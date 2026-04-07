"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Play, Users, Gamepad2, Brain, CheckCircle2, XCircle, Sparkles, Calculator, Puzzle } from "lucide-react";

const TRIVIA_QUESTIONS = [
  { q: "Siapakah penemu bola lampu?", options: ["Thomas Edison", "Nikola Tesla", "Albert Einstein", "Isaac Newton"], answer: 0 },
  { q: "Berapa hasil dari 15 x 12?", options: ["160", "170", "180", "190"], answer: 2 },
  { q: "Apa nama planet terdekat dari Matahari?", options: ["Venus", "Mars", "Merkurius", "Bumi"], answer: 2 },
  { q: "Ibukota dari provinsi Jawa Timur adalah?", options: ["Semarang", "Surabaya", "Malang", "Sidoarjo"], answer: 1 },
  { q: "Dalam biologi, sel darah merah disebut juga dengan?", options: ["Leukosit", "Eritrosit", "Trombosit", "Plasma"], answer: 1 },
];

const SCRAMBLE_WORDS = [
  { word: "MAHASISWA", hint: "Pelajar" },
  { word: "KAMPUS", hint: "Tempat belajar" },
  { word: "SKRIPSI", hint: "Tugas akhir" },
  { word: "BEASISWA", hint: "Bantuan pendidikan" },
  { word: "FAKULTAS", hint: "Bagian dari universitas" }
];

type Player = { id: string; name: string; score: number; };
type GameState = "lobby" | "playing" | "leaderboard";
type GameMode = "trivia" | "math" | "scramble";

interface GamePayload {
  mode: GameMode;
  questionIdx?: number;     // for trivia
  mathText?: string;        // for math
  mathAns?: number;         // for math
  scrambleWord?: string;    // for scramble
  scrambleAns?: string;     // for scramble
}

interface MultiplayerGameModalProps {
  roomId: string;
  user: { id: string; name: string };
  onClose: () => void;
}

