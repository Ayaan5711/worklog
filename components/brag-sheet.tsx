"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";

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

function DateButton({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? new Date(value + "T00:00:00") : undefined;
  const label = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2 text-xs text-left hover:border-[#6c9fff]/40 focus:outline-none transition-colors">
        <svg className="w-3 h-3 text-[#6c9fff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? "text-white" : "text-[#556]"}>{label}</span>
        {value && (
          <span onClick={e => { e.stopPropagation(); onChange(""); }}
            className="ml-auto text-[#556] hover:text-white text-xs leading-none">✕</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-[#141820] border border-[#2a3040] rounded-xl shadow-xl p-2">
          <style>{CAL_STYLES}</style>
          <DayPicker mode="single" selected={selected} disabled={{ after: new Date() }}
            onSelect={d => { onChange(d ? d.toISOString().slice(0, 10) : ""); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

export default function BragSheet() {
  const { promptStyle, allProjects, logs, setLogs } = useLogStore();
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (logs.length === 0) api.logs.list().then(setLogs).catch(() => {});
  }, []);

  const projects = allProjects();

  const toggleProject = (p: string) =>
    setSelectedProjects(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const generate = async () => {
    setLoading(true); setBullets(null);
    try {
      const result = await api.ai.brag({
        from: from || undefined,
        to: to || undefined,
        projects: selectedProjects.length ? selectedProjects : undefined,
        style: promptStyle,
      });
      setBullets(result.bullets ?? []);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to generate brag sheet"); }
    setLoading(false);
  };

  const copyAll = () => {
    navigator.clipboard?.writeText((bullets ?? []).map(b => `• ${b}`).join("\n"));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Brag Sheet</h2>
        <p className="text-sm text-[#8690a5] mt-1">Resume-ready accomplishment bullets from your logs</p>
      </div>

      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">From</label>
            <DateButton value={from} onChange={setFrom} placeholder="All time" />
          </div>
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">To</label>
            <DateButton value={to} onChange={setTo} placeholder="Today" />
          </div>
        </div>

        {projects.length > 0 && (
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-2">
              Projects <span className="text-[#556]">{selectedProjects.length ? `(${selectedProjects.length} selected)` : "(all)"}</span>
            </label>
            <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto">
              {projects.map(p => (
                <button key={p} type="button" onClick={() => toggleProject(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                    selectedProjects.includes(p)
                      ? "bg-[#6c9fff]/15 border-[#6c9fff]/40 text-[#6c9fff]"
                      : "bg-transparent border-[#2a3040] text-[#556] hover:text-[#8690a5] hover:border-[#3a4258]"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#556]">Leave blank to use all logs</p>
        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
          {loading ? "AI is writing..." : "Generate Brag Sheet"}
        </button>
      </div>

      {loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-6 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-[#2a3040] animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
                <div className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${45 + i * 5}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {bullets !== null && bullets.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm text-[#8690a5]">No logs found for the selected filters.</p>
          <a href="/log" className="mt-3 text-xs text-[#6c9fff] hover:underline">Add some work logs first</a>
        </div>
      )}

      {bullets !== null && bullets.length > 0 && !loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#6c9fff] via-[#5ce0a0] to-[#b48cff]" />
          <div className="px-6 pt-5 pb-2 space-y-0">
            {bullets.map((b, i) => (
              <div key={i} className="group flex gap-4 py-4 border-b border-[#1e2535] last:border-0">
                <span className="text-[10px] font-bold font-mono text-[#6c9fff] bg-[#6c9fff]/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-[#cdd5e0] flex-1">{b}</p>
                <button onClick={() => { navigator.clipboard?.writeText(b); toast.success("Copied"); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 p-1 rounded text-[#556] hover:text-[#6c9fff] hover:bg-[#6c9fff]/10"
                  title="Copy bullet">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="px-6 pb-5 flex items-center justify-between">
            <span className="text-[10px] text-[#556]">{bullets.length} accomplishments</span>
            <button onClick={copyAll}
              className="px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
              📋 Copy all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
