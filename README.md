# 🎓 LoginPTN — Smart Collaborative UTBK Ecosystem

**LoginPTN** adalah platform persiapan UTBK (Seleksi Nasional Berdasarkan Tes) tercanggih yang mengintegrasikan kecerdasan buatan (AI LLM) dengan sistem kolaborasi komunitas real-time berbasis WebRTC. Dibangun menggunakan Next.js 16 dan Supabase, platform ini memberikan pengalaman belajar yang dipersonalisasi untuk membantu siswa Indonesia menembus PTN impian.

---

## 🔥 Fitur Utama & Analisis Kode

### 🤖 AI Study Assistant (Llama 3.3 & Qwen-2)
- **Logika Cerdas**: Menggunakan integrasi Groq Cloud yang diproses melalui **Server-Side API Proxy** (`/api/chat/route.ts`) untuk keamanan API Key maksimal.
- **Persistent Memory**: Setiap pesan disimpan secara permanen di tabel `ai_messages` Supabase, memungkinkan riwayat percakapan yang berkelanjutan layaknya ChatGPT.
- **Auto-Prompting**: Integrasi unik dengan PDF Workspace untuk merangkum file secara otomatis melalui query parameter.

### 👥 Ruang Kolaborasi (Discord-Inspired)
- **Komunikasi Suara (WebRTC P2P)**: Implementasi *Custom Hook* `useWebRTC.ts` yang mengelola Mesh Network antar pengguna untuk *Voice Chat* tanpa server perantara.
- **Real-time Messaging**: Memanfaatkan **Supabase Broadcast & Realtime** untuk pertukaran pesan teks dan sinkronisasi status bertenaga tinggi.
- **Study Groups**: Manajemen grup lengkap dengan sistem Owner, Moderator, dan Member yang diatur via RLS Policy di Database.

### 📄 PDF Workspace & Study Drive
- **AI Document Extraction**: Mengolah dokumen PDF yang diunggah ke grup obrolan menjadi ringkasan, quiz, dan flashcards.
- **Material Repository**: Fitur Study Drive (`study-drive/page.tsx`) secara cerdas menyaring pesan bertipe 'file' dari seluruh database grup untuk menjadi perpustakaan pribadi pengguna.

### 🎯 IRT-Standard Tryout & Bank Soal
- **Simulasi Ujian**: Sistem tryout terstruktur dengan pembagian sesi (PU, PK, PPU, dll.) dan durasi waktu yang ketat.
- **Standard Scoring**: Skema database yang mendukung penilaian berbasis IRT (Item Response Theory) melalui tabel `questions` yang memiliki tingkat kesulitan (`difficulty`) dinamis.
- **Smart Analytics**: Visualisasi performa menggunakan `recharts` untuk mendeteksi kelemahan subtes secara mendalam.

---

## 🛠️ Stack Teknologi (Deep Dive)

- **Frontend**: `Next.js 16.2.1` (App Router) bertenaga `React 19`.
- **Styling**: `Tailwind CSS 4.0` dengan implementasi **Premium Dark Theme** melalui CSS Variables di `globals.css`.
- **Backend/BaaS**: `Supabase` (Auth, PostgreSQL Database, Realtime, & Storage).
- **AI Core**: `Groq LLM Engine` (Llama 3.3 70B & Qwen-2 72B).
- **Konektivitas**: `WebRTC Mesh Network` untuk komunikasi suara latensi rendah.
- **State Management**: `React Hooks` kustom dan `Zustand` (opsional).

---

## 📂 Struktur Arsitektur

- **`src/app/(protected)`**: Seluruh halaman inti aplikasi yang dibatasi oleh Middleware Auth Supabase.
- **`src/app/api`**: Rute backend untuk operasi sensitif seperti AI Chat Proxy.
- **`src/lib/ai/agent.ts`**: Logika utama yang menjembatani asisten AI dengan antarmuka pengguna.
- **`src/hooks/useWebRTC.ts`**: Otak dibalik sistem Voice Chat real-time.
- **`supabase/migrations`**: Skema database lengkap (380+ baris SQL) yang mencakup Gamifikasi (Badges), Streaks, dan Tryout System.

---

## 🏁 Memulai Development

1. **Persiapan**: Pastikan Node.js 18+ terinstal.
2. **Environment Setup**:
   Buat file `.env` dan isi dengan konfigurasi berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_AI_AGENT_URL=https://api.groq.com/openai/v1/chat/completions
   AI_AGENT_API_KEY=gsk_...
   ```
3. **Instalasi & Menjalankan**:
   ```bash
   npm install
   npm run dev --webpack
   ```
   *Catatan: Kami menggunakan flag `--webpack` untuk stabilitas kompilasi pada berbagai arsitektur CPU.*

---
*LoginPTN — Accelerating Educational Success through AI & Collaboration.*