"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Bot, Send, Plus, MessageSquare, Loader2, Sparkles, Trash2, ArrowLeft, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendAIMessage } from "@/lib/ai/agent";
import type { AIMessage } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";

function AIAssistantContent() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<{ id: string; title: string; messages: AIMessage[] }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, loading]);

  useEffect(() => {
    if (!user) return;
    
    async function loadConversations() {
      const { data: convs } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (convs && convs.length > 0) {
        // Load messages for the most recent conversation by default
        const firstId = convs[0].id;
        const { data: msgs } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', firstId)
          .order('created_at', { ascending: true });

        const mappedConvs = [...convs].map(c => ({
          ...c,
          messages: c.id === firstId && msgs ? msgs : []
        }));
        setConversations(mappedConvs);
        setActiveConvId(firstId);
      } else {
        // Buat percakapan dummy sementara jika kosong
        const tempId = "temp-" + Date.now().toString();
        setConversations([{ id: tempId, title: "Percakapan Baru", messages: [] }]);
        setActiveConvId(tempId);
      }
      setInitialLoad(false);
    }
    loadConversations();
  }, [user, supabase]);

  // Handle pindah percakapan
  const handleSelectConv = async (id: string) => {
    setActiveConvId(id);
    const conv = conversations.find(c => c.id === id);
    if (conv && conv.messages.length === 0 && !id.startsWith("temp-")) {
      const { data: msgs } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
        
      if (msgs) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: msgs } : c));
      }
    }
  };

  const exportCatatan = (content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Catatan_AI_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const newConversation = () => {
    const id = "temp-" + Date.now().toString();
    setConversations((prev) => [{ id, title: "Percakapan Baru", messages: [] }, ...prev]);
    setActiveConvId(id);
    return id;
  };

  const handleSend = async (forcedInitialMessage?: string, forcedConvId?: string, fileUrlParam?: string) => {
    const msgText = forcedInitialMessage || input.trim();
    let currentConvId = forcedConvId || activeConvId;
    
    if (!msgText || loading || !user || !currentConvId) return;
    
    setInput("");
    setLoading(true);

    // Optimistically show user message IMMEDIATELY (before DB save)
    const optimisticUserMsg: AIMessage = { id: "opt-" + Date.now(), role: "user", content: msgText, conversation_id: currentConvId, created_at: new Date().toISOString() };
    setConversations(prev => prev.map(c => 
      c.id === currentConvId ? { ...c, messages: [...c.messages, optimisticUserMsg] } : c
    ));

    let isNewConv = false;
    let convTitle = "Percakapan Baru";

    // Jika ini adalah temp ID (baru), kita buat rec di Supabase dulu
    if (currentConvId.startsWith("temp-")) {
      isNewConv = true;
      convTitle = msgText.slice(0, 40) + "...";
      const { data: newDbConv } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        title: convTitle
      }).select().single();

      if (newDbConv) {
        const oldId = currentConvId;
        currentConvId = newDbConv.id;
        setActiveConvId(newDbConv.id);
        setConversations(prev => prev.map(c => 
          c.id === oldId ? { ...c, id: newDbConv.id, title: convTitle, messages: c.messages.map(m => ({ ...m, conversation_id: newDbConv.id })) } : c
        ));
      }
    }

    // Save user message to DB in background
    const userMsg = { role: "user", content: msgText, conversation_id: currentConvId };
    supabase.from('ai_messages').insert(userMsg).select().single();

    try {
      const activeMessages = conversations.find(c => c.id === currentConvId)?.messages || [];
      const responseText = await sendAIMessage(activeMessages, msgText, fileUrlParam);
      
      const assistantMsg = { role: "assistant", content: responseText, conversation_id: currentConvId };
      const { data: savedAssistantMsg } = await supabase.from('ai_messages').insert(assistantMsg).select().single();

      if (savedAssistantMsg) {
        setConversations(prev => prev.map(c => 
          c.id === currentConvId ? { ...c, messages: [...c.messages, savedAssistantMsg] } : c
        ));
      }
    } catch {
      const errorMsg = { role: "assistant", content: "Maaf, terjadi kesalahan layanan. Coba lagi ya! 🙏", conversation_id: currentConvId };
      const { data: savedErrorMsg } = await supabase.from('ai_messages').insert(errorMsg).select().single();
      if (savedErrorMsg) {
        setConversations(prev => prev.map(c => 
          c.id === currentConvId ? { ...c, messages: [...c.messages, savedErrorMsg] } : c
        ));
      }
    }
    
    setLoading(false);
    setAttachedFile(null); // Clear attachment state after process is complete
  };

  // Tangkap Auto-Prompt dari URL
  useEffect(() => {
    const promptQuery = searchParams.get('prompt');
    const fileUrlObj = searchParams.get('fileUrl');
    const fileNameObj = searchParams.get('fileName');

    if (promptQuery && !initialLoad && user) {
       if (fileNameObj) setAttachedFile(fileNameObj);
       const newId = newConversation();
       setTimeout(() => {
         handleSend(promptQuery, newId, fileUrlObj || undefined);
         // Cleanup URL param so it doesn't loop
         router.replace("/ai-assistant");
       }, 100);
    }
  }, [searchParams, initialLoad, user, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoad) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border border-border/50 rounded-2xl p-3">
        <button onClick={newConversation} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all mb-3 w-full justify-center">
          <Plus className="w-4 h-4" /> Percakapan Baru
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConv(conv.id)}
              className={`w-full text-left p-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                conv.id === activeConvId ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{conv.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">LoginPTN AI Assistant</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" /> Online — Siap membantu
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConv?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Halo! Ada yang bisa kubantu? 👋</h2>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">Aku bisa menjelaskan materi UTBK, merangkum file PDF dari Study Drive, atau memberikan tips belajar jitu.</p>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 max-w-lg">
                {["Jelaskan Penalaran Umum", "Buatku jadwal belajar 2 minggu", "Gimana cara baca grafik UTBK?", "Berikan 1 contoh soal Literasi"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                    className="text-xs bg-secondary/80 hover:bg-secondary text-secondary-foreground p-3 rounded-xl transition-all text-left border border-border font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConv?.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="flex flex-col gap-1 items-start max-w-[85%]">
                <div className={`px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm self-end whitespace-pre-wrap" : "bg-secondary text-foreground rounded-2xl rounded-tl-sm self-start prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2 prose-li:my-0.5 prose-blockquote:my-2"
                }`}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "assistant" && (
                  <button 
                    onClick={() => exportCatatan(msg.content)}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors ml-2 mt-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Simpan Catatan
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground rounded-2xl rounded-tl-sm px-5 py-3 flex flex-col gap-2 min-w-[200px]">
                {attachedFile && (
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/20 w-max">
                    <Sparkles className="w-3 h-3" /> Membaca {attachedFile}...
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground font-medium">
                    {attachedFile ? "Mengekstrak teks PDF & menyusun jawaban..." : "Bentar ya, Kak AI mikir dulu..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apa saja, atau mintai aku merangkum PDF..."
              className="flex-1 bg-secondary/80 border border-border rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[48px] max-h-32"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
      <AIAssistantContent />
    </Suspense>
  );
}
