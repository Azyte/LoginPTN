"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { HardDrive, FileText, FolderOpen, Download, Search, Loader2 } from "lucide-react";

export default function StudyDrivePage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [groupedFiles, setGroupedFiles] = useState<{ group: string; files: any[] }[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadFiles() {
      // 1. Dapatkan semua grup di mana user adalah member
      if (!user) return;
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberGroups || memberGroups.length === 0) {
        setLoading(false);
        return;
      }

      const groupIds = memberGroups.map((mg) => mg.group_id);

      // 2. Tarik semua pesan bertipe 'file' dari grup-grup tersebut
      const { data: fileMessages } = await supabase
        .from("group_messages")
        .select("*, study_groups(name)")
        .in("group_id", groupIds)
        .eq("type", "file")
        .order("created_at", { ascending: false });

      if (fileMessages) {
        // Kelompokkan file berdasarkan nama grup
        const groupsMap: Record<string, any[]> = {};
        fileMessages.forEach((msg) => {
          const groupName = msg.study_groups?.name || "Grup Tidak Diketahui";
          if (!groupsMap[groupName]) {
            groupsMap[groupName] = [];
          }
          groupsMap[groupName].push(msg);
        });

        const formatted = Object.keys(groupsMap).map((groupName) => ({
          group: groupName,
          files: groupsMap[groupName],
        }));

        setGroupedFiles(formatted);
      }

      setLoading(false);
    }

    loadFiles();
  }, [user, supabase]);

  // Handle local searching
  const filteredData = groupedFiles.map((group) => ({
    ...group,
    files: group.files.filter((f) =>
      f.file_name?.toLowerCase().includes(search.toLowerCase())
    )
  })).filter((group) => group.files.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <HardDrive className="w-7 h-7 text-primary" />
          Study Drive
        </h1>
        <p className="text-muted-foreground mt-1">
          Semua file dan materi dari jalur obrolan grup belajarmu terkumpul di sini.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama file..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/50 rounded-2xl">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-20" />
          <p className="text-muted-foreground">Belum ada file materi yang dibagikan di grup panutemu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((group) => (
            <div key={group.group} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-primary" />
                {group.group}
              </h2>
              <div className="space-y-2">
                {group.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/80 border border-transparent hover:border-border transition-all group"
                  >
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate pr-4" title={file.file_name}>
                        {file.file_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {file.file_size ? (file.file_size / 1024).toFixed(1) + " KB" : "Unknown"} •{" "}
                        {new Date(file.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:text-primary transition-colors pr-2">
                       <Download className="w-5 h-5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
