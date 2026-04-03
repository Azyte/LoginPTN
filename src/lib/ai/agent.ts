import type { AIMessage } from "@/lib/types";

export async function sendAIMessage(
  messages: AIMessage[],
  userMessage: string,
  fileUrl?: string | null
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, userMessage, fileUrl }),
    });

    if (!response.ok) {
      console.warn("Backend API Chat gagal. Respons API tidak OK.");
      return "Maaf, sistem AI sedang mengalami gangguan. Mohon coba beberapa saat lagi.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Maaf, AI tidak dapat menangkap respon. Coba ulangi pertanyaanmu.";
  } catch (error) {
    console.error("Gagal terhubung ke /api/chat:", error);
    return "Terjadi kesalahan jaringan saat menghubungi AI. Periksa koneksimu atau coba lagi nanti.";
  }
}
