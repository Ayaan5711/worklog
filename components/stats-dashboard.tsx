"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { TYPE_COLORS, TYPE_ICONS } from "@/lib/constants";
import type { LogType } from "@/lib/types";

export default function StatsDashboard() {
  const { logs, setLogs, promptStyle } = useLogStore();
  const [weeklySummary, setWeeklySummary] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  useEffect(() => {
    if (logs.length === 0) api.logs.list().then(setLogs).catch(() => {});
  }, []);

  const typeCounts: Record<string, number> = {};
  const projectCounts: Record<string, number> = {};
  logs.forEach(l => {
    typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    projectCounts[l.project] = (projectCounts[l.project] || 0) + 1;
  });

  const maxProject = Math.max(...Object.values(projectCounts), 1);

  const generateWeekly = async () => {
    setWeeklyLoading(true); setWeeklySummary("");
    try {
      const result = await api.ai.weekly({ style: promptStyle });
      setWeeklySummary(result.summary);
    } catch { toast.error("Failed to generate summary"); }
    setWeeklyLoading(false);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Stats</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { v: logs.length, l: "Entries", c: "#6c9fff" },
          { v: typeCounts.feature || 0, l: "Features", c: "#5ce0a0" },
          { v: typeCounts.refactor || 0, l: "Refactors", c: "#b48cff" },
          { v: Object.keys(projectCounts).length, l: "Projects", c: "#f0b860" },
        ].map(({ v, l, c }) => (
          <div key={l} className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: c }}>{v}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8690a5] mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Weekly summary */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-sm font-semibold">Weekly Summary</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#6c9fff]/10 text-[#6c9fff] font-semibold">AI</span>
        </div>
        <p className="text-xs text-[#8690a5]">Manager-ready summary of your past 7 days.</p>
        <button onClick={generateWeekly} disabled={weeklyLoading}
          className="w-full py-2.5 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
          {weeklyLoading ? "Claude is writing..." : "Generate Weekly Summary"}
        </button>
        {weeklyLoading && (
          <div className="space-y-1.5">{[1,2,3].map(i => <div key={i} className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${60 + i * 12}%` }} />)}</div>
        )}
        {weeklySummary && !weeklyLoading && (
          <div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{weeklySummary}</p>
            <button onClick={() => { navigator.clipboard?.writeText(weeklySummary); toast.success("Copied"); }}
              className="mt-2 px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
              📋 Copy
            </button>
          </div>
        )}
      </div>

      {/* By project */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">By project</h3>
        <div className="space-y-2.5">
          {Object.entries(projectCounts).sort((a, b) => b[1] - a[1]).map(([proj, count]) => (
            <div key={proj} className="flex items-center gap-3">
              <span className="text-[11px] text-[#8690a5] w-24 text-right flex-shrink-0 truncate">{proj}</span>
              <div className="flex-1 h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] rounded-full transition-all" style={{ width: `${(count / maxProject) * 100}%` }} />
              </div>
              <span className="text-xs font-mono font-semibold text-[#6c9fff] w-5">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By type */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">By type</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <div key={type} className="bg-[#0c0f14] rounded-xl p-3 flex flex-col items-center gap-1">
              <span className="text-base">{TYPE_ICONS[type as LogType] || "📝"}</span>
              <span className="text-lg font-bold font-mono" style={{ color: TYPE_COLORS[type as LogType] }}>{count}</span>
              <span className="text-[9px] text-[#8690a5] capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
