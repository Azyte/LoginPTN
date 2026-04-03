"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, UserPlus, Shield, Info, PlusCircle, Search, LogOut, MessageCircle, X, Loader2, Lock, Globe, Copy, Check, Hash, KeyRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function StudyGroupsPage() {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<Record<string, any>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", max_members: 50, is_private: false, password: "" });
  const [creating, setCreating] = useState(false);

  // Join by Code Modal State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [foundGroup, setFoundGroup] = useState<any>(null);

  useEffect(() => {
    loadGroups();
  }, [user, supabase]);

  async function loadGroups() {
    if (!user) { setLoading(false); return; }

    try {
      const [groupsRes, membersRes] = await Promise.all([
        supabase.from("study_groups").select("*, profiles!study_groups_owner_id_fkey(name), group_members(count)").order("created_at", { ascending: false }),
        supabase.from("group_members").select("*").eq("user_id", user.id)
      ]);

      if (groupsRes.error) {
        setFetchError(groupsRes.error.message);
      } else {
        setFetchError(null);
      }

      if (groupsRes.data) setGroups(groupsRes.data);
      if (membersRes.data) {
        const membershipMap: Record<string, any> = {};
        membersRes.data.forEach((m: any) => membershipMap[m.group_id] = m);
        setMyMemberships(membershipMap);
      }
    } catch (err) {
      console.error("Error loading groups:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member"
    });
    loadGroups();
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    loadGroups();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const roomCode = generateCode();

    const { data: ng, error } = await supabase.from("study_groups").insert({
      name: createForm.name,
      description: createForm.description,
      max_members: createForm.max_members,
      owner_id: user.id,
      room_code: roomCode,
      is_private: createForm.is_private,
      password: createForm.is_private ? createForm.password : null,
    }).select().single();

    if (error) {
      alert("Gagal membuat kelas: " + error.message);
      setCreating(false);
      return;
    }

    if (ng) {
      await supabase.from("group_members").insert({
        group_id: ng.id,
        user_id: user.id,
        role: "owner"
      });
    }

    setCreating(false);
    setIsCreateOpen(false);
    setCreateForm({ name: "", description: "", max_members: 50, is_private: false, password: "" });
    loadGroups();
  };

  // Join by Code
  const handleSearchCode = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    setFoundGroup(null);

    const { data, error } = await supabase
      .from("study_groups")
      .select("id, name, is_private, max_members, group_members(count)")
      .eq("room_code", joinCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      setJoinError("Grup dengan kode tersebut tidak ditemukan.");
      setJoinLoading(false);
      return;
    }

    setFoundGroup(data);
    setJoinLoading(false);
  };

  const handleJoinByCode = async () => {
    if (!user || !foundGroup) return;
    setJoinLoading(true);
    setJoinError("");

    // Check if private and password required
    if (foundGroup.is_private) {
      // Verify password server-side
      const { data: fullGroup } = await supabase
        .from("study_groups")
        .select("password")
        .eq("id", foundGroup.id)
        .single();

      if (fullGroup?.password && fullGroup.password !== joinPassword) {
        setJoinError("Password salah! Coba lagi.");
        setJoinLoading(false);
        return;
      }
    }

    // Check if already member
    if (myMemberships[foundGroup.id]) {
      setJoinError("Kamu sudah bergabung di grup ini!");
      setJoinLoading(false);
      return;
    }

    // Check if full
    const memberCount = foundGroup.group_members?.[0]?.count || 0;
    if (memberCount >= foundGroup.max_members) {
      setJoinError("Grup sudah penuh!");
      setJoinLoading(false);
      return;
    }

    await supabase.from("group_members").insert({
      group_id: foundGroup.id,
      user_id: user.id,
      role: "member"
    });

    setJoinLoading(false);
    setIsJoinOpen(false);
    setJoinCode("");
    setJoinPassword("");
    setFoundGroup(null);
    loadGroups();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter: only show public groups to non-members, show all groups user is member of
  const filteredGroups = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    // Show all groups user is member of, and all public groups
    if (myMemberships[g.id]) return true;
    if (!g.is_private) return true;
    return false; // Hide private groups user is not member of
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Ruang Belajar Bersama
          </h1>
          <p className="text-muted-foreground mt-1">Bergabung atau jadilah penggagas grup belajar UTBK bersama teman-teman seperjuanganmu.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsJoinOpen(true)}
            className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/80 flex items-center gap-2 text-sm"
          >
            <Hash className="w-4 h-4"/> Join via Kode
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-lg text-sm"
          >
            <PlusCircle className="w-4 h-4"/> Buat Grup
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border border-border/50">
         <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="Cari nama grup atau materi..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary/50 border-none rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
         </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <div key={i} className="bg-card border border-border/50 rounded-2xl p-6 h-[260px] flex flex-col justify-between">
                <div>
                   <div className="h-6 w-3/4 bg-secondary animate-pulse rounded-lg mb-4"></div>
                   <div className="h-3 w-full bg-secondary/50 animate-pulse rounded-md mb-2"></div>
                   <div className="h-3 w-2/3 bg-secondary/50 animate-pulse rounded-md mb-6"></div>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                   <div className="h-7 w-24 bg-secondary animate-pulse rounded-lg" />
                   <div className="h-7 w-20 bg-secondary animate-pulse rounded-lg" />
                </div>
             </div>
           ))}
        </div>
      ) : fetchError ? (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-xl">
          <strong>Error loading groups:</strong> {fetchError}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.length === 0 && (
             <div className="col-span-full text-center py-10 bg-secondary/30 rounded-2xl border border-dashed border-border/50">
               <Info className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
               <p className="text-muted-foreground">Belum ada grup yang ditemukan.</p>
               <p className="text-sm text-muted-foreground mt-1">Buat grup baru atau join via kode!</p>
             </div>
          )}

          {filteredGroups.map(group => {
            const memberCount = group.group_members?.[0]?.count || 0;
            const isFull = memberCount >= group.max_members;
            const myStatus = myMemberships[group.id];

            return (
              <div key={group.id} className={`bg-card border rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors shadow-sm ${group.is_private ? "border-warning/30" : "border-border/50"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {group.is_private ? (
                      <span className="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    ) : (
                      <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    )}
                    {myStatus && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {myStatus.role === "owner" ? "Pembuat" : "Member"}
                      </span>
                    )}
                  </div>
                  {isFull && !myStatus && (
                    <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Penuh</span>
                  )}
                </div>

                <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-1">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[40px]">{group.description || "Tidak ada deskripsi."}</p>
                
                {/* Room Code */}
                {myStatus && group.room_code && (
                  <button 
                    onClick={() => copyCode(group.room_code)}
                    className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-lg text-xs font-mono font-bold mb-3 w-fit transition-colors"
                    title="Klik untuk copy kode"
                  >
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    {group.room_code}
                    {copiedCode === group.room_code ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                    <Shield className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase">Pembuat Grup</div>
                    <div className="text-xs font-bold">{group.profiles?.name || "Sistem"}</div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{memberCount} / {group.max_members}</span>
                   </div>

                   {myStatus ? (
                      <div className="flex gap-2">
                        {myStatus.role === 'member' && (
                           <button onClick={() => handleLeave(group.id)} className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors">
                            Keluar
                           </button>
                        )}
                        <Link href={`/study-groups/${group.id}`} className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                          <MessageCircle className="w-3 h-3"/> Chat
                        </Link>
                      </div>
                   ) : (
                      <button 
                        onClick={() => handleJoin(group.id)}
                        disabled={isFull}
                        className="bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:hover:bg-secondary disabled:hover:text-foreground text-xs px-4 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3"/> {isFull ? "Penuh" : "Gabung"}
                      </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Grup */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
             <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:bg-secondary p-1 rounded-full"><X className="w-5 h-5" /></button>
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-primary" /> Buat Study Group</h2>
             
             <form onSubmit={handleCreate} className="space-y-4">
                <div>
                   <label className="text-sm font-medium mb-1 block">Nama Kelas / Grup</label>
                   <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Masterclass PK & PU - Batch 3" />
                </div>
                <div>
                   <label className="text-sm font-medium mb-1 block">Deskripsi Detail</label>
                   <textarea rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Target pembahasan untuk grup ini..." />
                </div>
                <div>
                   <label className="text-sm font-medium mb-1 block">Maksimal Peserta</label>
                   <input required type="number" min={5} max={100} value={createForm.max_members} onChange={e => setCreateForm({...createForm, max_members: parseInt(e.target.value) || 50})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>

                {/* Tipe Grup */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipe Grup</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, is_private: false, password: ""})}
                      className={`p-3.5 rounded-xl border text-center transition-all ${!createForm.is_private ? "border-success bg-success/10" : "border-border/50 hover:bg-secondary/50"}`}
                    >
                      <Globe className={`w-6 h-6 mx-auto mb-1.5 ${!createForm.is_private ? "text-success" : "text-muted-foreground"}`} />
                      <div className="text-sm font-bold">Public</div>
                      <div className="text-[10px] text-muted-foreground">Semua bisa join</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, is_private: true})}
                      className={`p-3.5 rounded-xl border text-center transition-all ${createForm.is_private ? "border-warning bg-warning/10" : "border-border/50 hover:bg-secondary/50"}`}
                    >
                      <Lock className={`w-6 h-6 mx-auto mb-1.5 ${createForm.is_private ? "text-warning" : "text-muted-foreground"}`} />
                      <div className="text-sm font-bold">Private</div>
                      <div className="text-[10px] text-muted-foreground">Perlu password</div>
                    </button>
                  </div>
                </div>

                {/* Password (jika private) */}
                {createForm.is_private && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Password Group</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        required 
                        type="text" 
                        value={createForm.password} 
                        onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                        className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50" 
                        placeholder="e.g. snbt2026"
                        minLength={3}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Bagikan password ini ke teman yang ingin bergabung.</p>
                  </div>
                )}

                <div className="bg-secondary/50 p-3 rounded-xl border border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    📌 Room Code akan di-generate otomatis setelah grup dibuat. Bagikan kode ini ke temanmu!
                  </p>
                </div>

                <button type="submit" disabled={creating} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 hover:opacity-90 transition-all">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin"/> Membuat Grup...</> : "Buat Grup Sekarang"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Join via Kode */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsJoinOpen(false); setFoundGroup(null); setJoinError(""); setJoinCode(""); setJoinPassword(""); }} />
          <div className="relative bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
             <button onClick={() => { setIsJoinOpen(false); setFoundGroup(null); setJoinError(""); }} className="absolute top-4 right-4 text-muted-foreground hover:bg-secondary p-1 rounded-full"><X className="w-5 h-5" /></button>
             <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /> Join via Kode</h2>
             <p className="text-sm text-muted-foreground mb-6">Masukkan kode room yang dibagikan temanmu.</p>

             {joinError && (
               <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 mb-4">
                 {joinError}
               </div>
             )}

             {!foundGroup ? (
               <>
                 <div className="relative mb-4">
                   <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type="text"
                     value={joinCode}
                     onChange={e => setJoinCode(e.target.value.toUpperCase())}
                     placeholder="Masukkan kode, e.g. A1B2C3"
                     className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                     maxLength={6}
                   />
                 </div>
                 <button 
                   onClick={handleSearchCode} 
                   disabled={joinCode.length < 4 || joinLoading}
                   className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                 >
                   {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                   Cari Grup
                 </button>
               </>
             ) : (
               <div className="space-y-4">
                 <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                   <div className="flex items-center gap-2 mb-1">
                     {foundGroup.is_private ? (
                       <Lock className="w-4 h-4 text-warning" />
                     ) : (
                       <Globe className="w-4 h-4 text-success" />
                     )}
                     <span className="text-xs font-bold text-muted-foreground uppercase">
                       {foundGroup.is_private ? "Private Group" : "Public Group"}
                     </span>
                   </div>
                   <h3 className="font-bold text-lg">{foundGroup.name}</h3>
                   <p className="text-xs text-muted-foreground mt-1">
                     {foundGroup.group_members?.[0]?.count || 0} / {foundGroup.max_members} anggota
                   </p>
                 </div>

                 {foundGroup.is_private && (
                   <div>
                     <label className="text-sm font-medium mb-1 block">Password Group</label>
                     <div className="relative">
                       <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input
                         type="password"
                         value={joinPassword}
                         onChange={e => setJoinPassword(e.target.value)}
                         placeholder="Masukkan password..."
                         className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
                       />
                     </div>
                   </div>
                 )}

                 <div className="flex gap-2">
                   <button 
                     onClick={() => { setFoundGroup(null); setJoinError(""); setJoinPassword(""); }}
                     className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors"
                   >
                     Kembali
                   </button>
                   <button 
                     onClick={handleJoinByCode}
                     disabled={joinLoading || (foundGroup.is_private && !joinPassword)}
                     className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                   >
                     {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                     Gabung
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
