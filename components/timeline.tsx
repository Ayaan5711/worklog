"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { TYPE_COLORS, TYPE_ICONS } from "@/lib/constants";
import type { Log, LogType } from "@/lib/types";

function fmtDate(ds: string) {
  const d = new Date(ds + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const target = new Date(d); target.setHours(0,0,0,0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(logs: Log[]): { date: string; label: string; logs: Log[] }[] {
  const map = new Map<string, Log[]>();
  for (const log of logs) {
    if (!map.has(log.date)) map.set(log.date, []);
    map.get(log.date)!.push(log);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, logs]) => ({ date, label: fmtDate(date), logs }));
}

export default function TimelinePage() {
  const { logs, setLogs, setLoading, loading, updateLog, removeLog, filters, setFilter, resetFilters, filteredLogs, allProjects, allTypes } = useLogStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDateFilters, setShowDateFilters] = useState(false);

  const load = (force = false) => {
    if (logs.length > 0 && !force) return;
    setLoading(true);
    api.logs.list().then(setLogs).catch(() => toast.error("Failed to load logs")).finally(() => setLoading(false));
  };

  const refresh = () => {
    setLoading(true);
    api.logs.list().then(setLogs).catch(() => toast.error("Failed to load logs")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.logs.delete(id);
      removeLog(id);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (log: Log) => {
    try {
      const updated = await api.logs.update(log.id, { raw_input: editText });
      updateLog(log.id, updated);
      setEditingId(null);
      toast.success("Updated");
    } catch { toast.error("Failed to update"); }
  };

  const displayed = filteredLogs();
  const grouped = groupByDate(displayed);
  const projects = allProjects();
  const types = allTypes();
  const hasFilters = filters.project || filters.type || filters.search || filters.from || filters.to;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Timeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8690a5]">{displayed.length} entries</span>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg text-[#556] hover:text-[#8690a5] hover:bg-white/5 transition-all disabled:opacity-40" title="Refresh">
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
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
          <button onClick={() => setShowDateFilters(o => !o)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${showDateFilters || filters.from || filters.to ? "border-[#6c9fff]/30 text-[#6c9fff] bg-[#6c9fff]/08" : "border-[#2a3040] text-[#556] hover:text-[#8690a5]"}`}>
            📅 Date
          </button>
          {hasFilters && (
            <button onClick={resetFilters} className="px-2.5 py-1.5 rounded-lg border border-[#2a3040] text-[#556] text-xs hover:text-[#8690a5] transition-colors">
              Clear
            </button>
          )}
        </div>

        {showDateFilters && (
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-[10px] text-[#8690a5] mb-1">From</label>
              <input type="date" value={filters.from} onChange={e => setFilter("from", e.target.value)}
                className="w-full bg-[#141820] border border-[#2a3040] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-[#8690a5] mb-1">To</label>
              <input type="date" value={filters.to} onChange={e => setFilter("to", e.target.value)}
                className="w-full bg-[#141820] border border-[#2a3040] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-[#141820] rounded-xl animate-pulse" />)}</div>
      )}

      {/* Empty state — no logs at all */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-base font-semibold mb-1">No logs yet</h3>
          <p className="text-sm text-[#8690a5] mb-4">Start tracking your work — it only takes 30 seconds.</p>
          <a href="/log" className="px-5 py-2 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] hover:opacity-90 transition-opacity">
            Add your first entry
          </a>
        </div>
      )}

      {/* No results from filter */}
      {!loading && logs.length > 0 && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm text-[#8690a5]">No entries match your filters.</p>
          <button onClick={resetFilters} className="mt-3 text-xs text-[#6c9fff] hover:underline">Clear filters</button>
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-8">
        {grouped.map(({ date, label, logs: dayLogs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-[#8690a5] uppercase tracking-wider">{label}</span>
              <div className="flex-1 h-px bg-[#2a3040]" />
              <span className="text-[10px] font-mono text-[#556]">{dayLogs.length}</span>
            </div>
            <div className="space-y-2.5">
              {dayLogs.map(log => (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full mt-[18px] flex-shrink-0" style={{ background: TYPE_COLORS[log.type as LogType] || "#8690a5" }} />
                  <div className="group flex-1 bg-[#141820] border border-[#2a3040] rounded-xl px-5 py-4">
                    {editingId === log.id ? (
                      <div>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                          className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none" />
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleSaveEdit(log)} className="px-3 py-1.5 bg-[#6c9fff] text-[#0c0f14] rounded-lg text-xs font-semibold">Save with AI</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-[#2a3040] text-[#8690a5] rounded-lg text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : confirmDeleteId === log.id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#8690a5]">Delete this entry?</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(log.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 border border-[#2a3040] text-[#8690a5] rounded-lg text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#6c9fff]/08 text-[#6c9fff] font-semibold">{log.project}</span>
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: `${TYPE_COLORS[log.type as LogType] || "#8690a5"}14`, color: TYPE_COLORS[log.type as LogType] || "#8690a5" }}>
                              {TYPE_ICONS[log.type as LogType] || "📝"} {log.type}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => { setEditingId(log.id); setEditText(log.raw_input); }} className="text-xs px-2 py-1 text-[#556] hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Edit">✏️</button>
                            <button onClick={() => setConfirmDeleteId(log.id)} className="text-xs px-2 py-1 text-[#556] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">🗑️</button>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-[#cdd5e0]">{log.summary}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
