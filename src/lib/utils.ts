import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🏆";
  if (streak >= 14) return "🔥";
  if (streak >= 7) return "⚡";
  if (streak >= 3) return "✨";
  return "💪";
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy": return "text-green-500";
    case "medium": return "text-yellow-500";
    case "hard": return "text-red-500";
    default: return "text-gray-500";
  }
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty) {
    case "easy": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "hard": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

export function getSubjectColor(code: string): string {
  const colors: Record<string, string> = {
    PU: "#6366f1",
    PK: "#8b5cf6",
    PBM: "#ec4899",
    PPU: "#f59e0b",
    LBI: "#10b981",
    LBE: "#3b82f6",
    PM: "#ef4444",
  };
  return colors[code] || "#6b7280";
}
