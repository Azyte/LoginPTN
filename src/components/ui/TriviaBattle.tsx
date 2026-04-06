"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Play, Users, Brain, Loader2, Sparkles, XCircle, CheckCircle2 } from "lucide-react";

// Hardcoded questions for the minigame
const QUESTIONS = [
  { q: "Siapakah penemu bola lampu?", options: ["Thomas Edison", "Nikola Tesla", "Albert Einstein", "Isaac Newton"], answer: 0 },
  { q: "Berapa hasil dari 15 x 12?", options: ["160", "170", "180", "190"], answer: 2 },
  { q: "Apa nama planet terdekat dari Matahari?", options: ["Venus", "Mars", "Merkurius", "Bumi"], answer: 2 },
  { q: "Ibukota dari provinsi Jawa Timur adalah?", options: ["Semarang", "Surabaya", "Malang", "Sidoarjo"], answer: 1 },
  { q: "Dalam biologi, sel darah merah disebut juga dengan?", options: ["Leukosit", "Eritrosit", "Trombosit", "Plasma"], answer: 1 },
  { q: "Berapa akar kuadrat dari 144?", options: ["10", "11", "12", "14"], answer: 2 },
  { q: "Simbol unsur kimia untuk Emas adalah?", options: ["Ag", "Au", "Fe", "Cu"], answer: 1 },
  { q: "Siapa Presiden ke-3 Republik Indonesia?", options: ["Soekarno", "Soeharto", "B.J. Habibie", "Abdurrahman Wahid"], answer: 2 },
  { q: "Apa nama samudera terluas di dunia?", options: ["Samudera Hindia", "Samudera Atlantik", "Samudera Pasifik", "Samudera Arktik"], answer: 2 },
  { q: "Organ yang berfungsi memompa darah ke seluruh tubuh adalah?", options: ["Paru-paru", "Hati", "Jantung", "Ginjal"], answer: 2 },
];

type Player = {
  id: string;
  name: string;
  score: number;
};

type GameState = "lobby" | "playing" | "leaderboard";

interface TriviaBattleProps {
  roomId: string;
  user: { id: string; name: string };
  onClose: () => void;
}

