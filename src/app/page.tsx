import Link from "next/link";
import {
  Heart, Activity, Bell, Shield, Users, ChevronRight,
  Zap, Lock, Brain, Stethoscope, FileText, Smartphone,
  Mail, ArrowRight, CheckCircle, Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f0eb] text-slate-900 overflow-x-hidden">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-md border-b border-[#e8e0d8]">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">NearCare</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#why" className="hover:text-blue-600 transition-colors">Why NearCare</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm">
              Get started free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                India's Personal Health OS
              </div>

              <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight text-slate-900 mb-6">
                Keeping your family{" "}
                <span className="text-blue-600">healthy</span>{" "}
                and{" "}
                <span className="text-blue-600">independent</span>{" "}
                at home.
              </h1>

              <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-lg">
                Track vitals, manage medications, get AI health insights, and keep your
                family connected — all in one beautiful app.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link href="/sign-up" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-7 py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5 shadow-lg">
                  Start for free
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/sign-in" className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-4 rounded-2xl text-base border border-slate-200 transition-all hover:-translate-y-0.5">
                  See a demo
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8">
                {[
                  { stat: "Free", label: "Forever core features" },
                  { stat: "AI", label: "Powered by Gemini" },
                  { stat: "ABHA", label: "India health ID ready" },
                ].map(({ stat, label }) => (
                  <div key={stat}>
                    <p className="text-2xl font-extrabold text-slate-900">{stat}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — animated health card */}
            <div className="animate-fade-in-up delay-150 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100/60 to-purple-100/40 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/80 p-7 border border-slate-100">
                {/* Live vitals header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Today's vitals</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">Shikhar's Dashboard</p>
                  </div>
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    All normal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Heart Rate", value: "72", unit: "bpm", color: "bg-rose-50 border-rose-100", text: "text-rose-600" },
                    { label: "Blood Pressure", value: "118/76", unit: "mmHg", color: "bg-blue-50 border-blue-100", text: "text-blue-600" },
                    { label: "Blood Sugar", value: "95", unit: "mg/dL", color: "bg-amber-50 border-amber-100", text: "text-amber-600" },
                    { label: "SpO₂", value: "98", unit: "%", color: "bg-indigo-50 border-indigo-100", text: "text-indigo-600" },
                  ].map(({ label, value, unit, color, text }) => (
                    <div key={label} className={`${color} border rounded-2xl p-4`}>
                      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
                      <p className={`text-2xl font-bold ${text}`}>{value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{unit}</p>
                    </div>
                  ))}
                </div>

                {/* Medication row */}
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Medications</p>
                      <p className="text-xs text-slate-400">2 of 3 taken today</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[true, true, false].map((taken, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${taken ? "bg-emerald-500" : "bg-slate-200"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY NEARCARE ── */}
      <section id="why" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Why NearCare?</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 max-w-xl">
              Built for real families, not just tech users.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Heart className="h-7 w-7" />,
                bg: "bg-rose-100 text-rose-600",
                cardBg: "bg-rose-50 border-rose-100",
                title: "Made for elderly",
                desc: "Large text, simple check-in, voice input — designed for parents and grandparents.",
              },
              {
                icon: <Brain className="h-7 w-7" />,
                bg: "bg-violet-100 text-violet-600",
                cardBg: "bg-violet-50 border-violet-100",
                title: "AI health insights",
                desc: "Gemini AI analyzes your data and surfaces patterns before they become problems.",
              },
              {
                icon: <Bell className="h-7 w-7" />,
                bg: "bg-amber-100 text-amber-600",
                cardBg: "bg-amber-50 border-amber-100",
                title: "Instant family alerts",
                desc: "When vitals go out of range, your family gets an email within seconds.",
              },
              {
                icon: <Shield className="h-7 w-7" />,
                bg: "bg-emerald-100 text-emerald-600",
                cardBg: "bg-emerald-50 border-emerald-100",
                title: "ABHA ready",
                desc: "Link your India national health ID — your records travel with you to any hospital.",
              },
            ].map(({ icon, bg, cardBg, title, desc }, i) => (
              <div
                key={title}
                className={`border rounded-3xl p-7 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default animate-fade-in-up ${cardBg}`}
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${bg}`}>
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 bg-[#f5f0eb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Everything your health needs
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              From daily vitals to doctor-ready reports — NearCare handles the full health journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Activity className="h-6 w-6" />,
                iconBg: "bg-blue-600",
                title: "Daily Health Log",
                desc: "Track mood, energy, sleep, vitals, symptoms. AI voice input — just speak and the form fills itself.",
                tag: "Daily",
              },
              {
                icon: <Activity className="h-6 w-6" />,
                iconBg: "bg-emerald-600",
                title: "Medication Tracker",
                desc: "Scan your prescription, add all medications in one tap. Daily check-in with progress ring.",
                tag: "Medications",
              },
              {
                icon: <Brain className="h-6 w-6" />,
                iconBg: "bg-violet-600",
                title: "AI Health Chat",
                desc: "Ask your health AI anything. 'Why is my BP trending up?' — answered with your actual data.",
                tag: "AI",
              },
              {
                icon: <Stethoscope className="h-6 w-6" />,
                iconBg: "bg-rose-600",
                title: "Appointment Prep",
                desc: "1-page AI brief before every doctor visit. Chief complaints, vitals to discuss, questions to ask.",
                tag: "Doctors",
              },
              {
                icon: <FileText className="h-6 w-6" />,
                iconBg: "bg-orange-500",
                title: "Medical Documents",
                desc: "Upload prescriptions and lab reports. AI extracts key info — medications, results, diagnosis.",
                tag: "Documents",
              },
              {
                icon: <Users className="h-6 w-6" />,
                iconBg: "bg-pink-600",
                title: "Caregiver Mode",
                desc: "Family can log health on behalf of elderly parents. No login needed — just share a link.",
                tag: "Family",
              },
            ].map(({ icon, iconBg, title, desc, tag }) => (
              <div
                key={title}
                className="group bg-white rounded-3xl p-7 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`${iconBg} w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white`}>
                    {icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              Up and running in 2 minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
            {[
              { step: "01", title: "Create your profile", desc: "Sign up in 30 seconds. Add basic health details, blood type, allergies, emergency contact." },
              { step: "02", title: "Start tracking", desc: "Use quick check-in daily. Scan prescriptions. Upload documents. Talk to the AI." },
              { step: "03", title: "Stay connected", desc: "Family gets alerts. Doctors get clean reports. You get insights. Everyone is in the loop." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
                  <span className="text-lg font-extrabold text-white">{step}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#f5f0eb]">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 p-12 sm:p-16 text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
                <Heart className="h-3.5 w-3.5 fill-white" />
                Free for individuals — always
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                Your family's health,<br />one app away.
              </h2>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Join families already using NearCare. Set up your care circle today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-up" className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-slate-900 font-bold px-8 py-4 rounded-2xl text-base transition-all hover:-translate-y-0.5 shadow-xl">
                  Get started — it's free
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/sign-in" className="flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-2xl text-base transition-all">
                  Sign in
                </Link>
              </div>
              <p className="mt-6 text-sm text-slate-500">No credit card · Cancel anytime · HIPAA-aligned</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Get in touch</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                Have questions or feedback?
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                NearCare is built with care for Indian families. I'd love to hear from you —
                whether it's a bug, a feature idea, or a partnership inquiry.
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:shikhar.singhal55@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">Email</p>
                    <p className="text-base font-semibold text-slate-800">shikhar.singhal55@gmail.com</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
                </a>

                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5">Built by</p>
                    <p className="text-base font-semibold text-slate-800">Shikhar Singhal</p>
                    <p className="text-sm text-slate-500">NearCare — Personal Health OS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — trust badges */}
            <div className="space-y-4">
              {[
                { icon: <Shield className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", title: "HIPAA-aligned design", desc: "Built with medical data privacy principles at its core." },
                { icon: <Lock className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50", title: "Your data, your control", desc: "Delete your account and all data anytime. We never sell your health data." },
                { icon: <Zap className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", title: "Powered by Gemini AI", desc: "Google's latest AI models analyze your health data securely." },
                { icon: <Star className="h-5 w-5 text-violet-600" />, bg: "bg-violet-50", title: "ABHA integration ready", desc: "Link your India national health ID for seamless hospital visits." },
              ].map(({ icon, bg, title, desc }) => (
                <div key={title} className={`flex items-start gap-4 p-4 rounded-2xl ${bg}`}>
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 py-10 px-6 bg-[#f5f0eb]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <Heart className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-extrabold text-slate-800">NearCare</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-500">Your Health OS</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-slate-800 transition-colors">Security</Link>
              <a href="mailto:shikhar.singhal55@gmail.com" className="hover:text-slate-800 transition-colors">Contact</a>
            </nav>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© 2026 NearCare. Built by Shikhar Singhal. All rights reserved.</p>
            <p>Made with ❤️ for Indian families</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
