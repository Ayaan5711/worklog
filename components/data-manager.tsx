"use client";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { Log } from "@/lib/types";

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function DataManager() {
  const { logs, setLogs, setLoading } = useLogStore();
  const [importMsg, setImportMsg] = useState("");
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDeleteAll = async () => {
    setClearing(true);
    try {
      await api.logs.deleteAll();
      setLogs([]);
      setConfirmClear(false);
      toast.success("All data deleted");
    } catch { toast.error("Failed to delete"); }
    setClearing(false);
  };

  useEffect(() => {
    if (logs.length > 0) return;
    setLoading(true);
    api.logs.list().then(setLogs).catch(() => toast.error("Failed to load logs")).finally(() => setLoading(false));
  }, []);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `worklog_backup_${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = "Date,Project,Type,Summary,Raw Input\n";
    const rows = logs.map(l =>
      `"${l.date}","${l.project}","${l.type}","${l.summary.replace(/"/g, '""')}","${l.raw_input.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `worklog_${todayStr()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as (Partial<Log> & { project_override?: string; type_override?: string })[];
        if (!Array.isArray(raw)) throw new Error("Not an array");
        const toImport = raw.filter(entry =>
          entry.raw_input && entry.date && !logs.some(l => l.date === entry.date && l.raw_input === entry.raw_input)
        );
        setImportProgress({ current: 0, total: toImport.length });
        let added = 0;
        const BATCH = 5;
        for (let i = 0; i < toImport.length; i += BATCH) {
          const slice = toImport.slice(i, i + BATCH);
          await Promise.all(slice.map(entry => api.logs.create({
            raw_input: entry.raw_input!,
            date: entry.date!,
            project_override: entry.project_override,
            type_override: entry.type_override as Log["type"],
          })));
          added += slice.length;
          setImportProgress({ current: Math.min(i + BATCH, toImport.length), total: toImport.length });
        }
        const fresh = await api.logs.list();
        setLogs(fresh);
        setImportProgress(null);
        setImportMsg(`Imported ${added} entries`);
        toast.success(`Imported ${added} entries`);
      } catch { setImportProgress(null); setImportMsg("Invalid file format"); toast.error("Import failed"); }
      setTimeout(() => setImportMsg(""), 4000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Data</h2>

      {/* Export */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span>💾</span><span className="text-sm font-semibold">Export</span>
        </div>
        <p className="text-xs text-[#8690a5] mb-3">Download a backup of all your logs.</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportJSON} className="px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
            Download JSON
          </button>
          <button onClick={exportCSV} className="px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
            Download CSV
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span>📂</span><span className="text-sm font-semibold">Import</span>
        </div>
        <p className="text-xs text-[#8690a5] mb-3">Restore from a JSON backup. Duplicates are skipped.</p>
        <label className={`px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold cursor-pointer hover:bg-[#6c9fff]/15 transition-colors inline-block ${importProgress ? "opacity-50 pointer-events-none" : ""}`}>
          {importProgress ? `Importing ${importProgress.current}/${importProgress.total}...` : "Choose JSON file"}
          <input ref={fileRef} type="file" accept=".json" onChange={importJSON} className="hidden" disabled={!!importProgress} />
        </label>
        {importProgress && (
          <div className="mt-2 bg-[#0c0f14] rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] transition-all duration-300"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} />
          </div>
        )}
        {importMsg && <p className="mt-2 text-xs font-semibold text-[#5ce0a0]">{importMsg}</p>}
      </div>

      {/* Danger zone */}
      <div className="bg-[#141820] border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span>⚠️</span><span className="text-sm font-semibold text-red-400">Danger Zone</span>
        </div>
        <p className="text-xs text-[#8690a5] mb-3">Permanently delete all your logs. This cannot be undone.</p>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)} disabled={logs.length === 0}
            className="px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-40">
            Delete all data ({logs.length} entries)
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8690a5]">Are you sure? This is permanent.</span>
            <button onClick={handleDeleteAll} disabled={clearing}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50">
              {clearing ? "Deleting..." : "Yes, delete all"}
            </button>
            <button onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 border border-[#2a3040] text-[#8690a5] rounded-lg text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-[#141820] border border-[#6c9fff]/15 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span>💡</span><span className="text-sm font-semibold">Tips for daily use</span>
        </div>
        <ol className="space-y-2 text-xs text-[#8690a5] leading-relaxed">
          <li><strong className="text-white">1. End of day</strong> — go to New Log, type what you did. AI polishes it.</li>
          <li><strong className="text-white">2. Before standup</strong> — Standup tab → generate → paste into Teams/Slack.</li>
          <li><strong className="text-white">3. Before 1:1</strong> — Brag Sheet → generate → share with manager.</li>
          <li><strong className="text-white">4. Weekly</strong> — Stats → weekly summary → send in email.</li>
          <li><strong className="text-white">5. Monthly</strong> — export a JSON backup. Keep it safe.</li>
        </ol>
      </div>
    </div>
  );
}