export function TriviaBattle({ roomId, user, onClose }: TriviaBattleProps) {
  const supabase = useMemo(() => createClient(), []);
  
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [players, setPlayers] = useState<Record<string, Player>>({
    [user.id]: { id: user.id, name: user.name, score: 0 }
  });
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds per question
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(null);

  // Channel reference
  const channel = useMemo(() => supabase.channel(`game-${roomId}`), [supabase, roomId]);

  useEffect(() => {
    // Broadcast my presence to others
    const broadcastPresence = () => {
      channel.send({
        type: "broadcast",
        event: "player-join",
        payload: { id: user.id, name: user.name, score: 0 }
      });
    };

    channel
      .on("broadcast", { event: "player-join" }, (payload) => {
        setPlayers((prev) => {
          if (prev[payload.payload.id]) return prev; // Already exist
          // Welcome them and send my state back so they see me
          setTimeout(broadcastPresence, 1000); 
          return { ...prev, [payload.payload.id]: payload.payload };
        });
      })
      .on("broadcast", { event: "start-game" }, (payload) => {
        setGameState("playing");
        setCurrentQuestionIdx(payload.payload.questionIdx);
        setTimeLeft(10);
        setHasAnswered(false);
        setAnswerResult(null);
        // Reset scores
        setPlayers((prev) => {
          const reset = { ...prev };
          Object.keys(reset).forEach(k => reset[k].score = 0);
          return reset;
        });
      })
      .on("broadcast", { event: "next-question" }, (payload) => {
        setCurrentQuestionIdx(payload.payload.questionIdx);
        setTimeLeft(10);
        setHasAnswered(false);
        setAnswerResult(null);
      })
      .on("broadcast", { event: "point-scored" }, (payload) => {
        setPlayers((prev) => ({
          ...prev,
          [payload.payload.id]: {
             ...prev[payload.payload.id],
             score: prev[payload.payload.id].score + 1
          }
        }));
      })
      .on("broadcast", { event: "end-game" }, () => {
        setGameState("leaderboard");
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          broadcastPresence();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channel, user.id, user.name]);

  // Timer logic for host
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time is up. Host moves to next question.
          // Determine "host" as whoever is earliest in players list just to prevent multiple broadcasts. 
          // Simple hack: if I'm the first alphabetically, I'm host.
          const hostId = Object.keys(players).sort()[0];
          if (user.id === hostId) {
            if (currentQuestionIdx >= 4) { // 5 questions per match
              channel.send({ type: "broadcast", event: "end-game", payload: {} });
              setGameState("leaderboard");
            } else {
              const nextIdx = (currentQuestionIdx + 1) % QUESTIONS.length;
              channel.send({ type: "broadcast", event: "next-question", payload: { questionIdx: nextIdx } });
              setCurrentQuestionIdx(nextIdx);
              setTimeLeft(10);
              setHasAnswered(false);
              setAnswerResult(null);
            }
          }
          return 0; // Prevent negative
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentQuestionIdx, players, user.id, channel]);

  const handleStartGame = () => {
    const randomIdx = Math.floor(Math.random() * (QUESTIONS.length - 5));
    channel.send({
      type: "broadcast",
      event: "start-game",
      payload: { questionIdx: randomIdx }
    });
    
    // Also set locally
    setGameState("playing");
    setCurrentQuestionIdx(randomIdx);
    setTimeLeft(10);
    setHasAnswered(false);
    setAnswerResult(null);
    setPlayers((prev) => {
        const reset = { ...prev };
        Object.keys(reset).forEach(k => reset[k].score = 0);
        return reset;
    });
  };

  const answerQuestion = (optIndex: number) => {
    if (hasAnswered) return;
    setHasAnswered(true);

    const isCorrect = optIndex === QUESTIONS[currentQuestionIdx].answer;
    
    if (isCorrect) {
      setAnswerResult("correct");
      // Add local score immediately
      setPlayers(prev => ({
        ...prev,
        [user.id]: { ...prev[user.id], score: prev[user.id].score + 1 }
      }));
      // Broadcast score
      channel.send({
        type: "broadcast",
        event: "point-scored",
        payload: { id: user.id }
      });
    } else {
      setAnswerResult("wrong");
    }
  };

  const getSortedPlayers = () => {
    return Object.values(players).sort((a, b) => b.score - a.score);
  };

  return (
    <div className="bg-card w-full max-w-lg mx-auto rounded-2xl shadow-2xl border border-primary/20 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="font-bold text-lg">Cerdas Cermat Realtime</h2>
        </div>
        <button onClick={onClose} className="relative bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 relative min-h-[350px] flex flex-col">
        {gameState === "lobby" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Tantang Temanmu!</h3>
            <p className="text-sm text-muted-foreground mb-6">Hitung-hitungan cepat & pengetahuan umum. Siapa yang paling jenius di grup ini?</p>
            
            <div className="w-full bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                 <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pemain Siap ({Object.keys(players).length})</span>
                 <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(players).map(p => (
                  <div key={p.id} className="bg-background border border-border px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartGame}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <Play className="w-5 h-5" fill="currentColor" /> Mulai Pertandingan
            </button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-center mb-6">
                <div className="bg-secondary px-3 py-1 rounded-full text-xs font-bold">
                  Skormu: <span className="text-primary">{players[user.id]?.score || 0}</span>
                </div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-full border-4 font-black text-lg ${timeLeft <= 3 ? 'text-destructive border-destructive animate-pulse' : 'text-primary border-primary'}`}>
                  {timeLeft}
                </div>
             </div>

             <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-center mb-8 leading-relaxed">
                  {QUESTIONS[currentQuestionIdx].q}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                  {QUESTIONS[currentQuestionIdx].options.map((opt, idx) => {
                    const isCorrect = idx === QUESTIONS[currentQuestionIdx].answer;
                    
                    let bgClass = "bg-secondary hover:bg-primary hover:text-primary-foreground";
                    if (hasAnswered) {
                       if (isCorrect) bgClass = "bg-green-500 text-white border-green-600";
                       else bgClass = "bg-secondary opacity-50";
                    }

                    return (
                      <button 
                         key={idx}
                         onClick={() => answerQuestion(idx)}
                         disabled={hasAnswered}
                         className={`p-4 rounded-xl text-sm font-bold border border-border/50 transition-all text-left flex justify-between items-center ${bgClass}`}
                      >
                        {opt}
                        {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    )
                  })}
                </div>
             </div>

             {hasAnswered && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in z-10">
                   <div className={`p-6 rounded-2xl flex flex-col items-center ${answerResult === 'correct' ? 'text-green-500' : 'text-destructive'}`}>
                     {answerResult === 'correct' ? <Sparkles className="w-16 h-16 animate-bounce" /> : <XCircle className="w-16 h-16" />}
                     <h2 className="text-2xl font-black mt-4">{answerResult === 'correct' ? 'BENAR!' : 'SALAH!'}</h2>
                     <p className="text-sm font-medium mt-1 text-muted-foreground">Menunggu pertanyaan selanjutnya...</p>
                   </div>
                </div>
             )}
          </div>
        )}

        {gameState === "leaderboard" && (
          <div className="flex-1 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
             <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
             <h2 className="text-2xl font-black mb-1">Hasil Pertandingan</h2>
             <p className="text-sm text-muted-foreground mb-6">Siapa pemenangnya?</p>

             <div className="w-full bg-secondary/30 rounded-xl border border-border/50 overflow-hidden mb-6">
               {getSortedPlayers().map((p, idx) => (
                 <div key={p.id} className={`flex items-center justify-between p-4 border-b border-border/30 ${p.id === user.id ? 'bg-primary/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-secondary text-foreground'}`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold">{p.name} {p.id === user.id ? '(Kamu)' : ''}</span>
                    </div>
                    <div className="font-black text-primary">{p.score} pt</div>
                 </div>
               ))}
             </div>

             <div className="flex gap-3 w-full">
                <button onClick={() => setGameState("lobby")} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl transition-all border border-border">
                  Main Lagi
                </button>
                <button onClick={onClose} className="flex-1 bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md">
                  Tutup
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