export function MultiplayerGameModal({ roomId, user, onClose }: MultiplayerGameModalProps) {
  const supabase = useMemo(() => createClient(), []);
  
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [selectedMode, setSelectedMode] = useState<GameMode>("trivia");
  const [players, setPlayers] = useState<Record<string, Player>>({
    [user.id]: { id: user.id, name: user.name, score: 0 }
  });
  
  const [gameData, setGameData] = useState<GamePayload | null>(null);
  const [timeLeft, setTimeLeft] = useState(10); 
  const [currentRound, setCurrentRound] = useState(1);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(null);
  const [textInput, setTextInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const channel = useMemo(() => supabase.channel(`game-${roomId}`, {
    config: { broadcast: { self: true } }
  }), [supabase, roomId]);

  const MAX_ROUNDS = 5;

  const generateGameData = (mode: GameMode): GamePayload => {
    if (mode === "math") {
      const ops = ["+", "-", "*"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, ans;
      if (op === "+") { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; ans = a + b; }
      else if (op === "-") { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * a); ans = a - b; }
      else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; ans = a * b; }
      return { mode, mathText: `${a} ${op} ${b}`, mathAns: ans };
    } else if (mode === "scramble") {
      const rand = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
      let _arr = rand.word.split("");
      for (let i = _arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [_arr[i], _arr[j]] = [_arr[j], _arr[i]];
      }
      return { mode, scrambleWord: _arr.join(""), scrambleAns: rand.word };
    } else {
      return { mode, questionIdx: Math.floor(Math.random() * TRIVIA_QUESTIONS.length) };
    }
  };

  useEffect(() => {
    const broadcastPresence = () => {
      channel.send({ type: "broadcast", event: "player-join", payload: { id: user.id, name: user.name, score: 0 } });
    };

    channel
      .on("broadcast", { event: "player-join" }, (p) => {
        setPlayers((prev) => {
          if (prev[p.payload.id]) return prev; 
          setTimeout(broadcastPresence, 1000); 
          return { ...prev, [p.payload.id]: p.payload };
        });
      })
      .on("broadcast", { event: "start-game" }, (p) => {
        setGameState("playing");
        setGameData(p.payload);
        setCurrentRound(1);
        setTimeLeft(10);
        setHasAnswered(false);
        setAnswerResult(null);
        setTextInput("");
        setPlayers((prev) => {
          const reset = { ...prev };
          Object.keys(reset).forEach(k => reset[k].score = 0);
          return reset;
        });
        setTimeout(() => inputRef.current?.focus(), 100);
      })
      .on("broadcast", { event: "next-question" }, (p) => {
        setGameData(p.payload);
        setCurrentRound(p.payload.round);
        setTimeLeft(10);
        setHasAnswered(false);
        setAnswerResult(null);
        setTextInput("");
        setTimeout(() => inputRef.current?.focus(), 100);
      })
      .on("broadcast", { event: "point-scored" }, (p) => {
        setPlayers((prev) => ({
          ...prev, [p.payload.id]: { ...prev[p.payload.id], score: prev[p.payload.id].score + 1 }
        }));
      })
      .on("broadcast", { event: "end-game" }, () => {
        setGameState("leaderboard");
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") broadcastPresence();
      });

    return () => { supabase.removeChannel(channel); };
  }, [channel, user.id, user.name]);

  // Host Timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const hostId = Object.keys(players).sort()[0];
          if (user.id === hostId) {
            if (currentRound >= MAX_ROUNDS) {
              channel.send({ type: "broadcast", event: "end-game", payload: {} });
              setGameState("leaderboard");
            } else {
              const payload = generateGameData(gameData!.mode);
              channel.send({ type: "broadcast", event: "next-question", payload: { ...payload, round: currentRound + 1 } });
            }
          }
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentRound, players, user.id, channel, gameData]);

  const handleStartGame = () => {
    const payload = generateGameData(selectedMode);
    channel.send({ type: "broadcast", event: "start-game", payload });
    // Since we're using self: true, the listener on line 98 will trigger for host too
  };

  const processAnswer = (isCorrect: boolean) => {
    if (hasAnswered) return;
    setHasAnswered(true);

    if (isCorrect) {
      setAnswerResult("correct");
      // Give points to the FIRST correct answer only in text games? Or just anyone? 
      // For simplicity, anyone who gets it right within time gets a point in Trivia.
      // But for Race modes, we want fastest. To simulate fastest, we just add points locally and broadcast.
      setPlayers(prev => ({ ...prev, [user.id]: { ...prev[user.id], score: prev[user.id].score + 1 } }));
      channel.send({ type: "broadcast", event: "point-scored", payload: { id: user.id } });
    } else {
      setAnswerResult("wrong");
    }
  };

  const handleTriviaAnswer = (optIndex: number) => {
    if (!gameData || gameData.questionIdx === undefined) return;
    const isCorrect = optIndex === TRIVIA_QUESTIONS[gameData.questionIdx].answer;
    processAnswer(isCorrect);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameData || !textInput.trim() || hasAnswered) return;

    let isCorrect = false;
    if (gameData.mode === "math" && gameData.mathAns !== undefined) {
      isCorrect = parseInt(textInput) === gameData.mathAns;
    } else if (gameData.mode === "scramble" && gameData.scrambleAns) {
      isCorrect = textInput.toUpperCase() === gameData.scrambleAns.toUpperCase();
    }
    
    // For text inputs, wrong answer doesn't lock you out immediately, you can try again unless time is up
    if (isCorrect) {
      processAnswer(true);
    } else {
      setTextInput("");
      // Visual wobble or error can be added
    }
  };

  const getSortedPlayers = () => Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-card w-full max-w-xl mx-auto rounded-2xl shadow-2xl border border-primary/20 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-primary to-accent p-4 text-white flex justify-between items-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative flex items-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          <h2 className="font-bold text-lg">Multiplayer Games Area</h2>
        </div>
        <button onClick={onClose} className="relative bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 relative flex flex-col flex-1 overflow-y-auto min-h-[400px]">
        {gameState === "lobby" && (
          <div className="flex-1 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <Trophy className="w-12 h-12 text-yellow-400 mb-3" />
            <h3 className="text-xl font-bold mb-1">Tantang Temanmu!</h3>
            <p className="text-sm text-muted-foreground mb-6">Pilih mode permainan dan jadilah yang tercepat memecahkan soal.</p>
            
            <div className="w-full text-left mb-6">
               <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Pilih Mode Game:</label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <button onClick={() => setSelectedMode("trivia")} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMode === 'trivia' ? 'bg-primary/20 border-primary cursor-default shadow-sm' : 'bg-secondary border-border/50 hover:bg-secondary/80'}`}>
                    <Brain className={`w-6 h-6 ${selectedMode === 'trivia' ? 'text-primary' : 'text-muted-foreground'}`}/>
                    <span className="text-xs font-bold">Cerdas Cermat</span>
                 </button>
                 <button onClick={() => setSelectedMode("math")} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMode === 'math' ? 'bg-orange-500/20 border-orange-500 cursor-default shadow-sm' : 'bg-secondary border-border/50 hover:bg-secondary/80'}`}>
                    <Calculator className={`w-6 h-6 ${selectedMode === 'math' ? 'text-orange-500' : 'text-muted-foreground'}`}/>
                    <span className="text-xs font-bold">Balap Matematika</span>
                 </button>
                 <button onClick={() => setSelectedMode("scramble")} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedMode === 'scramble' ? 'bg-purple-500/20 border-purple-500 cursor-default shadow-sm' : 'bg-secondary border-border/50 hover:bg-secondary/80'}`}>
                    <Puzzle className={`w-6 h-6 ${selectedMode === 'scramble' ? 'text-purple-500' : 'text-muted-foreground'}`}/>
                    <span className="text-xs font-bold">Tebak Kata</span>
                 </button>
               </div>
            </div>

            <div className="w-full bg-secondary/50 rounded-xl p-4 mb-6 mt-auto">
              <div className="flex items-center justify-between mb-3">
                 <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pemain Standby ({Object.keys(players).length})</span>
                 <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(players).map(p => (
                  <div key={p.id} className="bg-background border border-border px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>{p.name}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleStartGame} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
              <Play className="w-5 h-5" fill="currentColor" /> Mulai Pertandingan
            </button>
          </div>
        )}

        {gameState === "playing" && gameData && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-300 relative">
             <div className="flex justify-between items-center mb-6">
                <div className="bg-secondary px-3 py-1 rounded-full text-xs font-bold border border-border/50">
                   Ronde {currentRound}/{MAX_ROUNDS} | Skor: <span className="text-primary">{players[user.id]?.score || 0}</span>
                </div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-full border-4 font-black text-lg shadow-sm ${timeLeft <= 3 ? 'text-destructive border-destructive animate-pulse' : 'text-primary border-primary'}`}>
                  {timeLeft}
                </div>
             </div>

             <div className="flex-1 flex flex-col">
                {/* RENDER TRIVIA */}
                {gameData.mode === "trivia" && gameData.questionIdx !== undefined && (
                  <>
                    <h3 className="text-lg sm:text-xl font-extrabold text-center mb-8 leading-relaxed">
                      {TRIVIA_QUESTIONS[gameData.questionIdx].q}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                      {TRIVIA_QUESTIONS[gameData.questionIdx].options.map((opt, idx) => {
                        const isCorrect = idx === TRIVIA_QUESTIONS[gameData.questionIdx!].answer;
                        let bgClass = "bg-secondary hover:bg-primary/90 hover:text-primary-foreground";
                        if (hasAnswered) {
                           if (isCorrect) bgClass = "bg-green-500 text-white border-green-600";
                           else bgClass = "bg-secondary opacity-50";
                        }
                        return (
                          <button key={idx} onClick={() => handleTriviaAnswer(idx)} disabled={hasAnswered} className={`p-4 rounded-xl text-sm font-bold border border-border/50 transition-all text-left flex justify-between items-center shadow-sm ${bgClass}`}>
                            {opt}{hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* RENDER MATH OR SCRAMBLE */}
                {(gameData.mode === "math" || gameData.mode === "scramble") && (
                   <div className="flex-1 flex flex-col items-center justify-center">
                     <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        {gameData.mode === "math" ? "Selesaikan dengan cepat!" : "Susun huruf menjadi kata!"}
                     </div>
                     
                     <div className={`text-5xl sm:text-6xl font-black mb-10 tracking-widest text-transparent bg-clip-text bg-gradient-to-br ${gameData.mode === 'math' ? 'from-orange-500 to-amber-500' : 'from-purple-500 to-pink-500'}`}>
                        {gameData.mode === "math" ? gameData.mathText : gameData.scrambleWord}
                     </div>

                     <form onSubmit={handleTextSubmit} className="w-full relative mt-auto">
                        <input
                           ref={inputRef}
                           type={gameData.mode === "math" ? "number" : "text"}
                           value={textInput}
                           onChange={e => setTextInput(e.target.value)}
                           disabled={hasAnswered}
                           placeholder="Ketik jawaban..."
                           className="w-full text-center text-2xl font-bold bg-secondary border-2 border-border/50 rounded-2xl py-4 focus:outline-none focus:border-primary transition-colors shadow-inner uppercase"
                           autoFocus
                           autoComplete="off"
                        />
                     </form>
                   </div>
                )}
             </div>

             {hasAnswered && answerResult === "correct" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in z-10 rounded-xl">
                   <div className="p-6 flex flex-col items-center text-green-500">
                     <Sparkles className="w-16 h-16 animate-bounce" />
                     <h2 className="text-2xl font-black mt-4">TEPAT! +1</h2>
                     <p className="text-sm font-medium mt-1 text-muted-foreground">Menunggu pertanyaan usai...</p>
                   </div>
                </div>
             )}
          </div>
        )}

        {gameState === "leaderboard" && (
          <div className="flex-1 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
             <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
             <h2 className="text-2xl font-black mb-1">Hasil Akhir</h2>
             <p className="text-sm text-muted-foreground mb-6">Siapa paling jenius?</p>

             <div className="w-full bg-secondary/30 rounded-xl border border-border/50 overflow-hidden mb-6">
               {getSortedPlayers().map((p, idx) => (
                 <div key={p.id} className={`flex items-center justify-between p-4 border-b border-border/30 ${p.id === user.id ? 'bg-primary/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 && p.score > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-secondary text-foreground'}`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold">{p.name} {p.id === user.id ? '(Kamu)' : ''}</span>
                    </div>
                    <div className="font-black text-primary">{p.score} pt</div>
                 </div>
               ))}
             </div>

             <div className="flex gap-3 w-full mt-auto">
                <button onClick={() => setGameState("lobby")} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl transition-all border border-border">
                  Ke Lobby
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
