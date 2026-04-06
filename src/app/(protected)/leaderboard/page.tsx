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

      // Bank Soal Leaderboard: count correct answers per user
      const { data: bankSoalRaw } = await supabase
        .from("user_answers")
        .select("user_id, is_correct, profiles(name, avatar_url, school)")
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
              score: 0,
              extra: "",
            };
          }
          userMap[uid].score += 1;
        });

        const sorted = Object.values(userMap).sort((a, b) => b.score - a.score).slice(0, 50);
        sorted.forEach((e) => (e.extra = `${e.score} soal benar`));
        setBankSoalData(sorted);
      }

      // Tryout Leaderboard: best total_score per user
      const { data: tryoutRaw } = await supabase
        .from("tryout_attempts")
        .select("user_id, total_score, profiles(name, avatar_url, school)")
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
              score,
              extra: `Skor: ${score.toFixed(1)}`,
            };
          }
        });

        const sorted = Object.values(userMap).sort((a, b) => b.score - a.score).slice(0, 50);
        setTryoutData(sorted);
      }

      setLoading(false);
    }

    fetchLeaderboard();

    // Realtime subscription for live updates
    const bankSoalSub = supabase
      .channel("leaderboard-bank-soal")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_answers" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    const tryoutSub = supabase
      .channel("leaderboard-tryout")
      .on("postgres_changes", { event: "*", schema: "public", table: "tryout_attempts" }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bankSoalSub);
      supabase.removeChannel(tryoutSub);
    };
  }, [supabase]);

  const currentData = tab === "bank-soal" ? bankSoalData : tryoutData;
  const podium = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  const myRank = currentData.findIndex((e) => e.user_id === user?.id) + 1;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getPodiumGradient = (index: number) => {
    if (index === 0) return "from-yellow-500/20 to-amber-500/10 border-yellow-500/40";
    if (index === 1) return "from-gray-400/20 to-slate-400/10 border-gray-400/40";
    return "from-amber-700/20 to-orange-600/10 border-amber-700/40";
  };

  const getPodiumHeight = (index: number) => {
    if (index === 0) return "h-32 sm:h-40";
    if (index === 1) return "h-24 sm:h-32";
    return "h-20 sm:h-28";
  };

  // Reorder podium: [2nd, 1st, 3rd] for visual display
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const podiumRanks = podium.length >= 3 ? [1, 0, 2] : podium.map((_, i) => i);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Leaderboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          Papan <span className="gradient-text">Peringkat</span>
        </h1>
        <p className="text-muted-foreground text-sm">Siapa yang paling rajin dan paling jago? Lihat posisimu!</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-secondary/50 p-1 rounded-xl flex gap-1 border border-border/50">
          <button
            onClick={() => setTab("bank-soal")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === "bank-soal"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Bank Soal
          </button>
          <button
            onClick={() => setTab("tryout")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === "tryout"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Tryout
          </button>
        </div>
      </div>

      {/* My Rank Banner */}
      {myRank > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Peringkatmu saat ini</div>
            <div className="text-2xl font-extrabold gradient-text">#{myRank}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{tab === "bank-soal" ? "Soal Benar" : "Skor Tertinggi"}</div>
            <div className="text-lg font-bold">{currentData[myRank - 1]?.score ?? 0}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Belum Ada Data</h3>
          <p className="text-muted-foreground text-sm">
            {tab === "bank-soal"
              ? "Belum ada yang menjawab soal. Jadilah yang pertama!"
              : "Belum ada yang menyelesaikan tryout. Jadilah yang pertama!"}
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length >= 3 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4">
              {podiumOrder.map((entry, displayIdx) => {
                const actualRank = podiumRanks[displayIdx];
                return (
                  <div key={entry.user_id} className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className={`relative mb-2 ${actualRank === 0 ? "scale-110" : ""}`}>
                      <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 flex items-center justify-center text-lg font-bold overflow-hidden ${
                        actualRank === 0 ? "border-yellow-400 bg-yellow-500/20" : actualRank === 1 ? "border-gray-300 bg-gray-400/20" : "border-amber-600 bg-amber-600/20"
                      }`}>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className={actualRank === 0 ? "text-yellow-400" : actualRank === 1 ? "text-gray-300" : "text-amber-600"}>
                            {entry.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2">{getRankIcon(actualRank)}</div>
                    </div>

                    {/* Name */}
                    <div className="text-xs sm:text-sm font-bold text-center truncate max-w-[80px] sm:max-w-[100px]">{entry.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[80px] text-center">{entry.school || "-"}</div>

                    {/* Podium bar */}
                    <div className={`w-20 sm:w-24 ${getPodiumHeight(actualRank)} bg-gradient-to-t ${getPodiumGradient(actualRank)} border rounded-t-xl mt-2 flex flex-col items-center justify-center`}>
                      <div className="text-xl sm:text-2xl font-black">#{actualRank + 1}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground font-bold">{entry.extra}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] gap-0">
              {rest.map((entry, i) => {
                const rank = i + 4;
                const isMe = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={`col-span-3 grid grid-cols-subgrid items-center px-4 py-3 border-b border-border/30 transition-colors ${
                      isMe ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-secondary/30"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`text-sm font-black ${rank <= 10 ? "text-primary" : "text-muted-foreground"}`}>
                      #{rank}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          entry.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate flex items-center gap-1.5">
                          {entry.name}
                          {isMe && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">KAMU</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{entry.school || "-"}</div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-sm font-bold">{entry.score}</div>
                      <div className="text-[10px] text-muted-foreground">{tab === "bank-soal" ? "benar" : "poin"}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {rest.length === 0 && podium.length > 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Hanya {podium.length} peserta saat ini. Ajak temanmu untuk bersaing! 🔥
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
