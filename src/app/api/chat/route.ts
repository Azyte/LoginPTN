import { NextResponse } from "next/server";
// Gunakan require untuk modul CommonJS lawas agar tidak crash di Turbopack
const pdfParse = require("pdf-parse");

export async function POST(request: Request) {
  try {
    const { messages, userMessage, fileUrl } = await request.json();

    const agentUrl = process.env.NEXT_PUBLIC_AI_AGENT_URL;
    const apiKey = process.env.AI_AGENT_API_KEY;

    if (!agentUrl || !apiKey) {
      return NextResponse.json({ error: "AI URL atau API Key belum dikonfigurasi di server." }, { status: 500 });
    }

    let extractedText = "";
    if (fileUrl) {
      try {
        const fileResponse = await fetch(fileUrl);
        if (fileResponse.ok) {
          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfData = await pdfParse(buffer);
          // Limit to roughly 15000 characters to prevent overflowing Groq Llama-3 context limit safely
          extractedText = pdfData.text.slice(0, 15000);
        }
      } catch (err) {
        console.error("Failed to parse PDF:", err);
      }
    }

    const systemContent = `Kamu adalah **LoginPTN AI Assistant**, mentor dan asisten belajar cerdas eksklusif untuk persiapan UTBK SNBT Indonesia.
Tugas utamamu adalah:
1. Menjadi tutor yang super ramah, suportif, dan memotivasi para pejuang PTN. Gunakan bahasa Indonesia kasual yang cerdas (boleh pakai sapaan 'Kak' atau 'Aku').
2. **Ahli Merangkum**: Jika ditanya atau diberikan konteks dokumen/pdf, berikan ringkasan yang komprehensif, terstruktur dengan list/bullet points, tebalkan kata-kata kunci (bold), dan to the point.
3. **Ahli Membuat Soal**: Jika diminta membuat soal (dari materi, pdf, atau acak), buatlah soal standar UTBK SNBT tipe terbaru (Penalaran Umum, Pengetahuan Kuantitatif, Literasi). Format soal dengan jelas: Pertanyaan, Pilihan Ganda (A-E), Kunci Jawaban dengan indikator emoji (✅), dan Pembahasan detail.
4. **Strategi Belajar**: Jika ditanya, sarankan strategi seperti Pomodoro, Active Recall, dan Spaced Repetition dengan cara yang praktis.
5. Gunakan formatting Markdown kaya fitur: Heading (##), List (-), Blockquote (>), dan tabel bila data perlu dibandingkan. Selalu akhiri pesan dengan kalimat penyemangat! 🔥
${extractedText ? `\n\n**REFERENSI DOKUMEN PDF (Maksimal ekstrak awal)**:\n"""\n${extractedText}\n"""\nGunakan referensi di atas dengan teliti untuk menjawab permintaan user.` : ""}`

    const payload = {
      model: "llama-3.3-70b-versatile", // Sesuai dengan Groq Llama-3
      messages: [
        {
          role: "system",
          content: systemContent
        },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ],
    };

    const response = await fetch(agentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Groq/AI Error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal API /chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
