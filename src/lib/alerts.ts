import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AlertResult {
  type: string;
  severity: "warning" | "critical";
  message: string;
  value: string;
}

export function checkThresholds(
  log: Record<string, any>,
  context: { exerciseMinutes?: number | null } = {}
): AlertResult[] {
  const alerts: AlertResult[] = [];
  const { exerciseMinutes } = context;

  if (log.systolic && log.diastolic) {
    if (log.systolic > 180 || log.diastolic > 120)
      alerts.push({ type: "blood_pressure", severity: "critical", message: "Blood pressure is critically high — seek immediate medical attention", value: log.systolic + "/" + log.diastolic + " mmHg" });
    else if (log.systolic > 140 || log.diastolic > 90)
      alerts.push({ type: "blood_pressure", severity: "warning", message: "Blood pressure is above normal range", value: log.systolic + "/" + log.diastolic + " mmHg" });
    else if (log.systolic < 90 || log.diastolic < 60)
      alerts.push({ type: "blood_pressure", severity: "warning", message: "Blood pressure is below normal range", value: log.systolic + "/" + log.diastolic + " mmHg" });
  }

  if (log.heartRate) {
    if (log.heartRate > 150)
      alerts.push({ type: "heart_rate", severity: "critical", message: "Heart rate is critically elevated", value: log.heartRate + " bpm" });
    else if (log.heartRate > 120 && !(exerciseMinutes != null && exerciseMinutes >= 20))
      alerts.push({ type: "heart_rate", severity: "warning", message: "Heart rate is elevated", value: log.heartRate + " bpm" });
    else if (log.heartRate < 50)
      alerts.push({ type: "heart_rate", severity: "warning", message: "Heart rate is lower than normal", value: log.heartRate + " bpm" });
  }

  if (log.bloodSugar) {
    if (log.bloodSugar < 70) {
      const lowMsg = exerciseMinutes != null && exerciseMinutes >= 30
        ? "Blood sugar low after exercise — have a snack immediately"
        : "Blood sugar is dangerously low — take action immediately";
      alerts.push({ type: "blood_sugar", severity: "critical", message: lowMsg, value: log.bloodSugar + " mg/dL" });
    } else if (log.bloodSugar > 250)
      alerts.push({ type: "blood_sugar", severity: "critical", message: "Blood sugar is critically high", value: log.bloodSugar + " mg/dL" });
    else if (log.bloodSugar > 180)
      alerts.push({ type: "blood_sugar", severity: "warning", message: "Blood sugar is above normal range", value: log.bloodSugar + " mg/dL" });
  }

  if (log.temperature) {
    if (log.temperature > 39.5)
      alerts.push({ type: "temperature", severity: "critical", message: "Very high fever detected", value: log.temperature + "°C" });
    else if (log.temperature > 37.5)
      alerts.push({ type: "temperature", severity: "warning", message: "Fever detected", value: log.temperature + "°C" });
  }

  if (log.oxygenSaturation) {
    if (log.oxygenSaturation < 90)
      alerts.push({ type: "spo2", severity: "critical", message: "Oxygen saturation is critically low — seek immediate help", value: log.oxygenSaturation + "%" });
    else if (log.oxygenSaturation < 95)
      alerts.push({ type: "spo2", severity: "warning", message: "Oxygen saturation is below normal", value: log.oxygenSaturation + "%" });
  }

  if (log.painLevel && log.painLevel >= 7)
    alerts.push({ type: "pain", severity: "warning", message: "Severe pain reported — monitor closely and contact your doctor if it persists", value: log.painLevel + "/10" });

  return alerts;
}

export async function sendAlertEmails(
  userName: string,
  userEmail: string,
  contacts: Array<{ name: string; email: string; relationship?: string | null }>,
  alerts: AlertResult[]
) {
  if (!contacts.length || !alerts.length) return;

  const criticalAlerts = alerts.filter(a => a.severity === "critical");

  const alertCards = alerts.map(a => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;border-radius:12px;overflow:hidden;border:1px solid ${a.severity === "critical" ? "#fecaca" : "#fde68a"}">
      <tr>
        <td style="padding:4px 16px;background:${a.severity === "critical" ? "#ef4444" : "#f59e0b"}">
          <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">${a.severity === "critical" ? "🔴 CRITICAL ALERT" : "⚠️ WARNING"}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:${a.severity === "critical" ? "#fff5f5" : "#fffdf0"}">
          <p style="margin:0;font-size:15px;font-weight:600;color:#111827">${a.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
          <p style="margin:6px 0 0;font-size:14px;color:#4b5563">${a.message}</p>
          <p style="margin:8px 0 0;display:inline-block;padding:4px 12px;background:${a.severity === "critical" ? "#ef4444" : "#f59e0b"};border-radius:20px;font-size:13px;font-weight:700;color:white">Recorded: ${a.value}</p>
        </td>
      </tr>
    </table>
  `).join("");

  const contactList = contacts.map(c => `${c.name} &lt;${c.email}&gt;`).join(", ");
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: contacts.map(c => c.email),
    subject: `${criticalAlerts.length > 0 ? "🔴 URGENT: " : "⚠️ "}Health Alert for ${userName}`,
    html: `
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
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:22px;font-weight:800;color:white">❤️ NearCare</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.5px">HEALTH MONITORING ALERT</p>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;display:inline-block">
                    <p style="margin:0;font-size:12px;color:white;font-weight:600">${criticalCount > 0 ? criticalCount + " CRITICAL" : ""}${criticalCount > 0 && warningCount > 0 ? " · " : ""}${warningCount > 0 ? warningCount + " WARNING" : ""}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:28px 32px">

            <!-- Person info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#64748b;font-weight:500">HEALTH LOG SUBMITTED BY</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a">${userName}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                </td>
                <td align="right" style="vertical-align:top">
                  <div style="width:48px;height:48px;background:${criticalCount > 0 ? "#fef2f2" : "#fffbeb"};border-radius:50%;text-align:center;line-height:48px;font-size:22px">${criticalCount > 0 ? "🚨" : "⚠️"}</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:15px;color:#374151">${alerts.length} health reading${alerts.length > 1 ? "s" : ""} ${alerts.length > 1 ? "were" : "was"} outside the normal range and may require attention.</p>

            <!-- Alert cards -->
            ${alertCards}

            <!-- What to do -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#15803d">✅ RECOMMENDED ACTIONS</p>
                  <ul style="margin:8px 0 0;padding-left:16px;color:#166534;font-size:14px">
                    ${criticalCount > 0 ? "<li style='margin:4px 0'>Contact a doctor or seek medical attention immediately</li>" : ""}
                    <li style="margin:4px 0">Check on ${userName} and ask how they are feeling</li>
                    <li style="margin:4px 0">Review their recent medications on NearCare</li>
                    <li style="margin:4px 0">Monitor and log vitals again in a few hours</li>
                  </ul>
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
                  <p style="margin:0;font-size:13px;color:#94a3b8">❤️ <strong style="color:white">NearCare</strong> — Personal Health OS</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b">Notifying: ${contactList}</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:11px;color:#475569">Automated health alert</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  }).catch((err: Error) => console.error("[alerts] Resend error:", err?.message ?? err));
}
