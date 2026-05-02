"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Sparkles, Pin } from "lucide-react";
import { TYPE_ICONS, ALL_TYPES } from "@/lib/constants";
import type { LogType, PromptStyle } from "@/lib/types";

function todayStr() { return new Date().toISOString().slice(0, 10); }

const PROMPT_STYLES: { value: PromptStyle; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
  { value: "technical", label: "Technical" },
];

const STATIC_TEMPLATES = ["Fixed bug in", "Reviewed PR for", "Built feature for", "Refactored", "Meeting about", "Researched"];

const DRAFT_KEY = "worklog_draft";

export default function LogForm() {
  const { addLog, allProjects, logs, setLogs, promptStyle, setPromptStyle } = useLogStore();
  const [rawInput, setRawInput] = useState("");
  const [date, setDate] = useState(todayStr());
  const [overrideProject, setOverrideProject] = useState("");
  const [overrideType, setOverrideType] = useState<LogType | "">("");
  const [preview, setPreview] = useState<{ summary: string; project: string; type: string; fallback?: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [whatsNext, setWhatsNext] = useState("");
  const [logsReady, setLogsReady] = useState(logs.length > 0);
  const calRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);

  // Restore draft + whatsNext on mount; load logs for todayCount + onboarding
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setRawInput(draft);
    setWhatsNext(localStorage.getItem("worklog_whats_next") || "");
    const savedStyle = localStorage.getItem("worklog_prompt_style") as PromptStyle | null;
    if (savedStyle) setPromptStyle(savedStyle);
    if (logs.length === 0) {
      api.logs.list().then(data => { setLogs(data); setLogsReady(true); }).catch(() => setLogsReady(true));
    }
  }, []);

  // Auto-save draft — skip first render to avoid deleting draft before restore runs
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    if (rawInput) localStorage.setItem(DRAFT_KEY, rawInput);
    else localStorage.removeItem(DRAFT_KEY);
  }, [rawInput]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (rawInput.trim().length < 10) { setPreview(null); setPreviewFailed(false); return; }
    setPreviewFailed(false);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await api.ai.structure(rawInput, promptStyle, projects);
        setPreview(result);
      } catch { setPreview(null); setPreviewFailed(true); }
      setPreviewLoading(false);
    }, 3000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rawInput, promptStyle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;
    setSaving(true); setSaveFailed(false);
    try {
      const log = await api.logs.create({
        raw_input: rawInput.trim(),
        date,
        project_override: overrideProject || undefined,
        type_override: (overrideType as LogType) || undefined,
        style: promptStyle,
      });
      addLog(log);
      if (whatsNext) localStorage.setItem("worklog_whats_next", whatsNext);
      else localStorage.removeItem("worklog_whats_next");
      localStorage.removeItem(DRAFT_KEY);
      setRawInput(""); setDate(todayStr()); setOverrideProject(""); setOverrideType(""); setPreview(null);
      setLastSaved(log.summary);
      if (lastSavedTimer.current) clearTimeout(lastSavedTimer.current);
      lastSavedTimer.current = setTimeout(() => setLastSaved(null), 6000);
      toast.success("Saved and structured with AI");
      const totalAfter = logs.length + 1;
      const milestones = [5, 20, 50];
      if (milestones.includes(totalAfter) && !localStorage.getItem(`worklog_support_nudge_${totalAfter}`)) {
        localStorage.setItem(`worklog_support_nudge_${totalAfter}`, "1");
        setTimeout(() => toast(`You've logged ${totalAfter} entries — if worklog saves you time, consider supporting it`, {
          duration: 8000,
          action: { label: "Support", onClick: () => window.open("https://paypal.me/worklog", "_blank") },
        }), 1500);
      }
    } catch (err) {
      setSaveFailed(true);
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const projects = allProjects();
  const templates = projects.length > 0
    ? [...projects.slice(0, 3).map(p => `Worked on ${p}`), ...STATIC_TEMPLATES.slice(0, 3)]
    : STATIC_TEMPLATES;
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const todayCount = logs.filter(l => l.date === todayStr()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">New Entry</h2>
          <p className="text-sm text-[#8690a5] mt-1">
            Type what you did — AI structures it for you
            {todayCount > 0 && <span className="ml-2 text-[#556]">· {todayCount} logged today</span>}
          </p>
        </div>
        {lastSaved && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-[#5ce0a0] font-semibold">✓ Saved</p>
            <p className="text-[10px] text-[#556] max-w-[180px] truncate">{lastSaved}</p>
          </div>
        )}
      </div>

      {/* First-time onboarding — only shown once fetch has settled */}
      {logsReady && logs.length === 0 && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold">How it works</p>
          <ol className="space-y-2 text-xs text-[#8690a5] leading-relaxed">
            <li><span className="text-white font-medium">1. Type freely</span> — "fixed the auth bug, reviewed 2 PRs, meeting about Q3 roadmap"</li>
            <li><span className="text-white font-medium">2. AI structures it</span> — clean summary, project name, and type tag automatically</li>
            <li><span className="text-white font-medium">3. Use it anywhere</span> — standup updates, brag sheet bullets, weekly summaries</li>
          </ol>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Quick templates — hidden once typing starts */}
        {!rawInput && (
          <div className="flex gap-1.5 flex-wrap">
            {templates.map(t => (
              <button key={t} type="button"
                onClick={() => setRawInput(t + " ")}
                className="px-2.5 py-1 rounded-lg bg-[#141820] border border-[#2a3040] text-[#8690a5] text-[10px] hover:border-[#6c9fff]/40 hover:text-white transition-all">
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div>
          <textarea
            value={rawInput} onChange={e => { setRawInput(e.target.value); setSaveFailed(false); }}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent); }}
            placeholder="e.g. fixed auth bug in login flow, added retry logic"
            rows={4}
            autoFocus
            className={`w-full bg-[#141820] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#3a4258] resize-y focus:outline-none leading-relaxed transition-colors ${
              saveFailed ? "border-red-500/50 focus:border-red-500/70" : "border-[#2a3040] focus:border-[#6c9fff]/50"
            }`}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className={`text-[10px] ${saveFailed ? "text-red-400" : "text-[#3a4258]"}`}>
              {saveFailed ? "Save failed — your entry is still here, try again" : "Ctrl+Enter to save"}
            </p>
            <div className="flex items-center gap-2">
              {rawInput && !saveFailed && <p className="text-[10px] text-[#3a4258]">Draft saved</p>}
              <p className={`text-[10px] font-mono ${rawInput.length > 1800 ? "text-red-400" : rawInput.length > 1500 ? "text-[#f0b860]" : "text-[#3a4258]"}`}>
                {rawInput.length} / 2000
              </p>
            </div>
          </div>
        </div>

        {/* AI Preview */}
        {rawInput.trim().length >= 10 && (
          <div className={`bg-[#0c0f14] border rounded-xl px-4 py-3 ${previewFailed ? "border-[#2a3040]" : "border-[#6c9fff]/15"}`}>
            <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider text-[#6c9fff]">
              {previewLoading ? "Analyzing..." : previewFailed ? "Preview" : preview?.fallback ? "Preview (fallback)" : <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Preview</span>}
            </p>
            {previewLoading && (
              <div className="space-y-2">
                <div className="h-3 bg-[#2a3040] rounded animate-pulse w-4/5" />
                <div className="flex gap-2">
                  <div className="h-4 w-20 bg-[#2a3040] rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-[#2a3040] rounded-full animate-pulse" />
                </div>
              </div>
            )}
            {previewFailed && !previewLoading && (
              <p className="text-xs text-[#556]">AI preview unavailable — smart fallback will be used on save.</p>
            )}
            {preview && !previewLoading && !previewFailed && (
              <>
                <p className="text-sm leading-snug mb-2.5 text-white">{preview.summary}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6c9fff]/10 text-[#6c9fff] font-semibold">
                    {overrideProject || preview.project}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8690a5] font-semibold">
                    {TYPE_ICONS[overrideType as LogType || preview.type as LogType] || "📝"} {overrideType || preview.type}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Date */}
        <div className="relative" ref={calRef}>
          <button type="button" onClick={() => setCalOpen(o => !o)}
            className="flex items-center gap-2 bg-[#141820] border border-[#2a3040] rounded-xl px-3 py-2 text-sm text-[#8690a5] hover:text-white hover:border-[#6c9fff]/40 focus:outline-none transition-colors">
            <svg className="w-3.5 h-3.5 text-[#6c9fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {formattedDate}
          </button>
          {calOpen && (
            <div className="absolute z-50 mt-1 bg-[#141820] border border-[#2a3040] rounded-xl shadow-xl p-2">
              <style>{`
                .rdp { --rdp-accent-color: #6c9fff; --rdp-background-color: #6c9fff22; color: white; margin: 0; }
                .rdp-day_selected { background: #6c9fff !important; color: #0c0f14 !important; font-weight: 700; }
                .rdp-day:hover:not(.rdp-day_selected) { background: #6c9fff22 !important; }
                .rdp-caption_label { color: white; font-size: 0.85rem; font-weight: 600; }
                .rdp-nav_button { color: #8690a5; }
                .rdp-nav_button:hover { color: white; background: #2a3040 !important; }
                .rdp-head_cell { color: #8690a5; font-size: 0.7rem; }
                .rdp-day { color: #cdd5e0; border-radius: 8px; }
                .rdp-day_today:not(.rdp-day_selected) { border: 1px solid #6c9fff55; color: #6c9fff; }
              `}</style>
              <DayPicker mode="single" selected={new Date(date + "T00:00:00")}
                onSelect={(d) => { if (d) { setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); setCalOpen(false); } }}
                disabled={{ after: new Date() }} />
            </div>
          )}
        </div>

        {/* What's next */}
        <div>
          <input value={whatsNext} onChange={e => setWhatsNext(e.target.value)}
            placeholder="What's next? (optional)"
            className="w-full bg-[#141820] border border-[#2a3040] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3a4258] focus:outline-none focus:border-[#6c9fff]/50 transition-colors" />
          <p className="text-[10px] text-[#3a4258] mt-1.5 flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Pinned as a reminder on your Standup page tomorrow</p>
        </div>

        {/* Advanced toggle */}
        <button type="button" onClick={() => setShowAdvanced(o => !o)}
          className="flex items-center gap-1.5 text-[11px] text-[#556] hover:text-[#8690a5] transition-colors">
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-[10px] text-[#8690a5] mb-1">Prompt style</label>
              <select value={promptStyle} onChange={e => { const s = e.target.value as PromptStyle; setPromptStyle(s); localStorage.setItem("worklog_prompt_style", s); }}
                className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                {PROMPT_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#8690a5] mb-1">Override project</label>
                <input value={overrideProject} onChange={e => setOverrideProject(e.target.value)}
                  placeholder="Auto" list="proj-list"
                  className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                <datalist id="proj-list">{projects.map(p => <option key={p} value={p} />)}</datalist>
              </div>
              <div>
                <label className="block text-[10px] text-[#8690a5] mb-1">Override type</label>
                <select value={overrideType} onChange={e => setOverrideType(e.target.value as LogType | "")}
                  className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                  <option value="">Auto</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={!rawInput.trim() || saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-40 hover:opacity-90 transition-opacity">
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </div>
  );
}
