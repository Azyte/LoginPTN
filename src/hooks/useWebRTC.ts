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
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" }
    ],
    iceCandidatePoolSize: 10
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
    // If there's an existing stale peer, preserve it if connected
    if (peersRef.current[targetUserId]) {
       if (peersRef.current[targetUserId].connectionState === 'connected') {
         return peersRef.current[targetUserId];
       }
       peersRef.current[targetUserId].close();
       delete peersRef.current[targetUserId];
    }

    const peer = new RTCPeerConnection(rtcConfig);
    const isPolite = userId < targetUserId; // Deterministic politeness

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: "broadcast", event: "webrtc_signal",
          payload: { 
            target: targetUserId, sender: userId, senderName: userName, 
            signal: { type: "ice", candidate: event.candidate } 
          }
        });
      }
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams(prev => ({
          ...prev, [targetUserId]: { stream, name: targetName }
        }));
      }
    };

    // Auto-reconnect on failure
    peer.onconnectionstatechange = () => {
       if (peer.connectionState === 'failed') {
         console.warn("Koneksi gagal, mencoba menyambung ulang...");
         peer.restartIce();
       }
    };

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(`group-voice-${roomId}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: userId }
      }
    });
    channelRef.current = channel;

    // Presence Sync
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
    
    // ... (rest of the broadcast handling is similar, but I'll ensure it stays stable)
    // Signaling Logic follows...

    // WebRTC Signaling
    channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
      if (payload.target && payload.target !== userId) return;

      const { sender, senderName, signal } = payload;
      const isPolite = userId < sender; // Am I the polite one?

      try {
        if (signal.type === "hello") {
          leftUsersRef.current.delete(sender);
          const peer = createPeerConnection(sender, senderName);
          
          // Only the impolite one (or determined by logic) starts the offer to avoid glare
          if (!isPolite) {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            channel.send({
              type: "broadcast", event: "webrtc_signal",
              payload: { target: sender, sender: userId, senderName: userName, signal: { type: "offer", description: peer.localDescription } }
            });
          }
        }
        else if (signal.type === "offer") {
          const peer = createPeerConnection(sender, senderName);
          const readyForOffer = !isPolite || peer.signalingState === "stable";
          
          if (!readyForOffer && (peer.signalingState as any) !== "stable") {
             // Rollback for polite peer
             await peer.setLocalDescription({ type: "rollback" });
          }

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
          if (peer && peer.signalingState !== "stable") {
            await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
          }
        }
        else if (signal.type === "ice") {
          const peer = peersRef.current[sender];
          if (peer) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              if (!peer.remoteDescription) {
                if (!pendingCandidates.current[sender]) pendingCandidates.current[sender] = [];
                pendingCandidates.current[sender].push(signal.candidate);
              }
            }
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
      } catch (err) {
        console.error("WebRTC Signaling Error:", err);
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
