"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Stethoscope,
  AlertTriangle,
  Activity,
  Pill,
  MessageSquare,
  BookmarkCheck,
  UserCheck,
  Printer,
  Share2,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChiefComplaint {
  complaint: string;
  detail: string;
  severity: "mild" | "moderate" | "severe";
}

interface VitalItem {
  metric: string;
  value: string;
  normalRange: string;
  status: "normal" | "high" | "low" | "critical";
}

interface MedicationNote {
  name: string;
  dosage: string;
  frequency: string;
  note: string | null;
}

interface DontForget {
  bloodType: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  recentSymptoms: string;
  recentDocuments: string | null;
}

interface SpecialistSuggestion {
  suggested: boolean;
  specialist: string | null;
  reason: string | null;
}

interface AppointmentSummary {
  chiefComplaints: ChiefComplaint[];
  vitalsToDiscuss: VitalItem[];
  medicationNotes: MedicationNote[];
  questionsToAsk: string[];
  dontForget: DontForget;
  specialistSuggestion: SpecialistSuggestion;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALIST_OPTIONS = [
  { value: "General Physician", label: "General Physician" },
  { value: "Cardiologist", label: "Cardiologist" },
  { value: "Endocrinologist", label: "Endocrinologist" },
  { value: "Orthopedic", label: "Orthopedic" },
  { value: "Neurologist", label: "Neurologist" },
  { value: "Other", label: "Other" },
];

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  moderate: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  normal: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  colorClass,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  colorClass: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-gray-900 shadow-sm overflow-hidden print:shadow-none print:border-gray-300",
        className
      )}
    >
      <div className={cn("flex items-center gap-3 px-5 py-4 border-b", colorClass)}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <h2 className="font-semibold text-base">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AppointmentPrepPage() {
  const [specialist, setSpecialist] = useState("General Physician");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AppointmentSummary | null>(null);

  async function generate() {
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/ai/appointment-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialistType: specialist }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const secs = Math.ceil((data.retryAfterMs ?? 30000) / 1000);
        toast.error(`Please wait ${secs}s before generating again.`);
        return;
      }

      if (!res.ok) {
        toast.error("Failed to generate summary. Please try again.");
        return;
      }

      const data = await res.json();
      setSummary(data as AppointmentSummary);
    } catch {
      toast.error("Something went wrong. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Appointment Summary — NearCare",
          text: `Appointment prep for ${specialist} visit${appointmentDate ? ` on ${appointmentDate}` : ""}`,
          url: shareUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  }

  return (
    <>
      {/* Print-only header */}
      <div className="hidden print:block mb-4 border-b pb-3">
        <p className="text-lg font-bold text-gray-900">Appointment Prep Summary — NearCare</p>
        {appointmentDate && (
          <p className="text-sm text-gray-600">
            Visit date: {appointmentDate} · Specialist: {specialist}
          </p>
        )}
      </div>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 print:bg-white print:pb-0">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="print:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-5">
          <div className="max-w-3xl mx-auto flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Appointment Prep
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                AI prepares you for your next doctor visit
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ── Input card ───────────────────────────────────────────────── */}
          {!summary && (
            <div className="print:hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-5 py-6 space-y-5">
              <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                Tell us about your visit
              </h2>

              {/* Specialist dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Who are you visiting?
                </label>
                <div className="relative">
                  <select
                    value={specialist}
                    onChange={(e) => setSpecialist(e.target.value)}
                    className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {SPECIALIST_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Date picker */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  When is your appointment?{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={loading}
                className={cn(
                  "w-full h-14 rounded-2xl font-semibold text-base text-white flex items-center justify-center gap-2.5 transition-all",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                  "shadow-md hover:shadow-lg active:scale-[0.98]",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CalendarCheck className="h-5 w-5" />
                )}
                {loading ? "Analyzing your health data..." : "Generate My Summary ✨"}
              </button>
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────────────────── */}
          {loading && (
            <div className="print:hidden space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden animate-pulse"
                >
                  <div className="h-14 bg-gray-100 dark:bg-gray-800" />
                  <div className="px-5 py-4 space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2 print:hidden">
                Analyzing your health data...
              </p>
            </div>
          )}

          {/* ── Results ───────────────────────────────────────────────────── */}
          {summary && !loading && (
            <>
              {/* Action bar */}
              <div className="print:hidden flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Prepared for:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {specialist}
                    {appointmentDate ? ` · ${appointmentDate}` : ""}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-h-[44px]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-h-[44px]"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all min-h-[44px] shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    Print Summary
                  </button>
                </div>
              </div>

              {/* Card 1 — Chief Complaints */}
              {summary.chiefComplaints?.length > 0 && (
                <SectionCard
                  title="Chief Complaints"
                  icon={AlertTriangle}
                  colorClass="border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                >
                  <ul className="space-y-3">
                    {summary.chiefComplaints.map((c, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {c.complaint}
                            </span>
                            {c.severity && (
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  SEVERITY_COLORS[c.severity] ?? ""
                                )}
                              >
                                {c.severity}
                              </span>
                            )}
                          </div>
                          {c.detail && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {c.detail}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Card 2 — Vitals to Discuss */}
              {summary.vitalsToDiscuss?.length > 0 && (
                <SectionCard
                  title="Key Vitals to Discuss"
                  icon={Activity}
                  colorClass="border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                >
                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Metric
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Your Value
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">
                            Normal Range
                          </th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                        {summary.vitalsToDiscuss.map((v, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                              {v.metric}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                              {v.value}
                            </td>
                            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 hidden sm:table-cell text-xs">
                              {v.normalRange}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                                  STATUS_COLORS[v.status] ?? "bg-gray-100 text-gray-700"
                                )}
                              >
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {/* Card 3 — Medications */}
              {summary.medicationNotes?.length > 0 && (
                <SectionCard
                  title="Your Medications"
                  icon={Pill}
                  colorClass="border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                >
                  <ul className="space-y-3">
                    {summary.medicationNotes.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                          <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {m.name}
                            </span>
                            {m.dosage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {m.dosage}
                              </span>
                            )}
                            {m.frequency && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                                {m.frequency}
                              </span>
                            )}
                          </div>
                          {m.note && (
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              {m.note}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Card 4 — Questions to Ask */}
              {summary.questionsToAsk?.length > 0 && (
                <SectionCard
                  title="Questions to Ask Your Doctor"
                  icon={MessageSquare}
                  colorClass="border-purple-100 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"
                >
                  <ol className="space-y-3">
                    {summary.questionsToAsk.map((q, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {q}
                        </p>
                      </li>
                    ))}
                  </ol>
                </SectionCard>
              )}

              {/* Card 5 — Don't Forget */}
              {summary.dontForget && (
                <SectionCard
                  title="Don't Forget to Mention"
                  icon={BookmarkCheck}
                  colorClass="border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                >
                  <dl className="space-y-3">
                    {summary.dontForget.bloodType && (
                      <div className="flex gap-3">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">
                          Blood Type
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                          {summary.dontForget.bloodType}
                        </dd>
                      </div>
                    )}
                    {summary.dontForget.allergies && (
                      <div className="flex gap-3">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">
                          Allergies
                        </dt>
                        <dd className="text-sm text-red-600 dark:text-red-400 font-medium">
                          {summary.dontForget.allergies}
                        </dd>
                      </div>
                    )}
                    {summary.dontForget.emergencyContact && (
                      <div className="flex gap-3">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">
                          Emergency Contact
                        </dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300">
                          {summary.dontForget.emergencyContact}
                        </dd>
                      </div>
                    )}
                    {summary.dontForget.recentSymptoms && (
                      <div className="flex gap-3">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">
                          Recent Symptoms
                        </dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300">
                          {summary.dontForget.recentSymptoms}
                        </dd>
                      </div>
                    )}
                    {summary.dontForget.recentDocuments && (
                      <div className="flex gap-3">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">
                          Bring Documents
                        </dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300">
                          {summary.dontForget.recentDocuments}
                        </dd>
                      </div>
                    )}
                  </dl>
                </SectionCard>
              )}

              {/* Card 6 — Specialist Suggestion */}
              {summary.specialistSuggestion?.suggested &&
                summary.specialistSuggestion.specialist && (
                  <SectionCard
                    title="Consider a Specialist Referral"
                    icon={UserCheck}
                    colorClass="border-sky-100 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {summary.specialistSuggestion.specialist}
                        </p>
                        {summary.specialistSuggestion.reason && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            {summary.specialistSuggestion.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}

              {/* Bottom action bar (print hidden) */}
              <div className="print:hidden flex gap-3 pt-2 flex-wrap">
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Print Summary
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Share with Doctor
                </button>
                <button
                  onClick={generate}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .min-h-screen, .min-h-screen * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .min-h-screen { position: absolute; top: 0; left: 0; width: 100%; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
