# LoginPTN — Smart Digital Learning Platform

![LoginPTN Hero](public/hero.png)

LoginPTN adalah platform pembelajaran digital tingkat lanjut bertenaga AI yang dirancang khusus untuk pejuang UTBK SNBT. Diciptakan dengan visi untuk mendemokratisasi akses ke bimbingan belajar berkualitas premium, LoginPTN menggabungkan metode pembelajaran berbasis riset (seperti Pomodoro dan Active Recall) dengan personalisasi yang didukung AI.

Platform ini hadir bukan hanya sebagai bank soal biasa, melainkan seperti mentor pribadi yang membimbing kamu langkah demi langkah menuju PTN Impian.

## ✨ Fitur Unggulan

- **🧠 LoginPTN AI Assistant**: Asisten AI cerdas yang siap menjawab, menjelaskan, dan merekomendasikan strategi belajar berdasarkan kekuatan dan kelemahanmu.
- **📚 Smart Question Bank**: Ribuan soal latihan UTBK SNBT (TPS & Literasi) terstruktur dengan pembahasan komprehensif.
- **⏱️ Realistic Tryout Simulator**: Tryout SNBT dengan blocking waktu, tingkat kesulitan dinamis, dan sistem scoring IRT-like.
- **📊 Advanced Analytics**: Pelacakan performa, akurasi per subtes, prediksi passing grade, dan analisis trend mingguan.
- **🫂 Study Groups (Community)**: Bergabunglah dengan sesama pejuang PTN favoritmu, berdiskusi, dan dapatkan peer-motivation.
- **📄 PDF Workspace & Study Drive**: Upload materi belajarmu, buat ringkasan otomatis, generate flashcards, atau chat interaktif menggunakan AI langsung dari PDF.
- **🎯 Score Rationalizer**: Kalkulator peluang diterima di PTN impian berdasarkan skor UTBK historis & data passing grade terbaru.

## 🛠️ Stack Teknologi

LoginPTN dibangun menggunakan tech stack modern dan scalable:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons, UI Custom Design System (Glassmorphism + Dark Mode)
- **Backend/Database**: Supabase (PostgreSQL), Supabase Auth
- **AI Integration**: DigitalOcean GenAI Agent
- **Data Visualization**: Recharts

## 🚀 Panduan Memulai (Development)

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

### 1. Prasyarat
- Node.js versi terbaru (v18+)
- npm atau pnpm
- Akun Supabase

### 2. Instalasi Dependensi
\`\`\`bash
npm install
\`\`\`

### 3. Konfigurasi Environment Variables
Gandakan \`.env.example\` menjadi \`.env.local\` dan isi kredensial berikut:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_AI_AGENT_URL=https://agent-loginptnx-xy2z.ondigitalocean.app/api/v1/chat/completions
AI_AGENT_API_KEY=your_digitalocean_ai_agent_key
\`\`\`

### 4. Setup Database
Jalankan file SQL schema yang terdapat di:
\`\`\`
supabase/migrations/001_complete_schema.sql
\`\`\`
File migrasi ini akan otomatis mengatur schema tabel, RLS policies, trigger auth, dan menyuntikkan (seeding) data awal universitas dan subtes.

### 5. Jalankan Development Server
\`\`\`bash
npm run dev
\`\`\`
Aplikasi dapat diakses melalui [http://localhost:3000](http://localhost:3000)

## 🏗️ Struktur Proyek

- `/src/app` - Routing aplikasi Next.js (App Router pattern)
  - `(auth)` - Grup rute untuk Login dan Register multi-step
  - `(protected)` - Halaman Dashboard, Bank Soal, Tryout, dll yang dilindungi proxy auth
- `/src/components` - Komponen React reusable (coming soon: refactor dari page)
- `/src/lib` - Utilitas aplikasi
  - `ai/agent.ts` - Penghubung ke DigitalOcean AI Agent
  - `supabase/client.ts & server.ts` - Klien Supabase
  - `constants.ts` - Data statis seperti Universitas, Subtes, Metode Belajar
  - `types.ts` - Definisi TypeScript interfaces
- `/src/providers` - Konteks global seperti AuthProvider & ThemeProvider
- `/supabase` - Konfigurasi dan migrasi SQL Supabase

## 📖 Pedoman Kontribusi (Architecture Notes)

LoginPTN dirancang untuk skalabilitas:
- **Proxy/Middleware**: Perutean aman ditangani di tingkat proxy (Next.js config + Supabase auth).
- **Desain Premium**: Hindari modifikasi default Tailwind utilities secara sembarangan, gunakan custom variables di `globals.css` untuk mempertahankan look and feel cyberpunk/modern.
- **Client/Server Boundaries**: Jaga agar page complex dapat dirender dari server semaksimal mungkin, dan gunakan `"use client"` hanya pada interaksi dinamis.

***

*Dibuat dengan ❤️ oleh AntiGravity (@Gemini) & Pembangun LoginPTN.*
