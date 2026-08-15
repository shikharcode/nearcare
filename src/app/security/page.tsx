import Link from "next/link";
import { Heart, ArrowLeft, Lock, Shield, Database, Cloud, Users, Mail } from "lucide-react";

export const metadata = {
  title: "Security — NearCare",
  description: "How NearCare protects your health data with encryption, access controls, and enterprise-grade infrastructure.",
};

export default function SecurityPage() {
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
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Trust &amp; Safety</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            Security
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            Your health data deserves serious protection. Here is exactly how NearCare keeps it safe.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {[
            {
              icon: Lock,
              title: "Encrypted in transit",
              desc: "All data travels over TLS 1.2+. Unencrypted connections are rejected.",
              color: "bg-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/40",
              border: "border-blue-100 dark:border-blue-900",
            },
            {
              icon: Database,
              title: "Encrypted at rest",
              desc: "Database and file storage use AES-256 encryption. Keys are managed by the provider's KMS.",
              color: "bg-violet-600",
              bg: "bg-violet-50 dark:bg-violet-950/40",
              border: "border-violet-100 dark:border-violet-900",
            },
            {
              icon: Shield,
              title: "Enterprise auth",
              desc: "Authentication is handled by Clerk — SOC 2 Type II certified with MFA support.",
              color: "bg-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-950/40",
              border: "border-emerald-100 dark:border-emerald-900",
            },
            {
              icon: Users,
              title: "You control access",
              desc: "You decide who sees your data. Revoke doctor or family access instantly at any time.",
              color: "bg-amber-500",
              bg: "bg-amber-50 dark:bg-amber-950/40",
              border: "border-amber-100 dark:border-amber-900",
            },
          ].map(({ icon: Icon, title, desc, color, bg, border }) => (
            <div key={title} className={`${bg} border ${border} rounded-xl p-5 flex gap-4`}>
              <div className={`${color} w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-10">

          <Section title="Encryption in Transit">
            <p>
              Every connection between your browser (or device) and NearCare's servers is secured with TLS 1.2 or higher. HTTP requests are automatically redirected to HTTPS. We set strict HSTS headers to prevent downgrade attacks. Sensitive fields such as health readings and document content are never transmitted in plaintext.
            </p>
          </Section>

          <Section title="Encryption at Rest">
            <p>
              Data stored in Neon serverless Postgres is encrypted at rest using AES-256 managed by Neon's infrastructure. Files uploaded to Cloudflare R2 are likewise encrypted at rest. Neither NearCare nor its employees have direct access to raw encryption keys — key management is handled by the respective cloud providers' key management systems.
            </p>
          </Section>

          <Section title="Authentication — Powered by Clerk">
            <p>
              NearCare delegates all authentication to <strong>Clerk</strong>, an enterprise-grade identity provider. This means:
            </p>
            <ul>
              <li>NearCare never stores your password — Clerk handles credential hashing and storage.</li>
              <li>Multi-factor authentication (MFA) is available and encouraged.</li>
              <li>Sessions are short-lived JWTs with automatic rotation.</li>
              <li>Clerk is SOC 2 Type II certified and undergoes regular independent security audits.</li>
              <li>OAuth sign-in (Google, Apple) is supported without NearCare ever seeing your third-party password.</li>
            </ul>
          </Section>

          <Section title="Database — Neon Serverless Postgres">
            <p>
              Structured health data (logs, medications, alerts, contacts) is stored in <strong>Neon</strong>, a serverless Postgres provider built on top of AWS infrastructure in the US East region. Neon provides:
            </p>
            <ul>
              <li>Automatic daily backups with point-in-time restore.</li>
              <li>Network isolation — the database is not publicly accessible; only NearCare's application servers can connect.</li>
              <li>AES-256 encryption at rest for all stored data.</li>
              <li>Audit logging of administrative access.</li>
            </ul>
          </Section>

          <Section title="File Storage — Cloudflare R2">
            <p>
              Documents you upload (lab results, prescriptions, imaging) are stored in <strong>Cloudflare R2</strong> object storage. Key properties:
            </p>
            <ul>
              <li>Files are private by default — no public URLs exist.</li>
              <li>Access is granted only via short-lived signed URLs generated server-side for your authenticated session.</li>
              <li>Files are encrypted at rest within Cloudflare's infrastructure.</li>
              <li>Cloudflare R2 does not egress data to third parties.</li>
            </ul>
          </Section>

          <Section title="Access Control — You Are in Charge">
            <p>
              NearCare is built around the principle that you control your data:
            </p>
            <ul>
              <li><strong>Family contacts</strong> receive only alert notifications for the specific readings that triggered an alert — they cannot browse your full history.</li>
              <li><strong>Doctor share links</strong> are read-only, scoped to a summary view, and can be revoked instantly from your dashboard. Each link is protected by a cryptographically random token.</li>
              <li><strong>No employee access</strong> — NearCare staff do not have access to your personal health records outside of aggregate anonymized diagnostics.</li>
            </ul>
          </Section>

          <Section title="Responsible Disclosure">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Found a vulnerability?</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    We take security reports seriously and aim to respond within 48 hours. Please email{" "}
                    <a href="mailto:security@nearcare.app" className="text-blue-600 hover:underline">security@nearcare.app</a>{" "}
                    with a description of the issue and steps to reproduce. We ask that you give us reasonable time to address the vulnerability before public disclosure. We do not pursue legal action against good-faith security researchers.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Infrastructure Summary">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300">Layer</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300">Provider</th>
                    <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ["Authentication", "Clerk", "SOC 2 Type II, MFA, short-lived JWTs"],
                    ["Database", "Neon (Postgres)", "AES-256 at rest, network isolated"],
                    ["File storage", "Cloudflare R2", "AES-256 at rest, signed URLs only"],
                    ["Transport", "TLS 1.2+", "HTTPS enforced, HSTS headers"],
                    ["AI processing", "Google Gemini", "Ephemeral inference, no training on your data"],
                    ["Email", "Resend", "Authenticated SMTP, SPF/DKIM/DMARC"],
                  ].map(([layer, provider, security]) => (
                    <tr key={layer}>
                      <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">{layer}</td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{provider}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{security}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

        </div>
      </main>

      <PageFooter current="security" />
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
