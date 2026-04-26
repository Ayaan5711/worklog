"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useLogStore } from "@/lib/store";
import { api } from "@/lib/api";

export default function BragSheet() {
  const { allProjects, promptStyle } = useLogStore();
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const generate = async () => {
    setLoading(true); setBullets([]);
    try {
      const result = await api.ai.brag({ from: from || undefined, to: to || undefined, style: promptStyle });
      setBullets(result.bullets);
    } catch { toast.error("Failed to generate brag sheet"); }
    setLoading(false);
  };

  const copyAll = () => {
    navigator.clipboard?.writeText(bullets.map(b => `• ${b}`).join("\n"));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">AI Brag Sheet</h2>
        <p className="text-sm text-[#8690a5] mt-0.5">Resume-ready accomplishment bullets from your logs</p>
      </div>

      <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full bg-[#0c0f14] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-[#8690a5] mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full bg-[#0c0f14] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 rounded-lg font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] disabled:opacity-50 hover:opacity-90 transition-opacity">
          {loading ? "Claude is writing..." : "Generate Brag Sheet"}
        </button>
      </div>

      {loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl p-4 space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-3">
              <span className="text-[#6c9fff] font-bold mt-0.5">→</span>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${65 + i * 7}%` }} />
                <div className="h-3 bg-[#2a3040] rounded animate-pulse" style={{ width: `${40 + i * 5}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {bullets.length > 0 && !loading && (
        <div className="bg-[#141820] border border-[#2a3040] rounded-xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#6c9fff] via-[#5ce0a0] to-[#b48cff]" />
          <div className="p-4 space-y-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex gap-3 text-sm leading-relaxed border-b border-[#2a3040] pb-3 last:border-0 last:pb-0">
                <span className="text-[#6c9fff] font-bold flex-shrink-0 mt-0.5">→</span>
                <span>{b}</span>
              </div>
            ))}
            <button onClick={copyAll} className="mt-1 px-4 py-1.5 rounded-lg bg-[#6c9fff]/08 border border-[#6c9fff]/15 text-[#6c9fff] text-xs font-semibold hover:bg-[#6c9fff]/15 transition-colors">
              📋 Copy all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
