"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { SUBJECTS } from "@/lib/constants";
import { Trophy, Target, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TryoutResultPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    async function loadResult() {
      if (!params.id) return;

      try {
        // Fetch attempt data
        const { data: attempt } = await supabase
          .from("tryout_attempts")
          .select("*, tryout:tryouts(title, description)")
          .eq("id", params.id as string)
          .single();

        if (!attempt) { setLoading(false); return; }
        setResult(attempt);

        // Fetch answers for this attempt grouped by section
        const { data: answers } = await supabase
          .from("tryout_answers")
          .select("*, section:tryout_sections(subject_id, subjects(name, code))")
          .eq("attempt_id", params.id as string);

        if (answers) {
          // Group by section/subject
          const sectionMap: Record<string, { code: string; name: string; correct: number; total: number }> = {};
          answers.forEach((ans: any) => {
            const code = ans.section?.subjects?.code || "??";
            const name = ans.section?.subjects?.name || "Unknown";
            if (!sectionMap[code]) {
              sectionMap[code] = { code, name, correct: 0, total: 0 };
            }
            sectionMap[code].total += 1;
            if (ans.is_correct) sectionMap[code].correct += 1;
          });
          setSections(Object.values(sectionMap));
        }
      } catch (err) {
        console.error("Error loading result:", err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat hasil tryout...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Hasil Tidak Ditemukan</h2>
        <Link href="/tryout" className="text-primary underline text-sm">Kembali ke Tryout</Link>
      </div>
    );
  }

  const totalScore = result.total_score || 0;
  const maxScore = 1000;
  const scorePercent = Math.min((totalScore / maxScore) * 100, 100);
  const totalCorrect = sections.reduce((a, s) => a + s.correct, 0);
  const totalQuestions = sections.reduce((a, s) => a + s.total, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const startTime = new Date(result.started_at);
  const endTime = result.finished_at ? new Date(result.finished_at) : new Date();
  const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const durationStr = durationMin >= 60 ? `${Math.floor(durationMin / 60)}j ${durationMin % 60}m` : `${durationMin}m`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/tryout" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Tryout
      </Link>

      {/* Score Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
        <Trophy className="w-12 h-12 text-warning mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Hasil Tryout</h1>
        <p className="text-muted-foreground mb-6">{result.tryout?.title || "Tryout UTBK SNBT"}</p>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
            <circle cx="60" cy="60" r="54" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${scorePercent * 3.39} 339.292`} />
            <defs><linearGradient id="gradient"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{totalScore}</span>
            <span className="text-xs text-muted-foreground">/ {maxScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          <div><div className="text-xl font-bold text-success">{accuracy}%</div><div className="text-xs text-muted-foreground">Akurasi</div></div>
          <div><div className="text-xl font-bold text-primary">{totalCorrect}/{totalQuestions}</div><div className="text-xs text-muted-foreground">Benar</div></div>
          <div><div className="text-xl font-bold text-warning">{durationStr}</div><div className="text-xs text-muted-foreground">Durasi</div></div>
        </div>
      </div>

      {/* Per-Section Breakdown */}
      {sections.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Breakdown Per Subtes
          </h2>
          <div className="space-y-3">
            {sections.map((section) => {
              const subjectData = SUBJECTS.find((s) => s.code === section.code);
              const acc = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
              return (
                <div key={section.code} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                  <span className="text-xl w-8">{subjectData?.icon || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{section.name}</span>
                      <span className="text-sm font-bold">{section.correct}/{section.total}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${acc >= 80 ? "bg-success" : acc >= 60 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{acc}%</div>
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
          Rekomendasi
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          {sections.length > 0 && (() => {
            const best = sections.reduce((a, b) => (b.total > 0 && (b.correct / b.total) > (a.correct / a.total) ? b : a), sections[0]);
            const worst = sections.reduce((a, b) => (b.total > 0 && (b.correct / b.total) < (a.correct / a.total) ? b : a), sections[0]);
            return (
              <>
                <p>✅ <strong className="text-foreground">{best.name}</strong> — Subtes terkuatmu! Pertahankan dengan latihan rutin.</p>
                {worst.code !== best.code && (
                  <p>⚠️ <strong className="text-foreground">{worst.name}</strong> — Perlu peningkatan. Fokus latihan di area ini.</p>
                )}
                <p>💡 <strong className="text-foreground">Tips:</strong> Perbanyak latihan di Bank Soal dan gunakan AI Assistant untuk penjelasan materi yang belum dipahami.</p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
