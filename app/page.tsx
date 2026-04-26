import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/log");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0c0f14]">
      <div className="max-w-lg w-full space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6c9fff]/10 border border-[#6c9fff]/20 text-[#6c9fff] text-xs font-semibold mb-2">
            ✦ AI-powered work tracking
          </div>
          <h1 className="text-4xl font-bold font-mono tracking-tight">
            worklog<span className="text-[#6c9fff]">.</span>ai
          </h1>
          <p className="text-[#8690a5] text-base">
            Type what you did. AI turns it into structured, resume-ready documentation.
          </p>
        </div>

        {/* Before / after demo */}
        <div className="bg-[#141820] border border-[#2a3040] rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-[#556] font-semibold">How it works</p>
          <div className="space-y-2">
            <div className="bg-[#0c0f14] rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-[#556] mb-1">You type</p>
              <p className="text-sm text-[#8690a5] leading-relaxed">fixed auth bug, reviewed 2 PRs, meeting about Q3 roadmap</p>
            </div>
            <div className="flex justify-center text-[#556] text-xs">↓ AI structures it</div>
            <div className="bg-[#0c0f14] border border-[#6c9fff]/15 rounded-lg px-3 py-2.5 space-y-2">
              <p className="text-[10px] text-[#6c9fff] mb-1">Structured log</p>
              <p className="text-sm text-white leading-relaxed">Resolved authentication flow bug, conducted code reviews for 2 pull requests, and aligned on Q3 product roadmap.</p>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6c9fff]/10 text-[#6c9fff] font-semibold">Auth</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff7085]/10 text-[#ff7085] font-semibold">🐛 bug</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="bg-[#141820] border border-[#2a3040] rounded-2xl divide-y divide-[#2a3040]">
          {[
            { icon: "💬", title: "Standup in one click", desc: "Paste into Slack or Teams — done in 10 seconds" },
            { icon: "📋", title: "Brag sheet generator", desc: "Resume bullets ready for performance reviews" },
            { icon: "📊", title: "Stats & streaks", desc: "See your work patterns and keep the habit" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 px-5 py-3.5">
              <span className="text-lg mt-0.5">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-[#8690a5]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/login"
            className="flex items-center justify-center w-full py-3 rounded-xl font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] hover:opacity-90 transition-opacity">
            Get started — it&apos;s free
          </Link>
          <p className="text-center text-xs text-[#556]">Sign in with Google · No credit card required</p>
        </div>

      </div>
    </main>
  );
}
