"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, TrendingUp, Target, Zap, Brain, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) { setLoading(false); return; }

      try {
        const [
          { data: answersData },
          { data: attemptsData },
          { data: subjectsData }
        ] = await Promise.all([
          supabase.from("user_answers").select("is_correct, questions(subject_id)").eq("user_id", user.id),
          supabase.from("tryout_attempts").select("finished_at, total_score").eq("user_id", user.id).eq("status", "completed").order("finished_at", { ascending: true }),
          supabase.from("subjects").select("*").order("id")
        ]);

        // Calculate performance by subject
        const subjStats: Record<number, { correct: number, total: number }> = {};
        if (answersData) {
          answersData.forEach((ans: any) => {
            const sId = ans.questions?.subject_id;
            if (sId) {
              if (!subjStats[sId]) subjStats[sId] = { correct: 0, total: 0 };
              subjStats[sId].total += 1;
              if (ans.is_correct) subjStats[sId].correct += 1;
            }
          });
        }

        const mappedPerformance = (subjectsData || []).map(sub => {
          const stats = subjStats[sub.id] || { correct: 0, total: 0 };
          const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          return {
            subject: sub.code,
            name: sub.name,
            accuracy: acc,
            total: stats.total,
            correct: stats.correct
          };
        });

        setPerformanceData(mappedPerformance);

        const mappedTrend = (attemptsData || []).map((att, i) => ({
          label: `T${i + 1}`,
          score: att.total_score || 0
        }));

        if (mappedTrend.length === 0) {
          for (let i = 1; i <= 3; i++) mappedTrend.push({ label: `T${i}`, score: 0 });
        }

        setWeeklyTrend(mappedTrend);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
         <p className="text-muted-foreground">Menghitung analitik pintar kamu...</p>
      </div>
    );
  }

  // Derived stats
  const answeredSubjects = performanceData.filter(p => p.total > 0);
  const avgAccuracy = answeredSubjects.length > 0 
    ? Math.round(answeredSubjects.reduce((sum, p) => sum + p.accuracy, 0) / answeredSubjects.length) 
    : 0;
    
  const totalQuestions = performanceData.reduce((sum, p) => sum + p.total, 0);
  const totalCorrect = performanceData.reduce((sum, p) => sum + p.correct, 0);
  
  let strongest, weakest;
  if (answeredSubjects.length > 0) {
    const maxAcc = Math.max(...answeredSubjects.map(p => p.accuracy));
    const minAcc = Math.min(...answeredSubjects.map(p => p.accuracy));
    strongest = answeredSubjects.find(p => p.accuracy === maxAcc);
    weakest = answeredSubjects.find(p => p.accuracy === minAcc);
  }

  const firstScore = weeklyTrend[0]?.score || 0;
  const lastScore = weeklyTrend[weeklyTrend.length - 1]?.score || 0;
  const scoreImprovement = lastScore - firstScore;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          Analitik Performa (Realtime)
        </h1>
        <p className="text-muted-foreground mt-1">Lacak progres belajarmu dan identifikasi area yang perlu ditingkatkan dari hasil test nyata.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <Target className="w-8 h-8 text-primary mb-3" />
          <div className="text-2xl font-bold">{avgAccuracy}%</div>
          <div className="text-xs text-muted-foreground">Akurasi Rata-rata</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <Brain className="w-8 h-8 text-purple-500 mb-3" />
          <div className="text-2xl font-bold">{totalQuestions}</div>
          <div className="text-xs text-muted-foreground">Total Soal Dijawab</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <Zap className="w-8 h-8 text-success mb-3" />
          <div className="text-2xl font-bold">{totalCorrect}</div>
          <div className="text-xs text-muted-foreground">Jawaban Benar</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <TrendingUp className={`w-8 h-8 mb-3 ${scoreImprovement >= 0 ? 'text-warning' : 'text-destructive'}`} />
          <div className="text-2xl font-bold">{scoreImprovement > 0 ? '+' : ''}{scoreImprovement}</div>
          <div className="text-xs text-muted-foreground">Peningkatan Skor Tryout</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Accuracy */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Akurasi Per Subtes</h2>
          <div className="space-y-5">
            {performanceData.map((perf) => (
              <div key={perf.subject}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{perf.subject}</span>
                    <span className="text-muted-foreground text-xs line-clamp-1">{perf.name}</span>
                  </span>
                  <span className={`text-sm font-bold ${perf.accuracy >= 75 ? "text-success" : perf.accuracy >= 60 ? "text-warning" : "text-destructive"}`}>
                    {perf.accuracy}% ({perf.correct}/{perf.total})
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${perf.accuracy >= 75 ? "bg-success" : perf.accuracy >= 60 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${perf.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Trend */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-6">Tren Skor Tryout & Simulasi</h2>
          <div className="flex-1 flex items-end gap-3 min-h-[250px] pt-8">
            {weeklyTrend.map((record, i) => {
              const height = record.score === 0 ? 5 : ((record.score) / 1000) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 relative group">
                  <div className="absolute -top-8 text-xs font-bold bg-secondary px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {record.score}
                  </div>
                  <div className="w-full bg-secondary/50 rounded-t-lg overflow-hidden flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-accent transition-all duration-1000 hover:brightness-110"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground mt-1">{record.label}</span>
                </div>
              );
            })}
          </div>
          {weeklyTrend[0]?.score === 0 && (
             <p className="text-xs text-center text-muted-foreground mt-6">Ayo ikuti tryout pertamamu untuk melacak peningkatan skormu di sini!</p>
          )}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {answeredSubjects.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-success/5 border border-success/20 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-success mb-2 flex items-center gap-2">💪 Kekuatan Utama</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subtes <strong className="text-foreground">{strongest?.name} ({strongest?.subject})</strong> adalah yang terkuat ({strongest?.accuracy}% akurasi).
              Pertahankan konsistensi belajarmu di materi ini!
            </p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-warning mb-2 flex items-center gap-2">🎯 Prioritas Latihan</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subtes <strong className="text-foreground">{weakest?.name} ({weakest?.subject})</strong> harus kamu perhatikan lebih ({weakest?.accuracy}% akurasi).
              Perbanyak latihan soal pada subtes ini secara spesifik minggu ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
