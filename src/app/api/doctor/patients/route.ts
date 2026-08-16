import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorPatients, healthLogs, medications, healthAlerts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [activeRelationships, pendingRelationships] = await Promise.all([
    db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.status, "active"))),
    db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.status, "pending"))),
  ]);

  const patients = await Promise.all(activeRelationships.map(async (rel) => {
    const [patient] = await db.select().from(users).where(eq(users.id, rel.patientUserId));
    const recentLogs = await db.select().from(healthLogs).where(eq(healthLogs.userId, rel.patientUserId)).orderBy(desc(healthLogs.date)).limit(3);
    const activeMeds = await db.select().from(medications).where(and(eq(medications.userId, rel.patientUserId), eq(medications.isActive, true)));
    const recentAlerts = await db.select().from(healthAlerts).where(eq(healthAlerts.userId, rel.patientUserId)).orderBy(desc(healthAlerts.createdAt)).limit(3);
    const lastLog = recentLogs[0] ?? null;
    // Pick the most clinically significant vital from the last log
    let lastVitalLabel: string | null = null;
    let lastVitalValue: string | null = null;
    if (lastLog) {
      if (lastLog.systolic != null && lastLog.diastolic != null) {
        lastVitalLabel = "BP";
        lastVitalValue = `${lastLog.systolic}/${lastLog.diastolic} mmHg`;
      } else if (lastLog.bloodSugar != null) {
        lastVitalLabel = "Blood Sugar";
        lastVitalValue = `${lastLog.bloodSugar} mg/dL`;
      } else if (lastLog.heartRate != null) {
        lastVitalLabel = "Heart Rate";
        lastVitalValue = `${lastLog.heartRate} bpm`;
      } else if (lastLog.oxygenSaturation != null) {
        lastVitalLabel = "SpO2";
        lastVitalValue = `${lastLog.oxygenSaturation}%`;
      } else if (lastLog.weight != null) {
        lastVitalLabel = "Weight";
        lastVitalValue = `${lastLog.weight} kg`;
      }
    }
    const hasCriticalAlert = recentAlerts.some((a) => a.severity === "critical");
    const hasWarningAlert = recentAlerts.some((a) => a.severity === "warning");
    return {
      id: rel.id,
      patientUserId: rel.patientUserId,
      name: patient?.name || "",
      email: patient?.email || "",
      lastLogDate: lastLog?.date || null,
      lastVitalLabel,
      lastVitalValue,
      hasCriticalAlert,
      hasWarningAlert,
      medications: activeMeds.map((m) => ({ id: m.id, name: m.name, isActive: m.isActive })),
      alerts: recentAlerts.map((a) => ({ id: a.id, severity: a.severity })),
    };
  }));

  const pendingInvites = pendingRelationships.map((rel) => ({
    id: rel.id,
    token: rel.inviteToken ?? "",
    createdAt: rel.createdAt,
  }));

  return Response.json({ patients, pendingInvites });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();
  const body = await request.json();
  const token = randomUUID();
  await db.insert(users).values({ id: userId, email: clerkUser?.emailAddresses[0]?.emailAddress || "", name: clerkUser?.fullName || "" }).onConflictDoNothing();
  const [rel] = await db.insert(doctorPatients).values({ doctorUserId: userId, patientUserId: userId, status: "pending", inviteToken: token }).returning();
  const doctorName = clerkUser?.fullName || "Your Doctor";
  const inviteUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/doctor-invite/" + token;
  const toEmail = body.email || body.patientEmail;
  if (toEmail) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: toEmail,
      subject: `Dr. ${doctorName} has invited you to NearCare`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px">
        <p style="margin:0;font-size:22px;font-weight:800;color:white">❤️ NearCare</p>
        <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Personal Health OS</p>
      </td></tr>
      <tr><td style="padding:28px 32px">
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827">You've been invited</h2>
        <p style="margin:0 0 20px;font-size:15px;color:#4b5563">
          <strong>Dr. ${doctorName}</strong> has invited you to share your health data on NearCare — a secure health monitoring platform for patients and caregivers.
        </p>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-size:14px;color:#0369a1;font-weight:600">What happens when you accept?</p>
          <ul style="margin:8px 0 0;padding-left:18px;color:#0369a1;font-size:13px">
            <li>Dr. ${doctorName} can view your health logs and vitals</li>
            <li>Your medications and documents stay private unless shared</li>
            <li>You can revoke access at any time</li>
          </ul>
        </div>
        <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:white;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          Accept Invitation →
        </a>
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
          Or copy this link: <span style="color:#2563eb">${inviteUrl}</span>
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6">
        <p style="margin:0;font-size:12px;color:#9ca3af">This invitation was sent via NearCare · nearcare.vercel.app · If you did not expect this, you can safely ignore it.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
    }).catch(() => {});
  }
  return Response.json({ ...rel, inviteUrl, inviteLink: inviteUrl, token });
}
