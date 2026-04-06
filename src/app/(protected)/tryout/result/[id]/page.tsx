"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { SUBJECTS } from "@/lib/constants";
import { Trophy, Target, TrendingUp, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TryoutResultPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<any>(null);
  const [sectionResults, setSectionResults] = useState<any[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      if (!params.id) return;

      try {
        // Parallelize fetching attempt details and answers
        const [attemptResponse, answersResponse] = await Promise.all([
          supabase
            .from("tryout_attempts")
            .select(`
              *,
              tryout:tryouts(title, description, duration_minutes)
            `)
            .eq("id", params.id as string)
            .single(),
            
          supabase
            .from("tryout_answers")
            .select(`
              *,
              question:questions(id, content, options, correct_answer, subject_id, difficulty),
              section:tryout_sections(id, order_index, subject_id, duration_minutes, subjects(name, code))
            `)
            .eq("attempt_id", params.id as string)
        ]);

        const { data: attemptData, error: attemptError } = attemptResponse;
        const answersData = answersResponse.data;

        if (attemptError || !attemptData) {
          setError("Hasil tryout tidak ditemukan.");
          setLoading(false);
          return;
        }

        setAttempt(attemptData);

        if (answersData && answersData.length > 0) {
          // Group answers by section
          const sectionMap: Record<string, {
            sectionId: string;
            subjectCode: string;
            subjectName: string;
            correct: number;
            total: number;
            orderIndex: number;
          }> = {};

          let correct = 0;
          let total = 0;

          answersData.forEach((ans: any) => {
            const sectionId = ans.section_id;
            const subjectCode = ans.section?.subjects?.code || "?";
            const subjectName = ans.section?.subjects?.name || "Tidak diketahui";
            const orderIndex = ans.section?.order_index ?? 99;

            if (!sectionMap[sectionId]) {
              sectionMap[sectionId] = {
                sectionId,
                subjectCode,
                subjectName,
                correct: 0,
                total: 0,
                orderIndex,
              };
            }

            sectionMap[sectionId].total += 1;
            total += 1;

            if (ans.is_correct) {
              sectionMap[sectionId].correct += 1;
              correct += 1;
            }
          });

          const sortedSections = Object.values(sectionMap).sort(
            (a, b) => a.orderIndex - b.orderIndex
          );

          setSectionResults(sortedSections);
          setTotalCorrect(correct);
          setTotalQuestions(total);
        } else {
          // No answers found — maybe user submitted with no answers
          setTotalCorrect(0);
          setTotalQuestions(0);
        }
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Terjadi kesalahan saat memuat hasil.");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [params.id, supabase]);

  // Fire confetti once data loads
  useEffect(() => {
    if (!loading && attempt && !confettiFired) {
      setConfettiFired(true);
      import("canvas-confetti").then((confettiModule) => {
        const confetti = confettiModule.default;
        const duration = 2000;
        const animationEnd = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
          });
          if (Date.now() < animationEnd) requestAnimationFrame(frame);
        };
        frame();
      });
    }
  }, [loading, attempt, confettiFired]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24 flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Memuat hasil tryout...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Hasil Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">{error || "Data hasil tryout tidak tersedia."}</p>
        <Link href="/tryout" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium">
          Kembali ke Tryout
        </Link>
      </div>
    );
  }

  const totalScore = attempt.total_score || 0;
  const maxScore = 1000;
  const scorePercent = Math.min((totalScore / maxScore) * 100, 100);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Calculate duration
  let durationText = "-";
  if (attempt.started_at && attempt.finished_at) {
    const diffMs = new Date(attempt.finished_at).getTime() - new Date(attempt.started_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    durationText = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/tryout" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Tryout
      </Link>

      {/* Score Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
        <Trophy className="w-12 h-12 text-warning mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Hasil Tryout</h1>
        <p className="text-muted-foreground mb-6">{attempt.tryout?.title || "Tryout UTBK SNBT"}</p>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
            <circle cx="60" cy="60" r="54" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${scorePercent * 3.39} 339.292`} />
            <defs><linearGradient id="gradient"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{Math.round(totalScore)}</span>
            <span className="text-xs text-muted-foreground">/ {maxScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-sm mx-auto">
          <div><div className="text-xl font-bold text-success">{accuracy}%</div><div className="text-xs text-muted-foreground">Akurasi</div></div>
          <div><div className="text-xl font-bold text-primary">{totalCorrect}/{totalQuestions}</div><div className="text-xs text-muted-foreground">Benar</div></div>
          <div className="col-span-2 sm:col-span-1"><div className="text-xl font-bold text-warning">{durationText}</div><div className="text-xs text-muted-foreground">Durasi</div></div>
        </div>
      </div>

      {/* Per-Section Breakdown */}
      {sectionResults.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Breakdown Per Subtes
          </h2>
          <div className="space-y-3">
            {sectionResults.map((section) => {
              const subjectData = SUBJECTS.find((s) => s.code === section.subjectCode);
              const sectionAccuracy = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
              return (
                <div key={section.sectionId} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                  <span className="text-xl w-8">{subjectData?.icon || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{section.subjectName}</span>
                      <span className="text-sm font-bold">{section.correct}/{section.total}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${sectionAccuracy >= 80 ? "bg-success" : sectionAccuracy >= 60 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${sectionAccuracy}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{sectionAccuracy}%</div>
                    <div className="text-xs text-muted-foreground">akurasi</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Analisis Performa
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          {sectionResults.length > 0 && (() => {
            const best = [...sectionResults].sort((a, b) => (b.correct / b.total) - (a.correct / a.total))[0];
            const worst = [...sectionResults].sort((a, b) => (a.correct / a.total) - (b.correct / b.total))[0];
            return (
              <>
                <p>✅ <strong className="text-foreground">{best.subjectName}</strong> — Subtes terkuatmu! Pertahankan dengan latihan rutin.</p>
                {worst.sectionId !== best.sectionId && (
                  <p>⚠️ <strong className="text-foreground">{worst.subjectName}</strong> — Perlu peningkatan. Fokus di Bank Soal untuk subtes ini.</p>
                )}
              </>
            );
          })()}
          <p>💡 <strong className="text-foreground">Tips:</strong> Gunakan teknik Active Recall setelah mengerjakan soal. Kerjakan ulang soal yang salah di Bank Soal untuk penguatan.</p>
        </div>
      </div>
    </div>
  );
}
