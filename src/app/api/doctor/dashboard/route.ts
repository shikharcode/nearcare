import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  doctorProfiles,
  doctorPatients,
  doctorNotes,
  healthLogs,
  healthAlerts,
} from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { users } from "@/db/schema";
import { format, subDays } from "date-fns";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // One week ago timestamp for notes
  const oneWeekAgo = subDays(new Date(), 7);

  // Fetch all in parallel where possible
  const [profile, activeRelationships, pendingRelationships] = await Promise.all([
    db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId)).then((r) => r[0] ?? null),
    db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.status, "active"))),
    db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.status, "pending"))),
  ]);

  const totalPatients = activeRelationships.length;
  const pendingInvites = pendingRelationships.length;

  // For each active patient, fetch their recent logs, alerts, and build activity
  const patientDetails = await Promise.all(
    activeRelationships.map(async (rel) => {
      const [patient, recentLogs, recentAlerts] = await Promise.all([
        db.select().from(users).where(eq(users.id, rel.patientUserId)).then((r) => r[0] ?? null),
        db
          .select()
          .from(healthLogs)
          .where(eq(healthLogs.userId, rel.patientUserId))
          .orderBy(desc(healthLogs.date))
          .limit(2),
        db
          .select()
          .from(healthAlerts)
          .where(eq(healthAlerts.userId, rel.patientUserId))
          .orderBy(desc(healthAlerts.createdAt))
          .limit(5),
      ]);

      const latestLog = recentLogs[0] ?? null;
      const loggedRecently =
        latestLog?.date === today || latestLog?.date === yesterday;

      // Build a human-readable activity summary from the log
      let activitySummary: string | null = null;
      if (loggedRecently && latestLog) {
        const parts: string[] = [];
        if (latestLog.systolic && latestLog.diastolic) {
          const bpFlag =
            latestLog.systolic >= 140 || latestLog.diastolic >= 90 ? " ⚠️" : "";
          parts.push(`BP ${latestLog.systolic}/${latestLog.diastolic}${bpFlag}`);
        }
        if (latestLog.heartRate) {
          const hrFlag =
            latestLog.heartRate > 100 || latestLog.heartRate < 50 ? " ⚠️" : "";
          parts.push(`HR ${latestLog.heartRate} bpm${hrFlag}`);
        }
        if (latestLog.bloodSugar) {
          const bsFlag = latestLog.bloodSugar > 180 ? " ⚠️" : "";
          parts.push(`BG ${latestLog.bloodSugar} mg/dL${bsFlag}`);
        }
        if (latestLog.oxygenSaturation) {
          const o2Flag = latestLog.oxygenSaturation < 95 ? " ⚠️" : "";
          parts.push(`SpO2 ${latestLog.oxygenSaturation}%${o2Flag}`);
        }
        if (latestLog.weight) parts.push(`${latestLog.weight} kg`);
        if (latestLog.mood) {
          const labels = ["", "Terrible", "Bad", "Okay", "Good", "Great"];
          parts.push(`Mood: ${labels[latestLog.mood] ?? latestLog.mood}`);
        }
        activitySummary =
          parts.length > 0 ? parts.join(", ") : "logged vitals";
      }

      // Critical/warning alerts for this patient
      const criticalAlerts = recentAlerts.filter((a) => a.severity === "critical");
      const warningAlerts = recentAlerts.filter((a) => a.severity === "warning");

      return {
        id: rel.id,
        patientUserId: rel.patientUserId,
        name: patient?.name ?? null,
        email: patient?.email ?? "",
        loggedRecently,
        logDate: latestLog?.date ?? null,
        activitySummary,
        criticalAlerts: criticalAlerts.map((a) => ({
          id: a.id,
          message: a.message,
          type: a.type,
          createdAt: a.createdAt,
        })),
        warningAlerts: warningAlerts.map((a) => ({
          id: a.id,
          message: a.message,
          type: a.type,
          createdAt: a.createdAt,
        })),
        hasCritical: criticalAlerts.length > 0,
      };
    })
  );

  // Notes written this week by this doctor
  const notesThisWeek = await db
    .select()
    .from(doctorNotes)
    .where(and(eq(doctorNotes.doctorUserId, userId), gte(doctorNotes.createdAt, oneWeekAgo)));

  // Patients with critical alerts count
  const criticalPatientsCount = patientDetails.filter((p) => p.hasCritical).length;

  // Recent activity — patients who logged today or yesterday
  const recentActivity = patientDetails
    .filter((p) => p.loggedRecently)
    .map((p) => ({
      patientUserId: p.patientUserId,
      name: p.name,
      email: p.email,
      logDate: p.logDate,
      activitySummary: p.activitySummary,
      hasCritical: p.hasCritical,
    }));

  // Critical alerts list — all critical alerts across all patients
  const criticalAlertsList = patientDetails
    .filter((p) => p.criticalAlerts.length > 0)
    .flatMap((p) =>
      p.criticalAlerts.map((a) => ({
        alertId: a.id,
        patientUserId: p.patientUserId,
        patientName: p.name,
        patientEmail: p.email,
        message: a.message,
        type: a.type,
        createdAt: a.createdAt,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  return Response.json({
    profile,
    totalPatients,
    pendingInvites,
    criticalPatientsCount,
    notesThisWeek: notesThisWeek.length,
    recentActivity,
    criticalAlertsList,
  });
}
