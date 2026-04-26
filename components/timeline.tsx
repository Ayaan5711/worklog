"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { TYPE_COLORS, TYPE_ICONS } from "@/lib/constants";
import type { Log, LogType } from "@/lib/types";

function fmtDate(ds: string) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function TimelinePage() {
  const { logs, setLogs, setLoading, loading, updateLog, removeLog, filters, setFilter, filteredLogs, allProjects, allTypes } = useLogStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (logs.length > 0) return;
    setLoading(true);
    api.logs.list().then(setLogs).catch(() => toast.error("Failed to load logs")).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.logs.delete(id);
      removeLog(id);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleSaveEdit = async (log: Log) => {
    try {
      const updated = await api.logs.update(log.id, { raw_input: editText });
      updateLog(log.id, updated);
      setEditingId(null);
      toast.success("Updated with AI");
    } catch { toast.error("Failed to update"); }
  };

  const displayed = filteredLogs();
  const projects = allProjects();
  const types = allTypes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <span className="text-xs font-mono text-[#8690a5]">{displayed.length} entries</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filters.project} onChange={e => setFilter("project", e.target.value)}
          className="bg-[#141820] border border-[#2a3040] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.type} onChange={e => setFilter("type", e.target.value)}
          className="bg-[#141820] border border-[#2a3040] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
        <input value={filters.search} onChange={e => setFilter("search", e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-24 bg-[#141820] border border-[#2a3040] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#556] focus:outline-none" />
      </div>

      {/* List */}
      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-[#141820] rounded-xl animate-pulse" />)}</div>}

      <div className="space-y-2">
        {displayed.map(log => (
          <div key={log.id} className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full mt-4 flex-shrink-0" style={{ background: TYPE_COLORS[log.type as LogType] || "#8690a5" }} />
            <div className="flex-1 bg-[#141820] border border-[#2a3040] rounded-xl px-4 py-3">
              {editingId === log.id ? (
                <div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                    className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleSaveEdit(log)} className="px-3 py-1 bg-[#6c9fff] text-[#0c0f14] rounded text-xs font-semibold">Save with AI</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 border border-[#2a3040] text-[#8690a5] rounded text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-[#8690a5]">{fmtDate(log.date)}</span>
                    <div className="flex gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(log.id); setEditText(log.raw_input); }} className="text-xs px-1.5 py-0.5 hover:bg-white/5 rounded" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(log.id)} className="text-xs px-1.5 py-0.5 hover:bg-white/5 rounded" title="Delete">🗑️</button>
                    </div>
                  </div>
                  <p className="text-sm leading-snug mb-2">{log.summary}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6c9fff]/08 text-[#6c9fff] font-semibold">{log.project}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${TYPE_COLORS[log.type as LogType] || "#8690a5"}14`, color: TYPE_COLORS[log.type as LogType] || "#8690a5" }}>
                      {TYPE_ICONS[log.type as LogType] || "📝"} {log.type}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && displayed.length === 0 && (
          <p className="text-center text-[#8690a5] text-sm py-12">No logs yet — add your first entry.</p>
        )}
      </div>
    </div>
  );
}
