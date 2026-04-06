"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

// Seeded shuffle for consistent shuffling per attempt
function seededShuffle<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = ((hash < 0 ? ~hash : hash) % (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TryoutTakePage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [tryout, setTryout] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctAnswerMap, setCorrectAnswerMap] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    async function fetchTryout() {
      if (!params.id) return;

      const { data } = await supabase
        .from("tryouts")
        .select(`
          *,
          tryout_sections (
            *,
            subjects (name, code),
            tryout_questions (
              id,
              order_index,
              questions (*)
            )
          )
        `)
        .eq("id", params.id as string)
        .single();
      
      if (data) {
        setTryout(data);
        
        // Build correct answer map (kept separate, NOT in questions shown to user)
        const answerMap: Record<string, string> = {};
        
        const sortedSections = (data.tryout_sections || []).sort((a: any, b: any) => a.order_index - b.order_index).map((sec: any) => {
          const questions = (sec.tryout_questions || [])
            .sort((qa: any, qb: any) => qa.order_index - qb.order_index)
            .map((tq: any) => {
              const q = tq.questions;
              if (!q) return null;
              
              // Extract correct answer key BEFORE stripping it
              let correctKey = "";
              try {
                if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
                  correctKey = q.correct_answer.key || String(q.correct_answer);
                } else if (typeof q.correct_answer === 'string') {
                  try {
                    const parsed = JSON.parse(q.correct_answer);
                    correctKey = parsed.key || String(parsed);
                  } catch {
                    correctKey = String(q.correct_answer).replace(/[\`'"/]/g, "");
                  }
                }
              } catch {
                correctKey = String(q.correct_answer || "").replace(/[\`'"/]/g, "");
              }
              answerMap[q.id] = correctKey;
              
              // Return question WITHOUT correct_answer and explanation
              return {
                id: q.id,
                content: q.content,
                options: q.options,
                difficulty: q.difficulty,
                type: q.type,
              };
            })
            .filter(Boolean);
          
          return {
            ...sec,
            questions,
          };
        });
        
        setCorrectAnswerMap(answerMap);
        setSections(sortedSections);
        if (sortedSections.length > 0) {
          setTimeLeft(sortedSections[0].duration_minutes * 60);
        }
      }
      setLoading(false);
    }
    fetchTryout();
  }, [params.id, supabase]);

  useEffect(() => {
    if (!isStarted || sections.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, currentSection, sections]);

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection((s) => s + 1);
      setCurrentQuestion(0);
      setTimeLeft(sections[currentSection + 1].duration_minutes * 60);
      setShowConfirm(false);
    } else {
      handleFinish();
    }
  };

  const handleStart = async () => {
    if (!profile) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: attempt } = await supabase.from("tryout_attempts").insert({
      tryout_id: tryout.id,
      user_id: userData.user.id,
      status: "in_progress"
    }).select().single();

    if (attempt) {
      setAttemptId(attempt.id);
      setIsStarted(true);
    }
  };

  const handleFinish = async () => {
    if (!attemptId) return;
    setShowConfirm(false);
    
    let correctCount = 0;
    let totalQuestions = 0;
    const answersToInsert: any[] = [];

    sections.forEach(sec => {
      sec.questions.forEach((q: any) => {
        if (!q) return;
        totalQuestions++;
        const userAnswer = answers[q.id];
        const correctKey = correctAnswerMap[q.id] || "";
        
        const isCorrect = userAnswer === correctKey;
        if (isCorrect) correctCount++;

        answersToInsert.push({
          attempt_id: attemptId,
          question_id: q.id,
          section_id: sec.id,
          answer: userAnswer ? { key: userAnswer } : null,
          is_correct: isCorrect
        });
      });
    });

    const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) : 0;

    await supabase.from("tryout_attempts").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      total_score: totalScore
    }).eq("id", attemptId);

    if (answersToInsert.length > 0) {
      await supabase.from("tryout_answers").insert(answersToInsert);
    }

    router.push(`/tryout/result/${attemptId}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Memuat data tryout...</p>
      </div>
    );
  }

  if (!tryout || sections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Tryout Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">Mungkin tryout ini belum dikonfigurasi atau sudah tidak aktif.</p>
        <button onClick={() => router.push("/tryout")} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium">
          Kembali ke Daftar Tryout
        </button>
      </div>
    );
  }

  const section = sections[currentSection];
  const questions = section.questions || [];
  const question = questions[currentQuestion];
  const answeredInSection = questions.filter((q: any) => q && answers[q.id]).length;

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Siap Memulai {tryout.title}?</h1>
          <p className="text-muted-foreground mb-6 text-sm">{tryout.description || `Tryout ini terdiri dari ${sections.length} sesi. Pastikan kamu siap sebelum memulai.`}</p>
          <div className="space-y-2 text-sm text-left max-w-sm mx-auto mb-8">
            {sections.map((s: any, i: number) => (
              <div key={s.id || i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <span className="font-medium flex items-center gap-2">
                  <span className="bg-secondary px-2 py-0.5 rounded text-xs">{s.subjects?.code}</span>
                  {s.subjects?.name || `Sesi ${i+1}`}
                </span>
                <span className="text-muted-foreground text-xs">{s.duration_minutes} mnt • {s.questions?.length} soal</span>
              </div>
            ))}
          </div>
          <button onClick={handleStart} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 w-full sm:w-auto">
            Mulai Tryout Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-10 shadow-sm">
        <div>
          <div className="text-xs text-muted-foreground">Sesi {currentSection + 1}/{sections.length}</div>
          <div className="font-semibold text-sm sm:text-base">{section.subjects?.name || `Sesi ${currentSection + 1}`}</div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timeLeft < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground hidden sm:block">
          {answeredInSection}/{questions.length} dijawab
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_250px] gap-6">
        {/* Question Area */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          {!question ? (
            <div className="text-center py-10">Data soal belum lengkap pada sesi ini.</div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">Soal {currentQuestion + 1} dari {questions.length}</div>
              <div className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap">{question.content}</div>
              <div className="space-y-3">
                {Array.isArray(question.options) && question.options.map((opt: any, i: number) => {
                  const key = opt.key || String.fromCharCode(65 + i);
                  const text = opt.text || opt.value || opt.content || String(opt);
                  return (
                    <button
                      key={key}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: key }))}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                        answers[question.id] === key ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 hover:bg-secondary/50"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                        answers[question.id] === key ? "border-primary text-primary bg-background" : "border-border text-muted-foreground bg-secondary/50"
                      }`}>{key}</span>
                      <span className="text-sm leading-relaxed mt-1 flex-1">{text}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 px-4 py-2"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            {currentQuestion >= questions.length - 1 ? (
              <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm">
                <Flag className="w-4 h-4" /> {currentSection === sections.length - 1 ? "Selesaikan Tryout" : "Selesaikan Sesi"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion((q) => Math.min(questions.length - 1, q + 1))}
                className="flex items-center gap-2 text-sm text-primary font-semibold px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors"
                disabled={!question}
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm h-fit sticky top-[5.5rem]">
          <h3 className="text-sm font-semibold mb-4 flex items-center justify-between">
            Navigasi Soal
            <span className="text-xs bg-secondary px-2 py-0.5 rounded font-medium">{answeredInSection}/{questions.length}</span>
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q: any, i: number) => {
              if (!q) return null;
              const isAnswered = answers[q.id];
              const isCurrent = i === currentQuestion;
              
              let btnClass = "bg-secondary text-muted-foreground hover:bg-secondary/80";
              if (isCurrent) {
                btnClass = "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1 ring-offset-background";
              } else if (isAnswered) {
                btnClass = "bg-success/20 text-success border border-success/30";
              }

              return (
                <button
                  key={q.id || i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${btnClass}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded bg-primary" /> Sedang dikerjakan</div>
            <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded bg-success/20 border border-success/30" /> Sudah dijawab</div>
            <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded bg-secondary" /> Belum dijawab</div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card border border-border/50 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-xl">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Selesaikan {currentSection === sections.length - 1 ? "Tryout" : "Sesi ini"}?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {questions.length - answeredInSection > 0 
                ? `${questions.length - answeredInSection} soal belum terjawab. ` 
                : "Semua soal telah terjawab. "}
              Yakin ingin melanjutkan?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-2.5 rounded-xl font-medium transition-colors">Batal</button>
              <button
                onClick={handleNextSection}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-all"
              >
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
