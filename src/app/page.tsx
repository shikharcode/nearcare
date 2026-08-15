import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Heart,
  Bell,
  Shield,
  Clock,
  Users,
  ChevronRight,
  Zap,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-200">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">NearCare</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white border-0 shadow-md shadow-blue-200/60 px-4">
                Get started free
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          {/* Primary large blob — animates slowly */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-to-b from-blue-100 via-blue-50/60 to-transparent rounded-full blur-3xl opacity-80 animate-pulse" style={{ animationDuration: "6s" }} />
          {/* Secondary blobs */}
          <div className="absolute top-16 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-200 to-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: "8s", animationDelay: "1s" }} />
          <div className="absolute top-48 left-0 w-72 h-72 bg-gradient-to-br from-blue-200 to-cyan-100 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
          {/* Subtle mesh grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#eff6ff_1px,transparent_1px),linear-gradient(to_bottom,#eff6ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        </div>

        {/* Pill badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            Real-time family health monitoring
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight text-slate-900 mb-6">
            Keep your family close.{" "}
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Keep your health closer.
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto mb-10">
            NearCare monitors your vitals, alerts your family instantly, and stores your medical history — all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white border-0 h-14 px-10 text-lg font-bold shadow-xl shadow-blue-300/50 rounded-2xl transition-all duration-200 hover:shadow-blue-400/60 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto">
                Start for free — no credit card
                <ChevronRight className="ml-1.5 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" className="h-14 px-10 text-lg font-semibold rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 w-full sm:w-auto">
                See a demo
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-sm text-slate-400">
            Trusted by families across the US · HIPAA-aligned · End-to-end encrypted
          </p>
        </div>

        {/* Hero visual — mock app card */}
        <div className="max-w-3xl mx-auto mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/15 to-indigo-800/15 rounded-3xl blur-2xl scale-95" />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-300/60 p-6 sm:p-8">
            {/* Card header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Live vitals</p>
                <p className="text-lg font-bold text-slate-800">Sarah&apos;s Dashboard</p>
              </div>
              {/* Pulsing "All normal" badge */}
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm animate-pulse" style={{ animationDuration: "3s" }}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                All normal
              </span>
            </div>

            {/* Vital cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Heart Rate",
                  value: "72",
                  unit: "bpm",
                  color: "text-rose-600",
                  bg: "bg-gradient-to-br from-rose-50 to-rose-100/60",
                  border: "border-rose-200",
                  dot: "bg-rose-500",
                  status: "Normal",
                  statusColor: "text-rose-500",
                },
                {
                  label: "Blood Pressure",
                  value: "118/76",
                  unit: "mmHg",
                  color: "text-blue-700",
                  bg: "bg-gradient-to-br from-blue-50 to-blue-100/60",
                  border: "border-blue-200",
                  dot: "bg-blue-500",
                  status: "Optimal",
                  statusColor: "text-blue-600",
                },
                {
                  label: "SpO₂",
                  value: "98",
                  unit: "%",
                  color: "text-indigo-700",
                  bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/60",
                  border: "border-indigo-200",
                  dot: "bg-indigo-500",
                  status: "Excellent",
                  statusColor: "text-indigo-600",
                },
                {
                  label: "Temperature",
                  value: "98.4",
                  unit: "°F",
                  color: "text-amber-700",
                  bg: "bg-gradient-to-br from-amber-50 to-amber-100/60",
                  border: "border-amber-200",
                  dot: "bg-amber-500",
                  status: "Normal",
                  statusColor: "text-amber-600",
                },
              ].map(({ label, value, unit, color, bg, border, dot, status, statusColor }) => (
                <div
                  key={label}
                  className={`${bg} border ${border} rounded-2xl p-4 shadow-sm hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`h-2 w-2 rounded-full ${dot} animate-pulse`} style={{ animationDuration: "2.5s" }} />
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                  </div>
                  <p className={`text-2xl font-black ${color} leading-none mb-1`}>{value}</p>
                  <p className="text-xs text-slate-400">{unit}</p>
                  <p className={`text-xs font-semibold mt-2 ${statusColor}`}>{status}</p>
                </div>
              ))}
            </div>

            {/* Card footer */}
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Updated just now · Next check in 4 hours
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-100 bg-slate-50/60 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { stat: "53M", label: "caregivers in the US alone" },
            { stat: "0 setup", label: "required — works out of the box" },
            { stat: "Free forever", label: "core features, no hidden fees" },
          ].map(({ stat, label }) => (
            <div key={stat} className="flex flex-col items-center gap-1">
              <span className="text-5xl font-black bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent leading-tight">
                {stat}
              </span>
              <span className="text-sm text-slate-500 mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Everything your family needs
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Built for patients, caregivers, and families who refuse to let distance get in the way of health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: "Live Vitals Monitoring",
                desc: "Real-time tracking of heart rate, blood pressure, SpO₂, and temperature. Syncs with wearables automatically.",
                iconBg: "bg-blue-600",
                glow: "hover:shadow-blue-100",
                tag: "Core",
                tagColor: "text-blue-700 bg-blue-50 border-blue-100",
              },
              {
                icon: Bell,
                title: "Instant Family Alerts",
                desc: "When something looks off, your chosen family members get a push notification within seconds — not minutes.",
                iconBg: "bg-violet-600",
                glow: "hover:shadow-violet-100",
                tag: "Real-time",
                tagColor: "text-violet-700 bg-violet-50 border-violet-100",
              },
              {
                icon: Shield,
                title: "Medical History Vault",
                desc: "Upload prescriptions, lab results, and imaging. AI extracts key data and stores it securely in one place.",
                iconBg: "bg-emerald-600",
                glow: "hover:shadow-emerald-100",
                tag: "Secure",
                tagColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
              },
              {
                icon: Zap,
                title: "AI Health Insights",
                desc: "Pattern recognition surfaces trends before they become problems. Weekly summaries delivered to your inbox.",
                iconBg: "bg-amber-500",
                glow: "hover:shadow-amber-100",
                tag: "AI-powered",
                tagColor: "text-amber-700 bg-amber-50 border-amber-100",
              },
              {
                icon: Users,
                title: "Care Circle",
                desc: "Add family members, doctors, and caregivers. Everyone sees what they need — nothing more.",
                iconBg: "bg-rose-500",
                glow: "hover:shadow-rose-100",
                tag: "Collaboration",
                tagColor: "text-rose-700 bg-rose-50 border-rose-100",
              },
              {
                icon: Lock,
                title: "Privacy First",
                desc: "End-to-end encryption. You control who sees your data. HIPAA-aligned and SOC 2 certified infrastructure.",
                iconBg: "bg-slate-700",
                glow: "hover:shadow-slate-100",
                tag: "Security",
                tagColor: "text-slate-700 bg-slate-50 border-slate-200",
              },
            ].map(({ icon: Icon, title, desc, iconBg, glow, tag, tagColor }) => (
              <div
                key={title}
                className={`group relative bg-white rounded-2xl border border-slate-100 p-8 shadow-lg min-h-[200px] hover:shadow-xl ${glow} hover:-translate-y-1 transition-all duration-200 cursor-default flex flex-col`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`${iconBg} w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${tagColor}`}>
                    {tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              No hardware to buy. No IT team needed. Just sign up and start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            {[
              {
                step: "01",
                title: "Create your profile",
                desc: "Sign up in 30 seconds. Add your basic health details, medications, and invite your family members to your care circle.",
              },
              {
                step: "02",
                title: "Connect your devices",
                desc: "Pair Apple Watch, Fitbit, or any Bluetooth health device. Or log vitals manually — either works seamlessly.",
              },
              {
                step: "03",
                title: "Stay informed together",
                desc: "You and your family receive alerts, summaries, and insights. Your doctor gets a clean report at every appointment.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-200/70 mb-7">
                  <span className="text-2xl font-black text-white">{step}</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 p-12 sm:p-16 text-center shadow-2xl shadow-blue-900/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-900/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.10),transparent_60%)]" />
            {/* Subtle animated shimmer */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(99,179,237,0.15),transparent_50%)] animate-pulse" style={{ animationDuration: "5s" }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
                <Heart className="h-3.5 w-3.5 fill-white" />
                Free for individuals — always
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                Your family&apos;s health,<br />one app away.
              </h2>
              <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
                Join thousands of families already using NearCare. Set up your care circle today and know your loved ones are never more than a tap away.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-up">
                  <Button className="bg-white hover:bg-blue-50 text-blue-800 border-0 h-16 px-10 text-xl font-bold shadow-xl rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto">
                    Get started — it&apos;s free
                    <ChevronRight className="ml-1.5 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="ghost" className="h-16 px-10 text-xl font-semibold text-white hover:bg-white/10 rounded-2xl border border-white/20 transition-all duration-200 w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-blue-200/70">
                No credit card required · Cancel anytime · HIPAA-aligned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
                <Heart className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-slate-800">NearCare</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-400">Your health, organized.</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-slate-800 transition-colors">Security</Link>
              <a href="mailto:hello@nearcare.app" className="hover:text-slate-800 transition-colors">Contact</a>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} NearCare, Inc. All rights reserved.</p>
            <p>Built with care for 53 million caregivers.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
