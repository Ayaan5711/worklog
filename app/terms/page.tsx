import Link from "next/link";

export const metadata = { title: "Terms of Service — worklog.space" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0c0f14] text-[#cdd5e0] px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-xs text-[#6c9fff] hover:underline mb-6 inline-block">← worklog.space</Link>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[#8690a5] mt-2">Last updated: May 2025</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Acceptance</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            By using worklog.space, you agree to these terms. If you do not agree, do not use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">The service</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            worklog.space is a work log tracking tool that uses AI to structure your entries and generate professional summaries.
            We provide the service as-is. Features may change without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your content</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            You own your work logs. By using the service, you grant us permission to process your content for the purpose of providing features (AI structuring, summary generation).
            Do not enter confidential information that you are not permitted to share with third-party AI services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Acceptable use</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            You agree not to abuse the service (automated bulk requests, attempts to access other users&apos; data, or using the service to generate harmful content).
            Accounts found in violation may be terminated without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Disclaimers</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            AI-generated content (summaries, brag bullets, standups) may contain errors. Always review before sharing professionally.
            We are not liable for any decisions made based on AI-generated output.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Availability</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            We aim for high availability but do not guarantee uninterrupted service. We are not liable for downtime or data loss.
            We strongly recommend regular exports of your data from the Data tab.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Changes</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            We may update these terms. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm text-[#8690a5] leading-relaxed">
            Questions? Email{" "}
            <a href="mailto:ayoooo5711@gmail.com" className="text-[#6c9fff] hover:underline">ayoooo5711@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
