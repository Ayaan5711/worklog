"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";
import { TYPE_ICONS, ALL_TYPES } from "@/lib/constants";
import type { LogType, PromptStyle } from "@/lib/types";

function todayStr() { return new Date().toISOString().slice(0, 10); }

const PROMPT_STYLES: { value: PromptStyle; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
  { value: "technical", label: "Technical" },
];

const TEMPLATES = ["Fixed bug in", "Reviewed PR for", "Built feature for", "Refactored", "Meeting about", "Researched"];

export default function LogForm() {
  const { addLog, allProjects, promptStyle, setPromptStyle } = useLogStore();
  const [rawInput, setRawInput] = useState("");
  const [date, setDate] = useState(todayStr());
  const [overrideProject, setOverrideProject] = useState("");
  const [overrideType, setOverrideType] = useState<LogType | "">("");
  const [preview, setPreview] = useState<{ summary: string; project: string; type: string; fallback?: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [whatsNext, setWhatsNext] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("worklog_whats_next") || "";
  });
  const calRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (rawInput.trim().length < 10) { setPreview(null); return; }
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await api.ai.structure(rawInput, promptStyle);
        setPreview(result);
      } catch { setPreview(null); }
      setPreviewLoading(false);
    }, 3000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rawInput, promptStyle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;
    setSaving(true);
    try {
      const log = await api.logs.create({
        raw_input: rawInput.trim(),
        date,
        project_override: overrideProject || undefined,
        type_override: (overrideType as LogType) || undefined,
        style: promptStyle,
      });
      addLog(log);
      localStorage.setItem("worklog_whats_next", whatsNext);
      setRawInput(""); setDate(todayStr()); setOverrideProject(""); setOverrideType(""); setPreview(null);
      toast.success("Saved and structured with AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const projects = allProjects();
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">New Entry</h2>
        <p className="text-sm text-[#8690a5] mt-1">Type what you did — AI structures it for you</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Quick templates */}
        <div className="flex gap-1.5 flex-wrap">
          {TEMPLATES.map(t => (
            <button key={t} type="button"
              onClick={() => setRawInput(r => r ? r : t + " ")}
              className="px-2.5 py-1 rounded-lg bg-[#141820] border border-[#2a3040] text-[#8690a5] text-[10px] hover:border-[#6c9fff]/40 hover:text-white transition-all">
              {t}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div>
          <textarea
            value={rawInput} onChange={e => setRawInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent); }}
            placeholder="e.g. fixed auth bug in login flow, added retry logic"
            rows={4}
            autoFocus
            className="w-full bg-[#141820] border border-[#2a3040] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#3a4258] resize-y focus:outline-none focus:border-[#6c9fff]/50 leading-relaxed transition-colors"
          />
          <p className="text-[10px] text-[#3a4258] mt-1.5">Ctrl+Enter to save</p>
        </div>

        {/* AI Preview */}
        {rawInput.trim().length >= 10 && (
          <div className="bg-[#0c0f14] border border-[#6c9fff]/15 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-[#6c9fff] mb-2 uppercase tracking-wider">
              {previewLoading ? "Analyzing..." : preview?.fallback ? "Preview (fallback)" : "✦ AI Preview"}
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
            {preview && !previewLoading && (
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
                onSelect={(d) => { if (d) { setDate(d.toISOString().slice(0, 10)); setCalOpen(false); } }}
                disabled={{ after: new Date() }} />
            </div>
          )}
        </div>

        {/* What's next */}
        <input value={whatsNext} onChange={e => setWhatsNext(e.target.value)}
          placeholder="What's next? (carries to tomorrow's standup)"
          className="w-full bg-[#141820] border border-[#2a3040] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3a4258] focus:outline-none focus:border-[#6c9fff]/50 transition-colors" />

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
              <select value={promptStyle} onChange={e => setPromptStyle(e.target.value as PromptStyle)}
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
