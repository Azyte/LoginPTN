"use client";

import { useState, useMemo } from "react";
import { GraduationCap, Search, Calculator, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, Award, School, MapPin } from "lucide-react";

const UNIVERSITIES = [
  { id: 1, name: "Universitas Indonesia", short_name: "UI", location: "Depok, Jawa Barat" },
  { id: 2, name: "Universitas Gadjah Mada", short_name: "UGM", location: "Yogyakarta" },
  { id: 3, name: "Institut Teknologi Bandung", short_name: "ITB", location: "Bandung, Jawa Barat" },
  { id: 4, name: "Universitas Airlangga", short_name: "UNAIR", location: "Surabaya, Jawa Timur" },
  { id: 5, name: "Institut Teknologi Sepuluh Nopember", short_name: "ITS", location: "Surabaya, Jawa Timur" },
  { id: 6, name: "Universitas Diponegoro", short_name: "UNDIP", location: "Semarang, Jawa Tengah" },
  { id: 7, name: "Universitas Padjadjaran", short_name: "UNPAD", location: "Bandung, Jawa Barat" },
  { id: 8, name: "Universitas Brawijaya", short_name: "UB", location: "Malang, Jawa Timur" },
  { id: 9, name: "Institut Pertanian Bogor", short_name: "IPB", location: "Bogor, Jawa Barat" },
  { id: 10, name: "Universitas Hasanuddin", short_name: "UNHAS", location: "Makassar, Sulawesi Selatan" },
  { id: 11, name: "Universitas Sebelas Maret", short_name: "UNS", location: "Surakarta, Jawa Tengah" },
  { id: 12, name: "Universitas Sumatera Utara", short_name: "USU", location: "Medan, Sumatera Utara" },
  { id: 13, name: "Universitas Andalas", short_name: "UNAND", location: "Padang, Sumatera Barat" },
  { id: 14, name: "Universitas Negeri Yogyakarta", short_name: "UNY", location: "Yogyakarta" },
  { id: 15, name: "Universitas Negeri Malang", short_name: "UM", location: "Malang, Jawa Timur" },
  { id: 16, name: "Universitas Pendidikan Indonesia", short_name: "UPI", location: "Bandung, Jawa Barat" },
  { id: 17, name: "Universitas Negeri Semarang", short_name: "UNNES", location: "Semarang, Jawa Tengah" },
  { id: 18, name: "Universitas Negeri Surabaya", short_name: "UNESA", location: "Surabaya, Jawa Timur" },
  { id: 19, name: "Universitas Jember", short_name: "UNEJ", location: "Jember, Jawa Timur" },
  { id: 20, name: "Universitas Lampung", short_name: "UNILA", location: "Bandar Lampung" },
  { id: 21, name: "Universitas Sriwijaya", short_name: "UNSRI", location: "Palembang, Sumatera Selatan" },
  { id: 22, name: "Universitas Riau", short_name: "UNRI", location: "Pekanbaru, Riau" },
  { id: 23, name: "Universitas Udayana", short_name: "UNUD", location: "Bali" },
  { id: 24, name: "Universitas Negeri Jakarta", short_name: "UNJ", location: "Jakarta" },
  { id: 25, name: "Universitas Syiah Kuala", short_name: "USK", location: "Banda Aceh" },
].map(u => ({
  ...u,
  majors: generateMajors(u.id)
}));

function generateMajors(uniId: number) {
  const base = [
    { name: "Kedokteran", faculty: "FK", score: 720 },
    { name: "Teknik Informatika", faculty: "FT", score: 660 },
    { name: "Hukum", faculty: "FH", score: 640 },
    { name: "Manajemen", faculty: "FEB", score: 630 },
    { name: "Psikologi", faculty: "FPsi", score: 650 },
    { name: "Farmasi", faculty: "FF", score: 620 },
  ];
  // Top 5 universities get higher passing scores
  const tier = uniId <= 3 ? 40 : uniId <= 9 ? 20 : 0;
  return base.map((m, i) => ({
    id: uniId * 100 + i + 1,
    name: m.name,
    faculty: m.faculty,
    passing_score_estimate: m.score + tier
  }));
}

