import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs, medications, medicationLogs, documents, healthAlerts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Pill,
  FileText,
  Flame,
  HeartPulse,
  Upload,
  Heart,
  Footprints,
  Moon,
  Brain,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
  Scale,
  Dumbbell,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { today, moodEmoji, moodLabel, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const todayStr = today();

  const [logs, meds, medLogs, docs, alerts] = await Promise.all([
    // Only fetch last 90 days of logs — not all time
    db.select().from(healthLogs)
      .where(eq(healthLogs.userId, userId))
      .orderBy(desc(healthLogs.date))
      .limit(90),
    db.select().from(medications).where(eq(medications.userId, userId)),
    db.select().from(medicationLogs).where(
      and(eq(medicationLogs.userId, userId), eq(medicationLogs.date, todayStr))
    ),
    // Only fetch latest 20 documents for count
    db.select({ id: documents.id }).from(documents)
      .where(eq(documents.userId, userId))
      .limit(100),
    // Only fetch recent alerts
    db.select({ id: healthAlerts.id, severity: healthAlerts.severity, type: healthAlerts.type })
      .from(healthAlerts)
      .where(eq(healthAlerts.userId, userId))
      .orderBy(desc(healthAlerts.createdAt))
      .limit(50),
  ]);

  const todayLog = logs.find((l) => l.date === todayStr);
  const activeMeds = meds.filter((m) => m.isActive);
  const recentLogs = logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const anomalyCount = alerts.filter(a => a.type === "anomaly_detected").length;

  // Streak: count consecutive days logged ending today
  const loggedDates = new Set(logs.map((l) => l.date));
  let streak = 0;
  {
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (loggedDates.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const totalActiveMedIds = new Set(activeMeds.map((m) => m.id));
  const takenActiveMedsToday = medLogs.filter(
    (ml) => ml.taken && totalActiveMedIds.has(ml.medicationId)
  ).length;

  const hasVitals =
    todayLog &&
    (todayLog.heartRate ||
      todayLog.systolic ||
      todayLog.oxygenSaturation ||
      todayLog.weight ||
      todayLog.bloodSugar ||
      todayLog.temperature ||
      todayLog.sleep ||
      todayLog.steps ||
      todayLog.water);

  const greeting = getGreeting();
  // Get first name from session claims (no extra API call)
  const fullName = (sessionClaims?.name as string) ?? (sessionClaims?.fullName as string) ?? "";
  const firstName = fullName.split(" ")[0] || "there";

  return (
    <div className="space-y-5 pb-8">
      {/* ── 1. WELCOME BANNER ── */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-xl">
        {/* decorative blob top-right */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-white/20 to-purple-400/20 blur-2xl" />
        <div className="pointer-events-none absolute right-6 top-4 h-28 w-28 rounded-full bg-white/10 blur-xl" />

        <p className="mb-1 text-sm font-medium text-blue-200">{formatDate(todayStr)}</p>
        <h1 className="text-3xl font-bold leading-tight">
          Good {greeting},{" "}
          <span className="text-white/90">{firstName}</span>
        </h1>
        <p className="mt-1.5 text-base text-blue-200">
          Here&apos;s your health overview for today
        </p>

        {streak > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Flame className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-semibold">
              {streak}-day streak — keep it up!
            </span>
          </div>
        )}
      </div>

      {/* ── 2. CHECK-IN CTA ── */}
      {todayLog ? (
        <div className="animate-fade-in-up flex items-center gap-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-green-50 px-5 py-4 shadow-md dark:border-teal-800 dark:from-teal-950 dark:to-green-950">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
            <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-teal-800 dark:text-teal-200">
              Checked in today!
            </p>
            <p className="text-sm text-teal-600 dark:text-teal-400">
              You logged {moodEmoji(todayLog.mood ?? 3)} {moodLabel(todayLog.mood ?? 3)} mood
            </p>
          </div>
          <Link href="/dashboard/checkin">
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-xl border-teal-300 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900"
            >
              Update
            </Button>
          </Link>
        </div>
      ) : (
        <div className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          {/* pulsing dot */}
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide text-green-100">
              Daily Check-in
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">How are you feeling today?</h2>
              <p className="mt-0.5 text-sm text-green-100">
                Takes just 30 seconds to track your health
              </p>
            </div>
          </div>

          <Link href="/dashboard/checkin" className="mt-5 block">
            <Button className="h-14 w-full rounded-2xl bg-white text-green-700 text-base font-bold shadow-lg hover:bg-green-50 active:scale-95 transition-all duration-200">
              <Heart className="mr-2 h-5 w-5" />
              Start Check-in
            </Button>
          </Link>
        </div>
      )}

      {/* ── 3. STAT CARDS — 2×2 mobile, 4-col desktop ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Days Logged"
          value={logs.length}
          gradient="from-blue-500 to-blue-700"
          delay="delay-75"
        />
        <StatCard
          icon={Pill}
          label="Active Meds"
          value={activeMeds.length}
          gradient="from-emerald-500 to-green-700"
          delay="delay-150"
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={docs.length}
          gradient="from-purple-500 to-violet-700"
          delay="delay-225"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={streak > 0 ? streak : 0}
          sublabel={streak === 1 ? "day" : streak > 1 ? "days" : "Start logging!"}
          gradient="from-orange-500 to-amber-600"
          delay="delay-300"
        />
      </div>

      {/* ── 4. TODAY'S VITALS PILLS ── */}
      {hasVitals && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Today&apos;s Vitals
          </h2>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {todayLog.heartRate && (
              <VitalPill
                icon={<Heart className="h-4 w-4" />}
                value={`${todayLog.heartRate}`}
                unit="bpm"
                colorClass="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              />
            )}
            {todayLog.systolic && todayLog.diastolic && (
              <VitalPill
                icon={<Activity className="h-4 w-4" />}
                value={`${todayLog.systolic}/${todayLog.diastolic}`}
                unit="mmHg"
                colorClass="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
              />
            )}
            {todayLog.oxygenSaturation && (
              <VitalPill
                icon={<Wind className="h-4 w-4" />}
                value={`${todayLog.oxygenSaturation}`}
                unit="SpO2%"
                colorClass="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
              />
            )}
            {todayLog.weight && (
              <VitalPill
                icon={<Scale className="h-4 w-4" />}
                value={`${todayLog.weight}`}
                unit="kg"
                colorClass="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              />
            )}
            {todayLog.sleep && (
              <VitalPill
                icon={<Moon className="h-4 w-4" />}
                value={`${todayLog.sleep}`}
                unit="hrs sleep"
                colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              />
            )}
            {todayLog.steps && (
              <VitalPill
                icon={<Footprints className="h-4 w-4" />}
                value={todayLog.steps.toLocaleString()}
                unit="steps"
                colorClass="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              />
            )}
            {todayLog.water && (
              <VitalPill
                icon={<Droplets className="h-4 w-4" />}
                value={`${todayLog.water}`}
                unit="L water"
                colorClass="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              />
            )}
            {todayLog.bloodSugar && (
              <VitalPill
                icon={<Activity className="h-4 w-4" />}
                value={`${todayLog.bloodSugar}`}
                unit="mg/dL"
                colorClass="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
              />
            )}
            {todayLog.temperature && (
              <VitalPill
                icon={<Thermometer className="h-4 w-4" />}
                value={`${todayLog.temperature}`}
                unit="°C"
                colorClass="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              />
            )}
          </div>
        </div>
      )}

      {/* ── SHORTCUT PILLS: AI Insights + Anomalies ── */}
      <div className="flex flex-wrap gap-2.5">
        <Link href="/dashboard/insights">
          <div className="flex h-11 items-center gap-2.5 rounded-2xl border border-violet-200 bg-violet-50 px-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:hover:bg-violet-900">
            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              AI Insights
            </span>
          </div>
        </Link>
        {anomalyCount > 0 && (
          <Link href="/dashboard/anomalies">
            <div className="flex h-11 items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {anomalyCount} {anomalyCount === 1 ? "Anomaly" : "Anomalies"}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* ── 5. RECENT LOGS ── */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <HeartPulse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </span>
              Recent Logs
            </span>
            <Link href="/dashboard/health-log">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                View all
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950">
                <HeartPulse className="h-10 w-10 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  No health logs yet
                </p>
                <p className="mt-1 max-w-[260px] text-sm text-gray-500 dark:text-gray-400">
                  Your first log starts your streak. Tap below to record today&apos;s data.
                </p>
              </div>
              <Link href="/dashboard/health-log">
                <Button className="h-12 rounded-2xl gap-2 bg-blue-600 px-6 text-base font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200">
                  <HeartPulse className="h-5 w-5" />
                  Log Today
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentLogs.map((log) => {
                const moodBorderColor =
                  log.mood === 5
                    ? "border-l-green-500"
                    : log.mood === 4
                    ? "border-l-teal-500"
                    : log.mood === 3
                    ? "border-l-blue-400"
                    : log.mood === 2
                    ? "border-l-orange-400"
                    : log.mood === 1
                    ? "border-l-red-500"
                    : "border-l-gray-300";

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start justify-between rounded-xl border-l-4 px-4 py-3.5 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900/50",
                      moodBorderColor
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                        {formatDate(log.date)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {log.sleep != null && (
                          <VitalChip
                            icon={<Moon className="h-3.5 w-3.5" />}
                            label={`${log.sleep}h`}
                            colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          />
                        )}
                        {log.steps != null && (
                          <VitalChip
                            icon={<Footprints className="h-3.5 w-3.5" />}
                            label={log.steps.toLocaleString()}
                            colorClass="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          />
                        )}
                        {log.heartRate != null && (
                          <VitalChip
                            icon={<Heart className="h-3.5 w-3.5" />}
                            label={`${log.heartRate} bpm`}
                            colorClass="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          />
                        )}
                        {log.exercise != null && log.exercise > 0 && (
                          <VitalChip
                            icon={<Dumbbell className="h-3.5 w-3.5" />}
                            label={`${log.exercise}m`}
                            colorClass="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          />
                        )}
                      </div>
                    </div>
                    {log.mood && (
                      <div className="ml-3 flex flex-shrink-0 flex-col items-center gap-0.5">
                        <span className="text-2xl leading-none">{moodEmoji(log.mood)}</span>
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                          {moodLabel(log.mood)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── ACTIVE MEDICATIONS ── */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              Medications
              {activeMeds.length > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold",
                    takenActiveMedsToday === activeMeds.length
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  )}
                >
                  {takenActiveMedsToday}/{activeMeds.length} today
                </span>
              )}
            </span>
            <Link href="/dashboard/medications">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                Manage
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMeds.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950">
                <Pill className="h-10 w-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  No medications yet
                </p>
                <p className="mt-1 max-w-[260px] text-sm text-gray-500 dark:text-gray-400">
                  Add your prescriptions to track daily check-ins and never miss a dose.
                </p>
              </div>
              <Link href="/dashboard/medications">
                <Button
                  variant="outline"
                  className="h-12 rounded-2xl gap-2 border-emerald-300 px-6 text-base font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all duration-200 dark:border-emerald-700 dark:text-emerald-300"
                >
                  <Pill className="h-5 w-5" />
                  Add Medication
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {activeMeds.map((med) => {
                const isTakenToday = medLogs.some(
                  (ml) => ml.medicationId === med.id && ml.taken
                );
                return (
                  <div
                    key={med.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                          isTakenToday
                            ? "bg-green-100 dark:bg-green-950"
                            : "bg-amber-100 dark:bg-amber-950"
                        )}
                      >
                        <Pill
                          className={cn(
                            "h-5 w-5",
                            isTakenToday
                              ? "text-green-600 dark:text-green-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                          {med.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {med.dosage}
                          {med.frequency ? ` · ${med.frequency}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        isTakenToday
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      )}
                    >
                      {isTakenToday ? "✓ Taken" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 6. QUICK ACTIONS ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/dashboard/health-log" className="block">
            <div className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95">
              <HeartPulse className="h-5 w-5" />
              <span className="text-xs font-bold">Log Health</span>
            </div>
          </Link>
          <Link href="/dashboard/medications" className="block">
            <div className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95">
              <Pill className="h-5 w-5" />
              <span className="text-xs font-bold">Medications</span>
            </div>
          </Link>
          <Link href="/dashboard/documents" className="block">
            <div className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95">
              <Upload className="h-5 w-5" />
              <span className="text-xs font-bold">Documents</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  gradient: string;
  delay: string;
  sublabel?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in-up relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-200 hover:scale-[1.02]",
        `bg-gradient-to-br ${gradient}`,
        delay
      )}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-4xl font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-sm font-medium text-white/80">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-white/60">{sublabel}</p>
      )}
    </div>
  );
}

function VitalPill({
  icon,
  value,
  unit,
  colorClass,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  colorClass: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold",
        colorClass
      )}
    >
      {icon}
      <span>{value}</span>
      <span className="font-normal opacity-70">{unit}</span>
    </span>
  );
}

function VitalChip({
  icon,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
        colorClass
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
