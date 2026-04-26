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

        {/* Feature list */}
        <div className="bg-[#141820] border border-[#2a3040] rounded-2xl divide-y divide-[#2a3040]">
          {[
            { icon: "✨", title: "Smart structuring", desc: "Raw notes → professional summaries automatically" },
            { icon: "📋", title: "Brag sheet generator", desc: "Resume bullets ready for performance reviews" },
            { icon: "💬", title: "Standup updates", desc: "One click, paste into Slack or Teams" },
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
