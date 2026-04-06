"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ClipboardList, Clock, BookOpen, Users, ArrowRight, Play, CheckCircle2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export default function TryoutPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"available" | "history">("available");
  
  const [tryouts, setTryouts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [completedTryoutIds, setCompletedTryoutIds] = useState<Record<string, string>>({}); // tryout_id -> attempt_id
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) { setLoading(false); return; }

      try {
        // Run both active tryouts and user history fetching in parallel
        const [tryoutsResponse, historyResponse] = await Promise.all([
          supabase
            .from("tryouts")
            .select(`
              *,
              attempts:tryout_attempts(count)
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
            
          supabase
            .from("tryout_attempts")
            .select(`
              *,
              tryout:tryouts(title)
            `)
            .eq("user_id", user.id)
            .eq("status", "completed")
            .order("finished_at", { ascending: false })
        ]);

        const activeTryouts = tryoutsResponse.data;
        const pastAttempts = historyResponse.data;

        if (activeTryouts) {
          setTryouts(activeTryouts.map(t => ({
            ...t,
            participants: t.attempts?.[0]?.count || 0,
            difficulty: "Mixed"
          })));
        }

        if (pastAttempts) {
          setHistory(pastAttempts);

          // Buat map: tryout_id -> attempt_id (ambil yang terbaru)
          const completed: Record<string, string> = {};
          pastAttempts.forEach((att: any) => {
            if (!completed[att.tryout_id]) {
              completed[att.tryout_id] = att.id;
            }
          });
          setCompletedTryoutIds(completed);
        }
      } catch (err) {
        console.error("Error loading tryout data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, supabase]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-primary" />
          Tryout UTBK SNBT
        </h1>
        <p className="text-muted-foreground mt-1">Simulasi ujian realistis dengan timer dan format SNBT terbaru</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("available")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === "available" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
          Tersedia
        </button>
        <button onClick={() => setTab("history")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all relative ${tab === "history" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
          Riwayat
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {tab === "available" && (
        <div className="grid md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-10 text-muted-foreground">Memuat data tryout...</div>
          ) : tryouts.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-muted-foreground">Belum ada tryout yang tersedia</div>
          ) : (
            tryouts.map((tryout) => {
              const completedAttemptId = completedTryoutIds[tryout.id];
              const isCompleted = !!completedAttemptId;

              return (
                <div key={tryout.id} className={`bg-card border rounded-2xl p-6 card-hover ${isCompleted ? "border-success/30" : "border-border/50"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{tryout.difficulty}</span>
                      {isCompleted && (
                        <span className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {tryout.participants}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{tryout.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tryout.description || "Tidak ada deskripsi"}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {tryout.duration_minutes} menit</span>
                    {tryout.questionsCount && (
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {tryout.questionsCount} soal</span>
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/tryout/result/${completedAttemptId}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-success/10 text-success border border-success/30 py-2.5 rounded-xl text-sm font-semibold hover:bg-success/20 transition-all"
                      >
                        <Eye className="w-4 h-4" /> Review Jawaban
                      </Link>
                      <Link
                        href={`/tryout/${tryout.id}`}
                        className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all"
                      >
                        <Play className="w-4 h-4" /> Ulang
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/tryout/${tryout.id}`}
                      className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all w-full"
                    >
                      <Play className="w-4 h-4" /> Mulai Tryout
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Memuat riwayat tryout...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada riwayat tryout</p>
              <p className="text-sm mt-1">Ayo mulai tryout pertamamu!</p>
            </div>
          ) : (
            history.map((result) => (
              <div key={result.id} className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{result.tryout?.title || "Tryout Selesai"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(result.finished_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                    {" • "}
                    {new Date(result.finished_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{result.total_score || 0}</div>
                    <div className="text-xs text-muted-foreground">Skor</div>
                  </div>
                </div>
                <Link href={`/tryout/result/${result.id}`} className="flex items-center gap-2 text-sm text-primary font-medium shrink-0 bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all">
                  <Eye className="w-4 h-4" /> Review <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
