import type { AIMessage } from "@/lib/types";

const MOCK_RESPONSES: Record<string, string> = {
  default: `Hai! 👋 Aku **LoginPTN AI Assistant**, siap membantu kamu mempersiapkan UTBK SNBT.

Aku bisa membantu kamu dengan:
- 📚 **Menjelaskan materi** - Konsep TPS & Literasi
- 💡 **Strategi belajar** - Tips efektif persiapan UTBK
- 📝 **Latihan soal** - Pembahasan dan penjelasan
- 🎯 **Analsis performa** - Rekomendasi improvement
- 🏫 **Info PTN** - Passing grade & jurusan

Apa yang ingin kamu pelajari hari ini?`,
};

function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("pomodoro") || lower.includes("teknik belajar") || lower.includes("cara belajar")) {
    return `## 🍅 Teknik Pomodoro untuk UTBK

Teknik Pomodoro sangat cocok untuk persiapan UTBK:

1. **Set timer 25 menit** - Fokus pada satu subtes
2. **Istirahat 5 menit** - Relaksasi sejenak
3. **Ulangi 4 siklus** - Lalu istirahat 15-30 menit

### Tips Khusus UTBK:
- Sesi 1: Penalaran Umum (PU)
- Sesi 2: Literasi Bahasa Indonesia
- Sesi 3: Penalaran Matematika
- Sesi 4: Review soal-soal yang salah

Konsistensi lebih penting dari durasi! 💪`;
  }

  if (lower.includes("penalaran umum") || lower.includes("pu ") || lower.includes("tps")) {
    return `## 🧠 Penalaran Umum (PU)

Subtes PU terdiri dari 3 bagian:

### 1. Penalaran Induktif (10 soal, 10 menit)
- Pola angka dan huruf
- Analogi dan silogisme
- Tips: Cari pola umum, jangan terjebak pengecoh

### 2. Penalaran Deduktif (10 soal, 10 menit)
- Logika formal
- Premis dan kesimpulan
- Tips: Pahami validitas vs kebenaran argumen

### 3. Penalaran Kuantitatif (10 soal, 10 menit)
- Interpretasi data
- Grafik dan tabel
- Tips: Perhatikan satuan dan skala

Mau aku jelaskan salah satu bagian lebih detail? 📖`;
  }

  if (lower.includes("soal") || lower.includes("latihan") || lower.includes("contoh")) {
    return `## 📝 Contoh Soal Penalaran

**Soal Penalaran Induktif:**

Perhatikan pola berikut: 2, 6, 18, 54, ...

Bilangan selanjutnya adalah?

**Pembahasan:**
Pola: setiap bilangan dikalikan 3
- 2 × 3 = 6
- 6 × 3 = 18  
- 18 × 3 = 54
- 54 × 3 = **162** ✅

### Tips Mengerjakan:
1. Cek selisih antar bilangan
2. Cek rasio antar bilangan
3. Cek pola ganjil-genap
4. Perhatikan bilangan prima

Mau coba latihan lagi? 🎯`;
  }

  if (lower.includes("passing grade") || lower.includes("peluang") || lower.includes("ptn")) {
    return `## 🏫 Info Peluang Masuk PTN

Penting dipahami: **tidak ada passing grade resmi** dari SNPMB. Kelulusan ditentukan oleh perankingan.

### Faktor Penentu:
1. **Skor UTBK kamu** vs peserta lain
2. **Daya tampung** program studi
3. **Jumlah peminat** tahun tersebut

### Tips Strategi:
- Pilih PTN realistis di pilihan 1
- Pastikan skor kamu di atas rata-rata
- Gunakan fitur **Cek Peluang PTN** di LoginPTN
- Pantau data peminat di snpmb.id

Gunakan kalkulator skor di menu **Cek Peluang PTN** untuk estimasi! 📊`;
  }

  return MOCK_RESPONSES.default;
}

export async function sendAIMessage(
  messages: AIMessage[],
  userMessage: string
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, userMessage }),
    });

    if (!response.ok) {
      console.warn("Backend API Chat gagal. Falling back to mock.");
      return generateMockResponse(userMessage);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateMockResponse(userMessage);
  } catch (error) {
    console.error("Gagal terhubung ke /api/chat:", error);
    return generateMockResponse(userMessage);
  }
}
