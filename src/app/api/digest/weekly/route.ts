import { db } from "@/db";
import { users, healthLogs, medications } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { generateHealthSummary } from "@/lib/gemini";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function getSevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildEmailHtml(
  userName: string,
  summary: {
    overallScore: number;
    summary: string;
    highlights: string[];
    concerns: string[];
    patterns: string[];
    recommendations: string[];
  }
): string {
  const scoreColor =
    summary.overallScore >= 8
      ? "#16a34a"
      : summary.overallScore >= 5
      ? "#d97706"
      : "#dc2626";

  const scoreBg =
    summary.overallScore >= 8
      ? "#f0fdf4"
      : summary.overallScore >= 5
      ? "#fffbeb"
      : "#fef2f2";

  const listItems = (items: string[]) =>
    items.map((item) => `<li style="margin:6px 0;font-size:14px;color:#374151">${item}</li>`).join("");

  const highlights =
    summary.highlights.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-radius:12px;overflow:hidden;border:1px solid #bbf7d0">
          <tr>
            <td style="padding:10px 16px;background:#16a34a">
              <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">HIGHLIGHTS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;background:#f0fdf4">
              <ul style="margin:0;padding-left:18px">${listItems(summary.highlights)}</ul>
            </td>
          </tr>
        </table>`
      : "";

  const concerns =
    summary.concerns.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-radius:12px;overflow:hidden;border:1px solid #fde68a">
          <tr>
            <td style="padding:10px 16px;background:#d97706">
              <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">AREAS TO WATCH</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;background:#fffbeb">
              <ul style="margin:0;padding-left:18px">${listItems(summary.concerns)}</ul>
            </td>
          </tr>
        </table>`
      : "";

  const recommendations =
    summary.recommendations.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-radius:12px;overflow:hidden;border:1px solid #bfdbfe">
          <tr>
            <td style="padding:10px 16px;background:#2563eb">
              <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">RECOMMENDATIONS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;background:#eff6ff">
              <ul style="margin:0;padding-left:18px">${listItems(summary.recommendations)}</ul>
            </td>
          </tr>
        </table>`
      : "";

  const patterns =
    summary.patterns.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-radius:12px;overflow:hidden;border:1px solid #e9d5ff">
          <tr>
            <td style="padding:10px 16px;background:#7c3aed">
              <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">PATTERNS NOTICED</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;background:#faf5ff">
              <ul style="margin:0;padding-left:18px">${listItems(summary.patterns)}</ul>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:16px 16px 0 0;padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:22px;font-weight:800;color:white">NearCare</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.5px">WEEKLY HEALTH SUMMARY</p>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px">
                    <p style="margin:0;font-size:12px;color:#bfdbfe">Past 7 Days</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:28px 32px">

            <!-- Greeting -->
            <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">${summary.summary}</p>

            <!-- Health score -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;padding:20px;background:${scoreBg};border-radius:12px;border:1px solid ${scoreColor}33">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280">OVERALL HEALTH SCORE</p>
                  <p style="margin:6px 0 0;font-size:42px;font-weight:800;color:${scoreColor};line-height:1">${summary.overallScore}<span style="font-size:20px;color:#9ca3af">/10</span></p>
                </td>
                <td align="right" style="vertical-align:middle">
                  <div style="width:64px;height:64px;border-radius:50%;background:${scoreColor};display:flex;align-items:center;justify-content:center;text-align:center;line-height:64px">
                    <span style="font-size:28px">${summary.overallScore >= 8 ? "A" : summary.overallScore >= 5 ? "B" : "C"}</span>
                  </div>
                </td>
              </tr>
            </table>

            ${highlights}
            ${concerns}
            ${patterns}
            ${recommendations}

          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:white;padding:0 32px 28px">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
              <tr>
                <td align="center">
                  <p style="margin:0 0 12px;font-size:14px;color:#6b7280">Keep up the momentum — log your vitals today</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nearcare.app"}/dashboard" style="display:inline-block;padding:12px 28px;background:#2563eb;color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">Open NearCare Dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#94a3b8"><strong style="color:white">NearCare</strong> — Personal Health OS</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b">You're receiving this because you have a NearCare account. Manage your notification preferences in your profile settings.</p>
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
}

export async function POST(request: Request) {
  // Auth: accept CRON_SECRET from x-cron-secret header or Authorization: Bearer <secret>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const headerSecret = request.headers.get("x-cron-secret");
    const authHeader = request.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (headerSecret !== cronSecret && bearerSecret !== cronSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sevenDaysAgo = getSevenDaysAgo();
  const allUsers = await db.select().from(users);

  let processed = 0;
  let sent = 0;
  let errors = 0;

  for (const user of allUsers) {
    processed++;

    try {
      const logs = await db
        .select()
        .from(healthLogs)
        .where(
          and(
            eq(healthLogs.userId, user.id),
            gte(healthLogs.date, sevenDaysAgo)
          )
        );

      if (logs.length < 3) continue;

      const activeMeds = await db
        .select()
        .from(medications)
        .where(
          and(eq(medications.userId, user.id), eq(medications.isActive, true))
        );

      const summary = await generateHealthSummary(logs, activeMeds);

      const displayName = user.name || user.email.split("@")[0];

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: "Your NearCare Weekly Health Summary",
        html: buildEmailHtml(displayName, summary),
      });

      sent++;
    } catch (err) {
      errors++;
      console.error(`[digest/weekly] Error for user ${user.id}:`, err instanceof Error ? err.message : err);
    }
  }

  return Response.json({ processed, sent, errors });
}
