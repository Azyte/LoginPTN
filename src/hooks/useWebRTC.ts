"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

interface Peer {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export function useWebRTC(roomId: string, userId: string, userName: string, supabase: SupabaseClient) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream, name: string }>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());

  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<any>(null);

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
      channelRef.current.unsubscribe();
    }
    setLocalStream(null);
    setRemoteStreams({});
    setIsVoiceConnected(false);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
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

      // 2. Setup Supabase Realtime Channel as Signaling Server
      const channel = supabase.channel(`voice-${roomId}`, {
        config: { broadcast: { ack: false, self: false } }
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        // Only process signals meant for me or broadcasted to everyone (like 'hello')
        if (payload.target && payload.target !== userId) return;

        const { sender, senderName, signal } = payload;

        if (signal.type === "hello") {
          // New person joined, they said hello. I should create an offer and send to them.
          const peer = createPeerConnection(sender, senderName);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          
          channel.send({
            type: "broadcast", event: "webrtc_signal",
            payload: { target: sender, sender: userId, senderName: userName, signal: { type: "offer", description: peer.localDescription } }
          });
        } 
        else if (signal.type === "offer") {
          // Received an offer, create an answer
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
          // Received an answer to my offer
          const peer = peersRef.current[sender];
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
          }
        }
        else if (signal.type === "ice") {
          // Received ICE candidate
          const peer = peersRef.current[sender];
          if (peer) {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
        else if (signal.type === "leave") {
          // A user left the voice chat
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
      channel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
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
    // Notify others
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
    isMuted,
    isVoiceConnected,
    toggleMute,
    joinVoiceChannel,
    leaveVoiceChannel
  };
}
