"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, Upload, Sparkles, BookOpen, Brain, HelpCircle, ListChecks, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PDFWorkspacePage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [files, setFiles] = useState<{ id: string; name: string; size: string; uploadedAt: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function loadWorkspaceFiles() {
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberGroups || memberGroups.length === 0) {
        setLoading(false);
        return;
      }
      const groupIds = memberGroups.map((mg) => mg.group_id);

      const { data: fileMessages } = await supabase
        .from("group_messages")
        .select("*")
        .in("group_id", groupIds)
        .eq("type", "file")
        .order("created_at", { ascending: false });

      if (fileMessages) {
         setFiles(fileMessages.map(f => ({
            id: f.id,
            name: f.file_name || "Unknown File",
            size: f.file_size ? (f.file_size / 1024).toFixed(1) + " KB" : "Unknown",
            uploadedAt: new Date(f.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })
         })));
      }
      setLoading(false);
    }
    loadWorkspaceFiles();
  }, [user, supabase]);

  const fireAIPrompt = (promptTemplate: string) => {
    if (!selectedFile) return;
    const finalPrompt = promptTemplate.replace("{{FILE}}", selectedFile.name);
    // Masukkan ke URL agar ditangkap oleh Halaman AI Assistant
    router.push(`/ai-assistant?prompt=${encodeURIComponent(finalPrompt)}`);
  };

  const aiActions = [
    { label: "Ringkasan", icon: BookOpen, description: "Buat ringkasan otomatis dari PDF", prompt: "Tolong buatkan ringkasan materi komprehensif berdasarkan dokumen '{{FILE}}' yang ada di Study Drive kita." },
    { label: "Poin Kunci", icon: ListChecks, description: "Ekstrak poin-poin penting", prompt: "Bantu aku mengekstrak 5 poin kunci terpenting dari file '{{FILE}}' agar mudah dihafal saat UTBK." },
    { label: "Buat Quiz", icon: Brain, description: "Generate quiz dari materi PDF", prompt: "Berperanlah sebagai penguji UTBK. Buatkan 3 pilihan ganda menjebak berdasarkan topik dokumen '{{FILE}}'." },
    { label: "Flashcards", icon: CreditCard, description: "Buat flashcards untuk review", prompt: "Buatkan tabel Flashcards (Istilah & Definisi) untuk bahan hafalan cepat dari dokumen '{{FILE}}'." },
    { label: "Tanya AI", icon: HelpCircle, description: "Tanyakan apa saja tentang PDF ini", prompt: "Aku sedang membaca dokumen '{{FILE}}'. Bisakah kamu bantu jelaskan kembali apa inti utama yang diajarkan di dalamnya?" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          PDF Workspace
        </h1>
        <p className="text-muted-foreground mt-1">Gunakan kecerdasan AI untuk mengupas tuntas file materi belajarmu.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* File List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">Pilih File Target</h2>
          {loading ? (
             <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : files.length === 0 ? (
             <p className="text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-2xl p-6 text-center">Belum ada file di Study Drive Anda. Minta anggota grup untuk mengunggah materi!</p>
          ) : (
             files.map((file) => (
               <button
                 key={file.id}
                 onClick={() => setSelectedFile({ id: file.id, name: file.name })}
                 className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                   selectedFile?.id === file.id ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 bg-card hover:bg-secondary/50"
                 }`}
               >
                 <FileText className={`w-8 h-8 shrink-0 transition-colors ${selectedFile?.id === file.id ? "text-primary" : "text-muted-foreground"}`} />
                 <div className="flex-1 min-w-0">
                   <div className="font-bold text-sm truncate">{file.name}</div>
                   <div className="text-xs text-muted-foreground">{file.size} • Diunggah {file.uploadedAt}</div>
                 </div>
               </button>
             ))
          )}
        </div>

        {/* AI Actions */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 sticky top-6 self-start shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" /> AI Tools
          </h3>
          {!selectedFile ? (
            <div className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-dashed border-border text-center">
              Pilih salah satu file di samping kiri untuk mengaktifkan fungsi AI.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-primary mb-3 truncate px-1">
                Target: {selectedFile.name}
              </div>
              {aiActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button 
                    key={action.label} 
                    onClick={() => fireAIPrompt(action.prompt)}
                    className="w-full text-left p-3.5 rounded-xl border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center gap-3 group"
                  >
                    <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground shrink-0 transition-colors" />
                    <div>
                      <div className="text-sm font-bold">{action.label}</div>
                      <div className="text-xs opacity-70 leading-tight">{action.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
