"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function fmtDate(ds: string) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function StandupGenerator() {
  const { logs, promptStyle } = useLogStore();
  const [date, setDate] = useState(todayStr());
  const [update, setUpdate] = useState("");
  const [loading, setLoading] = useState(false);

  const recentDates = [...new Set(logs.map(l => l.date))].sort().reverse().slice(0, 8);

  const generate = async (d?: string) => {
    const target = d || date;
    setLoading(true); setUpdate("");
    try {
      const result = await api.ai.standup(target, promptStyle);
      setUpdate(result.update);
      if (d) setDate(d);
    } catch { toast.error("Failed to generate standup"); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Daily Standup</h2>
        <p className="text-sm text-[#8690a5] mt-0.5">Ready to paste into Teams or Slack</p>
      </div>

      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-[#0c0f14] border border-[#2a3040] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none" />
          </div>
          <button onClick={() => generate()} disabled={loading}
            className="px-5 py-2 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
            {loading ? "Writing..." : "Generate"}
          </button>
        </div>

        {recentDates.length > 0 && (
          <div>
            <p className="text-[10px] text-[#8690a5] mb-1.5">Quick pick</p>
            <div className="flex gap-1.5 flex-wrap">
              {recentDates.map(d => (
                <button key={d} onClick={() => generate(d)}
                  className="px-2.5 py-1 bg-[#0c0f14] border border-[#2a3040] text-[#8690a5] text-[10px] rounded-lg hover:border-[#6c9fff]/30 hover:text-white transition-all">
                  {fmtDate(d)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 space-y-2">
          {[95, 80, 60].map((w, i) => <div key={i} className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${w}%` }} />)}
        </div>
      )}

      {update && !loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4">
          <p className="text-[11px] font-mono text-[#8690a5] mb-2">{fmtDate(date)}</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{update}</p>
          <button onClick={() => { navigator.clipboard?.writeText(update); toast.success("Copied"); }}
            className="mt-3 px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
            📋 Copy
          </button>
        </div>
      )}
    </div>
  );
}
