import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0c0f14]">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold font-mono tracking-tight">
            worklog<span className="text-[#6c9fff]">.</span>ai
          </h1>
          <p className="mt-3 text-[#8690a5] text-lg">AI-powered daily work tracking</p>
        </div>

        <div className="bg-[#141820] border border-[#2a3040] rounded-2xl p-8 space-y-4 text-left">
          <p className="text-[#8690a5] text-sm leading-relaxed">
            Type what you did in plain language — Claude turns it into structured, resume-ready
            documentation. Generate brag sheets, standup updates, and weekly summaries in seconds.
          </p>
          <ul className="space-y-2 text-sm text-[#8690a5]">
            {[
              "✨ AI structures your raw notes into professional summaries",
              "📋 One-click brag sheet for performance reviews",
              "💬 Daily standup generator — paste into Slack/Teams",
              "📊 Timeline, stats, and project breakdown",
              "🔒 Your data stored securely, never shared",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <Link
          href="/login"
          className="inline-block w-full py-3 rounded-xl font-bold text-sm text-[#0c0f14] bg-gradient-to-r from-[#6c9fff] to-[#5ce0a0] hover:opacity-90 transition-opacity"
        >
          Get started — it&apos;s free
        </Link>
        <p className="text-xs text-[#556]">Sign in with Google or GitHub. No credit card required.</p>
      </div>
    </main>
  );
}
