# 🎓 LoginPTN — Gamified AI-Powered UTBK Ecosystem

**LoginPTN** bukan sekadar platform latihan ujian biasa. LoginPTN adalah ekosistem persiapan UTBK SNBT (Seleksi Nasional Berdasarkan Tes) tercanggih yang menggabungkan kekuatan **Kecerdasan Buatan (Llama 3.3 70B)**, kolaborasi antarsiswa **(Live Voice Chat WebRTC)**, serta psikologi desain kelas tinggi **(Gamification & Focus Tools)**.

Dibangun dengan *Next.js 16 App Router* dan *Supabase*, platform ini dirancang untuk satu tujuan mutlak: **Membantu siswa Indonesia menembus PTN impian mereka tanpa rasa bosan.** 🔥

---

## 🚀 "Wow Factors" (Keunggulan Kompetitif)

Kami memahami bahwa belajar mandiri itu berat. Oleh karena itu, arsitektur LoginPTN dilengkapi oleh fitur pendongkrak interaksi:

- 🎉 **Live Gamification (Canvas Confetti)**: Efek kembang api meledak se-layar setelah pengguna berhasil merampungkan sesi Tryout untuk memberi injeksi dopamin.
- 💬 **Live Audio Room**: Study Group tidak cuma berisi teks! Kami membangun *Mesh Network WebRTC* agar pejuang SNBT bisa "Nongkrong" sambil berdiskusi via suara langsung di dalam platform.
- 🍅 **Built-in Pomodoro Widget**: Pejuang sejati butuh fokus. Widget *Focus Timer* tertanam secara global mengunci ritme belajar (25 Menit) & istirahat (5 Menit) di penjuru aplikasi.
- 🔥 **Daily Ambis Quotes**: Di halaman beranda, algoritma memilih sapaan penyemangat revolusioner setiap hari agar energi tetap penuh sedari detik pertama membuka dasbor.

---

## 🛠️ Fitur Teknis Utama 

### 1. 🤖 AI Chat Assistant Terintegrasi
- **Secure Server-Side AI**: Menggunakan API proxy di `/api/chat` menuju *Groq Cloud Llama-3*, memastikan *API Keys* aman dengan arsitektur bebas *rate-limit* liar di klien.
- **Export "Simpan Catatan"**: Percakapan bermutu bersama mentor AI tidak akan hilang. Satu klik untuk mengunduh (`.txt`) log pelajaran rahasia hasil tempaan AI.
- **Persistent Chat History**: Memory state per *user* dijaga abadi dalam Supabase, menciptakan riwayat asisten privat berkesinambungan layaknya *ChatGPT*.

### 2. 📄 Engine Ekstraksi PDF Asli (Bukan Ilusi)
Berbeda dengan platform tiruan, **PDF Workspace** kami adalah Monster Literasi yang nyata.
- **`pdf-parse` Backend Logic**: Saat siswa mengklik file dari *Group Drive*, API Next.js kami akan mengunduh dokumen tersebut ke memori server lalu **MENGEKSTRAKSI TEKS** aslinya ke dalam Prompt *Llama*.
- Hasilnya? AI dapat merangkum bab spesifik dari file unggahan atau merekayasa Kuis Pilihan Ganda (A-E) 100% otentik dari materi yang PDF tersebut! 

### 3. 🎯 IRT-Standard Tryout & Analitik Mendalam
- **Simulasi 7 Subtes**: Sesuai kurikulum SNBT balai pengujian (PU, PK, PPU, PBM, LBI, LBE, PM).
- **Penilaian Modern**: Didukung analitik basis *React Recharts* serta skema basis data (*Item Response Theory-ready*).
- **Rekomendasi AI Rapor**: Kelemahan dikupas di ujung ujian, memberi petunjuk bedah subtes mana yang perlu digenjot lebih keras.

---

## ⚙️ Spesifikasi & Stack Teknologi

| Layer | Teknologi yang Digunakan |
| :--- | :--- |
| **Frontend Frame** | App Router Next.js 16.2.1, React 19 |
| **BaaS / Database** | Supabase (PostgreSQL, Realtime, Edge Storage) |
| **AI LLM Inference** | Groq Cloud Engine (Llama 3.3 70B Versatile) |
| **Desain & Animasi** | TailwindCSS v4, Lucide React, Canvas-Confetti |
| **Komunikasi Data** | WebRTC APIs (P2P), Supabase Broadcast Channel |

---

## 📂 Peta Arsitektur File Inti

Penting bagi Juri Hackathon untuk melihat keindahan kode kami:

- `src/app/api/chat/route.ts` → Markas Integrasi LLM API & Mesin Ekstraksi Payload `pdf-parse`.
- `src/app/(protected)/pdf-workspace/` → Layar kolaborasi ajaib di mana interaksi File Drive dipadu dengan lemparan *Auto-Prompt* ke sistem kecerdasan buatan. 
- `src/app/(protected)/tryout/` → Kerangka modul ujian berbasis *real-timer* lengkap dengan logika *score calculation*.
- `src/hooks/useWebRTC.ts` → Kumpulan perakitan Audio Pipeline P2P *(Peer-to-Peer)*.
- `src/components/ui/Pomodoro.tsx` → Desain kustom komponen layar melayang *Time Management*.

---

## 🏁 Memulai Development (Local Deployment)

Jalankan LoginPTN di mesin lokal Anda dalam hitungan menit:

1. **Persiapan Node.js**: Membutuhkan `npm` & Node versi 18 ke atas.
2. **Environment Variables**:
   Bikin file `.env` di root project berdasarkan `.env.example` atau sertakan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_AI_AGENT_URL=https://api.groq.com/openai/v1/chat/completions
   AI_AGENT_API_KEY=gsk_XXX (Kunci Groq)
   ```
3. **Instalasi Paket & Nyalakan Server**:
   ```bash
   npm install
   npm run dev --webpack
   ```
   *Catatan: Parameter `--webpack` mengoptimalkan turbo kompilasi di sistem operasi Windows tertentu.*

---
🌟 **LoginPTN** — *Selesai Belajar, Diterima Kampus Kuning. Solusi Final Penakluk SNBT.* 🌟