"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BookOpen, Brain, BarChart3, Users, Bot, GraduationCap,
  ArrowRight, Sparkles, Target, Trophy, Zap, ChevronRight,
  Star, CheckCircle2, TrendingUp
} from "lucide-react";

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString("id-ID")}{suffix}</span>;
}

const features = [
  {
    icon: Brain,
    title: "AI Assistant Cerdas",
    description: "Asisten belajar personal yang memahami kebutuhanmu. Tanya materi, minta strategi, dan dapatkan penjelasan instan.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: BookOpen,
    title: "Bank Soal Lengkap",
    description: "Ribuan soal UTBK SNBT dengan pembahasan detail. Filter berdasarkan subtes dan tingkat kesulitan.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Target,
    title: "Tryout Realistis",
    description: "Simulasi UTBK dengan timer per sesi, blocking time, dan format soal identik ujian asli.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Analitik Performa",
    description: "Lacak progres belajarmu per subtes. Identifikasi kekuatan dan kelemahan dengan data visual.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Study Groups",
    description: "Belajar bareng teman! Buat grup, diskusi real-time, dan motivasi satu sama lain.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const stats = [
  { label: "Pengguna Aktif", value: 12840, suffix: "+" },
  { label: "Bank Soal", value: 5000, suffix: "+" },
  { label: "Tryout Selesai", value: 28500, suffix: "+" },
  { label: "Tingkat Kelulusan", value: 89, suffix: "%" },
];

const testimonials = [
  {
    name: "Aisyah R.",
    school: "SMAN 1 Jakarta",
    text: "LoginPTN bener-bener bantu aku fokus belajar. AI Assistant-nya keren banget, kayak punya tutor pribadi 24/7!",
    avatar: "A",
    target: "FK UI",
  },
  {
    name: "Budi S.",
    school: "SMAN 3 Bandung",
    text: "Fitur tryout realistisnya bikin aku terbiasa sama format UTBK. Scorenya bisa dilacak jadi tau progress-ku.",
    avatar: "B",
    target: "Teknik ITB",
  },
  {
    name: "Citra D.",
    school: "SMAN 5 Surabaya",
    text: "Study group-nya seru! Bisa diskusi sama teman dari seluruh Indonesia. Streak system-nya bikin rajin belajar.",
    avatar: "C",
    target: "FEB UNAIR",
  },
];

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">LoginPTN</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Statistik</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimoni</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden hero-pattern">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-20 h-20 bg-success/20 rounded-full blur-2xl float" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Raih PTN Impianmu{" "}
              <span className="gradient-text">dengan AI</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Platform belajar cerdas yang menggabungkan AI assistant, bank soal lengkap, tryout realistis, dan analytics untuk memaksimalkan persiapan{" "}
              <span className="font-semibold text-foreground">UTBK SNBT</span> kamu.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/30 glow"
              >
                Mulai Belajar Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-secondary/80 transition-all"
              >
                Lihat Fitur
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex items-center justify-center gap-8 mt-14 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>100% Gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span>12K+ Pengguna</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Semua yang Kamu Butuhkan untuk{" "}
              <span className="gradient-text">Lolos UTBK</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Fitur lengkap yang dirancang khusus untuk memaksimalkan persiapan SNBT kamu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-card border border-border/50 card-hover cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Cara Kerja <span className="gradient-text">LoginPTN</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: GraduationCap, title: "Daftar & Pilih PTN", desc: "Buat akun dan pilih PTN serta jurusan impianmu" },
              { step: "02", icon: BookOpen, title: "Latihan Soal", desc: "Kerjakan soal dari bank soal yang lengkap dan terstruktur" },
              { step: "03", icon: Bot, title: "Belajar dengan AI", desc: "Tanya AI Assistant untuk penjelasan dan strategi belajar" },
              { step: "04", icon: TrendingUp, title: "Pantau Progres", desc: "Lihat analytics dan tingkatkan skor dengan rekomendasi AI" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Apa Kata <span className="gradient-text">Mereka</span>
            </h2>
            <p className="text-muted-foreground text-lg">Cerita sukses pengguna LoginPTN</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full animated-gradient flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.school}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      Target: {t.target}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden animated-gradient p-px">
            <div className="rounded-3xl bg-card p-12 sm:p-16 text-center">
              <Trophy className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Siap Raih PTN Impianmu?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Bergabung dengan 12,000+ pelajar yang sudah menggunakan LoginPTN untuk persiapan UTBK SNBT mereka.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/30"
              >
                Daftar Sekarang — Gratis!
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">LoginPTN</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart AI-Powered Digital Learning Platform untuk UTBK SNBT Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Bank Soal</div>
                <div>Tryout SNBT</div>
                <div>AI Assistant</div>
                <div>Analitik</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Belajar</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Tips & Strategi</div>
                <div>Study Groups</div>
                <div>PDF Workspace</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Dukungan</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>FAQ</div>
                <div>Kontak</div>
                <div>Kebijakan Privasi</div>
                <div>Syarat & Ketentuan</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 LoginPTN. All rights reserved. Made with 💜 for Indonesian students.
          </div>
        </div>
      </footer>
    </div>
  );
}
