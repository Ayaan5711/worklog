import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Zap, BarChart2, ArrowRight, Check } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/log");

  return (
    <main className="min-h-screen bg-[#0c0f14] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-[#0c0f14]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-bold font-mono tracking-tight">worklog<span className="text-[#6c9fff]">.</span>space</span>
        </div>
        <Link href="/login" className="flex items-center gap-1.5 text-sm text-[#8690a5] hover:text-white transition-colors">
          Sign in <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6c9fff]/10 border border-[#6c9fff]/20 text-[#6c9fff] text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5ce0a0] animate-pulse" />
            AI-powered work tracking
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Your work,<br />
            <span className="text-[#6c9fff]">documented.</span>
          </h1>
          <p className="text-lg text-[#8690a5] leading-relaxed max-w-lg mx-auto">
            Type what you did in plain language. AI structures it into professional documentation — ready for standups, performance reviews, and your next job interview.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[#0c0f14] bg-[#6c9fff] hover:bg-[#6c9fff]/90 transition-colors w-full sm:w-auto justify-center">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-xs text-[#556]">No credit card · Sign in with Google</span>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0d1117] border border-[#1e2535] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1e2535]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[11px] text-[#556] font-mono">worklog.space / log</span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] text-[#556] font-semibold uppercase tracking-wider mb-2">You type</p>
                <div className="bg-[#141820] rounded-lg px-4 py-3 text-sm text-[#8690a5] border border-[#2a3040]">
                  fixed auth bug in login flow, reviewed 2 PRs for the payments feature, sync with design team about new dashboard
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6c9fff]/30 to-transparent" />
                <div className="flex items-center gap-1.5 text-[10px] text-[#6c9fff] font-semibold bg-[#6c9fff]/10 px-2.5 py-1 rounded-full border border-[#6c9fff]/20">
                  <Zap className="w-3 h-3" />
                  AI structures it
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6c9fff]/30 to-transparent" />
              </div>
              <div>
                <p className="text-[10px] text-[#5ce0a0] font-semibold uppercase tracking-wider mb-2">Structured log</p>
                <div className="bg-[#141820] rounded-lg px-4 py-3 border border-[#6c9fff]/15 space-y-2.5">
                  <p className="text-sm text-white leading-relaxed">Resolved authentication vulnerability in login flow, conducted code reviews for 2 payments feature pull requests, and collaborated with design team on dashboard specifications.</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#6c9fff]/10 text-[#6c9fff] font-semibold border border-[#6c9fff]/20">Auth</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#ff7085]/10 text-[#ff7085] font-semibold border border-[#ff7085]/20">bug</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#556] mb-10">Everything you need</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: "Standup in seconds", desc: "Generate a paste-ready standup update for Slack or Teams from your daily logs." },
              { icon: Zap, title: "Brag sheet generator", desc: "Turn months of logs into polished resume bullets before your performance review." },
              { icon: BarChart2, title: "Stats & streaks", desc: "See your work patterns, active days, and top projects at a glance." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#141820] border border-[#2a3040] rounded-xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#6c9fff]/10 border border-[#6c9fff]/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#6c9fff]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-xs text-[#8690a5] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto bg-[#141820] border border-[#2a3040] rounded-2xl p-8">
          <p className="text-sm font-semibold text-white mb-6">Everything included, free</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "AI log structuring", "Daily standup generator",
              "Brag sheet builder", "Weekly summary",
              "Activity heatmap", "JSON & CSV export",
              "Full data ownership", "Dark mode",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#5ce0a0]/15 border border-[#5ce0a0]/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-[#5ce0a0]" />
                </div>
                <span className="text-sm text-[#cdd5e0]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="max-w-lg mx-auto space-y-5">
          <h2 className="text-3xl font-bold tracking-tight">Start logging today</h2>
          <p className="text-[#8690a5] text-sm">Takes 30 seconds per day. Saves hours at review time.</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-[#0c0f14] bg-[#6c9fff] hover:bg-[#6c9fff]/90 transition-colors">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2535] px-6 py-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="w-5 h-5 rounded-md" />
            <span className="text-xs font-mono text-[#556]">worklog.space</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-[#556] hover:text-[#8690a5] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-[#556] hover:text-[#8690a5] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
