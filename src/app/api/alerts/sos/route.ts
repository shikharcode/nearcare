import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs, familyContacts, users, healthAlerts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch user profile, latest health log, and alerted contacts in parallel
  const [userRows, latestLogs, contacts] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db
      .select()
      .from(healthLogs)
      .where(eq(healthLogs.userId, userId))
      .orderBy(desc(healthLogs.createdAt))
      .limit(1),
    db
      .select()
      .from(familyContacts)
      .where(and(eq(familyContacts.userId, userId), eq(familyContacts.alertsEnabled, true))),
  ]);

  const user = userRows[0];
  const latestLog = latestLogs[0] ?? null;
  const userName = user?.name ?? "Your family member";
  const emergencyContact = user?.emergencyContact ?? null;

  // Build vitals section for email
  const vitals: string[] = [];
  if (latestLog) {
    if (latestLog.heartRate)       vitals.push(`Heart Rate: <strong>${latestLog.heartRate} bpm</strong>`);
    if (latestLog.systolic && latestLog.diastolic)
      vitals.push(`Blood Pressure: <strong>${latestLog.systolic}/${latestLog.diastolic} mmHg</strong>`);
    if (latestLog.oxygenSaturation) vitals.push(`Oxygen Saturation: <strong>${latestLog.oxygenSaturation}%</strong>`);
    if (latestLog.bloodSugar)      vitals.push(`Blood Sugar: <strong>${latestLog.bloodSugar} mg/dL</strong>`);
    if (latestLog.temperature)     vitals.push(`Temperature: <strong>${latestLog.temperature}°C</strong>`);
    if (latestLog.mood)            vitals.push(`Mood: <strong>${latestLog.mood}/5</strong>`);
    if (latestLog.energy)          vitals.push(`Energy: <strong>${latestLog.energy}/5</strong>`);
    if (latestLog.sleep != null)   vitals.push(`Sleep: <strong>${latestLog.sleep} hrs</strong>`);
    if (latestLog.painLevel != null) vitals.push(`Pain Level: <strong>${latestLog.painLevel}/10</strong>`);
    if (latestLog.symptoms)        vitals.push(`Symptoms: <strong>${latestLog.symptoms}</strong>`);
  }

  const vitalsHtml = vitals.length
    ? vitals
        .map(
          (v) =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151">${v}</td></tr>`
        )
        .join("")
    : `<tr><td style="padding:8px 12px;font-size:14px;color:#6b7280">No recent vitals on record.</td></tr>`;

  const logDate = latestLog
    ? new Date(latestLog.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const emergencyContactHtml = emergencyContact
    ? `<p style="margin:8px 0 0;font-size:14px;color:#374151">Emergency Contact: <strong>${emergencyContact}</strong></p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#991b1b,#ef4444);border-radius:16px 16px 0 0;padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#fecaca;letter-spacing:1px">🚨 EMERGENCY ALERT</p>
                  <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:white">${userName} needs help</p>
                  <p style="margin:6px 0 0;font-size:13px;color:#fca5a5">Sent from NearCare · ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                </td>
                <td align="right" style="vertical-align:top">
                  <div style="font-size:48px">🆘</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:28px 32px">

            <!-- Alert banner -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:12px;background:#fef2f2;border:2px solid #fca5a5">
              <tr>
                <td style="padding:16px 20px">
                  <p style="margin:0;font-size:16px;font-weight:800;color:#991b1b">⚠️ ${userName} has triggered a manual SOS alert.</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#b91c1c">Please check on them immediately. Call or visit as soon as possible.</p>
                </td>
              </tr>
            </table>

            <!-- Person info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;letter-spacing:0.5px">PATIENT</p>
                  <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0f172a">${userName}</p>
                  ${emergencyContactHtml}
                </td>
              </tr>
            </table>

            <!-- Latest vitals -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#64748b;letter-spacing:0.5px">LATEST VITALS (logged ${logDate})</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px">
              ${vitalsHtml}
            </table>

            <!-- Action block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:16px;background:#fef2f2;border-radius:12px;border:1px solid #fca5a5">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#991b1b">IMMEDIATE ACTIONS</p>
                  <ul style="margin:8px 0 0;padding-left:16px;color:#b91c1c;font-size:14px">
                    <li style="margin:4px 0">Call ${userName} right now</li>
                    <li style="margin:4px 0">If no answer, send someone to check on them</li>
                    <li style="margin:4px 0">If in serious condition, call emergency services (911)</li>
                  </ul>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 32px">
            <p style="margin:0;font-size:13px;color:#94a3b8">❤️ <strong style="color:white">NearCare</strong> — Personal Health OS</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">This alert was manually triggered by the patient.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  let emailSent = false;

  if (contacts.length > 0) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: contacts.map((c) => c.email),
        subject: `🚨 EMERGENCY ALERT — ${userName} needs help`,
        html,
      });
      emailSent = true;
    } catch (err: unknown) {
      console.error("[sos] Resend error:", err instanceof Error ? err.message : err);
    }
  }

  // Insert health_alert record
  await db.insert(healthAlerts).values({
    userId,
    logId: latestLog?.id ?? null,
    type: "sos",
    severity: "critical",
    message: "User triggered SOS alert",
    value: null,
    emailSent,
  });

  return Response.json({
    success: true,
    notified: contacts.length,
    ...(contacts.length === 0 && { noContacts: true }),
  });
}
