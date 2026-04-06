import { useState, useEffect, useRef } from "react";
import { Keyboard, Timer, Target, RotateCcw } from "lucide-react";

// Quotes with educational and motivational themes
const QUOTES = [
  "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia.",
  "Masa depan adalah milik mereka yang menyiapkan hari ini.",
  "Jangan pernah berhenti belajar, karena hidup tak pernah berhenti mengajarkan.",
  "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaanlah kunci kesuksesan.",
  "Sulitnya belajar hanya sebentar, tapi pahitnya kebodohan akan terasa seumur hidup.",
  "Mimpi tidak akan menjadi kenyataan melalui sihir; itu membutuhkan keringat, tekad, dan kerja keras.",
  "Pengetahuan tidak punya nilai jika tidak dipraktikkan."
];

export function TypingSpeed() {
  const [quote, setQuote] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initGame = () => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
    setUserInput("");
    setTimeLeft(60);
    setIsStarted(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    if (inputRef.current) inputRef.current.focus();
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted) {
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isStarted, timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isStarted && !isFinished) {
      setIsStarted(true);
    }
    
    if (isFinished) return;

    const val = e.target.value;
    setUserInput(val);

    // Calculate accuracy on the fly
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
        if (val[i] === quote[i]) correctChars++;
    }
    
    const acc = val.length === 0 ? 100 : Math.round((correctChars / val.length) * 100);
    setAccuracy(acc);

    // End game early if quote is fully typed
    if (val === quote) {
      handleFinish(val);
    }
  };

  const handleFinish = (finalVal = userInput) => {
    setIsStarted(false);
    setIsFinished(true);
    
    // Calculate WPM: (Total characters / 5) / (Time elapsed in minutes)
    const timeElapsedSec = 60 - timeLeft;
    const minutes = timeElapsedSec / 60 || 1; // Prevent div by 0 if finished instantly
    const totalWords = finalVal.trim().length / 5;
    
    setWpm(Math.round(totalWords / (minutes > 0 ? minutes : 1)));
  };

  const renderQuote = () => {
    return quote.split("").map((char, index) => {
      let colorClass = "text-muted-foreground opacity-50"; // default un-typed
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
              <div className="text-xl font-black">{isFinished ? wpm : '?'}</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Akurasi</span>
              <div className="text-xl font-black">{accuracy}%</div>
            </div>
         </div>
         <button onClick={initGame} className="p-3 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors focus:outline-none">
            <RotateCcw className="w-5 h-5" />
         </button>
       </div>

       <div className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="text-lg md:text-2xl font-medium leading-relaxed tracking-wide mb-8 select-none font-mono">
             {renderQuote()}
          </div>
          
          <textarea
             ref={inputRef}
             value={userInput}
             onChange={handleInputChange}
             disabled={isFinished}
             placeholder={isStarted ? "" : "Mulai ketik di sini..."}
             className={`w-full bg-secondary/30 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-mono resize-none transition-all ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
       </div>

       {isFinished && (
         <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center animate-bounce-short">
            <h3 className="text-2xl font-black text-primary mb-2">Waktu Habis!</h3>
            <p className="text-muted-foreground mb-4">
               Kecepatan mengetikmu adalah <strong className="text-foreground">{wpm} Word per Minute</strong><br/>
               dengan akurasi <strong className="text-foreground">{accuracy}%</strong>.
            </p>
            <button onClick={initGame} className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Coba Lagi
            </button>
         </div>
       )}
    </div>
  );
}