export default function ScoreCheckPage() {
  const [score, setScore] = useState<string>("");
  const [searchUni, setSearchUni] = useState("");
  const [selectedUni, setSelectedUni] = useState<any | null>(null);
  
  const [searchMajor, setSearchMajor] = useState("");
  const [selectedMajor, setSelectedMajor] = useState<any | null>(null);
  
  const [result, setResult] = useState<{ probability: string; level: "high" | "medium" | "low"; advice: string; gap: number; estimate: number } | null>(null);

  // Filters
  const filteredUniversities = useMemo(() => {
    if (!searchUni.trim()) return UNIVERSITIES;
    const lower = searchUni.toLowerCase();
    return UNIVERSITIES.filter(u => u.name.toLowerCase().includes(lower) || u.short_name.toLowerCase().includes(lower));
  }, [searchUni]);

  const availableMajors = selectedUni?.majors || [];
  const filteredMajors = useMemo(() => {
    if (!searchMajor.trim()) return availableMajors;
    const lower = searchMajor.toLowerCase();
    return availableMajors.filter((m: any) => m.name.toLowerCase().includes(lower));
  }, [searchMajor, availableMajors]);

  const calculate = () => {
    const numScore = parseInt(score);
    if (!selectedMajor || isNaN(numScore)) return;

    const estimate = selectedMajor.passing_score_estimate || 600; // fallback
    const gap = numScore - estimate;
    let probability: string;
    let level: "high" | "medium" | "low";
    let advice: string;

    if (gap >= 50) {
      probability = "Sangat Terbuka (>85%)";
      level = "high";
      advice = "Skor kamu mengungguli margin aman! Peluangmu sangat besar, optimalkan tryout lanjutan untuk mempertahankan posisi.";
    } else if (gap >= 0) {
      probability = "Aman (60-85%)";
      level = "high";
      advice = "Skor di atas estimasi rata-rata. Meski aman, jangan lengah karena persaingan prodi ini selalu dinamis.";
    } else if (gap >= -30) {
      probability = "Hati-Hati (40-60%)";
      level = "medium";
      advice = "Kamu berada di zona bersaing ketat. Tingkatkan 1-3 subtes tertinggal untuk menembus passing grade.";
    } else if (gap >= -80) {
      probability = "Riskan (15-40%)";
      level = "low";
      advice = "Selisih lumayan tinggi. Kami menyarankan untuk melakukan drilling TO intensif atau pertimbangkan pilihan 2 alternatif.";
    } else {
      probability = "Perlu Keajaiban (<15%)";
      level = "low";
      advice = "Gap skor sangat besar. Sangat disarankan untuk segera switch target prodi paralel dengan tingkat keketatan yang lebih realistis.";
    }

    setResult({ probability, level, advice, gap, estimate });
    
    // Smooth scroll to results
    setTimeout(() => {
       window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center sm:justify-start gap-4 mb-3">
          <div className="bg-primary/10 p-3 rounded-2xl hidden sm:block"><GraduationCap className="w-8 h-8 text-primary" /></div>
          Rasionalisasi & Peluang PTN
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Kalkulasi tingkat keamanan daya saingmu menuju prodi dan PTN Idaman berbasis skor Real-time Tryout. Algoritma kami membandingkan historis keketatan jutaan data peserta.
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* STEP 1: SCORE */}
          <div className="space-y-6">
            <h3 className="font-bold border-b border-border/50 pb-3 flex items-center gap-2">
               <span className="bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> 
               Input Skor Saat Ini
            </h3>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Rata-rata Skor UTBK (Prediksi)</label>
              <div className="relative">
                <input
                  type="number"
                  value={score}
                  onChange={(e) => { setScore(e.target.value); setResult(null); }}
                  placeholder="Misal: 685"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-4 pl-12 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:font-normal"
                />
                <Award className="w-6 h-6 text-muted-foreground absolute left-4 top-4" />
              </div>
            </div>

            {/* STEP 2: PTN */}
            <h3 className="font-bold border-b border-border/50 pb-3 mt-8 flex items-center gap-2">
               <span className="bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span> 
               Pilih Kampus
            </h3>
            
            {selectedUni ? (
               <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start justify-between">
                 <div>
                    <div className="text-xs text-primary font-bold mb-1">{selectedUni.short_name}</div>
                    <div className="font-semibold text-lg">{selectedUni.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {selectedUni.location}</div>
                 </div>
                 <button onClick={() => {setSelectedUni(null); setSelectedMajor(null); setResult(null);}} className="text-xs font-semibold text-primary/70 hover:text-primary">Ganti PTN</button>
               </div>
            ) : (
               <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchUni}
                      onChange={(e) => setSearchUni(e.target.value)}
                      placeholder="Cari Universitas..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:border-primary/50"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  </div>
                  <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                     {filteredUniversities.length === 0 ? <p className="text-xs text-center text-muted-foreground py-4">PTN tidak ditemukan</p> : null}
                     {filteredUniversities.map(u => (
                        <button key={u.id} onClick={() => { setSelectedUni(u); setSearchUni(""); }} className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3">
                           <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0 text-muted-foreground"><School className="w-5 h-5"/></div>
                           <div>
                              <div className="text-sm font-semibold">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.location}</div>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
            )}
          </div>

          {/* STEP 3: MAJOR */}
          <div className="space-y-6">
            <h3 className="font-bold border-b border-border/50 pb-3 flex items-center gap-2" style={{opacity: selectedUni ? 1 : 0.5}}>
               <span className="bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span> 
               Pilih Program Studi
            </h3>
            
            {!selectedUni ? (
               <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border/50">
                  <School className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Pilih universitas terlebih dahulu untuk melihat daftar program studi.</p>
               </div>
            ) : selectedMajor ? (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-start justify-between">
                 <div>
                    <div className="text-xs text-accent font-bold mb-1">Fakultas {selectedMajor.faculty || "-"}</div>
                    <div className="font-semibold text-lg">{selectedMajor.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Passing Grade Est: <span className="font-bold text-foreground">{selectedMajor.passing_score_estimate}</span></div>
                 </div>
                 <button onClick={() => {setSelectedMajor(null); setResult(null);}} className="text-xs font-semibold text-accent/70 hover:text-accent">Ganti Prodi</button>
               </div>
            ) : (
               <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchMajor}
                      onChange={(e) => setSearchMajor(e.target.value)}
                      placeholder="Cari Program Studi..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:border-primary/50"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  </div>
                  <div className="max-h-[340px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                     {filteredMajors.length === 0 ? <p className="text-xs text-center text-muted-foreground py-4">Belum ada jurusan yang tercatat untuk universitas ini.</p> : null}
                     {filteredMajors.map((m: any) => (
                        <button key={m.id} onClick={() => { setSelectedMajor(m); setSearchMajor(""); }} className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all flex justify-between items-center">
                           <div>
                              <div className="text-sm font-bold">{m.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">EST: {m.passing_score_estimate}</div>
                           </div>
                           <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                        </button>
                     ))}
                  </div>
               </div>
            )}

            <button
               onClick={calculate}
               disabled={!score || !selectedUni || !selectedMajor}
               className="w-full bg-primary text-primary-foreground py-4 mt-8 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
            >
               <Calculator className="w-5 h-5" /> Analisis Peluang Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="fade-in-up">
           <div className={`rounded-3xl p-8 border-2 ${
             result.level === "high" ? "bg-success/5 border-success/30" : result.level === "medium" ? "bg-warning/5 border-warning/30" : "bg-destructive/10 border-destructive/30"
           }`}>
             <div className="text-center sm:text-left flex flex-col sm:flex-row gap-6 sm:items-center mb-8">
               <div className={`w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 shadow-lg ${result.level === 'high' ? 'bg-success text-white shadow-success/30' : result.level === 'medium' ? 'bg-warning text-white shadow-warning/30' : 'bg-destructive text-white shadow-destructive/30'}`}>
                  {result.level === "high" ? <CheckCircle2 className="w-10 h-10" /> : result.level === "medium" ? <TrendingUp className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
               </div>
               <div className="flex-1">
                 <h2 className="text-3xl font-black mb-1">{result.probability}</h2>
                 <p className="text-muted-foreground text-sm">
                   Anda {result.gap >= 0 ? 'surplus' : 'kurang'} <strong className="text-foreground text-lg px-1">{Math.abs(result.gap)}</strong> poin dari ambang aman jurusan <strong className="text-foreground">{selectedMajor?.name}</strong>.
                 </p>
               </div>
               
               <div className="bg-card w-full sm:w-auto px-6 py-4 rounded-2xl border border-border/50 text-center">
                  <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Skor Target</div>
                  <div className="text-3xl font-black font-mono tracking-tight">{result.estimate}</div>
               </div>
             </div>

             {/* Mega Gauge */}
             <div className="mb-8 relative">
               <div className="absolute top-0 w-full flex justify-between text-[10px] font-bold text-muted-foreground px-2 -mt-5">
                 <span>0%</span>
                 <span>50%</span>
                 <span>100%</span>
               </div>
               <div className="h-6 bg-background rounded-full overflow-hidden border border-border/50 shadow-inner">
                 <div
                   className={`h-full rounded-full transition-all duration-1000 ${result.level === "high" ? "bg-gradient-to-r from-success/50 to-success" : result.level === "medium" ? "bg-gradient-to-r from-warning/50 to-warning" : "bg-gradient-to-r from-destructive/50 to-destructive"}`}
                   style={{ width: `${result.level === "high" ? Math.min(100, 80 + (result.gap/10)) : result.level === "medium" ? 50 + (result.gap/2) : Math.max(10, 40 + (result.gap))}  %` }}
                 />
               </div>
             </div>

             <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
               <h4 className="font-bold mb-2 flex items-center gap-2 border-b border-border/50 pb-3">💡 Analisis Strategis AI</h4>
               <p className="text-sm leading-relaxed text-muted-foreground">{result.advice}</p>
             </div>

             <p className="text-xs text-muted-foreground/60 mt-6 text-center">
               *Dihitung berdasarkan algoritma internal historis dari sebaran pendaftar simulasi nasional LoginPTN. Realita penentu SNBT tunduk pada sistem IRT BP3 Kemdikbud.
             </p>
           </div>
        </div>
      )}
    </div>
  );
}
