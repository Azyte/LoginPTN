"use client";

import { useState } from "react";
import { STUDY_METHODS } from "@/lib/constants";
import { Lightbulb, ChevronDown, ChevronUp, CheckCircle2, Star, BookOpen } from "lucide-react";

export default function TipsStrategiPage() {
  const [expandedMethod, setExpandedMethod] = useState<string | null>("pomodoro");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-warning" />
          Tips & Strategi Belajar
        </h1>
        <p className="text-muted-foreground mt-1">Metode belajar berdasarkan riset sains pembelajaran global</p>
      </div>

      {/* Daily Recommendation */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-warning" />
          <h2 className="font-semibold">Rekomendasi Hari Ini</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Berdasarkan pola belajarmu, hari ini cocok menggunakan <strong className="text-foreground">Active Recall</strong> setelah sesi latihan soal.
          Setelah mengerjakan soal, coba tutup pembahasan dan ingat kembali konsep-konsep kunci yang baru kamu pelajari.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Cocok untuk: Review materi</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Efektivitas: Tinggi</span>
        </div>
      </div>

      {/* Study Methods */}
      <div className="space-y-3">
        {STUDY_METHODS.map((method) => {
          const isExpanded = expandedMethod === method.id;
          return (
            <div key={method.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden card-hover">
              <button
                onClick={() => setExpandedMethod(isExpanded ? null : method.id)}
                className="w-full p-5 flex items-center gap-4 text-left"
              >
                <span className="text-3xl">{method.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{method.description}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4 fade-in-up">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">📋 Langkah-langkah:</h4>
                    <div className="space-y-2">
                      {method.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">✅ Manfaat:</h4>
                    <div className="flex flex-wrap gap-2">
                      {method.benefits.map((benefit, i) => (
                        <span key={i} className="text-xs bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
