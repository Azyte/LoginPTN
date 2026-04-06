import { useState, useEffect } from "react";
import { Trophy, RotateCcw, Brain, Timer, Award } from "lucide-react";

const CARD_SYMBOLS = ["📚", "🎓", "✏️", "🔬", "📐", "💻", "💡", "🎒"];

type Card = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export function BrainMemory() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const shuffledSymbols = [...CARD_SYMBOLS, ...CARD_SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffledSymbols);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsPlaying(true);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (!isPlaying) return;
    if (cards[index].isMatched || flippedIndices.includes(index) || flippedIndices.length >= 2) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
        setCards((prev) => {
          const newCards = [...prev];
          newCards[firstIndex].isMatched = true;
          newCards[secondIndex].isMatched = true;
          return newCards;
        });
        setMatches((m) => m + 1);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (matches === CARD_SYMBOLS.length && CARD_SYMBOLS.length > 0) {
      setIsWon(true);
      setIsPlaying(false);
    }
  }, [matches]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-center gap-4 sm:gap-8">
        <div className="bg-secondary/50 border border-border/50 px-6 py-3 rounded-2xl flex flex-col items-center">
          <div className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
            <Timer className="w-3 h-3" /> Langkah
          </div>
          <div className="text-2xl font-black">{moves}</div>
        </div>
        <div className="bg-secondary/50 border border-border/50 px-6 py-3 rounded-2xl flex flex-col items-center">
          <div className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3" /> Cocok
          </div>
          <div className="text-2xl font-black text-primary">{matches} <span className="text-sm text-foreground/50">/ {CARD_SYMBOLS.length}</span></div>
        </div>
      </div>

      {isWon && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 text-center shadow-lg shadow-green-500/5 my-6 animate-bounce-short">
          <Trophy className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-green-500 mb-2">Luar Biasa!</h2>
          <p className="font-medium">Kamu menyelesaikan game dalam {moves} langkah.</p>
          <button 
            onClick={initGame}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-md"
          >
            Main Lagi
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-3 sm:gap-4 perspective-1000">
          {cards.map((card, index) => {
            const isFlipped = card.isFlipped || card.isMatched || flippedIndices.includes(index);
            return (
              <div 
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`group relative aspect-square cursor-pointer transition-all duration-300 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : "hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-primary/80 to-primary text-white rounded-xl shadow-md border border-primary/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 opacity-50" />
                </div>
                
                <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl shadow-md border flex items-center justify-center text-3xl sm:text-4xl transition-colors duration-300 ${
                  card.isMatched ? "bg-green-500/20 border-green-500/50" : "bg-card border-border"
                }`}>
                  <span className={card.isMatched ? "animate-bounce" : ""}>{card.symbol}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isWon && (
         <div className="text-center pt-4">
           <button onClick={initGame} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
             <RotateCcw className="w-4 h-4" /> Reset
           </button>
         </div>
      )}
    </div>
  );
}
