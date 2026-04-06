import { useState, useEffect, useRef } from "react";
import { Puzzle, Timer, CheckCircle2, RotateCcw } from "lucide-react";

const WORDS = [
  { word: "UNIVERSITAS", hint: "Perguruan Tinggi" },
  { word: "MAHASISWA", hint: "Pelajar di Perguruan Tinggi" },
  { word: "FAKULTAS", hint: "Bagian dari Universitas" },
  { word: "SKRIPSI", hint: "Tugas Akhir Mahasiswa" },
  { word: "BEASISWA", hint: "Bantuan Dana Pendidikan" },
  { word: "REKTOR", hint: "Pemimpin Universitas" },
  { word: "KAMPUS", hint: "Tempat Belajar" },
  { word: "ALMAMATER", hint: "Jas Kebanggan Mahasiswa" },
  { word: "SEMESTER", hint: "Periode Belajar" },
  { word: "SKS", hint: "Satuan Kredit Semester" },
];

export function WordScramble() {
  const [currentWord, setCurrentWord] = useState({ word: "", hint: "", scrambled: "" });
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const shuffleWord = (word: string) => {
    let _word = word.split("");
    for (let i = _word.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_word[i], _word[j]] = [_word[j], _word[i]];
    }
    // Prevent it from accidentally being the correct word
    const scrambled = _word.join("");
    if (scrambled === word) return shuffleWord(word);
    return scrambled;
  };

  const nextWord = () => {
    const random = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord({
      ...random,
      scrambled: shuffleWord(random.word)
    });
    setUserInput("");
  };

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(false);
    setIsFinished(false);
    nextWord();
    if (inputRef.current) inputRef.current.focus();
  };

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
    if (!isPlaying && !isFinished) setIsPlaying(true);
    setUserInput(e.target.value.toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (userInput === currentWord.word) {
        setScore((s) => s + 10);
        nextWord();
      } else {
        // Wrong answer visual feedback can be added here
        setUserInput("");
      }
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
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Skor</span>
              <div className="text-2xl font-black">{score}</div>
            </div>
          </div>
          <button onClick={initGame} className="p-3 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors focus:outline-none">
            <RotateCcw className="w-5 h-5" />
          </button>
       </div>

       <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-sm flex flex-col items-center min-h-[350px]">
          {isFinished ? (
            <div className="text-center animate-in zoom-in duration-300 w-full flex-1 flex flex-col justify-center">
               <Puzzle className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
               <h2 className="text-3xl font-black mb-2">Waktu Habis!</h2>
               <p className="text-muted-foreground mb-6">Kamu berhasil menebak kata dengan <span className="text-primary font-bold">{score} poin</span>.</p>
               <button onClick={initGame} className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                 Coba Lagi
               </button>
            </div>
          ) : (
             <div className="w-full flex-1 flex flex-col">
               <div className="text-center mb-10">
                 <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4">
                    Susun Kata Berikut
                 </div>
                 <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {currentWord.scrambled.split("").map((letter, i) => (
                      <span key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary border border-border flex items-center justify-center rounded-xl text-xl font-bold shadow-sm">
                        {letter}
                      </span>
                    ))}
                 </div>
                 <div className="bg-primary/10 text-primary text-sm font-medium py-2 px-4 rounded-lg inline-block border border-primary/20">
                    💡 Hint: {currentWord.hint}
                 </div>
               </div>

               <div className="w-full mt-auto relative">
                 <input
                   ref={inputRef}
                   type="text"
                   value={userInput}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   placeholder="Ketik jawabanmu..."
                   className="w-full text-center text-2xl font-bold bg-secondary/50 border-2 border-border/50 rounded-2xl py-4 focus:outline-none focus:border-primary transition-colors tracking-widest uppercase"
                   autoFocus
                 />
                 <div className="text-center mt-3 text-xs text-muted-foreground">
                    Tekan Enter ↵ untuk mengecek
                 </div>
               </div>
             </div>
          )}
       </div>
    </div>
  );
}
