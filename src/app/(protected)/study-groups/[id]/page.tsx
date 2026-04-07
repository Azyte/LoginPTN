"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Phone, PhoneOff, Mic, MicOff, Send, Users, ArrowLeft, Loader2, MessageCircle, Paperclip, FileText, Download, Trash2, ShieldAlert, Gamepad2 } from "lucide-react";
import { MultiplayerGameModal } from "@/components/ui/MultiplayerGameModal";

export default function StudyGroupRoom() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    localStream,
    remoteStreams,
    onlineUsers,
    isMuted,
    isVoiceConnected,
    toggleMute,
    joinVoiceChannel,
    leaveVoiceChannel
  } = useWebRTC(id as string, user?.id || "", profile?.name || "Anon", supabase);

  // Load Group Info and Initial Messages
  useEffect(() => {
    if (!user) return;
    
    const loadGroupData = async () => {
      // Get Group
      const { data: g } = await supabase.from("study_groups").select("*").eq("id", id).single();
      if (!g) {
        alert("Grup tidak ditemukan.");
        router.push("/study-groups");
        return;
      }
      setGroup(g);

      // Get Chat History
      const { data: m } = await supabase
        .from("group_messages")
        .select("*, profiles:user_id(name, avatar_url)")
        .eq("group_id", id)
        .order("created_at", { ascending: true })
        .limit(100);
        
      if (m) setMessages(m);

      // Get Members
      const { data: mem } = await supabase
        .from("group_members")
        .select("role, joined_at, profiles:user_id(id, name, avatar_url, target_university_id)")
        .eq("group_id", id);
      
      if (mem) setMembers(mem);

      setLoading(false);
    };

    loadGroupData();

    // Subscribe to new text messages
    const channel = supabase.channel(`group-chat-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${id}` 
      }, async (payload) => {
        // Avoid duplicates if we already added it optimistically
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          
          // Find sender info from members list instead of re-fetching from DB
          const sender = members.find(m => m.profiles.id === payload.new.user_id);
          const newMsg = { 
            ...payload.new, 
            profiles: sender?.profiles || { name: "Loading...", avatar_url: null } 
          };
          
          // If profile not in members yet (rare), we could fetch here, but let's try to find it
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (isVoiceConnected) leaveVoiceChannel();
    };
  }, [id, user, supabase, router, members]); // Added members to deps

  // ... (existing code)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !user) return;

    const content = msgInput;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic Update
    const optimisticMsg = {
      id: tempId,
      group_id: id,
      user_id: user.id,
      content: content,
      type: "text",
      created_at: new Date().toISOString(),
      profiles: {
        name: profile?.name || "Anda",
        avatar_url: profile?.avatar_url || null
      }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setMsgInput(""); 

    try {
      const { data, error } = await supabase.from("group_messages").insert({
        group_id: id,
        user_id: user.id,
        content: content,
        type: "text"
      }).select().single();

      if (error) throw error;

      // Replace temp message with real one to sync IDs
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...data, profiles: optimisticMsg.profiles } : m));
      }
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMsgInput(content); // Restore input
      alert("Gagal mengirim pesan. Silakan coba lagi.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('study_drive').upload(filePath, file);
    
    if (uploadError) {
      alert("Gagal mengupload file: " + uploadError.message);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    const { data } = supabase.storage.from('study_drive').getPublicUrl(filePath);
    
    await supabase.from("group_messages").insert({
      group_id: id,
      user_id: user.id,
      content: msgInput.trim() || `Membagikan file: ${file.name}`,
      type: "file",
      file_url: data.publicUrl,
      file_name: file.name,
      file_size: file.size
    });
    
    setMsgInput(""); 
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 font-medium text-muted-foreground animate-pulse">Memasuki Ruang Belajar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* LEFT PANEL: Voice Channel */}
      <div className="lg:w-1/3 min-h-[400px] lg:min-h-0 flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm flex-shrink-0">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/study-groups')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="font-bold text-lg line-clamp-1 leading-tight">{group?.name}</h1>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider relative pl-3">
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTrivia(true)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary hover:text-primary/80" title="Main Cerdas Cermat">
              <Gamepad2 className="w-5 h-5" />
            </button>
            <button onClick={() => setShowMembers(true)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Daftar Anggota">
              <Users className="w-5 h-5" />
            </button>
            {group?.owner_id === user?.id && (
              <button onClick={handleDeleteGroup} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Hapus Grup">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4 relative">
          {!isVoiceConnected && (
             <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center text-center mb-4">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-3">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm mb-1">Voice Channel Offline</h3>
                <p className="text-xs text-muted-foreground mb-4">Bergabung untuk berbicara dengan anggota yang sudah di dalam.</p>
                <button onClick={joinVoiceChannel} className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all">
                  <Phone className="w-4 h-4" /> Hubungkan Suara
                </button>
             </div>
          )}

          <div className="flex flex-col gap-3">
             {/* Me */}
             {isVoiceConnected && (
                <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-primary/20">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary relative">
                       {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover"/> : <Users className="w-5 h-5"/>}
                       {!isMuted && <span className="absolute -right-1 -bottom-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" title="Microphone Active"/>}
                     </div>
                     <div>
                       <div className="font-bold text-sm">Anda (Target PTN: {profile?.target_university_id ?? "SNBT"})</div>
                       <div className="text-xs text-muted-foreground">{isMuted ? "Muted" : "Speaking / Listening"}</div>
                     </div>
                   </div>
                </div>
             )}

             {/* Remote Participants */}
             {Object.entries(onlineUsers).map(([peerId, data]) => {
               const hasStream = remoteStreams[peerId]?.stream;
               return (
                 <div key={peerId} className="bg-secondary/30 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground overflow-hidden relative">
                      <Users className="w-5 h-5 text-muted-foreground"/>
                      {!data.isMuted && hasStream && (
                        <span className="absolute -right-1 -bottom-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" title="Microphone Active"/>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{data.name}</div>
                      <div className={`text-xs ${hasStream ? "text-green-500" : "text-muted-foreground"}`}>
                        {data.isMuted ? "Muted" : hasStream ? "Connected" : isVoiceConnected ? "Menghubungkan..." : "Di dalam ruangan"}
                      </div>
                    </div>
                    {/* Hidden Audio Element strictly for voice! */}
                    {hasStream && <AudioPlayer stream={remoteStreams[peerId].stream} />}
                 </div>
               );
             })}

             {Object.keys(onlineUsers).length === 0 && !isVoiceConnected && (
                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl opacity-70">
                   Belum ada anggota yang bergabung di Voice Channel.
                </div>
             )}
          </div>
        </div>

        {isVoiceConnected && (
          <div className="p-4 border-t border-border/50 bg-secondary/20 flex gap-3">
            <button onClick={toggleMute} className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${isMuted ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20" : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"}`}>
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button onClick={leaveVoiceChannel} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-md shadow-destructive/20">
              <PhoneOff className="w-4 h-4" /> Putus
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Text Chat */}
      <div className="flex-1 min-h-[500px] lg:min-h-0 flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center mb-8 pt-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Selamat datang di {group?.name}!</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Ini adalah awal dari diskusi teks. Bagikan pertanyaan, materi TPS/SosTeks/SainTek, atau bahas soal di sini.</p>
          </div>

          {messages.map((m, idx) => {
             const isMe = m.user_id === user?.id;
             const showName = idx === 0 || messages[idx-1].user_id !== m.user_id;

             return (
               <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {showName && !isMe && <span className="text-xs font-bold text-muted-foreground ml-12 mb-1">{m.profiles?.name || "Anon"}</span>}
                  
                  <div className={`flex gap-3 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {showName ? (
                      <div className="w-9 h-9 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover"/> : <Users className="w-4 h-4 text-muted-foreground"/>}
                      </div>
                    ) : (
                      <div className="w-9 h-9 flex-shrink-0" />
                    )}
                    
                    <div className={`px-5 py-3 rounded-2xl break-words text-sm shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"}`}>
                      {m.type === "file" ? (
                        <div className="flex flex-col gap-2">
                          {m.content && m.content !== `Membagikan file: ${m.file_name}` && <div>{m.content}</div>}
                          <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/10 p-3 rounded-xl hover:bg-black/20 transition-colors w-[220px] sm:w-[260px]">
                            <div className="bg-white/20 p-2 rounded-lg text-current"><FileText className="w-5 h-5"/></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate" title={m.file_name}>{m.file_name}</div>
                              <div className="text-xs opacity-80">{(m.file_size / 1024).toFixed(1)} KB</div>
                            </div>
                            <Download className="w-4 h-4 opacity-80" />
                          </a>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
               </div>
             )
          })}
          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-card">
          <div className="relative flex items-center">
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute left-2 p-2.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors focus:outline-none"
              title="Unggah File ke Study Drive"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Paperclip className="w-5 h-5" />}
            </button>

            <input 
              type="text" 
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder={uploading ? "Sedang mengunggah file..." : "Tulis pesan atau pilih tombol klip untuk share file..."}
              disabled={uploading}
              className="w-full bg-secondary/80 border-none rounded-xl px-4 py-3.5 pl-14 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              maxLength={1000}
            />
            <button 
              type="submit" 
              disabled={!msgInput.trim() || uploading}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 transition-all shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      {/* MEMBERS MODAL */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border mt-16 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Anggota Grup ({members.length})
              </h3>
              <button onClick={() => setShowMembers(false)} className="text-muted-foreground hover:text-foreground p-1">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada anggota yang dimuat.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary overflow-hidden">
                        {m.profiles?.avatar_url ? (
                          <img src={m.profiles.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm flex items-center gap-2">
                          {m.profiles?.name || "Anonim"}
                          {m.role === "owner" && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bergabung: {new Date(m.joined_at).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRIVIA BATTLE MODAL */}
      {showTrivia && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <MultiplayerGameModal 
             roomId={id as string} 
             user={{ id: user.id, name: profile?.name || "Anonim" }} 
             onClose={() => setShowTrivia(false)} 
          />
        </div>
      )}

    </div>
  );
}

// Hidden wrapper component to auto-play remote audio streams
function AudioPlayer({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
