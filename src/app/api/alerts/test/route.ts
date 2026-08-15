import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { familyContacts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { contactId } = body;
  if (!contactId) return Response.json({ error: "contactId is required" }, { status: 400 });

  // Fetch the contact, ensuring it belongs to this user
  const [contact] = await db
    .select()
    .from(familyContacts)
    .where(and(eq(familyContacts.id, contactId), eq(familyContacts.userId, userId)));

  if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });

  // Fetch the patient's display name
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const userName = user?.name ?? "Your loved one";

  const sentAt = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const sentAtTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: contact.email,
    subject: `[Test] NearCare alert notification for ${userName}`,
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
                  <p style="margin:0;font-size:22px;font-weight:800;color:white">&#x2764;&#xfe0f; NearCare</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.5px">TEST ALERT — NO ACTION NEEDED</p>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;display:inline-block">
                    <p style="margin:0;font-size:12px;color:white;font-weight:600">TEST</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:28px 32px">

            <!-- Notice banner -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;padding:16px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#1d4ed8">&#x1f9ea; THIS IS A TEST EMAIL</p>
                  <p style="margin:6px 0 0;font-size:14px;color:#1e40af">
                    ${userName} sent this test to confirm you are set up correctly to receive NearCare health alerts.
                    No action is needed — this is not a real health alert.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Person info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;color:#64748b;font-weight:500">YOU ARE A CONTACT FOR</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0f172a">${userName}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b">${sentAt} at ${sentAtTime}</p>
                </td>
                <td align="right" style="vertical-align:top">
                  <div style="width:48px;height:48px;background:#eff6ff;border-radius:50%;text-align:center;line-height:48px;font-size:22px">&#x1f514;</div>
                </td>
              </tr>
            </table>

            <!-- Sample alert card -->
            <p style="margin:0 0 12px;font-size:14px;color:#374151;font-weight:500">Here is what a real alert looks like:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;border-radius:12px;overflow:hidden;border:1px solid #fecaca">
              <tr>
                <td style="padding:4px 16px;background:#ef4444">
                  <p style="margin:0;font-size:12px;font-weight:700;color:white;letter-spacing:0.5px">&#x1f534; CRITICAL ALERT (SAMPLE)</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;background:#fff5f5">
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827">Blood Pressure</p>
                  <p style="margin:6px 0 0;font-size:14px;color:#4b5563">Blood pressure is critically high — seek immediate medical attention</p>
                  <p style="margin:8px 0 0;display:inline-block;padding:4px 12px;background:#ef4444;border-radius:20px;font-size:13px;font-weight:700;color:white">Recorded: 185/125 mmHg</p>
                </td>
              </tr>
            </table>

            <!-- What to do -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#15803d">&#x2705; WHEN A REAL ALERT ARRIVES</p>
                  <ul style="margin:8px 0 0;padding-left:16px;color:#166534;font-size:14px">
                    <li style="margin:4px 0">Check on ${userName} and ask how they are feeling</li>
                    <li style="margin:4px 0">For critical alerts, encourage them to contact a doctor</li>
                    <li style="margin:4px 0">Review their recent medications on NearCare</li>
                    <li style="margin:4px 0">Monitor and help log vitals again in a few hours</li>
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
                  <p style="margin:0;font-size:13px;color:#94a3b8">&#x2764;&#xfe0f; <strong style="color:white">NearCare</strong> — Personal Health OS</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b">Sent to: ${contact.name} &lt;${contact.email}&gt;</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:11px;color:#475569">Test notification</p>
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
  });

  if (error) {
    console.error("Resend test alert error:", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ success: true });
}
