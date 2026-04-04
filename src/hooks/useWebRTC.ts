"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export function useWebRTC(roomId: string, userId: string, userName: string, supabase: SupabaseClient) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream, name: string }>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { name: string, isMuted: boolean }>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);

  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Core configuration for WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" } // Backup STUN
    ]
  };

  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (channelRef.current) {
      try {
        channelRef.current.untrack();
      } catch { /* ignore untrack errors */ }
      channelRef.current.unsubscribe();
    }
    setLocalStream(null);
    setRemoteStreams({});
    setOnlineUsers({});
    setIsVoiceConnected(false);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const toggleMute = async () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMuted = !localStream.getAudioTracks()[0].enabled;
      setIsMuted(newMuted);
      
      // Update presence state across all users instantly
      if (channelRef.current) {
        try {
          await channelRef.current.track({ name: userName, isMuted: newMuted });
        } catch { /* ignore presence errors */ }
      }
    }
  };

  const createPeerConnection = (targetUserId: string, targetName: string) => {
    const peer = new RTCPeerConnection(rtcConfig);

    // Add local stream tracks to peer
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
      });
    }

    // Handle incoming ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: "broadcast",
          event: "webrtc_signal",
          payload: {
            target: targetUserId,
            sender: userId,
            senderName: userName,
            signal: { type: "ice", candidate: event.candidate }
          }
        });
      }
    };

    // Handle incoming media streams
    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: { stream: event.streams[0], name: targetName }
        }));
      }
    };

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  const joinVoiceChannel = async () => {
    try {
      // 1. Get Local Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVoiceConnected(true);

      // 2. Setup Supabase Realtime Channel (Signaling + Presence)
      const channel = supabase.channel(`voice-${roomId}`, {
        config: { 
          broadcast: { ack: false, self: false },
          presence: { key: userId }
        }
      });
      channelRef.current = channel;

      // Listen for Presence Sync (Who is connected right now?)
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Record<string, { name: string, isMuted: boolean }> = {};
        for (const [id, presences] of Object.entries(state)) {
          // Exclude self from the remote user view
          if (id !== userId && presences.length > 0) {
             users[id] = (presences[0] as unknown) as { name: string, isMuted: boolean };
          }
        }
        setOnlineUsers(users);
      });

      // Listen for WebRTC Signaling
      channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (payload.target && payload.target !== userId) return;

        const { sender, senderName, signal } = payload;

        if (signal.type === "hello") {
          const peer = createPeerConnection(sender, senderName);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          
          channel.send({
            type: "broadcast", event: "webrtc_signal",
            payload: { target: sender, sender: userId, senderName: userName, signal: { type: "offer", description: peer.localDescription } }
          });
        } 
        else if (signal.type === "offer") {
          const peer = createPeerConnection(sender, senderName);
          await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          channel.send({
            type: "broadcast", event: "webrtc_signal",
            payload: { target: sender, sender: userId, senderName: userName, signal: { type: "answer", description: peer.localDescription } }
          });
        }
        else if (signal.type === "answer") {
          const peer = peersRef.current[sender];
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
          }
        }
        else if (signal.type === "ice") {
          const peer = peersRef.current[sender];
          if (peer) {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
        else if (signal.type === "leave") {
          if (peersRef.current[sender]) {
            peersRef.current[sender].close();
            delete peersRef.current[sender];
          }
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[sender];
            return next;
          });
        }
      });

      // Join the channel and announce presence
      channel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          // Add ourselves to the presence tracker
          await channel.track({ name: userName, isMuted: false });

          // Send hello to trigger WebRTC SDP negotiation
          channel.send({
            type: "broadcast",
            event: "webrtc_signal",
            payload: { sender: userId, senderName: userName, signal: { type: "hello" } }
          });
        }
      });
      
    } catch (err) {
      console.error("Gagal mengakses mikrofon:", err);
      alert("Harap izinkan akses Mikrofon di browser untuk bergabung ke Voice Chat.");
    }
  };

  const leaveVoiceChannel = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "webrtc_signal",
        payload: { sender: userId, signal: { type: "leave" } }
      });
    }
    cleanup();
  };

  return {
    localStream,
    remoteStreams,
    onlineUsers,
    isMuted,
    isVoiceConnected,
    toggleMute,
    joinVoiceChannel,
    leaveVoiceChannel
  };
}
