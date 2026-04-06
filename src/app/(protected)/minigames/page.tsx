"use client";

import { useState } from "react";
import { Gamepad2, Brain, Keyboard, Calculator, Puzzle, ArrowLeft } from "lucide-react";
import { BrainMemory } from "@/components/minigames/BrainMemory";
import { TypingSpeed } from "@/components/minigames/TypingSpeed";
import { MathSprint } from "@/components/minigames/MathSprint";
import { WordScramble } from "@/components/minigames/WordScramble";

type GameType = "hub" | "memory" | "typing" | "math" | "scramble";

const GAMES = [
  {
    id: "memory",
    title: "Brain Memory",
    description: "Latih daya ingat jangka pendekmu dengan mencocokkan kartu bergambar.",
    icon: Brain,
    color: "from-blue-500 to-cyan-500",
    bgMuted: "bg-blue-500/10",
    textClass: "text-blue-500"
  },
  {
    id: "typing",
    title: "Typing Speed",
    description: "Uji kecepatan mengetik (WPM) dan akurasimu dengan quotes motivasi.",
    icon: Keyboard,
    color: "from-emerald-500 to-green-500",
    bgMuted: "bg-emerald-500/10",
    textClass: "text-emerald-500"
  },
  {
    id: "math",
    title: "Math Sprint",
    description: "Adu cepat berhitung matematika dasar dalam 60 detik. Latih insting numerik!",
    icon: Calculator,
    color: "from-orange-500 to-amber-500",
    bgMuted: "bg-orange-500/10",
    textClass: "text-orange-500"
  },
  {
    id: "scramble",
    title: "Word Scramble",
    description: "Susun kembali kata-kata acak bertema UTBK dan perkuliahan.",
    icon: Puzzle,
    color: "from-purple-500 to-pink-500",
    bgMuted: "bg-purple-500/10",
    textClass: "text-purple-500"
  }
];

export default function MinigamesHub() {
  const [activeGame, setActiveGame] = useState<GameType>("hub");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50 pb-6">
         <div className="flex items-center gap-4">
            {activeGame !== "hub" && (
              <button 
                onClick={() => setActiveGame("hub")}
                className="p-2 bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-xl transition-colors"
                title="Kembali ke Menu Game"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div>
               <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
                 <Gamepad2 className="w-8 h-8 text-primary" />
                 <span className="gradient-text">Minigames Arcade</span>
               </h1>
               <p className="text-muted-foreground text-sm mt-1">Area istirahat! Refresh otakmu sejenak sebelum lanjut ambis.</p>
            </div>
         </div>
         
         {activeGame !== "hub" && (
            <div className="px-4 py-1.5 bg-secondary border border-border/50 rounded-full text-sm font-bold text-muted-foreground">
               Sedang bermain: <span className="text-foreground">{GAMES.find(g => g.id === activeGame)?.title}</span>
            </div>
         )}
      </div>

      {/* Game Area */}
      <div className="pt-2">
         {activeGame === "hub" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in zoom-in-95 duration-300">
               {GAMES.map((game, idx) => {
                 const Icon = game.icon;
                 return (
                   <div 
                     key={game.id}
                     onClick={() => setActiveGame(game.id as GameType)}
                     className="group cursor-pointer bg-card hover:bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all rounded-3xl p-6 flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden relative"
                   >
                      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${game.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
                      
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 ${game.bgMuted} rounded-2xl flex items-center justify-center border border-current/10 ${game.textClass}`}>
                         <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <div className="flex-1 text-left flex flex-col justify-center">
                         <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{game.title}</h3>
                         <p className="text-muted-foreground text-sm leading-relaxed">{game.description}</p>
                      </div>
                   </div>
                 )
               })}
            </div>
         )}

         {activeGame === "memory" && <BrainMemory />}
         {activeGame === "typing" && <TypingSpeed />}
         {activeGame === "math" && <MathSprint />}
         {activeGame === "scramble" && <WordScramble />}
      </div>

    </div>
  );
}
