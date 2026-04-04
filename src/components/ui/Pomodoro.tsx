"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw, X, Target } from "lucide-react";

export function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(false);
      // Mainkan suara pendek (jika ada) saat timer habis
      const newIsBreak = !isBreak;
      setIsBreak(newIsBreak);
      setTimeLeft(newIsBreak ? 5 * 60 : 25 * 60);
      alert(newIsBreak ? "Waktu belajar habis! Istirahat 5 menit ya." : "Waktu istirahat habis! Lanjut gas ambis.");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const setMode = (breakMode: boolean) => {
    setIsActive(false);
    setIsBreak(breakMode);
    setTimeLeft(breakMode ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl hover:scale-105 transition-transform z-50 flex items-center justify-center animate-bounce"
        title="Buka Timer Belajar"
      >
        <Target className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-card border border-border/50 shadow-2xl rounded-2xl p-5 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" /> Focus Timer
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:bg-secondary p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-center gap-2 mb-4 bg-secondary/50 p-1 rounded-lg">
        <button 
          onClick={() => setMode(false)}
          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${!isBreak ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
        >
          Belajar
        </button>
        <button 
          onClick={() => setMode(true)}
          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${isBreak ? "bg-success text-success-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}
        >
          Istirahat
        </button>
      </div>

      <div className="text-5xl font-black text-center mb-6 tracking-tighter tabular-nums drop-shadow-sm">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button 
          onClick={toggleTimer}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all shadow-md ${
            isActive ? "bg-warning hover:bg-warning/90" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isActive ? "Pause" : "Mulai"}
        </button>
        <button 
          onClick={resetTimer}
          className="p-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-all border border-border"
        >
          <RotateCcw className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}
