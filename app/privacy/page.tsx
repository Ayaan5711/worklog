import Link from "next/link";

export const metadata = { title: "Privacy Policy — worklog.space" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0c0f14] text-[#cdd5e0] px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-xs text-[#6c9fff] hover:underline mb-6 inline-block">← worklog.space</Link>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[#8690a5] mt-2">Last updated: May 2025</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What we collect</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            When you sign in with Google, we receive your name, email address, and profile picture from Google OAuth.
            We store the work log entries you create — including the raw text you type and the AI-structured summary, project, and type fields.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">How we use your data</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            Your work logs are used solely to provide the product features: structuring entries with AI, generating standups, brag sheets, and summaries.
            We do not sell your data, share it with third parties, or use it for advertising.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">AI processing</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            Your log entries are sent to Groq&apos;s API to generate structured summaries. This is processed server-side.
            Please review <a href="https://groq.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#6c9fff] hover:underline">Groq&apos;s privacy policy</a> for information on how they handle API data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Data storage</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            Your data is stored in Supabase, a hosted PostgreSQL database. Data is encrypted at rest and in transit.
            Your logs are only accessible to your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your rights</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            You can export all your data at any time from the Data tab (JSON or CSV).
            You can delete all your logs or permanently delete your account from the Data tab.
            After account deletion, all associated data is permanently removed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cookies</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            We use a session cookie to keep you signed in. No tracking or advertising cookies are used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            Questions about your data? Email us at{" "}
            <a href="mailto:ayoooo5711@gmail.com" className="text-[#6c9fff] hover:underline">ayoooo5711@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
