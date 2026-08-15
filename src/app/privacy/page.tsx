import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — NearCare",
  description: "How NearCare collects, uses, and protects your health data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: August 2026</p>
        </div>

        <div className="prose-slate max-w-none space-y-10">

          <section>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              NearCare ("we", "us", "our") is committed to protecting your health data. This policy explains what we collect, how we use it, and your rights. If you have questions, email{" "}
              <a href="mailto:privacy@nearcare.app" className="text-blue-600 hover:underline">privacy@nearcare.app</a>.
            </p>
          </section>

          <Section title="1. What We Collect">
            <p>When you use NearCare we collect:</p>
            <ul>
              <li><strong>Account information</strong> — name, email address, and profile details you provide during sign-up.</li>
              <li><strong>Health logs</strong> — vitals you record (heart rate, blood pressure, blood sugar, SpO₂, temperature, mood, sleep, weight, etc.).</li>
              <li><strong>Medications</strong> — medication names, dosages, schedules, and daily check-in records.</li>
              <li><strong>Documents</strong> — files you upload (lab results, prescriptions, imaging). We store the file and metadata extracted from it.</li>
              <li><strong>Family and care circle data</strong> — names and contact details of family members or caregivers you add.</li>
              <li><strong>Doctor connections</strong> — information about doctors you invite and any notes they leave.</li>
              <li><strong>Usage data</strong> — standard server logs (IP address, browser type, pages visited) for security and debugging. We do not sell this data.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>Your data is used exclusively to provide the NearCare service:</p>
            <ul>
              <li><strong>Display to you</strong> — your dashboard, history, and trends are shown only to you when you are signed in.</li>
              <li><strong>Alert family contacts</strong> — if a health reading triggers an alert, we notify only the family contacts you have explicitly added to your care circle.</li>
              <li><strong>Share with doctors</strong> — we create read-only share links only for doctors you personally invite. You control this access and can revoke it at any time.</li>
              <li><strong>AI analysis</strong> — health data is sent to Google Gemini to generate weekly insights and extract information from document uploads. This processing is ephemeral; Gemini does not store your data.</li>
              <li><strong>Email notifications</strong> — we use Resend to deliver alerts and summaries to email addresses you provide.</li>
            </ul>
            <p>We do <strong>not</strong> sell, rent, or share your health data with advertisers or data brokers.</p>
          </Section>

          <Section title="3. Data Storage">
            <ul>
              <li><strong>Database</strong> — your structured health data (logs, medications, settings) is stored in Neon serverless Postgres with encryption at rest.</li>
              <li><strong>File storage</strong> — uploaded documents are stored in Cloudflare R2 object storage with encryption at rest and TLS in transit. Files are private by default and accessed only via signed URLs.</li>
              <li><strong>Location</strong> — data is stored in the United States.</li>
            </ul>
          </Section>

          <Section title="4. Data Deletion">
            <p>
              You may delete your account at any time from the account settings page. Deleting your account permanently removes all health logs, medications, documents (including files from Cloudflare R2), care circle connections, and profile data. This action is irreversible. We do not retain your personal health data after deletion.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>NearCare integrates with the following third parties, each with their own privacy policies:</p>
            <ul>
              <li><strong>Clerk</strong> — handles authentication (sign-up, sign-in, session management). Clerk stores your email and authentication credentials. See <a href="https://clerk.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">clerk.com/privacy</a>.</li>
              <li><strong>Google Gemini</strong> — processes health data and document content to generate AI insights. Google's data use is governed by their API terms. We use Gemini only for real-time inference; data is not used to train Google models under current API terms.</li>
              <li><strong>Resend</strong> — sends transactional emails (health alerts, summaries). Email addresses are shared with Resend only to deliver emails you have requested.</li>
              <li><strong>Neon</strong> — provides the managed Postgres database where structured data is stored.</li>
              <li><strong>Cloudflare R2</strong> — provides encrypted object storage for uploaded files.</li>
            </ul>
          </Section>

          <Section title="6. HIPAA Notice">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-5">
              <p className="text-slate-700 dark:text-slate-300">
                NearCare is designed with HIPAA principles in mind — including data minimization, access controls, and encryption — but is not a covered entity or business associate under HIPAA. NearCare is a personal health management tool, not a healthcare provider. Do not use NearCare as your sole record of clinical care.
              </p>
            </div>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access all data we hold about you (available in-app).</li>
              <li>Export your health data (contact us and we will provide a JSON export).</li>
              <li>Correct inaccurate data directly in-app.</li>
              <li>Delete your account and all associated data.</li>
              <li>Withdraw consent for AI analysis (contact us to disable).</li>
            </ul>
          </Section>

          <Section title="8. Contact">
            <p>
              For privacy questions or data requests, email{" "}
              <a href="mailto:privacy@nearcare.app" className="text-blue-600 hover:underline">privacy@nearcare.app</a>.
            </p>
          </Section>
        </div>
      </main>

      <PageFooter current="privacy" />
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
