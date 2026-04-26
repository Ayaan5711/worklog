"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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

export default function LogForm() {
  const { addLog, allProjects, promptStyle, setPromptStyle } = useLogStore();
  const [rawInput, setRawInput] = useState("");
  const [date, setDate] = useState(todayStr());
  const [overrideProject, setOverrideProject] = useState("");
  const [overrideType, setOverrideType] = useState<LogType | "">("");
  const [preview, setPreview] = useState<{ summary: string; project: string; type: string; fallback?: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview debounced
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
    }, 1200);
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
      setRawInput(""); setDate(todayStr()); setOverrideProject(""); setOverrideType(""); setPreview(null);
      toast.success("Saved and structured with AI");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const projects = allProjects();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">New Entry</h2>
        <p className="text-sm text-[#8690a5] mt-0.5">AI-enhanced</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-[#8690a5] mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#6c9fff]/50" />
        </div>

        {/* Raw input */}
        <div>
          <label className="block text-xs font-semibold text-[#8690a5] mb-1.5">What did you work on?</label>
          <textarea
            value={rawInput} onChange={e => setRawInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent); }}
            placeholder="Just type naturally... e.g. 'fixed auth bug in login flow, added retry logic'"
            rows={3}
            className="w-full bg-[#0c0f14] border border-[#2a3040] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#556] resize-y focus:outline-none focus:border-[#6c9fff]/50 leading-relaxed"
          />
          <p className="text-[10px] text-[#556] mt-1 italic">Claude structures this into a professional summary server-side · Ctrl+Enter to save</p>
        </div>

        {/* AI Preview */}
        {rawInput.trim().length >= 10 && (
          <div className="bg-[#6c9fff]/[0.04] border border-[#6c9fff]/12 rounded-lg px-3.5 py-3">
            <p className="text-[11px] font-semibold text-[#6c9fff] mb-2">
              {previewLoading ? "⏳ AI analyzing..." : preview?.fallback ? "📝 Preview (fallback)" : "✨ AI Preview"}
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
                <p className="text-sm font-medium leading-snug mb-2">{preview.summary}</p>
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

        {/* AI Settings */}
        <div className="bg-[#6c9fff]/[0.03] border border-[#6c9fff]/10 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-semibold text-[#8690a5] uppercase tracking-wider">AI Settings</p>
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">Prompt style</label>
            <select value={promptStyle} onChange={e => setPromptStyle(e.target.value as PromptStyle)}
              className="w-full bg-[#0c0f14] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white focus:outline-none">
              {PROMPT_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Overrides */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">Override project</label>
            <input value={overrideProject} onChange={e => setOverrideProject(e.target.value)}
              placeholder="Auto" list="proj-list"
              className="w-full bg-[#0c0f14] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#6c9fff]/50" />
            <datalist id="proj-list">{projects.map(p => <option key={p} value={p} />)}</datalist>
          </div>
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">Override type</label>
            <select value={overrideType} onChange={e => setOverrideType(e.target.value as LogType | "")}
              className="w-full bg-[#0c0f14] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white focus:outline-none">
              <option value="">Auto</option>
              {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={!rawInput.trim() || saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-40 hover:opacity-90 transition-opacity">
          {saving ? "Saving with AI..." : "Save Entry"}
        </button>
      </form>
    </div>
  );
}
