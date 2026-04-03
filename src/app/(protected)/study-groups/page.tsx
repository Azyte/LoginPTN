"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, UserPlus, Shield, Info, PlusCircle, Search, LogOut, MessageCircle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

export default function StudyGroupsPage() {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<Record<string, any>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", max_members: 50 });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [user, supabase]);

  async function loadGroups() {
    if (!user) return;

    const [groupsRes, membersRes] = await Promise.all([
      // Using a basic query since aggregating group_members count directly is complex via Rest API, 
      // but we can fetch them all or just get the groups and members separately
      supabase.from("study_groups").select("*, profiles!study_groups_owner_id_fkey(name), group_members(count)").order("created_at", { ascending: false }),
      supabase.from("group_members").select("*").eq("user_id", user.id)
    ]);

    if (groupsRes.error) {
      console.error("Fetch Groups Error:", groupsRes.error);
      setFetchError(groupsRes.error.message + " | Details: " + groupsRes.error.details + " | Hint: " + groupsRes.error.hint);
    } else {
      setFetchError(null);
    }

    if (groupsRes.data) setGroups(groupsRes.data);
    if (membersRes.data) {
      const membershipMap: Record<string, any> = {};
      membersRes.data.forEach((m: any) => membershipMap[m.group_id] = m);
      setMyMemberships(membershipMap);
    }
    setLoading(false);
  }

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member"
    });
    loadGroups(); // Refresh
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    loadGroups(); // Refresh
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const { data: ng, error } = await supabase.from("study_groups").insert({
      name: createForm.name,
      description: createForm.description,
      max_members: createForm.max_members,
      owner_id: user.id
    }).select().single();

    if (error) {
      console.error("Gagal buat grup:", error);
      alert("Gagal membuat kelas: " + error.message);
    }

    // 2. Automatically join the creator as owner
    if (ng) {
      const { error: memberErr } = await supabase.from("group_members").insert({
        group_id: ng.id,
        user_id: user.id,
        role: "owner"
      });
      if (memberErr) console.error("Gagal join ke grup sendiri:", memberErr);
    }

    setCreating(false);
    setIsCreateOpen(false);
    setCreateForm({ name: "", description: "", max_members: 50 });
    loadGroups();
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase()));

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

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-lg"
        >
          <PlusCircle className="w-5 h-5"/> Buat Grup Baru
        </button>
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
             <div key={i} className="bg-card border border-border/50 rounded-2xl p-6 h-[220px] flex flex-col justify-between">
                <div>
                   <div className="h-6 w-3/4 bg-secondary animate-pulse rounded-lg mb-4"></div>
                   <div className="h-3 w-full bg-secondary/50 animate-pulse rounded-md mb-2"></div>
                   <div className="h-3 w-2/3 bg-secondary/50 animate-pulse rounded-md mb-6"></div>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-md bg-secondary animate-pulse" />
                     <div className="h-3 w-16 bg-secondary animate-pulse rounded-md"></div>
                   </div>
                   <div className="h-7 w-20 bg-secondary animate-pulse rounded-lg mt-1" />
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
               <p className="text-muted-foreground">Belum ada grup yang dibuka atau ditemukan.</p>
             </div>
          )}

          {filteredGroups.map(group => {
            const memberCount = group.group_members?.[0]?.count || 0;
            const isFull = memberCount >= group.max_members;
            const myStatus = myMemberships[group.id];

            return (
              <div key={group.id} className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg leading-tight line-clamp-1">{group.name}</h3>
                  {myStatus ? (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{myStatus.role === "owner" ? "Pembuat" : "Member"}</span>
                  ) : isFull ? (
                    <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Penuh</span>
                  ) : null}
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{group.description || "Tidak ada deskripsi."}</p>
                
                <div className="flex items-center gap-2 mb-6">
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
                           <button onClick={() => handleLeave(group.id)} className="bg-destructive/10 text-destructive hover:bg-destructive text-xs px-3 py-1.5 rounded-lg font-bold transition-colors">
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
                   <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Masterclass PK & PU - Batch 3" />
                </div>
                <div>
                   <label className="text-sm font-medium mb-1 block">Deskripsi Detail</label>
                   <textarea rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Target pembahasan untuk grup ini..." />
                </div>
                <div>
                   <label className="text-sm font-medium mb-1 block">Maksimal Peserta</label>
                   <input required type="number" min={5} max={100} value={createForm.max_members} onChange={e => setCreateForm({...createForm, max_members: parseInt(e.target.value) || 50})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <button type="submit" disabled={creating} className="w-full bg-primary text-primary-foreground py-3 mt-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 hover:opacity-90 transition-all">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin"/> Membuat Grup...</> : "Buat Grup Sekarang"}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
