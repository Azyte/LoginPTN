LoginPTN — Smart Digital Learning Platform
LoginPTN adalah platform persiapan UTBK SNBT berbasis web yang mengintegrasikan AI untuk personalisasi belajar. Project ini dibangun untuk membantu pejuang PTN mengakses materi premium dan simulasi ujian dengan standar IRT.

🚀 Fitur Utama
AI Study Companion: Chatbot asisten untuk pembahasan soal dan rekomendasi strategi belajar.

Bank Soal & Tryout: Simulasi ujian dengan sistem blocking time dan penilaian mirip IRT.

Smart Analytics: Dashboard performa untuk melihat progres tiap subtes dan prediksi peluang lolos.

Study Drive: Fitur untuk kelola materi PDF, ringkasan otomatis, dan flashcards bertenaga AI.

Community Hub: Grup diskusi antar sesama pejuang PTN.

🛠️ Tech Stack
Core: Next.js (App Router), React, TypeScript.

Styling: Tailwind CSS (Custom Design System).

Backend: Supabase (Database, Auth, & Storage).

AI: DigitalOcean GenAI Agent Integration.

Charts: Recharts.

🏁 Memulai Development
1. Clone & Install
Bash
git clone <repository-url>
cd LoginPTN
npm install
2. Environment Variables
Buat file .env.local di root folder dan lengkapi datanya:

Cuplikan kode
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

NEXT_PUBLIC_AI_AGENT_URL=your_ai_endpoint_url
AI_AGENT_API_KEY=your_api_key

3. Database Setup
Gunakan file migrasi di supabase/migrations/ untuk setup tabel, RLS (Row Level Security), dan data awal universitas/subtes di instance Supabase kamu.

4. Running
Bash
npm run dev
Buka http://localhost:3000 untuk melihat hasilnya.

📁 Struktur Folder Utama
src/app: Routing dan Page logic (Next.js App Router).

src/components: UI components (Shared & Features).

src/lib: Logic untuk API client (Supabase & AI Agent), utils, dan types.

src/providers: Global context (Auth, Theme, dll).

supabase/: SQL migrations dan konfigurasi database.

📝 Catatan Kontribusi
Styling: Gunakan variabel custom di globals.css untuk menjaga konsistensi desain.

Performance: Utamakan Server Components untuk fetching data berat, gunakan Client Components hanya untuk interaksi user.