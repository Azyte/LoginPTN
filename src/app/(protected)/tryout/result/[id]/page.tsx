"use client";

import { useEffect } from "react";
import { SUBJECTS } from "@/lib/constants";
import { Trophy, Target, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const RESULTS = {
  totalScore: 742,
  maxScore: 1000,
  accuracy: 75,
  duration: "2j 48m",
  rank: 124,
  totalParticipants: 1280,
  sections: [
    { subject: "PU", correct: 24, total: 30, score: 115, time: "28m" },
    { subject: "PPU", correct: 15, total: 20, score: 98, time: "14m" },
    { subject: "PBM", correct: 14, total: 20, score: 96, time: "23m" },
    { subject: "PK", correct: 16, total: 20, score: 108, time: "19m" },
    { subject: "LBI", correct: 22, total: 30, score: 110, time: "40m" },
    { subject: "LBE", correct: 14, total: 20, score: 95, time: "18m" },
    { subject: "PM", correct: 15, total: 20, score: 120, time: "38m" },
  ],
};

export default function TryoutResultPage() {
  const scorePercent = (RESULTS.totalScore / RESULTS.maxScore) * 100;

  useEffect(() => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/tryout" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Tryout
      </Link>

      {/* Score Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
        <Trophy className="w-12 h-12 text-warning mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Hasil Tryout</h1>
        <p className="text-muted-foreground mb-6">Tryout UTBK SNBT #1 — Paket A</p>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
            <circle cx="60" cy="60" r="54" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${scorePercent * 3.39} 339.292`} />
            <defs><linearGradient id="gradient"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{RESULTS.totalScore}</span>
            <span className="text-xs text-muted-foreground">/ {RESULTS.maxScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          <div><div className="text-xl font-bold text-success">{RESULTS.accuracy}%</div><div className="text-xs text-muted-foreground">Akurasi</div></div>
          <div><div className="text-xl font-bold text-primary">#{RESULTS.rank}</div><div className="text-xs text-muted-foreground">Peringkat</div></div>
          <div><div className="text-xl font-bold text-warning">{RESULTS.duration}</div><div className="text-xs text-muted-foreground">Durasi</div></div>
        </div>
      </div>

      {/* Per-Section Breakdown */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Breakdown Per Subtes
        </h2>
        <div className="space-y-3">
          {RESULTS.sections.map((section) => {
            const subjectData = SUBJECTS.find((s) => s.code === section.subject);
            const accuracy = Math.round((section.correct / section.total) * 100);
            return (
              <div key={section.subject} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                <span className="text-xl w-8">{subjectData?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{subjectData?.name || section.subject}</span>
                    <span className="text-sm font-bold">{section.correct}/{section.total}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${accuracy >= 80 ? "bg-success" : accuracy >= 60 ? "bg-warning" : "bg-destructive"}`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold">{section.score}</div>
                  <div className="text-xs text-muted-foreground">{section.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Rekomendasi AI
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✅ <strong className="text-foreground">Penalaran Umum</strong> — Subtes terkuatmu! Pertahankan dengan latihan rutin.</p>
          <p>⚠️ <strong className="text-foreground">Literasi Bahasa Inggris</strong> — Perlu peningkatan. Fokus pada reading comprehension dan vocabulary.</p>
          <p>💡 <strong className="text-foreground">Tips:</strong> Perbanyak latihan soal LBE dan gunakan teknik scanning-skimming untuk menghemat waktu.</p>
        </div>
      </div>
    </div>
  );
}
