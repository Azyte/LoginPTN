"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Crown, Flame, Target, BookOpen, ClipboardList, Loader2, TrendingUp, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

type LeaderboardEntry = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  school: string | null;
  target_university_id: string | null;
  score: number;
  extra: string;
};

type TabType = "bank-soal" | "tryout";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<TabType>("bank-soal");
  const [bankSoalData, setBankSoalData] = useState<LeaderboardEntry[]>([]);
  const [tryoutData, setTryoutData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        // Bank Soal Leaderboard (Global)
        const { data: bankSoalRaw, error: bankSoalError } = await supabase
          .from("user_answers")
          .select("user_id, is_correct, profiles(name, avatar_url, school, target_university_id)")
          .eq("is_correct", true);

        if (bankSoalRaw) {
          const userMap: Record<string, LeaderboardEntry> = {};
          bankSoalRaw.forEach((row: any) => {
            const uid = row.user_id;
            if (!userMap[uid]) {
              const profile = row.profiles;
              userMap[uid] = {
                user_id: uid,
                name: profile?.name || "Anonim",
                avatar_url: profile?.avatar_url || null,
                school: profile?.school || null,
                target_university_id: profile?.target_university_id || null,
                score: 0,
                extra: "",
              };
            }
            userMap[uid].score += 1;
          });

          const sorted = Object.values(userMap).sort((a, b) => b.score - a.score).slice(0, 100);
          sorted.forEach((e) => (e.extra = `${e.score} poin` || `${e.score} soal benar`));
          setBankSoalData(sorted);
        }

        // Tryout Leaderboard (Global)
        const { data: tryoutRaw, error: tryoutError } = await supabase
          .from("tryout_attempts")
          .select("user_id, total_score, profiles(name, avatar_url, school, target_university_id)")
          .eq("status", "completed")
          .not("total_score", "is", null)
          .order("total_score", { ascending: false });

        if (tryoutRaw) {
          const userMap: Record<string, LeaderboardEntry> = {};
          tryoutRaw.forEach((row: any) => {
            const uid = row.user_id;
            const score = Number(row.total_score) || 0;
            if (!userMap[uid] || score > userMap[uid].score) {
              const profile = row.profiles;
              userMap[uid] = {
                user_id: uid,
                name: profile?.name || "Anonim",
                avatar_url: profile?.avatar_url || null,
                school: profile?.school || null,
                target_university_id: profile?.target_university_id || null,
                score,
                extra: `Skor: ${score.toFixed(1)}`,
              };
            }
          });

          const sorted = Object.values(userMap).sort((a, b) => b.score - a.score).slice(0, 100);
          setTryoutData(sorted);
        }
      } catch (err) {
        console.error("Leaderboard component error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();

    const channel = supabase.channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_answers" }, () => fetchLeaderboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "tryout_attempts" }, () => fetchLeaderboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, tab]);

  const currentData = tab === "bank-soal" ? bankSoalData : tryoutData;
  const podium = currentData.slice(0, 3);
  const rest = currentData.slice(3);
  const myRank = currentData.findIndex((e) => e.user_id === user?.id) + 1;
  const myData = myRank > 0 ? currentData[myRank - 1] : null;

  // Reorder podium: [2nd, 1st, 3rd]
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const podiumRanks = podium.length >= 3 ? [1, 0, 2] : podium.map((_, i) => i);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 sm:pb-32">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">RANKING <span className="text-primary italic">NASIONAL</span></h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">LoginPTN — Competitive Learning Platform</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center pt-4">
        <div className="bg-secondary/30 p-1.5 rounded-2xl flex gap-1 border border-border/50 backdrop-blur-md">
          <button
            onClick={() => setTab("bank-soal")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "bank-soal" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Bank Soal
          </button>
          <button
            onClick={() => setTab("tryout")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "tryout" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Tryout SNBT
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <div className="bg-secondary/30 p-1.5 rounded-2xl flex gap-1 border border-border/50 backdrop-blur-md relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />}
          <button
            onClick={() => setTab("bank-soal")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "bank-soal" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Bank Soal
          </button>
          <button
            onClick={() => setTab("tryout")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "tryout" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Tryout SNBT
          </button>
        </div>
      </div>

      {currentData.length === 0 && !loading ? (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl opacity-50">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold">Belum Ada Kompetisi</h3>
          <p className="text-sm">Jadilah yang pertama untuk menempati posisi puncak!</p>
        </div>
      ) : (
        <>
          {/* Enhanced Podium */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-6 pt-8 sm:pt-12 pb-8 relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-primary/20 rounded-full blur-[80px] sm:blur-[100px] -z-10" />
            
            {/* Mobile Podium (Stacked) */}
            <div className="sm:hidden flex flex-col items-center gap-4 w-full px-4">
               {/* 1st Place (Large) */}
               {podium[0] && (
                 <div className="w-full bg-card/80 backdrop-blur-sm border-2 border-yellow-400/50 rounded-3xl p-4 flex items-center gap-4 shadow-xl shadow-yellow-400/10">
                    <div className="relative">
                       <div className="w-16 h-16 rounded-2xl border-2 border-yellow-400 flex items-center justify-center overflow-hidden">
                          {podium[0].avatar_url ? <img src={podium[0].avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-black text-yellow-400">{podium[0].name.charAt(0)}</span>}
                       </div>
                       <Crown className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-0.5">Juara 1 Nasional</div>
                       <div className="font-bold truncate text-base">{podium[0].name}</div>
                       <div className="text-[10px] text-muted-foreground font-bold truncate">{podium[0].target_university_id || "TARGET PTN"}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-yellow-400">#{1}</div>
                       <div className="text-[9px] font-bold opacity-70">{podium[0].extra}</div>
                    </div>
                 </div>
               )}

               {/* 2nd & 3rd (Side-by-Side) */}
               <div className="grid grid-cols-2 gap-3 w-full">
                  {[podium[1], podium[2]].map((entry, i) => entry && (
                    <div key={entry.user_id} className={`bg-card/50 border rounded-2xl p-3 flex flex-col items-center text-center ${i === 0 ? "border-slate-300/30" : "border-amber-600/30"}`}>
                       <div className="w-12 h-12 rounded-xl border-2 mb-2 flex items-center justify-center overflow-hidden">
                          {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold opacity-50">{entry.name.charAt(0)}</span>}
                       </div>
                       <div className="text-[10px] font-bold truncate w-full mb-1">{entry.name}</div>
                       <div className={`text-lg font-black ${i === 0 ? "text-slate-300" : "text-amber-600"}`}>#{i + 2}</div>
                       <div className="text-[9px] font-medium opacity-60 italic">{entry.extra}</div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Desktop Podium (Existing Horizontal) */}
            <div className="hidden sm:flex items-end justify-center gap-6">
              {podiumOrder.map((entry, displayIdx) => {
                const actualRank = podiumRanks[displayIdx];
                const isFirst = actualRank === 0;
                const colorClass = actualRank === 0 ? "text-yellow-400" : actualRank === 1 ? "text-slate-300" : "text-amber-600";
                const borderClass = actualRank === 0 ? "border-yellow-400/50 shadow-yellow-400/20" : actualRank === 1 ? "border-slate-300/50 shadow-slate-300/10" : "border-amber-600/50 shadow-amber-600/10";
                const heightClass = actualRank === 0 ? "h-52" : actualRank === 1 ? "h-40" : "h-32";

                return (
                  <div key={entry.user_id} className={`flex flex-col items-center transition-transform hover:scale-105 duration-300 ${isFirst ? "z-10" : "z-0"}`}>
                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center overflow-hidden shadow-2xl bg-card ${borderClass}`}>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className={`text-2xl font-black ${colorClass}`}>{entry.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="absolute -top-3 -right-3">
                        {actualRank === 0 ? <Crown className="w-10 h-10 text-yellow-400 drop-shadow-lg" /> : <Medal className={`w-8 h-8 ${colorClass}`} />}
                      </div>
                    </div>
                    
                    <div className="text-center mb-4 space-y-0.5">
                      <div className="font-black truncate max-w-[140px]">{entry.name}</div>
                      <div className="text-xs text-primary font-bold uppercase tracking-tighter truncate max-w-[100px]">{entry.target_university_id || "TARGET PTN"}</div>
                    </div>

                    <div className={`w-32 ${heightClass} bg-card border ${borderClass} rounded-t-3xl shadow-2xl flex flex-col items-center justify-start pt-6 gap-2`}>
                      <div className={`text-5xl font-black ${colorClass}`}>#{actualRank + 1}</div>
                      <div className="text-xs font-bold px-3 py-1 bg-secondary/50 rounded-full">{entry.extra}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rank List */}
          <div className="space-y-3 px-2">
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = entry.user_id === user?.id;
              return (
                <div
                  key={entry.user_id}
                  className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    isMe ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 -translate-y-1" : "bg-card/50 border-border/50 hover:bg-secondary/40 hover:border-primary/30"
                  }`}
                >
                  <div className={`text-xl font-black w-10 text-center ${rank <= 10 ? "text-primary italic" : "text-muted-foreground opacity-50"}`}>
                    {rank}
                  </div>
                  
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold opacity-60">{entry.name.charAt(0)}</span>
                      )}
                    </div>
                    {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base truncate">{entry.name}</span>
                      {isMe && <span className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-black uppercase tracking-widest">ANDA</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-medium">
                      <span className="truncate max-w-[120px]">{entry.school || "Siswa LoginPTN"}</span>
                      <span className="opacity-30">•</span>
                      <span className="text-primary font-bold uppercase tracking-tighter truncate">{entry.target_university_id || "Persiapan SNBT"}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black gradient-text">{entry.score}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      {tab === "bank-soal" ? "Point" : "Score"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sticky Bottom Rank Bar */}
      {myData && myRank > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl shadow-primary/30 flex items-center gap-4 border border-white/20">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-none">
                <span className="text-[10px] opacity-70 mb-0.5">RANK</span>
                <span className="text-xl">#{myRank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs opacity-70 font-bold uppercase tracking-widest mb-0.5">Posisi Kamu Saat Ini</div>
                <div className="font-bold truncate text-base">{myData.name}</div>
              </div>
              <div className="text-right border-l border-white/20 pl-4">
                <div className="text-xs opacity-70 font-bold uppercase mb-0.5">{tab === "bank-soal" ? "TOTAL POINT" : "BEST SCORE"}</div>
                <div className="text-xl font-black">{myData.score}</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
