import Link from "next/link";
import { Heart, ArrowLeft, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms of Service — NearCare",
  description: "NearCare terms of service and user responsibilities.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-sm">
              <Heart className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">NearCare</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: August 2026</p>
        </div>

        {/* Emergency banner */}
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-5 mb-10">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-700 dark:text-red-400 mb-1">Medical Emergency Notice</p>
            <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
              In a medical emergency, call <strong>911</strong> immediately. NearCare is not an emergency service and cannot dispatch help or guarantee real-time alert delivery. Do not rely on NearCare in life-threatening situations.
            </p>
          </div>
        </div>

        <div className="space-y-10">

          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account or using NearCare (the "Service"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Service. We may update these Terms; continued use after changes constitutes acceptance. We will notify you of material changes by email.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              NearCare is a personal health management platform that allows individuals to:
            </p>
            <ul>
              <li>Log and track health vitals and symptoms over time.</li>
              <li>Manage medications and set daily reminders.</li>
              <li>Store and organize health documents (lab results, prescriptions, imaging).</li>
              <li>Share health summaries with family caregivers and doctors they choose.</li>
              <li>Receive AI-generated health insights powered by Google Gemini.</li>
            </ul>
            <p>
              NearCare is a consumer wellness tool, not a clinical system.
            </p>
          </Section>

          <Section title="3. Not a Medical Device">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-xl p-5">
              <p className="text-slate-700 dark:text-slate-300">
                <strong>NearCare is not a medical device and is not a substitute for professional medical advice, diagnosis, or treatment.</strong> AI-generated insights are informational only and have not been reviewed by a licensed clinician. Always consult a qualified healthcare provider with questions about your health. Never disregard or delay seeking professional medical advice because of something you read in NearCare.
              </p>
            </div>
          </Section>

          <Section title="4. User Responsibilities">
            <p>You agree to:</p>
            <ul>
              <li><strong>Provide accurate information.</strong> Enter health data that is as accurate as possible. Inaccurate data may lead to misleading insights or alerts.</li>
              <li><strong>Keep credentials secure.</strong> You are responsible for all activity under your account. Notify us immediately of any unauthorized access.</li>
              <li><strong>Use the Service lawfully.</strong> Do not use NearCare to store data belonging to others without their consent, or in violation of any applicable law.</li>
              <li><strong>Not rely on NearCare for emergencies.</strong> The Service is not designed for emergency response. Call 911 for any life-threatening situation.</li>
              <li><strong>Be 13 or older.</strong> NearCare is not intended for children under 13. Do not create an account on behalf of a minor without appropriate legal authority.</li>
            </ul>
          </Section>

          <Section title="5. Data Ownership">
            <p>
              <strong>You own your health data.</strong> NearCare does not claim ownership over any health information, documents, or content you upload. You grant NearCare a limited license to process your data solely to provide the Service (display it to you, generate insights, send alerts to contacts you choose). This license ends when you delete your account.
            </p>
            <p>
              You can export or delete your data at any time. See our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for details.
            </p>
          </Section>

          <Section title="6. Disclaimer of Warranties">
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, express or implied. NearCare does not warrant that the Service will be uninterrupted, error-free, or that health alerts will be delivered within any specific timeframe. Health data and AI insights may contain errors. NearCare is not liable for decisions made based on information in the Service.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, NearCare's total liability for any claim arising from use of the Service is limited to the amount you paid to NearCare in the 12 months preceding the claim (or $50 if you paid nothing). NearCare is not liable for indirect, incidental, special, or consequential damages.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              You may stop using NearCare and delete your account at any time. We may suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted per our Privacy Policy. Sections 5, 6, 7, and 9 survive termination.
            </p>
          </Section>

          <Section title="9. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any disputes will be resolved in the courts of Delaware.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For legal inquiries, email{" "}
              <a href="mailto:legal@nearcare.app" className="text-blue-600 hover:underline">legal@nearcare.app</a>.
            </p>
          </Section>
        </div>
      </main>

      <PageFooter current="terms" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800 [&_strong]:dark:text-slate-200">
        {children}
      </div>
    </section>
  );
}

function PageFooter({ current }: { current: "privacy" | "terms" | "security" }) {
  const links = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
  ];

  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 py-10 px-6 mt-16">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-800">
            <Heart className="h-3 w-3 text-white fill-white" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">NearCare</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                href === `/${current}`
                  ? "text-blue-600 font-medium"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400">© 2026 NearCare, Inc.</p>
      </div>
    </footer>
  );
}
