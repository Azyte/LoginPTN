"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { Settings, Moon, Sun, Monitor, Globe, Target, Clock, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState(profile?.language_preference || "id");
  const [dailyTarget, setDailyTarget] = useState(profile?.daily_target_minutes || 60);
  const [studyGoal, setStudyGoal] = useState(profile?.study_goal || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground mt-1">Sesuaikan pengalaman belajarmu</p>
      </div>

      {/* Theme */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} Tema
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light" as const, label: "Terang", icon: Sun },
            { value: "dark" as const, label: "Gelap", icon: Moon },
            { value: "system" as const, label: "Sistem", icon: Monitor },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  theme === option.value ? "border-primary bg-primary/10" : "border-border/50 hover:bg-secondary/50"
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${theme === option.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Bahasa</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "id", label: "🇮🇩 Bahasa Indonesia" },
            { value: "en", label: "🇬🇧 English" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setLanguage(option.value)}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                language === option.value ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:bg-secondary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Study Preferences */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Target className="w-5 h-5" /> Preferensi Belajar</h2>
        <div>
          <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Target Belajar Harian (menit)
          </label>
          <input
            type="number"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(parseInt(e.target.value) || 0)}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            min={15}
            max={480}
          />
          <p className="text-xs text-muted-foreground mt-1">{Math.floor(dailyTarget / 60)}j {dailyTarget % 60}m per hari</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tujuan Belajar</label>
          <textarea
            value={studyGoal}
            onChange={(e) => setStudyGoal(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
            placeholder="Contoh: Lolos FK UI dengan skor UTBK 750+"
          />
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Tersimpan!</> : <><Save className="w-4 h-4" /> Simpan Pengaturan</>}
      </button>
    </div>
  );
}
