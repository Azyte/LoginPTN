"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, User, Search, ChevronRight, ChevronLeft, School, BookMarked } from "lucide-react";

const UNIVERSITIES = [
  { id: 1, name: "Universitas Indonesia", short: "UI", location: "Depok, Jawa Barat" },
  { id: 2, name: "Universitas Gadjah Mada", short: "UGM", location: "Yogyakarta" },
  { id: 3, name: "Institut Teknologi Bandung", short: "ITB", location: "Bandung, Jawa Barat" },
  { id: 4, name: "Universitas Airlangga", short: "UNAIR", location: "Surabaya, Jawa Timur" },
  { id: 5, name: "Institut Teknologi Sepuluh Nopember", short: "ITS", location: "Surabaya, Jawa Timur" },
  { id: 6, name: "Universitas Diponegoro", short: "UNDIP", location: "Semarang, Jawa Tengah" },
  { id: 7, name: "Universitas Padjadjaran", short: "UNPAD", location: "Bandung, Jawa Barat" },
  { id: 8, name: "Universitas Brawijaya", short: "UB", location: "Malang, Jawa Timur" },
  { id: 9, name: "Institut Pertanian Bogor", short: "IPB", location: "Bogor, Jawa Barat" },
  { id: 10, name: "Universitas Hasanuddin", short: "UNHAS", location: "Makassar, Sulawesi Selatan" },
  { id: 11, name: "Universitas Sebelas Maret", short: "UNS", location: "Surakarta, Jawa Tengah" },
  { id: 12, name: "Universitas Sumatera Utara", short: "USU", location: "Medan, Sumatera Utara" },
  { id: 13, name: "Universitas Andalas", short: "UNAND", location: "Padang, Sumatera Barat" },
  { id: 14, name: "Universitas Negeri Yogyakarta", short: "UNY", location: "Yogyakarta" },
  { id: 15, name: "Universitas Negeri Malang", short: "UM", location: "Malang, Jawa Timur" },
  { id: 16, name: "Universitas Pendidikan Indonesia", short: "UPI", location: "Bandung, Jawa Barat" },
  { id: 17, name: "Universitas Negeri Semarang", short: "UNNES", location: "Semarang, Jawa Tengah" },
  { id: 18, name: "Universitas Negeri Surabaya", short: "UNESA", location: "Surabaya, Jawa Timur" },
  { id: 19, name: "Universitas Jember", short: "UNEJ", location: "Jember, Jawa Timur" },
  { id: 20, name: "Universitas Lampung", short: "UNILA", location: "Bandar Lampung" },
  { id: 21, name: "Universitas Sriwijaya", short: "UNSRI", location: "Palembang, Sumatera Selatan" },
  { id: 22, name: "Universitas Riau", short: "UNRI", location: "Pekanbaru, Riau" },
  { id: 23, name: "Universitas Udayana", short: "UNUD", location: "Bali" },
  { id: 24, name: "Universitas Negeri Jakarta", short: "UNJ", location: "Jakarta" },
  { id: 25, name: "Universitas Syiah Kuala", short: "USK", location: "Banda Aceh" },
];

const MAJORS: Record<number, { id: number; name: string; faculty: string }[]> = {
  1: [
    { id: 1, name: "Kedokteran", faculty: "Fakultas Kedokteran" },
    { id: 2, name: "Hukum", faculty: "Fakultas Hukum" },
    { id: 3, name: "Teknik Informatika", faculty: "Fakultas Ilmu Komputer" },
    { id: 4, name: "Manajemen", faculty: "Fakultas Ekonomi & Bisnis" },
    { id: 5, name: "Akuntansi", faculty: "Fakultas Ekonomi & Bisnis" },
    { id: 6, name: "Psikologi", faculty: "Fakultas Psikologi" },
    { id: 7, name: "Ilmu Komunikasi", faculty: "Fakultas Ilmu Sosial & Politik" },
    { id: 8, name: "Farmasi", faculty: "Fakultas Farmasi" },
  ],
  2: [
    { id: 9, name: "Kedokteran", faculty: "Fakultas Kedokteran" },
    { id: 10, name: "Teknik Elektro", faculty: "Fakultas Teknik" },
    { id: 11, name: "Ilmu Hukum", faculty: "Fakultas Hukum" },
    { id: 12, name: "Akuntansi", faculty: "Fakultas Ekonomi & Bisnis" },
    { id: 13, name: "Psikologi", faculty: "Fakultas Psikologi" },
    { id: 14, name: "Ilmu Komputer", faculty: "Fakultas Matematika & IPA" },
    { id: 15, name: "Hubungan Internasional", faculty: "Fakultas Ilmu Sosial & Politik" },
  ],
  3: [
    { id: 16, name: "Teknik Informatika", faculty: "STEI" },
    { id: 17, name: "Teknik Elektro", faculty: "STEI" },
    { id: 18, name: "Teknik Mesin", faculty: "FTI" },
    { id: 19, name: "Teknik Sipil", faculty: "FTSL" },
    { id: 20, name: "Arsitektur", faculty: "SAPPK" },
    { id: 21, name: "Matematika", faculty: "FMIPA" },
    { id: 22, name: "Desain Komunikasi Visual", faculty: "FSRD" },
  ],
  4: [
    { id: 23, name: "Kedokteran", faculty: "Fakultas Kedokteran" },
    { id: 24, name: "Farmasi", faculty: "Fakultas Farmasi" },
    { id: 25, name: "Psikologi", faculty: "Fakultas Psikologi" },
    { id: 26, name: "Hukum", faculty: "Fakultas Hukum" },
    { id: 27, name: "Manajemen", faculty: "FEB" },
    { id: 28, name: "Kedokteran Gigi", faculty: "FKG" },
  ],
  5: [
    { id: 29, name: "Teknik Informatika", faculty: "Fakultas Teknologi Informasi" },
    { id: 30, name: "Teknik Elektro", faculty: "FTE" },
    { id: 31, name: "Teknik Mesin", faculty: "FTI" },
    { id: 32, name: "Teknik Sipil", faculty: "FTSPK" },
    { id: 33, name: "Desain Produk Industri", faculty: "FADP" },
    { id: 34, name: "Arsitektur", faculty: "FADP" },
  ],
};

