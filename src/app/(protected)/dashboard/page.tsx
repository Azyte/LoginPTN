"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, ClipboardList, Target, TrendingUp, Flame, Trophy,
  ArrowRight, Brain, Zap, Calendar, CheckCircle2, Clock, Loader2, Users
} from "lucide-react";
import { getStreakEmoji } from "@/lib/utils";

const AMBIS_QUOTES = [
  "Keringat hari ini adalah senyum di kampus impian besok.",
  "Sainganmu sedang belajar saat kamu tidur. Bangun dan kejar!",
  "Satu hari tertunda, ribuan peringkat terlewat.",
  "Bukan soal seberapa pintar, tapi seberapa konsisten.",
  "Lelah itu wajar, tapi menyerah bukan pilihan.",
  "Masa depanmu ditentukan oleh apa yang kamu lakukan hari ini.",
  "SNBT tak kenal kata manja, ia hanya kenal siapa yang siap bertarung.",
  "Sakitnya belajar hanya sebentar, gilanya kebodohan seumur hidup.",
  "Tidur sedikit malam ini, agar nyenyak di Almamater Kuning esok hari.",
  "Orang tua menunggu senyum lulusmu. Jangan hancurkan harapan mereka."
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState({ questionsAnswered: 0, tryoutsCompleted: 0, accuracy: 0, streak: 0 });
  const [recentActivity, setRecentActivity] = useState<{ date: string; count: number }[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(AMBIS_QUOTES[0]);

  useEffect(() => {
    setQuote(AMBIS_QUOTES[Math.floor(Math.random() * AMBIS_QUOTES.length)]);
    
    async function loadDashboardData() {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoading(false);
          return;
        }
        const userId = userData.user.id;

        const [
          { count: answeredCount, data: answersData },
          { count: tryoutsCount },
          { data: streakData },
          { data: subjectsData }
        ] = await Promise.all([
          supabase.from("user_answers").select("created_at, is_correct, questions(subject_id)", { count: "exact" }).eq("user_id", userId),
          supabase.from("tryout_attempts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
          supabase.from("user_streaks").select("current_streak").eq("user_id", userId).maybeSingle(),
          supabase.from("subjects").select("*").order("id", { ascending: true })
        ]);

        let correct = 0;
        let acc = 0;
        const activityMap: Record<string, number> = {};
        
        const subjectStats: Record<number, { correct: number; total: number }> = {};

        if (answersData) {
          answersData.forEach((ans: any) => {
            if (ans.is_correct) correct++;
            const date = new Date(ans.created_at).toISOString().split("T")[0];
            activityMap[date] = (activityMap[date] || 0) + 1;

            const subjId = ans.questions?.subject_id;
            if (subjId) {
              if (!subjectStats[subjId]) subjectStats[subjId] = { correct: 0, total: 0 };
              subjectStats[subjId].total += 1;
              if (ans.is_correct) subjectStats[subjId].correct += 1;
            }
          });

          if (answersData.length > 0) {
            acc = Math.round((correct / answersData.length) * 100);
          }
        }

        setStats({
          questionsAnswered: answeredCount || 0,
          tryoutsCompleted: tryoutsCount || 0,
          accuracy: acc,
          streak: streakData?.current_streak || 0
        });

        if (subjectsData) {
          const mappedSubjects = subjectsData.map(subject => {
            const st = subjectStats[subject.id];
            const calcProgress = st ? Math.round((st.correct / st.total) * 100) : 0;
            return {
              ...subject,
              progress: calcProgress,
              totalAnswered: st?.total || 0
            };
          });
          mappedSubjects.sort((a, b) => b.totalAnswered - a.totalAnswered);
          setSubjectProgress(mappedSubjects.slice(0, 5));
        }

        const days = [];
        for (let i = 90; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          days.push({
            date: dateStr,
            count: activityMap[dateStr] || 0,
          });
        }
        setRecentActivity(days);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Safety timeout: if dashboard takes more than 10s, stop loading
    const timeout = setTimeout(() => setLoading(false), 10000);
    loadDashboardData().then(() => clearTimeout(timeout));
  }, [profile, supabase]);

  const quickActions = [
    { label: "Latihan Soal", href: "/bank-soal", icon: BookOpen, color: "from-indigo-500 to-purple-500" },
    { label: "Mulai Tryout", href: "/tryout", icon: ClipboardList, color: "from-purple-500 to-pink-500" },
    { label: "AI Assistant", href: "/ai-assistant", icon: Brain, color: "from-pink-500 to-rose-500" },
    { label: "Study Groups", href: "/study-groups", icon: Users, color: "from-emerald-500 to-teal-500" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    if (hour < 21) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count <= 2) return "bg-primary/20";
    if (count <= 4) return "bg-primary/40";
    if (count <= 6) return "bg-primary/70";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
         <p className="text-muted-foreground">Menyiapkan dashboard cerdasmu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {greeting()}, <span className="gradient-text">{profile?.name?.split(" ")[0] || "Pejuang PTN"}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-2 italic flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" /> "{quote}"
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-2xl px-5 py-3 shadow-sm">
          <span className="text-2xl">{getStreakEmoji(stats.streak)}</span>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Hari Streak</div>
          </div>
          <Flame className="w-5 h-5 text-orange-500 ml-2" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Soal Dijawab", value: stats.questionsAnswered, icon: CheckCircle2, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
          { label: "Tryout Selesai", value: stats.tryoutsCompleted, icon: ClipboardList, color: "text-purple-500", bgColor: "bg-purple-500/10" },
          { label: "Akurasi Rata-rata", value: `${stats.accuracy}%`, icon: Target, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
          { label: "Konsistensi", value: `${stats.streak} Hari`, icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 card-hover shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={i}
                href={action.href}
                className="group bg-card border border-border/50 rounded-2xl p-5 card-hover shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 shadow-lg transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Activity Calendar & Subject Progress */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Calendar */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Aktivitas Belajar
            </h2>
            <span className="text-xs text-muted-foreground">90 hari terakhir</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {recentActivity.map((day, i) => (
              <div
                key={i}
                className={`cal-cell ${getActivityColor(day.count)}`}
                title={`${day.date}: ${day.count} aktivitas`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Sedikit</span>
            <div className="flex gap-1">
              {[0, 2, 4, 6, 8].map((v) => (
                <div key={v} className={`w-3 h-3 rounded-sm ${getActivityColor(v)}`} />
              ))}
            </div>
            <span>Banyak</span>
          </div>
        </div>

        {/* Subject Quick View */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Penguasaan Subtes (Realtime)
          </h2>
          <div className="space-y-4">
            {subjectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data latihan soal. Yuk mulai kerjakan bank soal!</p>
            ) : (
              subjectProgress.map((subject, i) => (
                 <div key={subject.id || i}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{subject.code}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{subject.name}</span>
                    </span>
                    <span className="text-primary font-medium">{subject.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/analytics" className="flex items-center justify-center gap-2 text-sm text-primary font-medium mt-6 hover:underline">
            Lihat Analitik Lengkap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Study Tips */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">💡 Tips Hari Ini</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gunakan teknik <strong className="text-foreground">Active Recall</strong> setelah mengerjakan soal.
              Tutup buku, coba ingat konsep yang baru dipelajari, lalu verifikasi ulang. Ini terbukti 3x lebih efektif dari membaca ulang!
            </p>
            <Link href="/tips-strategi" className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:underline">
              Pelajari lebih lanjut <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
