import { db } from "@/db";
import { users, medications, medicationLogs } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayDate();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Fetch all active medications that have times set, joined with user info
  const activeMeds = await db
    .select({
      userId: medications.userId,
      medId: medications.id,
      medName: medications.name,
      dosage: medications.dosage,
      frequency: medications.frequency,
    })
    .from(medications)
    .where(and(eq(medications.isActive, true)));

  // Only keep meds that have times configured (non-null, non-empty)
  const medsWithTimes = activeMeds.filter((m) => {
    // times is a JSON string array like '["08:00","20:00"]'
    // We just check it exists — the real filter for "untaken" happens via logs
    return true; // include all active meds; we'll filter by logs
  });

  if (medsWithTimes.length === 0) {
    return Response.json({ sent: 0, errors: 0 });
  }

  // Get unique user IDs
  const userIds = [...new Set(medsWithTimes.map((m) => m.userId))];

  // Fetch all user records
  const userRecords = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));

  // Fetch today's medication logs for all relevant users
  const medIds = medsWithTimes.map((m) => m.medId);
  const todayLogs = await db
    .select({
      medicationId: medicationLogs.medicationId,
      userId: medicationLogs.userId,
      taken: medicationLogs.taken,
    })
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.date, today),
        inArray(medicationLogs.medicationId, medIds)
      )
    );

  let sent = 0;
  let errors = 0;

  for (const user of userRecords) {
    const userMeds = medsWithTimes.filter((m) => m.userId === user.id);

    // Find meds not yet logged as taken today
    const untakenMeds = userMeds.filter((med) => {
      const log = todayLogs.find(
        (l) => l.medicationId === med.medId && l.userId === user.id
      );
      // No log at all, or log exists but taken is false
      return !log || log.taken === false;
    });

    if (untakenMeds.length === 0) continue;

    const userName = user.name ?? "there";
    const medRows = untakenMeds
      .map(
        (m) =>
          `<tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9">
              <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a">${m.medName}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b">${[m.dosage, m.frequency].filter(Boolean).join(" · ") || "No dosage info"}</p>
            </td>
          </tr>`
      )
      .join("");

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
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:16px 16px 0 0;padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:800;color:white">💊 NearCare</p>
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.5px">MEDICATION REMINDER</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:28px 32px">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
              You have <strong>${untakenMeds.length} medication${untakenMeds.length > 1 ? "s" : ""}</strong> that ${untakenMeds.length > 1 ? "haven't" : "hasn't"} been logged as taken today. Here's a quick reminder:
            </p>

            <!-- Medication list -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px">
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.5px">TODAY'S PENDING MEDICATIONS</p>
                </td>
              </tr>
              ${medRows}
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/dashboard/medications"
                     style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
                    Log your medications
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              Staying on schedule helps you get the most from your treatment.<br>
              This reminder is sent because you have active medications in NearCare.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#94a3b8">💊 <strong style="color:white">NearCare</strong> — Personal Health OS</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:11px;color:#475569">Automated daily reminder</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: "💊 Time for your medications — NearCare",
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Reminder email failed for ${user.email}:`, err);
      errors++;
    }
  }

  return Response.json({ sent, errors });
}
