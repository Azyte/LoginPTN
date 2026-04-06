import { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, Timer, Target, RotateCcw, Play } from "lucide-react";

const QUOTES = [
  "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia.",
  "Masa depan adalah milik mereka yang menyiapkan hari ini.",
  "Jangan pernah berhenti belajar, karena hidup tak pernah berhenti mengajarkan.",
  "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaanlah kunci kesuksesan.",
  "Sulitnya belajar hanya sebentar, tapi pahitnya kebodohan akan terasa seumur hidup.",
  "Mimpi tidak menjadi kenyataan melalui sihir; itu membutuhkan keringat, tekad, dan kerja keras.",
  "Pengetahuan tidak punya nilai jika tidak dipraktikkan.",
  "Belajar tanpa berpikir itu tidaklah berguna, tapi berpikir tanpa belajar itu sangatlah berbahaya.",
  "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan.",
  "Orang yang berhenti belajar akan menjadi pemilik masa lalu. Orang yang terus belajar akan menjadi pemilik masa depan.",
];

export function TypingSpeed() {
  const [quote, setQuote] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Pick initial quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startGame = useCallback(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
    setUserInput("");
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(100);
    setGameState("playing");
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const finishGame = useCallback((finalVal: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setGameState("finished");

    const timeElapsedMs = Date.now() - startTimeRef.current;
    const minutes = timeElapsedMs / 60000 || 1;
    const totalWords = finalVal.trim().length / 5;
    setWpm(Math.round(totalWords / (minutes > 0 ? minutes : 1)));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState !== "playing") return;

    const val = e.target.value;
    setUserInput(val);

    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === quote[i]) correctChars++;
    }
    const acc = val.length === 0 ? 100 : Math.round((correctChars / val.length) * 100);
    setAccuracy(acc);

    if (val === quote) {
      finishGame(val);
    }
  };

  const renderQuote = () => {
    return quote.split("").map((char, index) => {
      let colorClass = "text-muted-foreground opacity-50";
      if (index < userInput.length) {
        colorClass = userInput[index] === char
           ? "text-green-500 bg-green-500/10 font-bold"
           : "text-destructive bg-destructive/10 underline decoration-destructive/50 decoration-wavy";
      }
      return (
        <span key={index} className={`transition-colors rounded-sm px-[1px] ${colorClass}`}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full animate-in zoom-in-95 duration-500">
       <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-2xl border border-border/50">
         <div className="flex items-center gap-4">
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Time</span>
              <div className={`text-xl font-black ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-primary'}`}>{timeLeft}s</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">WPM</span>
              <div className="text-xl font-black">{gameState === "finished" ? wpm : '?'}</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Akurasi</span>
              <div className="text-xl font-black">{accuracy}%</div>
            </div>
         </div>
         <button onClick={startGame} className="p-3 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors focus:outline-none">
            <RotateCcw className="w-5 h-5" />
         </button>
       </div>

       {gameState === "idle" ? (
         <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
           <Keyboard className="w-16 h-16 text-primary mx-auto mb-4 opacity-30" />
           <h2 className="text-2xl font-black mb-2">Typing Speed ⌨️</h2>
           <p className="text-muted-foreground mb-6 text-sm">Uji kecepatan mengetikmu! Timer langsung berjalan saat mulai.</p>
           <button onClick={startGame} className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
             <Play className="w-5 h-5" /> Mulai!
           </button>
         </div>
       ) : (
         <>
           <div className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="text-lg md:text-2xl font-medium leading-relaxed tracking-wide mb-8 select-none font-mono">
                 {renderQuote()}
              </div>

              <textarea
                 ref={inputRef}
                 value={userInput}
                 onChange={handleInputChange}
                 disabled={gameState === "finished"}
                 placeholder="Mulai ketik di sini..."
                 className={`w-full bg-secondary/30 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-mono resize-none transition-all ${gameState === "finished" ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
           </div>

           {gameState === "finished" && (
             <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
                <h3 className="text-2xl font-black text-primary mb-2">Selesai!</h3>
                <p className="text-muted-foreground mb-4">
                   Kecepatan mengetikmu adalah <strong className="text-foreground">{wpm} WPM</strong><br/>
                   dengan akurasi <strong className="text-foreground">{accuracy}%</strong>.
                </p>
                <button onClick={startGame} className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                  Coba Lagi
                </button>
             </div>
           )}
         </>
       )}
    </div>
  );
}
