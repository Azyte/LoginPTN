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
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  
  // Blacklist: users who sent "leave" signal. Prevents presence sync from resurrecting them.
  const leftUsersRef = useRef<Set<string>>(new Set());

  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" }
    ]
  };

  const cleanup = useCallback(() => {
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    pendingCandidates.current = {};
    leftUsersRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (channelRef.current) {
      try { channelRef.current.untrack(); } catch { /* ignore */ }
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setLocalStream(null);
    setRemoteStreams({});
    setOnlineUsers({});
    setIsVoiceConnected(false);
  }, []);

  const createPeerConnection = (targetUserId: string, targetName: string) => {
    // If there's an existing stale peer, close it first
    if (peersRef.current[targetUserId]) {
      try { peersRef.current[targetUserId].close(); } catch { /* ignore */ }
      delete peersRef.current[targetUserId];
    }

    const peer = new RTCPeerConnection(rtcConfig);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }

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

    peer.ontrack = (event) => {
      let stream = event.streams[0];
      if (!stream) {
        stream = new MediaStream();
        stream.addTrack(event.track);
      }
      setRemoteStreams(prev => ({
        ...prev,
        [targetUserId]: { stream, name: targetName }
      }));
    };

    peersRef.current[targetUserId] = peer;

    // Flush any queued ICE candidates
    if (pendingCandidates.current[targetUserId]) {
      pendingCandidates.current[targetUserId].forEach(c => {
        peer.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      });
      delete pendingCandidates.current[targetUserId];
    }

    return peer;
  };

  useEffect(() => {
    const channel = supabase.channel(`voice-${roomId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: userId }
      }
    });
    channelRef.current = channel;

    // Presence Sync — filter out blacklisted (left) users
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: Record<string, { name: string, isMuted: boolean }> = {};
      for (const [id, presences] of Object.entries(state)) {
        if (id !== userId && presences.length > 0 && !leftUsersRef.current.has(id)) {
          users[id] = (presences[0] as unknown) as { name: string, isMuted: boolean };
        }
      }
      setOnlineUsers(users);
    });

    // WebRTC Signaling
    channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
      if (payload.target && payload.target !== userId) return;

      const { sender, senderName, signal } = payload;

      if (signal.type === "hello") {
        // User is (re)joining — remove from blacklist
        leftUsersRef.current.delete(sender);
        
        const peer = createPeerConnection(sender, senderName);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        channel.send({
          type: "broadcast", event: "webrtc_signal",
          payload: { target: sender, sender: userId, senderName: userName, signal: { type: "offer", description: peer.localDescription } }
        });
      }
      else if (signal.type === "offer") {
        leftUsersRef.current.delete(sender);
        
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
        if (peer && peer.remoteDescription) {
          peer.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
        } else {
          if (!pendingCandidates.current[sender]) pendingCandidates.current[sender] = [];
          pendingCandidates.current[sender].push(signal.candidate);
        }
      }
      else if (signal.type === "leave") {
        // Blacklist this user so presence sync can't resurrect them
        leftUsersRef.current.add(sender);

        if (peersRef.current[sender]) {
          peersRef.current[sender].close();
          delete peersRef.current[sender];
        }
        delete pendingCandidates.current[sender];

        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[sender];
          return next;
        });
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[sender];
          return next;
        });
      }
    });

    channel.subscribe();

    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, userName, cleanup]);

  const toggleMute = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMuted = !localStreamRef.current.getAudioTracks()[0].enabled;
      setIsMuted(newMuted);

      if (channelRef.current) {
        try {
          await channelRef.current.track({ name: userName, isMuted: newMuted });
        } catch { /* ignore */ }
      }
    }
  };

  const joinVoiceChannel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVoiceConnected(true);

      if (channelRef.current) {
        await channelRef.current.track({ name: userName, isMuted: false });

        // Small delay to let presence propagate before sending hello
        setTimeout(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "webrtc_signal",
            payload: { sender: userId, senderName: userName, signal: { type: "hello" } }
          });
        }, 300);
      }
    } catch (err) {
      console.error("Gagal mengakses mikrofon:", err);
      alert("Harap izinkan akses Mikrofon di browser untuk bergabung ke Voice Chat.");
    }
  };

  const leaveVoiceChannel = async () => {
    // 1. Broadcast leave signal FIRST
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "webrtc_signal",
        payload: { sender: userId, signal: { type: "leave" } }
      });

      // 2. Untrack from presence (wait for it)
      try {
        await channelRef.current.untrack();
      } catch { /* ignore */ }
    }

    // 3. Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      try { peer.close(); } catch { /* ignore */ }
    });
    peersRef.current = {};
    pendingCandidates.current = {};

    // 4. Stop microphone
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStreams({});
    setIsVoiceConnected(false);
    setIsMuted(false);
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
