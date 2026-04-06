import { useState, useEffect, useRef } from "react";
import { Calculator, Timer, Trophy, RotateCcw } from "lucide-react";

type Problem = {
  text: string;
  answer: number;
};

export function MathSprint() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<Problem>({ text: "0 + 0", answer: 0 });
  const [userInput, setUserInput] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);

  const generateProblem = () => {
    const operators = ["+", "-", "*"];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a, b, answer;

    if (op === "+") {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
    } else if (op === "-") {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a); // ensure positive result
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
    }

    setCurrentProblem({ text: `${a} ${op} ${b}`, answer });
  };

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setUserInput("");
    setIsStarted(false);
    setIsFinished(false);
    generateProblem();
    if (inputRef.current) inputRef.current.focus();
  };

  // Alias for isStarted
  const setIsStarted = setIsPlaying;

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setIsFinished(true);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);

    if (!isPlaying && !isFinished) {
      setIsPlaying(true);
    }
  };

  // Submit on enter or auto-submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && userInput.trim() !== "") {
      checkAnswer();
    }
  };

  const checkAnswer = () => {
    if (parseInt(userInput) === currentProblem.answer) {
      setScore((s) => s + 10);
      generateProblem();
      setUserInput("");
    } else {
      // Small penalty or just clear input (let's just clear to keep it fast)
      setUserInput("");
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full animate-in zoom-in-95 duration-500">
       <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-2xl border border-border/50">
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1"><Timer className="w-3 h-3"/> Waktu</span>
              <div className={`text-2xl font-black ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-primary'}`}>{timeLeft}s</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Skor</span>
              <div className="text-2xl font-black">{score}</div>
            </div>
          </div>
          <button onClick={initGame} className="p-3 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors focus:outline-none">
            <RotateCcw className="w-5 h-5" />
          </button>
       </div>

       <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          {isFinished ? (
            <div className="text-center animate-in zoom-in duration-300">
               <Calculator className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
               <h2 className="text-3xl font-black mb-2">Waktu Habis!</h2>
               <p className="text-muted-foreground mb-6">Kamu mengumpulkan <span className="text-primary font-bold">{score} poin</span>.</p>
               <button onClick={initGame} className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                 Coba Lagi
               </button>
            </div>
          ) : (
             <>
               <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-6">
                  {isPlaying ? "Pertanyaan" : "Ketik jawaban & Entar"}
               </div>
               <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent mb-12 tracking-wider">
                  {currentProblem.text}
               </div>

               <div className="w-full relative">
                 <input
                   ref={inputRef}
                   type="number"
                   value={userInput}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   placeholder="?"
                   className="w-full text-center text-4xl font-bold bg-secondary/50 border-2 border-border/50 rounded-2xl py-4 focus:outline-none focus:border-primary transition-colors"
                   autoFocus
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Tekan Enter ↵
                 </div>
               </div>
             </>
          )}
       </div>
    </div>
  );
}
