"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Pin, Clipboard } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";

function todayStr() { return new Date().toISOString().slice(0, 10); }

const CAL_STYLES = `
  .rdp { --rdp-accent-color: #6c9fff; --rdp-background-color: #6c9fff22; color: white; margin: 0; }
  .rdp-day_selected { background: #6c9fff !important; color: #0c0f14 !important; font-weight: 700; }
  .rdp-day:hover:not(.rdp-day_selected) { background: #6c9fff22 !important; }
  .rdp-caption_label { color: white; font-size: 0.85rem; font-weight: 600; }
  .rdp-nav_button { color: #8690a5; }
  .rdp-nav_button:hover { color: white; background: #2a3040 !important; }
  .rdp-head_cell { color: #8690a5; font-size: 0.7rem; }
  .rdp-day { color: #cdd5e0; border-radius: 8px; }
  .rdp-day_today:not(.rdp-day_selected) { border: 1px solid #6c9fff55; color: #6c9fff; }
`;

function fmtDate(ds: string) {
  const d = new Date(ds + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const target = new Date(d); target.setHours(0,0,0,0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function StandupGenerator() {
  const { logs, setLogs, promptStyle } = useLogStore();
  const [date, setDate] = useState(todayStr());
  const [update, setUpdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [logsReady, setLogsReady] = useState(logs.length > 0);
  const calRef = useRef<HTMLDivElement>(null);

  const [whatsNext, setWhatsNext] = useState("");
  const recentDates = [...new Set(logs.map(l => l.date))].sort().reverse().slice(0, 8);
  const dateLogCount = logs.filter(l => l.date === date).length;

  useEffect(() => {
    if (logs.length === 0) {
      api.logs.list().then(data => { setLogs(data); setLogsReady(true); }).catch(() => setLogsReady(true));
    }
  }, []);

  useEffect(() => { setWhatsNext(localStorage.getItem("worklog_whats_next") || ""); }, []);

  const clearWhatsNext = () => {
    setWhatsNext("");
    localStorage.removeItem("worklog_whats_next");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const generate = async (d?: string) => {
    const target = d || date;
    setLoading(true); setUpdate("");
    try {
      const result = await api.ai.standup(target, promptStyle);
      let text = result.update;
      const today = todayStr();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (whatsNext && (target === today || target === yesterday)) text += `\n\nToday: ${whatsNext}`;
      setUpdate(text);
      if (d) setDate(d);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to generate standup"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Daily Standup</h2>
        <p className="text-sm text-[#8690a5] mt-1">Ready to paste into Teams or Slack</p>
      </div>

      {whatsNext && (
        <div className="bg-[#6c9fff]/[0.04] border border-[#6c9fff]/15 rounded-xl px-4 py-3 flex items-start gap-2">
          <Pin className="w-3.5 h-3.5 text-[#6c9fff] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#6c9fff] font-semibold mb-0.5">Pinned reminder</p>
            <p className="text-sm text-white">{whatsNext}</p>
          </div>
          <button onClick={clearWhatsNext} className="text-[#556] hover:text-white transition-colors shrink-0 mt-0.5" title="Clear">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">Date</label>
            <div className="relative" ref={calRef}>
              <button type="button" onClick={() => setCalOpen(o => !o)}
                className="flex items-center gap-2 bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2 text-xs text-white hover:border-[#6c9fff]/40 focus:outline-none transition-colors">
                <svg className="w-3 h-3 text-[#6c9fff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {fmtDate(date)}
              </button>
              {calOpen && (
                <div className="absolute z-50 mt-1 bg-[#141820] border border-[#2a3040] rounded-xl shadow-xl p-2">
                  <style>{CAL_STYLES}</style>
                  <DayPicker mode="single" selected={new Date(date + "T00:00:00")} disabled={{ after: new Date() }}
                    onSelect={d => { if (d) { setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); setCalOpen(false); } }} />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => generate()} disabled={loading}
              className="px-5 py-2 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
              {loading ? "Writing..." : "Generate"}
            </button>
            {logsReady && (
              <p className="text-[10px] text-center text-[#556]">
                {dateLogCount > 0
                  ? `${dateLogCount} log${dateLogCount !== 1 ? "s" : ""} for this date`
                  : <span>No logs · <a href="/log" className="text-[#6c9fff] hover:underline">Add one</a></span>
                }
              </p>
            )}
          </div>
        </div>

        {recentDates.length > 0 && (
          <div>
            <p className="text-[10px] text-[#8690a5] mb-1.5">Quick pick</p>
            <div className="flex gap-1.5 flex-wrap">
              {recentDates.map(d => (
                <button key={d} onClick={() => generate(d)}
                  className={`px-2.5 py-1 border text-[10px] rounded-lg transition-all ${
                    d === date ? "bg-[#6c9fff]/10 border-[#6c9fff]/30 text-[#6c9fff]" : "bg-[#0c0f14] border-[#2a3040] text-[#8690a5] hover:border-[#6c9fff]/30 hover:text-white"
                  }`}>
                  {fmtDate(d)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-2">
          {[95, 80, 60].map((w, i) => <div key={i} className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${w}%` }} />)}
        </div>
      )}

      {update && !loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5">
          <p className="text-[11px] font-mono text-[#8690a5] mb-3">{fmtDate(date)}</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#cdd5e0]">{update}</p>
          <button onClick={() => { navigator.clipboard?.writeText(update); toast.success("Copied"); }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors flex items-center gap-1.5">
            <Clipboard className="w-3 h-3" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}
