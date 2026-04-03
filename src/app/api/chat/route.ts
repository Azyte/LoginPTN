import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages, userMessage } = await request.json();

    const agentUrl = process.env.NEXT_PUBLIC_AI_AGENT_URL;
    const apiKey = process.env.AI_AGENT_API_KEY;

    if (!agentUrl || !apiKey) {
      return NextResponse.json({ error: "AI URL atau API Key belum dikonfigurasi di server." }, { status: 500 });
    }

    const payload = {
      model: "llama-3.3-70b-versatile", // Sesuai dengan Groq Llama-3
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah LoginPTN AI Assistant, asisten belajar cerdas untuk persiapan UTBK SNBT Indonesia. Jawab dalam Bahasa Indonesia yang ramah, supportif, dan mudah dipahami. Gunakan emoji dan formatting markdown.",
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
