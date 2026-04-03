"use client";

import { useState, useMemo, useEffect } from "react";
import { SUBJECTS } from "@/lib/constants";
import { getDifficultyBg } from "@/lib/utils";
import { BookOpen, Filter, Bookmark, BookmarkCheck, CheckCircle2, XCircle, ChevronDown, Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export default function BankSoalPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, { selected: string; revealed: boolean }>>({});
  
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select('*, subjects(code)')
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map(q => {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          const mappedOps = Array.isArray(q.options) 
            ? q.options.map((opt: any, i: number) => {
                if (typeof opt === 'string') {
                   return { key: letters[i] || 'X', text: opt };
                }
                return { key: opt?.key || letters[i] || 'X', text: opt?.text || JSON.stringify(opt) };
              })
            : [];
          
          let correctKey = 'A';
          if (q.correct_answer) {
             if (typeof q.correct_answer === 'object' && q.correct_answer !== null && q.correct_answer.key) {
                correctKey = q.correct_answer.key;
             } else {
                const found = mappedOps.find((o: any) => typeof o.text === 'string' && (o.text === q.correct_answer || (typeof q.correct_answer === 'string' && q.correct_answer.includes(o.text))));
                if (found) correctKey = found.key;
             }
          }

          return {
            id: q.id,
            subject: q.subjects?.code || "PU",
            difficulty: q.difficulty,
            type: q.type,
            content: q.content,
            options: mappedOps,
            correct: correctKey,
            explanation: q.explanation
          };
        });
        setQuestions(formatted);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [supabase]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject && q.subject !== selectedSubject) return false;
      if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery && !q.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [questions, selectedSubject, selectedDifficulty, searchQuery]);

  const toggleBookmark = async (id: string) => {
    const isBookmarked = bookmarks.has(id);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (user) {
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

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], revealed: true },
    }));

    if (user) {
      const q = questions.find(x => x.id === questionId);
      const isCorrect = ans.selected === q.correct;
      await supabase.from('user_answers').insert({
        user_id: user.id,
        question_id: questionId,
        answer: JSON.stringify(ans.selected),
        is_correct: isCorrect,
        time_spent_seconds: 30
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary" />
          Bank Soal
        </h1>
        <p className="text-muted-foreground mt-1">Latihan soal UTBK SNBT dengan pembahasan detail</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari soal..."
            className="w-full bg-card border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={selectedSubject || ""}
          onChange={(e) => setSelectedSubject(e.target.value || null)}
          className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
        >
          <option value="">Semua Subtes</option>
          {SUBJECTS.map((s) => (
            <option key={s.code} value={s.code}>{s.icon} {s.code} - {s.name}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty || ""}
          onChange={(e) => setSelectedDifficulty(e.target.value || null)}
          className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
        >
          <option value="">Semua Kesulitan</option>
          <option value="easy">Mudah</option>
          <option value="medium">Sedang</option>
          <option value="hard">Sulit</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filteredQuestions.length} soal</span>
        <span>•</span>
        <span>{bookmarks.size} dibookmark</span>
        <span>•</span>
        <span>{Object.values(answers).filter((a) => a.revealed).length} dijawab</span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const answer = answers[q.id];
          const isRevealed = answer?.revealed;
          const isCorrect = isRevealed && answer?.selected === q.correct;
          const subjectData = SUBJECTS.find((s) => s.code === q.subject);

          return (
            <div
              key={q.id}
              className={`bg-card border rounded-2xl p-6 transition-all ${
                isRevealed
                  ? isCorrect
                    ? "border-success/50 bg-success/5"
                    : "border-destructive/50 bg-destructive/5"
                  : "border-border/50"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {subjectData?.icon} {q.subject}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getDifficultyBg(q.difficulty)}`}>
                    {q.difficulty === "easy" ? "Mudah" : q.difficulty === "medium" ? "Sedang" : "Sulit"}
                  </span>
                </div>
                <button
                  onClick={() => toggleBookmark(q.id)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {bookmarks.has(q.id) ? (
                    <BookmarkCheck className="w-5 h-5 text-primary" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Question Content */}
              <p className="text-sm leading-relaxed mb-4 font-medium">{q.content}</p>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {q.options.map((opt: { key: string; text: string }) => {
                  const isSelected = answer?.selected === opt.key;
                  const isCorrectOpt = opt.key === q.correct;
                  let optClass = "border-border/50 hover:bg-secondary/50 cursor-pointer";

                  if (isRevealed) {
                    if (isCorrectOpt) optClass = "border-success bg-success/10";
                    else if (isSelected && !isCorrectOpt) optClass = "border-destructive bg-destructive/10";
                    else optClass = "border-border/30 opacity-50";
                  } else if (isSelected) {
                    optClass = "border-primary bg-primary/10";
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => selectAnswer(q.id, opt.key)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${optClass}`}
                    >
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                        isRevealed && isCorrectOpt ? "border-success text-success" : isSelected ? "border-primary text-primary" : "border-border text-muted-foreground"
                      }`}>
                        {isRevealed && isCorrectOpt ? <CheckCircle2 className="w-4 h-4" /> : isRevealed && isSelected && !isCorrectOpt ? <XCircle className="w-4 h-4" /> : opt.key}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              {!isRevealed && answer?.selected && (
                <button
                  onClick={() => revealAnswer(q.id)}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Periksa Jawaban
                </button>
              )}

              {/* Explanation */}
              {isRevealed && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Pembahasan</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