// Generate default majors for universities without specific data
for (let i = 6; i <= 25; i++) {
  if (!MAJORS[i]) {
    MAJORS[i] = [
      { id: i * 100 + 1, name: "Kedokteran", faculty: "FK" },
      { id: i * 100 + 2, name: "Teknik Informatika", faculty: "FT" },
      { id: i * 100 + 3, name: "Hukum", faculty: "FH" },
      { id: i * 100 + 4, name: "Manajemen", faculty: "FEB" },
      { id: i * 100 + 5, name: "Psikologi", faculty: "FPsi" },
      { id: i * 100 + 6, name: "Farmasi", faculty: "FF" },
    ];
  }
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUniId, setSelectedUniId] = useState<number | null>(null);
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [uniSearch, setUniSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const filteredUnis = useMemo(
    () => UNIVERSITIES.filter((u) => u.name.toLowerCase().includes(uniSearch.toLowerCase()) || u.short.toLowerCase().includes(uniSearch.toLowerCase())),
    [uniSearch]
  );

  const availableMajors = useMemo(() => {
    if (!selectedUniId) return [];
    const majors = MAJORS[selectedUniId] || [];
    return majors.filter((m) => m.name.toLowerCase().includes(majorSearch.toLowerCase()));
  }, [selectedUniId, majorSearch]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            target_university_id: selectedUniId,
            target_major_id: selectedMajorId,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Jika butuh verifikasi email, session akan kosong
        if (!data.session) {
          setError("Silakan periksa email kamu untuk memverifikasi akun ini.");
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Gagal membuat akun, silakan coba lagi.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan pada sistem.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-pattern relative">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl animated-gradient flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">LoginPTN</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Buat Akun Baru</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 1 && "Isi data dirimu untuk memulai"}
            {step === 2 && "Pilih PTN impianmu"}
            {step === 3 && "Pilih jurusan yang dituju"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? "w-10 bg-primary" : s < step ? "w-10 bg-primary/50" : "w-10 bg-secondary"
              }`}
            />
          ))}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-2xl shadow-black/10">
          {step === 1 && (
            <>
              <button
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-xl font-medium transition-all mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Daftar dengan Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">atau daftar dengan email</span></div>
              </div>

              <div className="space-y-4">
                {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3">{error}</div>}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="Nama lengkapmu" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="nama@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="Min. 6 karakter" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => { if (name && email && password.length >= 6) setStep(2); }} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={uniSearch} onChange={(e) => setUniSearch(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="Cari universitas..." />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {filteredUnis.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => { setSelectedUniId(uni.id); setSelectedMajorId(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedUniId === uni.id ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 hover:bg-secondary/50"
                    }`}
                  >
                    <School className={`w-5 h-5 shrink-0 ${selectedUniId === uni.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{uni.name} ({uni.short})</div>
                      <div className="text-xs text-muted-foreground">{uni.location}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button onClick={() => { if (selectedUniId) setStep(3); }} disabled={!selectedUniId} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={majorSearch} onChange={(e) => setMajorSearch(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="Cari jurusan..." />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {availableMajors.map((major) => (
                  <button
                    key={major.id}
                    type="button"
                    onClick={() => setSelectedMajorId(major.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedMajorId === major.id ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 hover:bg-secondary/50"
                    }`}
                  >
                    <BookMarked className={`w-5 h-5 shrink-0 ${selectedMajorId === major.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="font-medium text-sm">{major.name}</div>
                      <div className="text-xs text-muted-foreground">{major.faculty}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button type="submit" disabled={loading || !selectedMajorId} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Mendaftar..." : "Daftar"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
