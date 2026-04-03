export const APP_NAME = "LoginPTN";
export const APP_DESCRIPTION = "Smart AI-Powered Digital Learning Platform untuk UTBK SNBT";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const SUBJECTS = [
  { code: "PU", name: "Penalaran Umum", icon: "🧠", description: "Penalaran Induktif, Deduktif, Kuantitatif" },
  { code: "PK", name: "Pengetahuan Kuantitatif", icon: "📐", description: "Matematika Dasar & Logika" },
  { code: "PBM", name: "Pemahaman Bacaan & Menulis", icon: "📖", description: "Membaca & Menulis Kritis" },
  { code: "PPU", name: "Pengetahuan & Pemahaman Umum", icon: "🌍", description: "Wawasan Umum & Sosial" },
  { code: "LBI", name: "Literasi Bahasa Indonesia", icon: "🇮🇩", description: "Pemahaman Teks Bahasa Indonesia" },
  { code: "LBE", name: "Literasi Bahasa Inggris", icon: "🇬🇧", description: "Reading Comprehension English" },
  { code: "PM", name: "Penalaran Matematika", icon: "🔢", description: "Problem Solving Matematika" },
] as const;

export const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.code, s]));

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Mudah", color: "green" },
  { value: "medium", label: "Sedang", color: "yellow" },
  { value: "hard", label: "Sulit", color: "red" },
] as const;

export const STUDY_METHODS = [
  {
    id: "pomodoro",
    name: "Teknik Pomodoro",
    icon: "🍅",
    description: "Belajar 25 menit, istirahat 5 menit. Ulangi 4x, lalu istirahat panjang 15-30 menit.",
    steps: [
      "Pilih topik yang ingin dipelajari",
      "Set timer 25 menit dan fokus belajar",
      "Istirahat 5 menit setelah timer berbunyi",
      "Ulangi siklus ini 4 kali",
      "Ambil istirahat panjang 15-30 menit",
    ],
    benefits: ["Meningkatkan fokus", "Mengurangi kelelahan mental", "Melatih disiplin waktu"],
  },
  {
    id: "active-recall",
    name: "Active Recall",
    icon: "🧠",
    description: "Uji ingatanmu tanpa melihat catatan. Lebih efektif dari membaca ulang.",
    steps: [
      "Baca materi sekali dengan seksama",
      "Tutup buku/catatan",
      "Coba ingat semua poin penting",
      "Buka kembali dan cek jawabanmu",
      "Fokus pada bagian yang belum dikuasai",
    ],
    benefits: ["Memperkuat memori jangka panjang", "Mengidentifikasi kelemahan", "Belajar lebih efisien"],
  },
  {
    id: "spaced-repetition",
    name: "Spaced Repetition",
    icon: "📅",
    description: "Ulangi materi dengan interval yang semakin panjang untuk memori jangka panjang.",
    steps: [
      "Pelajari materi baru hari ini",
      "Review setelah 1 hari",
      "Review lagi setelah 3 hari",
      "Review setelah 1 minggu",
      "Review setelah 2 minggu, lalu 1 bulan",
    ],
    benefits: ["Memori tahan lama", "Efisien waktu belajar", "Ideal untuk persiapan UTBK"],
  },
  {
    id: "blurting",
    name: "Blurting Method",
    icon: "💬",
    description: "Tuliskan semua yang kamu ingat tentang suatu topik tanpa melihat catatan.",
    steps: [
      "Baca topik atau bab tertentu",
      "Ambil kertas kosong",
      "Tulis SEMUA yang kamu ingat",
      "Bandingkan dengan materi asli",
      "Isi bagian yang terlewat dan ulangi",
    ],
    benefits: ["Mengukur pemahaman nyata", "Menemukan gap pengetahuan", "Melatih recall aktif"],
  },
  {
    id: "time-blocking",
    name: "Time Blocking",
    icon: "⏰",
    description: "Jadwalkan blok waktu khusus untuk setiap mata pelajaran.",
    steps: [
      "Tentukan subject yang perlu dipelajari",
      "Alokasikan blok waktu 1-2 jam per subject",
      "Jangan campur-campur topik dalam 1 blok",
      "Sisipkan istirahat antar blok",
      "Review jadwal setiap minggu",
    ],
    benefits: ["Struktur belajar jelas", "Semua subject tercover", "Mengurangi decision fatigue"],
  },
] as const;

export const BADGES = [
  { id: 1, name: "First Step", description: "Selesaikan aktivitas pertama", icon: "🌟", requirement: 1 },
  { id: 2, name: "3-Day Streak", description: "Belajar 3 hari berturut-turut", icon: "✨", requirement: 3 },
  { id: 3, name: "7-Day Streak", description: "Belajar 7 hari berturut-turut", icon: "⚡", requirement: 7 },
  { id: 4, name: "14-Day Streak", description: "Belajar 14 hari berturut-turut", icon: "🔥", requirement: 14 },
  { id: 5, name: "SNBT Warrior", description: "Belajar 30 hari berturut-turut!", icon: "🏆", requirement: 30 },
  { id: 6, name: "Quiz Master", description: "Jawab 100 soal", icon: "📝", requirement: 100 },
  { id: 7, name: "Tryout Hero", description: "Selesaikan 5 tryout", icon: "🎯", requirement: 5 },
  { id: 8, name: "Perfect Score", description: "Dapatkan 100% di satu sesi", icon: "💯", requirement: 1 },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/bank-soal", label: "Bank Soal", icon: "BookOpen" },
  { href: "/tryout", label: "Tryout", icon: "ClipboardList" },
  { href: "/analytics", label: "Analitik", icon: "BarChart3" },
  { href: "/ai-assistant", label: "AI Assistant", icon: "Bot" },
  { href: "/study-groups", label: "Study Groups", icon: "Users" },
  { href: "/pdf-workspace", label: "PDF Workspace", icon: "FileText" },
  { href: "/study-drive", label: "Study Drive", icon: "HardDrive" },
  { href: "/tips-strategi", label: "Tips & Strategi", icon: "Lightbulb" },
  { href: "/score-check", label: "Cek Peluang PTN", icon: "GraduationCap" },
] as const;

export const UNIVERSITIES = [
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

export const MAJORS: Record<number, { id: number; name: string; faculty: string }[]> = {
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
  ]
};

// Generate default majors for universities without specific data
for (let i = 4; i <= 25; i++) {
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
