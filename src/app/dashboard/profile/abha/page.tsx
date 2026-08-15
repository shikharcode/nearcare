'use client'

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Link2, Info, Building2, FileText, Users, Pencil } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatAbha(digits: string): string {
  // digits = up to 14 raw digits
  const d = digits.slice(0, 14);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 6));
  if (d.length > 6) parts.push(d.slice(6, 10));
  if (d.length > 10) parts.push(d.slice(10, 14));
  return parts.join("-");
}

function stripDashes(v: string): string {
  return v.replace(/-/g, "");
}

function isValidAbha(raw: string): boolean {
  return /^\d{14}$/.test(raw);
}

// ── sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm px-4 py-5 text-center flex-1 min-w-[120px]">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{title}</span>
    </div>
  );
}

function ComingSoonCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 px-5 py-4 opacity-60">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{title}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Coming Soon
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function AbhaPage() {
  const [inputValue, setInputValue] = useState("");
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("nearcare_abha_id");
    if (stored && isValidAbha(stored)) {
      setLinkedId(stored);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = stripDashes(e.target.value).replace(/\D/g, "");
    setInputValue(formatAbha(raw));
    setError(null);
  }

  async function handleLink() {
    const digits = stripDashes(inputValue);
    if (!isValidAbha(digits)) {
      setError("Please enter a valid 14-digit ABHA number.");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/abha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abhaId: digits }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error || "Invalid ABHA ID format.");
        return;
      }
      const data = await res.json() as { abhaId?: string };
      const clean = data.abhaId || digits;
      localStorage.setItem("nearcare_abha_id", clean);
      setLinkedId(clean);
      setChanging(false);
      setInputValue("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange() {
    setChanging(true);
    setLinkedId(null);
    setInputValue("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const showForm = !linkedId || changing;

  return (
    <div className="space-y-8 pb-12 max-w-2xl mx-auto">

      {/* ── Hero gradient card ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-7 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, #FF9933 0%, #1a5fa8 60%, #138808 100%)" }}>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />

        <div className="relative flex items-start gap-4">
          {/* NearCare logo / ABHA badge */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <span className="text-2xl font-black tracking-tighter text-white">NC</span>
            </div>
            <span className="text-[10px] font-semibold bg-white/20 rounded-full px-2 py-0.5">NearCare</span>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">India Health Stack</p>
            <h1 className="text-2xl font-black leading-tight">
              ABHA
              <span className="block text-base font-semibold text-white/80 mt-0.5">
                Your National Health ID
              </span>
            </h1>
            <p className="text-sm text-white/75 mt-2 leading-relaxed">
              Link your government health ID to NearCare for seamless health record access across India.
            </p>
          </div>
        </div>

        {/* Ashoka chakra subtle watermark */}
        <div className="pointer-events-none absolute right-6 bottom-4 text-white/8 text-8xl font-black select-none">
          ⊕
        </div>
      </div>

      {/* ── Section 1: What is ABHA ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          What is ABHA?
        </h2>
        <div className="flex flex-wrap gap-3">
          <FeatureCard
            icon={<span className="text-sm font-bold">#14</span>}
            title="14-digit unique ID"
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5" />}
            title="Works at any hospital"
          />
          <FeatureCard
            icon={<span className="text-lg">₹</span>}
            title="Free & voluntary"
          />
          <FeatureCard
            icon={<span className="text-sm font-bold">UID</span>}
            title="Aadhaar-based"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 px-4 py-3">
          ABHA (Ayushman Bharat Health Account) is a 14-digit number issued by the National Health Authority of India. It creates a unified digital health identity that lets you store, access, and share your health records securely across the healthcare ecosystem.
        </p>
      </section>

      {/* ── Section 2: Link your ABHA ───────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-green-500" />
          Link Your ABHA ID
        </h2>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5 space-y-4">
          {/* Linked success state */}
          {linkedId && !changing && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">ABHA ID Linked</p>
                  <p className="text-base font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                    {formatAbha(linkedId)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleChange}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors min-h-[44px] px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
                Change
              </button>
            </div>
          )}

          {/* Input form */}
          {showForm && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="abha-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ABHA Number
                </label>
                <input
                  ref={inputRef}
                  id="abha-input"
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="XX-XXXX-XXXX-XXXX"
                  maxLength={17}
                  autoComplete="off"
                  className={cn(
                    "w-full h-12 px-4 rounded-xl border text-base font-mono tracking-widest transition-colors",
                    "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                    "placeholder:text-gray-300 dark:placeholder:text-gray-600",
                    "focus:outline-none focus:ring-2",
                    error
                      ? "border-red-400 dark:border-red-600 focus:ring-red-300 dark:focus:ring-red-700"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
                  )}
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Format: XX-XXXX-XXXX-XXXX (14 digits, dashes auto-inserted)
                </p>
              </div>

              <button
                onClick={handleLink}
                disabled={loading || stripDashes(inputValue).length === 0}
                type="button"
                className={cn(
                  "w-full h-12 rounded-xl text-sm font-semibold transition-all",
                  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Linking...
                  </span>
                ) : (
                  "Link ABHA ID"
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: How to get ABHA ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-500" />
          How to Get Your ABHA
        </h2>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5 space-y-0">
          {[
            {
              step: 1,
              text: "Visit healthid.ndhm.gov.in or download the ABHA app from Play Store / App Store",
            },
            {
              step: 2,
              text: "Verify using Aadhaar OTP or Driving Licence for identity confirmation",
            },
            {
              step: 3,
              text: "Complete registration to receive your 14-digit ABHA number instantly",
            },
            {
              step: 4,
              text: "Enter your ABHA number in the field above to link it with NearCare",
            },
          ].map(({ step, text }, idx, arr) => (
            <div key={step} className={cn("flex gap-4 py-4", idx < arr.length - 1 && "border-b border-gray-100 dark:border-gray-800")}>
              <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-bold">
                  {step}
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-px flex-1 bg-orange-100 dark:bg-orange-900/30 mt-2" />
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>

        <a
          href="https://healthid.ndhm.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 w-full h-12 rounded-xl",
            "border-2 border-orange-400 dark:border-orange-600",
            "text-sm font-semibold text-orange-700 dark:text-orange-400",
            "hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-700"
          )}
        >
          Create ABHA on Government Portal
          <ExternalLink className="h-4 w-4" />
        </a>
      </section>

      {/* ── Section 4: Coming soon ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          Coming Soon
        </h2>
        <div className="space-y-3">
          <ComingSoonCard
            icon={<Building2 className="h-5 w-5" />}
            title="Hospital Integration"
            description="Automatically share your health ID when visiting ABDM-enabled hospitals and clinics."
          />
          <ComingSoonCard
            icon={<FileText className="h-5 w-5" />}
            title="Auto-fetch Records"
            description="Pull your existing health records from government and private hospitals directly into NearCare."
          />
          <ComingSoonCard
            icon={<Users className="h-5 w-5" />}
            title="Share with Doctors"
            description="Grant and revoke consent for doctors to access specific health records via ABHA consent manager."
          />
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 dark:text-gray-600 text-center leading-relaxed px-2">
        NearCare stores your ABHA ID locally on this device. Live health record sync requires government empanelment. NearCare is not affiliated with the National Health Authority of India.
      </p>
    </div>
  );
}
