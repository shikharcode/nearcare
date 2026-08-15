import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  users,
  medications,
  healthLogs,
  healthAlerts,
  documents,
} from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";
import {
  AlertTriangle,
  User,
  Pill,
  Activity,
  FileText,
  Phone,
  Droplet,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number | null, decimals = 0): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

const BLOOD_TYPE_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  "B+": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "B-": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  "O+": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "O-": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  prescription: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  lab_report: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  scan: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function docTypeLabel(type: string): string {
  return (
    {
      prescription: "Prescription",
      lab_report: "Lab Report",
      scan: "Scan",
      other: "Other",
    }[type] ?? type
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PassportPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [userRow, activeMeds, logs, alerts, docs] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        name: true,
        dateOfBirth: true,
        bloodType: true,
        allergies: true,
        emergencyContact: true,
      },
    }),
    db.query.medications.findMany({
      where: and(eq(medications.userId, userId), eq(medications.isActive, true)),
      orderBy: [desc(medications.createdAt)],
      columns: {
        id: true,
        name: true,
        dosage: true,
        frequency: true,
        startDate: true,
        prescribedBy: true,
      },
    }),
    db.query.healthLogs.findMany({
      where: eq(healthLogs.userId, userId),
      orderBy: [desc(healthLogs.date)],
      limit: 30,
      columns: {
        id: true,
        date: true,
        systolic: true,
        diastolic: true,
        heartRate: true,
        bloodSugar: true,
        weight: true,
        sleep: true,
        symptoms: true,
      },
    }),
    db.query.healthAlerts.findMany({
      where: and(
        eq(healthAlerts.userId, userId),
        or(
          eq(healthAlerts.severity, "critical"),
          eq(healthAlerts.severity, "warning")
        )
      ),
      orderBy: [desc(healthAlerts.createdAt)],
      limit: 5,
      columns: {
        id: true,
        type: true,
        severity: true,
        message: true,
        createdAt: true,
      },
    }),
    db.query.documents.findMany({
      where: eq(documents.userId, userId),
      orderBy: [desc(documents.createdAt)],
      limit: 10,
      columns: {
        id: true,
        name: true,
        type: true,
        date: true,
      },
    }),
  ]);

  // ── vitals averages ──────────────────────────────────────────────────────────
  const avgSystolic = avg(logs.map((l) => l.systolic));
  const avgDiastolic = avg(logs.map((l) => l.diastolic));
  const avgHeartRate = avg(logs.map((l) => l.heartRate));
  const avgBloodSugar = avg(logs.map((l) => l.bloodSugar));
  const avgWeight = avg(logs.map((l) => l.weight));
  const avgSleep = avg(logs.map((l) => l.sleep));

  // ── recent symptoms ──────────────────────────────────────────────────────────
  const symptomLogs = logs
    .filter((l) => l.symptoms && l.symptoms.trim().length > 0)
    .slice(0, 5);

  // ── blood type badge colour ──────────────────────────────────────────────────
  const btColor =
    userRow?.bloodType && BLOOD_TYPE_COLORS[userRow.bloodType]
      ? BLOOD_TYPE_COLORS[userRow.bloodType]
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4 py-6">
      {/* ── HEADER CARD ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl print:shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase">
              NearCare Health Passport
            </p>
            <h1 className="text-2xl font-bold leading-tight">
              {userRow?.name ?? "Patient"}
            </h1>
            <p className="text-blue-100 text-sm">
              For emergency use — present to any healthcare provider
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* ── CARD 1: IDENTITY & EMERGENCY ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden print:border print:border-gray-300">
        <div className="flex">
          {/* red left border */}
          <div className="w-1 flex-shrink-0 bg-red-500 rounded-l-2xl" />
          <div className="flex-1 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Identity &amp; Emergency Info
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Full Name
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {userRow?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Date of Birth
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {userRow?.dateOfBirth ? formatDate(userRow.dateOfBirth) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Blood Type
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-block text-sm font-bold px-2.5 py-0.5 rounded-full",
                    btColor
                  )}
                >
                  {userRow?.bloodType ?? "Unknown"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  ABHA ID
                </p>
                <p className="mt-0.5 text-sm text-gray-400 italic">
                  Not linked
                </p>
              </div>
            </div>

            {/* Allergies */}
            {userRow?.allergies && userRow.allergies.trim().length > 0 && (
              <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wide">
                    Known Allergies
                  </p>
                  <p className="mt-0.5 text-sm text-red-800 dark:text-red-200 font-medium">
                    {userRow.allergies}
                  </p>
                </div>
              </div>
            )}

            {/* Emergency contact */}
            {userRow?.emergencyContact && userRow.emergencyContact.trim().length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold">Emergency Contact:</span>
                <span>{userRow.emergencyContact}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CARD 2: ACTIVE MEDICATIONS ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4 print:border print:border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
            <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Active Medications
          </h2>
          {activeMeds.length > 0 && (
            <span className="ml-auto text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {activeMeds.length}
            </span>
          )}
        </div>

        {activeMeds.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">
            No active medications on record.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-2 pr-4">
                    Name
                  </th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-2 pr-4">
                    Dosage
                  </th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-2 pr-4">
                    Frequency
                  </th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-2 pr-4">
                    Since
                  </th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-2">
                    Prescribed By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {activeMeds.map((med) => (
                  <tr key={med.id}>
                    <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">
                      {med.name}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-300">
                      {med.dosage ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-300 capitalize">
                      {med.frequency ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                      {med.startDate ? formatDate(med.startDate) : "—"}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {med.prescribedBy ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CARD 3: 30-DAY VITALS AVERAGES ──────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4 print:border print:border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            30-Day Vitals Averages
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Avg BP */}
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
              Avg Blood Pressure
            </p>
            <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-300">
              {avgSystolic != null && avgDiastolic != null
                ? `${fmt(avgSystolic)}/${fmt(avgDiastolic)}`
                : "—"}
            </p>
            <p className="text-xs text-red-400 mt-0.5">mmHg</p>
          </div>

          {/* Avg HR */}
          <div className="rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900 p-4">
            <p className="text-xs font-bold text-pink-500 uppercase tracking-wide">
              Avg Heart Rate
            </p>
            <p className="mt-1 text-xl font-bold text-pink-700 dark:text-pink-300">
              {fmt(avgHeartRate)}
            </p>
            <p className="text-xs text-pink-400 mt-0.5">bpm</p>
          </div>

          {/* Avg Blood Sugar */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 p-4">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">
              Avg Blood Sugar
            </p>
            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
              {fmt(avgBloodSugar, 1)}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">mg/dL</p>
          </div>

          {/* Avg Weight */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-4">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">
              Avg Weight
            </p>
            <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">
              {fmt(avgWeight, 1)}
            </p>
            <p className="text-xs text-blue-400 mt-0.5">kg</p>
          </div>

          {/* Avg Sleep */}
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 p-4">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
              Avg Sleep
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {fmt(avgSleep, 1)}
            </p>
            <p className="text-xs text-indigo-400 mt-0.5">hours / night</p>
          </div>
        </div>
      </div>

      {/* ── CARD 4: RECENT SYMPTOMS ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4 print:border print:border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Recent Symptoms
          </h2>
        </div>

        {symptomLogs.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">
            No symptoms recorded in recent logs.
          </p>
        ) : (
          <div className="space-y-3">
            {symptomLogs.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 items-start py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0"
              >
                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap mt-0.5 min-w-[80px]">
                  {formatDate(log.date)}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {log.symptoms}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 5: DOCUMENTS ON FILE ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4 print:border print:border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Documents on File
          </h2>
          {docs.length > 0 && (
            <span className="ml-auto text-xs font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
              {docs.length}
            </span>
          )}
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0"
              >
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                    DOC_TYPE_COLORS[doc.type] ??
                      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  )}
                >
                  {docTypeLabel(doc.type)}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                  {doc.name}
                </span>
                {doc.date && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(doc.date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-1 pt-2 pb-4">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Generated by NearCare |{" "}
          <span className="text-blue-600 dark:text-blue-400">
            nearcare.vercel.app
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
          This document supplements but does not replace professional medical
          advice.
        </p>
      </div>
    </div>
  );
}
