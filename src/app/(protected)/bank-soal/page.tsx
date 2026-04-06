"use client";

import { useState, useMemo, useCallback } from "react";
import { SUBJECTS } from "@/lib/constants";
import { getDifficultyBg } from "@/lib/utils";
import { BookOpen, Folder, Bookmark, BookmarkCheck, CheckCircle2, XCircle, ChevronLeft, Sparkles, RotateCcw, Shuffle, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

const PAGE_SIZE = 10; // Only load 10 questions at a time

export default function BankSoalPage() {
  const [viewState, setViewState] = useState<"folders" | "questions">("folders");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, { selected: string; revealed: boolean }>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();

  const handleBackToFolders = () => {
    setViewState("folders");
    setSelectedFolderId(null);
    setQuestions([]);
    setAnswers({});
    setBookmarks(new Set());
    setCurrentPage(0);
    setTotalCount(0);
  };

  const formatQuestions = useCallback((fetchedQuestions: any[], folderId: string) => {
    return fetchedQuestions.map(q => {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const mappedOps = Array.isArray(q.options)
        ? q.options.map((opt: any, i: number) => {
            if (typeof opt === 'string') {
              return { key: letters[i] || 'X', text: opt.replace(/\(kunci jawaban\)/gi, "").trim() };
            }
            return { key: opt?.key || letters[i] || 'X', text: String(opt?.text || '').replace(/\(kunci jawaban\)/gi, "").trim() };
          })
        : [];

      let correctKey = 'A';
      if (q.correct_answer) {
        if (typeof q.correct_answer === 'object' && q.correct_answer !== null && q.correct_answer.key) {
          correctKey = q.correct_answer.key;
        }
      }

      return {
        id: q.id,
        subject: q.subjects?.code || folderId,
        difficulty: q.difficulty,
        type: q.type,
        content: q.content,
        options: mappedOps,
        correct: correctKey,
        explanation: q.explanation
      };
    });
  }, []);

  const loadPage = useCallback(async (folderId: string, page: number) => {
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (folderId === "acak") {
        // Random mode: fetch 20 random
        const { data, count } = await supabase
          .from('questions')
          .select('*, subjects(code)', { count: 'exact' })
          .limit(20);

        if (data) {
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          setQuestions(formatQuestions(shuffled, folderId));
          setTotalCount(shuffled.length);
        }
      } else {
        // Paginated fetch by subject code
        const { data, count } = await supabase
          .from('questions')
          .select('*, subjects!inner(code)', { count: 'exact' })
          .eq('subjects.code', folderId)
          .order('difficulty', { ascending: true })
          .range(from, to);

        if (data) {
          setQuestions(formatQuestions(data, folderId));
        }
        setTotalCount(count || 0);
      }

      // Load bookmarks for this user (lightweight)
      if (user) {
        const { data: bkmData } = await supabase
          .from('bookmarks')
          .select('question_id')
          .eq('user_id', user.id);
        if (bkmData) setBookmarks(new Set(bkmData.map((b: any) => b.question_id)));
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, formatQuestions]);

  const handleOpenFolder = async (folderId: string) => {
    setSelectedFolderId(folderId);
    setViewState("questions");
    setAnswers({});
    setCurrentPage(0);
    await loadPage(folderId, 0);
  };

  const handlePageChange = async (newPage: number) => {
    if (!selectedFolderId) return;
    setCurrentPage(newPage);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await loadPage(selectedFolderId, newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const toggleBookmark = async (id: string) => {
    const isBookmarked = bookmarks.has(id);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (user && selectedFolderId !== "acak") {
      if (isBookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', id);
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, question_id: id });
      }
    }
  };

  const selectAnswer = (questionId: string, optionKey: string) => {
    if (answers[questionId]?.revealed) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { selected: optionKey, revealed: false } }));
  };

  const revealAnswer = async (questionId: string) => {
    const ans = answers[questionId];
    if (!ans) return;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], revealed: true } }));
    if (user && selectedFolderId !== "acak") {
      const q = questions.find(x => x.id === questionId);
      const isCorrect = ans.selected === q?.correct;
      await supabase.from('user_answers').insert({
        user_id: user.id,
        question_id: questionId,
        answer: JSON.stringify(ans.selected),
        is_correct: isCorrect,
        time_spent_seconds: 30
      });
    }
  };

  const retryQuestion = (questionId: string) => {
    setAnswers((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
  };

  // ── FOLDER VIEW ──
  if (viewState === "folders") {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary" />
            Eksplorasi Bank Soal
          </h1>
          <p className="text-muted-foreground mt-1">Pilih subtes SNBT untuk fokus belajar, atau coba latihan acak</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <button
            onClick={() => handleOpenFolder("acak")}
            className="group relative overflow-hidden bg-card border-2 border-primary/40 hover:border-primary p-6 rounded-2xl text-left transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 sm:col-span-2 lg:col-span-3"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                  <Shuffle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-1">🎲 Latihan Acak (Quick Play)</h3>
                <p className="text-sm text-muted-foreground">20 soal campuran tanpa menyimpan riwayat. Sikat habis!</p>
              </div>
            </div>
          </button>

          {SUBJECTS.map((subject) => (
            <button
              key={subject.code}
              onClick={() => handleOpenFolder(subject.code)}
              className="group relative bg-card border border-border/50 hover:border-secondary-foreground/20 p-6 rounded-2xl text-left transition-all card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-1 line-clamp-1">{subject.name}</h3>
              <div className="flex items-center gap-2 text-primary font-mono font-semibold text-sm">
                <span>{subject.icon}</span> {subject.code}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── QUESTIONS VIEW ──
  const folderName = selectedFolderId === "acak" ? "Latihan Acak" : SUBJECTS.find(s => s.code === selectedFolderId)?.name;
  const answeredCount = Object.values(answers).filter(a => a.revealed).length;
  const correctCount = Object.entries(answers).filter(([qId, a]) => {
    if (!a.revealed) return false;
    const q = questions.find(x => x.id === qId);
    return q && a.selected === q.correct;
  }).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={handleBackToFolders} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Folder
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            {selectedFolderId === "acak" ? <Shuffle className="w-7 h-7 text-primary" /> : <Folder className="w-7 h-7 text-primary" />}
            {folderName}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-secondary/30 px-4 py-2 rounded-xl border border-border/50">
           {loading ? (
             <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Memuat...</span>
           ) : (
             <>
               <span className="font-medium text-foreground">{totalCount} soal</span>
               <span>•</span>
               <span>Hal {currentPage + 1}/{Math.max(totalPages, 1)}</span>
               {answeredCount > 0 && (
                 <><span>•</span><span className="text-success font-semibold">{correctCount}/{answeredCount} benar</span></>
               )}
             </>
           )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
             <div key={i} className="bg-card border border-border/50 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-dashed border-border/50">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Belum ada soal</h3>
          <p className="text-muted-foreground">Soal untuk kategori ini sedang ditambahkan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const answer = answers[q.id];
            const isRevealed = answer?.revealed;
            const isCorrect = isRevealed && answer?.selected === q.correct;
            const subjectData = SUBJECTS.find((s) => s.code === q.subject);
            const globalIdx = currentPage * PAGE_SIZE + idx + 1;

            return (
              <div
                key={q.id}
                className={`bg-card border rounded-2xl p-6 transition-all ${
                  isRevealed
                    ? isCorrect
                      ? "border-success/50 bg-success/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      : "border-destructive/50 bg-destructive/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold bg-secondary text-foreground px-3 py-1 rounded-lg">Soal #{globalIdx}</span>
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                      {subjectData?.icon} {q.subject}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-lg font-bold border ${getDifficultyBg(q.difficulty)}`}>
                      {q.difficulty === "easy" ? "Mudah" : q.difficulty === "medium" ? "Sedang" : "Sulit"}
                    </span>
                    {isRevealed && (
                      <span className={`text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1 ${isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                        {isCorrect ? "Benar" : "Salah"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isRevealed && (
                      <button onClick={() => retryQuestion(q.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold">
                        <RotateCcw className="w-4 h-4" /> Ulangi
                      </button>
                    )}
                    <button onClick={() => toggleBookmark(q.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors">
                      {bookmarks.has(q.id) ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-base leading-relaxed mb-6 font-medium whitespace-pre-wrap">{q.content}</div>

                <div className="space-y-2.5 mb-5">
                  {q.options.map((opt: { key: string; text: string }) => {
                    const isSelected = answer?.selected === opt.key;
                    const isCorrectOpt = opt.key === q.correct;
                    let optClass = "border-border/50 hover:bg-secondary/50 cursor-pointer";
                    if (isRevealed) {
                      if (isCorrectOpt) optClass = "border-success bg-success/15 ring-1 ring-success/50 pointer-events-none";
                      else if (isSelected && !isCorrectOpt) optClass = "border-destructive bg-destructive/15 ring-1 ring-destructive/50 pointer-events-none";
                      else optClass = "border-border/30 opacity-40 pointer-events-none";
                    } else if (isSelected) {
                      optClass = "border-primary bg-primary/10 ring-1 ring-primary/50";
                    }
                    return (
                      <button key={opt.key} onClick={() => selectAnswer(q.id, opt.key)} className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${optClass}`}>
                        <span className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isRevealed && isCorrectOpt ? "border-transparent bg-success text-success-foreground" :
                          isRevealed && isSelected && !isCorrectOpt ? "border-transparent bg-destructive text-destructive-foreground" :
                          isSelected ? "border-transparent bg-primary text-primary-foreground" :
                          "border-border text-muted-foreground"
                        }`}>
                          {isRevealed && isCorrectOpt ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                           isRevealed && isSelected && !isCorrectOpt ? <XCircle className="w-3.5 h-3.5" /> :
                           opt.key}
                        </span>
                        <span className="text-sm pt-0.5 whitespace-pre-wrap">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {!isRevealed && answer?.selected && (
                  <div className="flex border-t border-border/50 pt-5 mt-2">
                    <button onClick={() => revealAnswer(q.id)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                      Periksa Jawaban
                    </button>
                  </div>
                )}

                {isRevealed && (
                  <div className="mt-5 p-5 bg-card/50 ring-1 ring-border/50 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pembahasan</span>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {q.explanation || "Pembahasan untuk soal ini belum tersedia."}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {selectedFolderId !== "acak" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4 pb-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5) {
                    const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    pageNum = start + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                        currentPage === pageNum ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-primary/20"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
