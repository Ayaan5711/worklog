"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { TYPE_COLORS, TYPE_ICONS } from "@/lib/constants";
import type { LogType } from "@/lib/types";

function calcStreak(logs: { date: string }[]): number {
  if (!logs.length) return 0;
  const dates = new Set(logs.map(l => l.date));
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (!dates.has(fmt(d))) { d.setDate(d.getDate() - 1); }
  while (dates.has(fmt(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function ActivityHeatmap({ logs }: { logs: { date: string }[] }) {
  const counts: Record<string, number> = {};
  logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; });

  const weeks: { date: string; count: number }[][] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 7 * 15 + 1);
  // align to Monday
  while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

  let week: { date: string; count: number }[] = [];
  const cur = new Date(start);
  while (cur <= today) {
    const ds = cur.toISOString().slice(0, 10);
    week.push({ date: ds, count: counts[ds] || 0 });
    if (week.length === 7) { weeks.push(week); week = []; }
    cur.setDate(cur.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const max = Math.max(...Object.values(counts), 1);
  const color = (count: number) => {
    if (!count) return "#1a2030";
    const intensity = Math.min(count / max, 1);
    if (intensity < 0.33) return "#6c9fff33";
    if (intensity < 0.66) return "#6c9fff88";
    return "#6c9fff";
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Activity</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, count }) => (
              <div key={date} title={`${date}: ${count} log${count !== 1 ? "s" : ""}`}
                className="w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-sm cursor-default transition-colors flex-shrink-0"
                style={{ background: color(count) }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-[#556]">Less</span>
        {["#1a2030","#6c9fff33","#6c9fff88","#6c9fff"].map(c => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-[#556]">More</span>
      </div>
    </div>
  );
}

export default function StatsDashboard() {
  const { logs, setLogs, promptStyle } = useLogStore();
  const [weeklySummary, setWeeklySummary] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(logs.length === 0);

  useEffect(() => {
    if (logs.length === 0) {
      api.logs.list().then(setLogs).catch(() => {}).finally(() => setInitialLoading(false));
    }
  }, []);

  const typeCounts: Record<string, number> = {};
  const projectCounts: Record<string, number> = {};
  logs.forEach(l => {
    typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    projectCounts[l.project] = (projectCounts[l.project] || 0) + 1;
  });

  const maxProject = Math.max(...Object.values(projectCounts), 1);
  const streak = calcStreak(logs);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const thisWeek = logs.filter(l => l.date >= weekAgo).length;
  const activeDays = new Set(logs.map(l => l.date)).size;

  const generateWeekly = async () => {
    setWeeklyLoading(true); setWeeklySummary("");
    try {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const result = await api.ai.weekly({ from, to, style: promptStyle });
      setWeeklySummary(result.summary);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to generate summary"); }
    setWeeklyLoading(false);
  };

  if (initialLoading) return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#141820] rounded-xl animate-pulse" />)}
      </div>
      <div className="h-24 bg-[#141820] rounded-xl animate-pulse" />
      <div className="h-32 bg-[#141820] rounded-xl animate-pulse" />
    </div>
  );

  if (logs.length === 0) return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Stats</h2>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-base font-semibold mb-1">No data yet</h3>
        <p className="text-sm text-[#8690a5] mb-4">Log a few days of work to see your stats.</p>
        <a href="/log" className="px-5 py-2 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] hover:opacity-90 transition-opacity">
          Add your first entry
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Stats</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { v: logs.length, l: "Total Logs", c: "#6c9fff" },
          { v: thisWeek, l: "This Week", c: "#5ce0a0" },
          { v: activeDays, l: "Active Days", c: "#b48cff" },
          { v: Object.keys(projectCounts).length, l: "Projects", c: "#f0b860" },
        ].map(({ v, l, c }) => (
          <div key={l} className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 text-center">
            <div className="text-3xl font-bold font-mono" style={{ color: c }}>{v}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#8690a5] mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 flex items-center gap-4">
        <div className="text-3xl">{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "📅"}</div>
        <div>
          <div className="text-2xl font-bold font-mono text-[#f0b860]">{streak} <span className="text-base font-semibold">day{streak !== 1 ? "s" : ""}</span></div>
          <div className="text-xs text-[#8690a5]">{streak === 0 ? "Log today to start your streak" : streak === 1 ? "Current streak — keep it up!" : `Current streak — ${streak >= 7 ? "on fire! 🔥" : "great work!"}`}</div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
        <ActivityHeatmap logs={logs} />
      </div>

      {/* Weekly summary */}
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-sm font-semibold">Weekly Summary</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#6c9fff]/10 text-[#6c9fff] font-semibold">AI</span>
        </div>
        <p className="text-xs text-[#8690a5]">Manager-ready summary of your past 7 days.</p>
        <button onClick={generateWeekly} disabled={weeklyLoading}
          className="w-full py-2.5 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
          {weeklyLoading ? "AI is writing..." : "Generate Weekly Summary"}
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
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">By project</h3>
        <div className="space-y-3">
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
      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
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
