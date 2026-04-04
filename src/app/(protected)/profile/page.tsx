"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { User, Mail, School, Target, Trophy, BookOpen, Calendar, Edit2, Loader2, X, Upload, Camera } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { UNIVERSITIES, MAJORS } from "@/lib/constants";

// Flatten all majors for reverse lookup
const ALL_MAJORS_FLAT = Object.entries(MAJORS).flatMap(([uniId, majors]) =>
  majors.map(m => ({ ...m, university_id: parseInt(uniId) }))
);

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState({ answered: 0, tryouts: 0, streak: 0 });
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    school: "",
    target_university_id: "",
    target_major_id: "",
    daily_target_minutes: 60,
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user) { setLoading(false); return; }

      try {
        const [
          { count: answeredCount },
          { count: tryoutCount },
          { data: streakData },
          { data: badgesData },
        ] = await Promise.all([
          supabase.from("user_answers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("tryout_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
          supabase.from("user_streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_badges").select("*, badge:badges(*)").eq("user_id", user.id),
        ]);

        setStats({
          answered: answeredCount || 0,
          tryouts: tryoutCount || 0,
          streak: streakData?.current_streak || 0
        });

        if (badgesData) setEarnedBadges(badgesData.map((b: any) => b.badge).filter(Boolean));
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        bio: profile.bio || "",
        school: profile.school || "",
        target_university_id: profile.target_university_id?.toString() || "",
        target_major_id: profile.target_major_id?.toString() || "",
        daily_target_minutes: profile.daily_target_minutes || 60,
        avatar_url: profile.avatar_url || ""
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError("");

    try {
      const { error } = await supabase.from("profiles").update({
        name: editForm.name,
        bio: editForm.bio,
        school: editForm.school,
        target_university_id: editForm.target_university_id ? parseInt(editForm.target_university_id) : null,
        target_major_id: editForm.target_major_id ? parseInt(editForm.target_major_id) : null,
        daily_target_minutes: editForm.daily_target_minutes,
        avatar_url: editForm.avatar_url
      }).eq("id", user.id);

      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }

      await refreshProfile();
      setIsEditOpen(false);
      setSaving(false);
    } catch (err: any) {
      setSaveError(err.message || "Gagal menyimpan profil.");
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingPhoto(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setEditForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (err: any) {
      alert("Gagal mengunggah foto: " + err.message);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Lookup PTN & Jurusan from hardcoded data
  const targetUni = UNIVERSITIES.find(u => u.id === profile?.target_university_id);
  const targetMajor = ALL_MAJORS_FLAT.find(m => m.id === profile?.target_major_id);

  // Filter majors for dropdown based on selected university
  const availableEditMajors = editForm.target_university_id
    ? (MAJORS[parseInt(editForm.target_university_id)] || [])
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <div className="h-32 animated-gradient" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-3xl font-bold text-primary shadow-lg mx-auto sm:mx-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile?.name ? getInitials(profile.name) : "?"
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile?.name || "Pengguna"}</h1>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role || "student"} • Bersiap untuk {new Date().getFullYear()}</p>
            </div>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors w-full sm:w-auto"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-6 text-center sm:text-left">{profile?.bio || "Pejuang UTBK SNBT — bismillah lolos PTN impian! 🎓"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-start gap-3 text-sm">
               <div className="bg-primary/10 p-2 rounded-lg text-primary"><Mail className="w-4 h-4" /></div>
               <div className="flex-1 min-w-0"><div className="text-xs text-muted-foreground mb-0.5">Email</div><div className="truncate font-medium">{user?.email || "email@example.com"}</div></div>
            </div>
            <div className="flex items-start gap-3 text-sm">
               <div className="bg-primary/10 p-2 rounded-lg text-primary"><School className="w-4 h-4" /></div>
               <div className="flex-1 min-w-0"><div className="text-xs text-muted-foreground mb-0.5">Asal Sekolah</div><div className="truncate font-medium">{profile?.school || "Belum diset"}</div></div>
            </div>
            <div className="flex items-start gap-3 text-sm">
               <div className="bg-primary/10 p-2 rounded-lg text-primary"><Target className="w-4 h-4" /></div>
               <div className="flex-1 min-w-0"><div className="text-xs text-muted-foreground mb-0.5">Target Impian</div><div className="truncate font-medium" title={targetUni ? `${targetUni.name} - ${targetMajor?.name}` : "Belum memilih PTN"}>{targetUni ? `${targetUni.short} - ${targetMajor?.name || "Jurusan"}` : "Kosong"}</div></div>
            </div>
            <div className="flex items-start gap-3 text-sm">
               <div className="bg-primary/10 p-2 rounded-lg text-primary"><Calendar className="w-4 h-4" /></div>
               <div className="flex-1 min-w-0"><div className="text-xs text-muted-foreground mb-0.5">Target Harian</div><div className="truncate font-medium">{profile?.daily_target_minutes || 60} menit</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-6 text-center card-hover overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
          <div className="text-3xl font-bold text-primary mb-1">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats.answered}</div>
          <div className="text-sm text-muted-foreground font-medium">Soal Dijawab</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6 text-center card-hover overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8" />
          <div className="text-3xl font-bold text-purple-500 mb-1">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats.tryouts}</div>
          <div className="text-sm text-muted-foreground font-medium">Tryout Selesai</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6 text-center card-hover overflow-hidden relative col-span-2 md:col-span-1">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8" />
          <div className="text-3xl font-bold text-orange-500 mb-1">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats.streak}</div>
          <div className="text-sm text-muted-foreground font-medium">Hari Streak</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> Badge Peringkat & Prestasi</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : earnedBadges.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border/50">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Belum ada badge yang dikumpulkan.</p>
            <p className="text-sm mt-1">Selesaikan misi dan tryout untuk mulai mengkoleksi!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge, idx) => (
              <div key={badge.id || idx} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-b from-secondary/50 to-secondary/20 border border-border/50 text-center hover:border-primary/50 transition-colors">
                <span className="text-4xl drop-shadow-sm">{badge.icon}</span>
                <div>
                  <div className="text-sm font-bold text-foreground mb-1">{badge.name}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-card border border-border/50 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:bg-secondary p-1 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Edit2 className="w-5 h-5 text-primary" /> Edit Profile</h2>

            <form onSubmit={handleSave} className="space-y-4">
              {saveError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3">
                  {saveError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-3 block">Foto Profil</label>
                <div className="flex flex-col sm:flex-row gap-4 mb-2 items-center sm:items-start">
                  <div className="relative w-20 h-20 rounded-full bg-secondary overflow-hidden border-2 border-border shrink-0">
                    {editForm.avatar_url ? (
                       <img src={editForm.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Camera className="w-6 h-6" /></div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none hover:bg-secondary/80 focus:ring-2 focus:ring-primary/50 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                      {uploadingPhoto ? "Mengunggah..." : "Unggah dari Perangkat"}
                    </button>
                    
                    <div className="flex gap-2 justify-center sm:justify-start">
                       {['Felix', 'Aneka', 'Oliver', 'Mimi', 'Jasper', 'Midnight'].map(seed => (
                          <button
                            type="button"
                            key={seed}
                            onClick={() => setEditForm({...editForm, avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`})}
                            className={`w-8 h-8 rounded-full bg-secondary overflow-hidden hover:scale-110 transition-transform ${editForm.avatar_url.includes(seed) ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
                            title={`Avatar ${seed}`}
                          >
                             <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`} alt={seed} />
                          </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Nama Lengkap</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bio & Target</label>
                <textarea rows={2} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Tulis bio singkatmu..." />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Asal Sekolah</label>
                <input type="text" value={editForm.school} onChange={e => setEditForm({...editForm, school: e.target.value})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. SMA N 1 Jakarta" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Kampus</label>
                  <select value={editForm.target_university_id} onChange={e => setEditForm({...editForm, target_university_id: e.target.value, target_major_id: ""})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Pilih PTN...</option>
                    {UNIVERSITIES.map(u => <option key={u.id} value={u.id}>{u.short} - {u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Jurusan</label>
                  <select value={editForm.target_major_id} onChange={e => setEditForm({...editForm, target_major_id: e.target.value})} disabled={!editForm.target_university_id} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50">
                    <option value="">Pilih Jurusan...</option>
                    {availableEditMajors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.faculty})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Target Belajar (Menit/Hari)</label>
                <input type="number" min={10} max={600} value={editForm.daily_target_minutes} onChange={e => setEditForm({...editForm, daily_target_minutes: parseInt(e.target.value) || 0})} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
