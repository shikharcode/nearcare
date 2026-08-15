import { db } from "@/db";
import { shareLinks, healthLogs, medications, documents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Heart, User, Pill, Activity, FileText, BarChart2, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatDate, moodEmoji, moodLabel } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { PrintButton } from "./print-button";

// ── helpers ───────────────────────────────────────────────────────────────────

function avg(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function docTypeLabel(type: string) {
  const map: Record<string, string> = {
    prescription: "Prescription",
    lab_report: "Lab Report",
    scan: "Scan / Imaging",
    other: "Other",
  };
  return map[type] ?? type;
}

// ── error page ────────────────────────────────────────────────────────────────

function ErrorPage({ expired }: { expired?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4">
      <div className="mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
        <span className="text-xl font-bold text-slate-900 tracking-tight">NearCare</span>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {expired ? "Share Link Expired" : "Share Link Not Found"}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          {expired
            ? "This shared health record link has expired and is no longer accessible."
            : "This shared health record link is invalid or has been revoked."}
        </p>
        <p className="mt-4 text-slate-400 text-sm">
          Please ask the patient to generate a new link and share it with you.
        </p>
        <div className="mt-6 inline-block rounded-xl bg-slate-50 border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-500">
          Request a new link from the patient
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-400">Powered by NearCare Health OS</p>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [link] = await db.select().from(shareLinks).where(eq(shareLinks.token, token));

  if (!link) return <ErrorPage />;
  if (link.expiresAt && link.expiresAt < new Date()) return <ErrorPage expired />;

  // Fetch patient profile + data in parallel
  const [patientRows, logs, meds, docs] = await Promise.all([
    db.select().from(users).where(eq(users.id, link.userId)),
    db.select().from(healthLogs).where(eq(healthLogs.userId, link.userId)),
    db.select().from(medications).where(eq(medications.userId, link.userId)),
    link.includeDocuments
      ? db.select().from(documents).where(eq(documents.userId, link.userId))
      : Promise.resolve([]),
  ]);

  const patient = patientRows[0];

  // Sort logs newest-first
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const recentLogs = sortedLogs.slice(0, 10);

  const activeMeds = meds.filter((m) => m.isActive);

  // Vitals averages — last 30 days
  const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const last30 = sortedLogs.filter((l) => l.date >= cutoff);
  const avgHR = avg(last30.map((l) => l.heartRate));
  const avgSleep = avg(last30.map((l) => l.sleep));
  const avgSystolic = avg(last30.map((l) => l.systolic));
  const avgDiastolic = avg(last30.map((l) => l.diastolic));

  const generatedOn = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* ── Confidential banner ─────────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 print:border-amber-300 print:bg-amber-50">
        <div className="max-w-4xl mx-auto px-6 py-2.5 flex items-center justify-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800 text-center tracking-wide uppercase">
            Confidential — Medical Record · Shared by patient · Read-only · Not for redistribution
          </p>
        </div>
      </div>

      {/* ── header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
                <Heart className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">NearCare</span>
              <span className="text-slate-300 text-sm">·</span>
              <span className="text-sm text-slate-500 font-medium">Shared Health Record</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient?.name ?? "Patient"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Generated {generatedOn}</p>
          </div>
          <PrintButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8 print:py-4 print:space-y-6">

        {/* ── Section 1: Patient info ───────────────────────────────────────── */}
        <section>
          <SectionHeading icon={<User className="h-4 w-4" />} title="Patient Information" />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow label="Full Name" value={patient?.name} />
            <InfoRow label="Blood Type" value={patient?.bloodType} badge />
            <InfoRow
              label="Allergies"
              value={patient?.allergies}
              fallback="None recorded"
              className="sm:col-span-2"
            />
            <InfoRow
              label="Emergency Contact"
              value={patient?.emergencyContact}
              fallback="Not provided"
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* ── Section 2: Active medications ────────────────────────────────── */}
        <section>
          <SectionHeading icon={<Pill className="h-4 w-4" />} title="Active Medications" />
          {activeMeds.length === 0 ? (
            <EmptyState text="No active medications recorded." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 text-left">
                    <Th>Medication</Th>
                    <Th>Dosage</Th>
                    <Th>Frequency</Th>
                    <Th>Prescribed By</Th>
                  </tr>
                </thead>
                <tbody>
                  {activeMeds.map((med, i) => (
                    <tr
                      key={med.id}
                      className={i % 2 === 0 ? "bg-white hover:bg-slate-50/70" : "bg-blue-50/30 hover:bg-blue-50/60"}
                      style={{ transition: "background-color 150ms" }}
                    >
                      <Td className="font-semibold text-slate-800">{med.name}</Td>
                      <Td>{med.dosage ?? <Dash />}</Td>
                      <Td>{med.frequency ?? <Dash />}</Td>
                      <Td>{med.prescribedBy ? `Dr. ${med.prescribedBy}` : <Dash />}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 3: Recent health logs ────────────────────────────────── */}
        <section>
          <SectionHeading icon={<Activity className="h-4 w-4" />} title="Recent Health Logs" subtitle="Last 10 entries" />
          {recentLogs.length === 0 ? (
            <EmptyState text="No health logs recorded." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 text-left">
                    <Th>Date</Th>
                    <Th>Mood</Th>
                    <Th>Sleep</Th>
                    <Th>Heart Rate</Th>
                    <Th>Blood Pressure</Th>
                    <Th>Blood Sugar</Th>
                    <Th>SpO₂</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={i % 2 === 0 ? "bg-white hover:bg-slate-50/70" : "bg-blue-50/30 hover:bg-blue-50/60"}
                      style={{ transition: "background-color 150ms" }}
                    >
                      <Td className="font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(log.date)}
                      </Td>
                      <Td>
                        {log.mood ? (
                          <span className="whitespace-nowrap">
                            {moodEmoji(log.mood)} {moodLabel(log.mood)}
                          </span>
                        ) : (
                          <Dash />
                        )}
                      </Td>
                      <Td>{log.sleep != null ? `${log.sleep}h` : <Dash />}</Td>
                      <Td>
                        {log.heartRate != null ? (
                          <span className="font-medium text-rose-600">{log.heartRate} bpm</span>
                        ) : (
                          <Dash />
                        )}
                      </Td>
                      <Td>
                        {log.systolic != null && log.diastolic != null ? (
                          <span className="font-medium text-blue-700">{log.systolic}/{log.diastolic}</span>
                        ) : (
                          <Dash />
                        )}
                      </Td>
                      <Td>
                        {log.bloodSugar != null ? (
                          <span className="font-medium text-amber-700">{log.bloodSugar} mg/dL</span>
                        ) : (
                          <Dash />
                        )}
                      </Td>
                      <Td>
                        {log.oxygenSaturation != null ? (
                          <span className="font-medium text-indigo-700">{log.oxygenSaturation}%</span>
                        ) : (
                          <Dash />
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 4: Vitals summary ─────────────────────────────────────── */}
        <section>
          <SectionHeading
            icon={<BarChart2 className="h-4 w-4" />}
            title="Vitals Summary"
            subtitle="30-day averages"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <VitalCard
              label="Avg Heart Rate"
              value={avgHR != null ? `${avgHR} bpm` : null}
              color="rose"
            />
            <VitalCard
              label="Avg Sleep"
              value={avgSleep != null ? `${avgSleep} hrs` : null}
              color="indigo"
            />
            <VitalCard
              label="Avg Blood Pressure"
              value={
                avgSystolic != null && avgDiastolic != null
                  ? `${avgSystolic}/${avgDiastolic}`
                  : null
              }
              color="blue"
            />
            <VitalCard
              label="Data Points"
              value={last30.length > 0 ? `${last30.length} logs` : null}
              sub="in last 30 days"
              color="emerald"
            />
          </div>
        </section>

        {/* ── Section 5: Documents (conditional) ───────────────────────────── */}
        {link.includeDocuments && (
          <section>
            <SectionHeading icon={<FileText className="h-4 w-4" />} title="Documents" />
            {docs.length === 0 ? (
              <EmptyState text="No documents uploaded." />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 text-left">
                      <Th>Document Name</Th>
                      <Th>Type</Th>
                      <Th>Date</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc, i) => (
                      <tr
                        key={doc.id}
                        className={i % 2 === 0 ? "bg-white hover:bg-slate-50/70" : "bg-blue-50/30 hover:bg-blue-50/60"}
                        style={{ transition: "background-color 150ms" }}
                      >
                        <Td className="font-semibold text-slate-800">{doc.name}</Td>
                        <Td>
                          <DocTypeBadge type={doc.type} />
                        </Td>
                        <Td>{doc.date ? formatDate(doc.date) : <Dash />}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 mt-12 print:mt-6">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-rose-400 fill-rose-400" />
            <span>NearCare Health OS</span>
          </div>
          <p className="text-center sm:text-right">
            This record was shared via NearCare. Data is read-only. Shared by the patient.
          </p>
        </div>
      </footer>

      {/* ── Print styles ─────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            margin: 1.5cm 2cm;
            size: A4;
          }
          body {
            font-size: 11pt;
            color: #0f172a;
          }
          /* Hide interactive elements */
          button { display: none !important; }
          /* Ensure tables don't break across pages mid-row */
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          /* Confidential banner always prints */
          .print\\:bg-amber-50 { background-color: #fffbeb !important; }
          /* Section headings */
          h2 { page-break-after: avoid; }
          /* Vital cards: force colors on print */
          .print-vital { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white">
        {icon}
      </span>
      <h2 className="font-bold text-slate-800 text-base">{title}</h2>
      {subtitle && (
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  fallback = "Not recorded",
  badge,
  className,
}: {
  label: string;
  value?: string | null;
  fallback?: string;
  badge?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      {badge && value ? (
        <span className="inline-block rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-sm font-bold text-rose-700">
          {value}
        </span>
      ) : (
        <p className={value ? "text-sm font-medium text-slate-800" : "text-sm text-slate-400 italic"}>
          {value ?? fallback}
        </p>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-slate-600 border-b border-slate-100 last:border-0 ${className ?? ""}`}>
      {children}
    </td>
  );
}

function Dash() {
  return <span className="text-slate-300 font-medium">—</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

const vitalColorMap = {
  rose: {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100/50",
    border: "border-rose-200",
    value: "text-rose-700",
    label: "text-rose-500",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    border: "border-blue-200",
    value: "text-blue-700",
    label: "text-blue-500",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
    border: "border-indigo-200",
    value: "text-indigo-700",
    label: "text-indigo-500",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
    border: "border-emerald-200",
    value: "text-emerald-700",
    label: "text-emerald-500",
  },
} as const;

function VitalCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | null;
  sub?: string;
  color?: keyof typeof vitalColorMap;
}) {
  const c = vitalColorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl px-5 py-5 shadow-sm print-vital`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${c.label}`}>{label}</p>
      {value ? (
        <>
          <p className={`text-2xl font-black leading-none ${c.value}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </>
      ) : (
        <p className="text-sm text-slate-400 italic">No data</p>
      )}
    </div>
  );
}

const docTypeColorMap: Record<string, string> = {
  prescription: "bg-violet-50 text-violet-700 border border-violet-200",
  lab_report: "bg-blue-50 text-blue-700 border border-blue-200",
  scan: "bg-amber-50 text-amber-700 border border-amber-200",
  other: "bg-slate-100 text-slate-600 border border-slate-200",
};

function DocTypeBadge({ type }: { type: string }) {
  const colorClass = docTypeColorMap[type] ?? docTypeColorMap.other;
  const label = { prescription: "Prescription", lab_report: "Lab Report", scan: "Scan / Imaging", other: "Other" }[type] ?? type;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}
