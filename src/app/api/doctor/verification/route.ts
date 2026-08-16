import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_CERT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CERT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);
const MAX_REG_NUMBER_LENGTH = 50;
const MAX_STATE_COUNCIL_LENGTH = 100;
// Alphanumeric characters and dashes only
const REG_NUMBER_PATTERN = /^[a-zA-Z0-9-]+$/;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const registrationNumber = (formData.get("registrationNumber") as string | null)?.trim() ?? "";
  const stateCouncil = (formData.get("stateCouncil") as string | null)?.trim() ?? "";
  const certificate = formData.get("certificate") as File | null;

  if (!registrationNumber || !stateCouncil) {
    return Response.json({ error: "Registration number and state council required" }, { status: 400 });
  }

  // Validate registration number: max 50 chars, alphanumeric + dash only
  if (registrationNumber.length > MAX_REG_NUMBER_LENGTH) {
    return Response.json({ error: "Registration number too long (max 50 characters)" }, { status: 400 });
  }
  if (!REG_NUMBER_PATTERN.test(registrationNumber)) {
    return Response.json({ error: "Registration number must be alphanumeric and dashes only" }, { status: 400 });
  }

  // Validate state council: max 100 chars
  if (stateCouncil.length > MAX_STATE_COUNCIL_LENGTH) {
    return Response.json({ error: "State council name too long (max 100 characters)" }, { status: 400 });
  }

  // Validate certificate if provided
  if (certificate && certificate.size > 0) {
    if (certificate.size > MAX_CERT_SIZE) {
      return Response.json({ error: "Certificate file too large (max 5MB)" }, { status: 400 });
    }
    if (!ALLOWED_CERT_TYPES.has(certificate.type)) {
      return Response.json({ error: "Certificate must be a PDF, JPG, or PNG file" }, { status: 400 });
    }
  }

  // Check if user has already submitted a verification request (max 1 per user)
  const [existingProfile] = await db
    .select({ verificationSubmitted: doctorProfiles.verificationSubmitted })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId));

  if (existingProfile?.verificationSubmitted) {
    return Response.json(
      { error: "A verification request has already been submitted for this account" },
      { status: 429 }
    );
  }

  const clerkUser = await currentUser();
  const doctorName = clerkUser?.fullName || "Unknown";
  const doctorEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

  // Get doctor profile for specialty
  const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));

  // Mark verification as submitted in doctorProfiles
  await db.insert(doctorProfiles)
    .values({ userId, verificationSubmitted: true })
    .onConflictDoUpdate({
      target: doctorProfiles.userId,
      set: { verificationSubmitted: true }
    });

  // Build certificate info
  let certInfo = "No certificate uploaded";
  if (certificate && certificate.size > 0) {
    certInfo = `Certificate uploaded: ${certificate.name} (${(certificate.size / 1024).toFixed(1)} KB)`;
  }

  // Send notification email to admin for manual verification
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: "shikhar.singhal55@gmail.com",
    subject: `Doctor Verification Request — ${doctorName}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;max-width:600px">
  <h2 style="color:#2563eb">Doctor Verification Request</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#555;width:40%">Doctor Name</td><td style="padding:8px 0;font-weight:600">${doctorName}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Email</td><td style="padding:8px 0">${doctorEmail}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Specialty</td><td style="padding:8px 0">${profile?.specialty || "Not set"}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Registration Number</td><td style="padding:8px 0;font-weight:600;color:#2563eb">${registrationNumber}</td></tr>
    <tr><td style="padding:8px 0;color:#555">State Medical Council</td><td style="padding:8px 0">${stateCouncil}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Certificate</td><td style="padding:8px 0">${certInfo}</td></tr>
    <tr><td style="padding:8px 0;color:#555">User ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${userId}</td></tr>
  </table>
  <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd">
    <p style="margin:0;font-size:14px;color:#0369a1"><strong>To verify:</strong></p>
    <ol style="margin:8px 0 0;font-size:14px;color:#0369a1">
      <li>Search at <a href="https://www.nmc.org.in">nmc.org.in</a> or the state council website</li>
      <li>If verified, run in Drizzle Studio or Neon SQL:<br>
        <code style="background:#e0f2fe;padding:4px 8px;border-radius:4px;font-size:12px">UPDATE doctor_profiles SET is_verified = true WHERE user_id = '${userId}';</code>
      </li>
      <li>Doctor will see the badge on next page load</li>
    </ol>
  </div>
</body></html>`,
  }).catch(err => console.error("[verification] email failed:", err));

  // Also send confirmation to doctor
  if (doctorEmail) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: doctorEmail,
      subject: "NearCare — Verification request received",
      html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:500px">
  <h2 style="color:#2563eb">NearCare</h2>
  <p>Hi Dr. ${doctorName},</p>
  <p>We've received your verification request for registration number <strong>${registrationNumber}</strong> from ${stateCouncil}.</p>
  <p>Our team will verify against the NMC Indian Medical Register and update your profile within <strong>24-48 hours</strong>.</p>
  <p>Questions? Reply to this email or contact <a href="mailto:verify@nearcare.app">verify@nearcare.app</a></p>
  <p style="color:#888;font-size:13px">— The NearCare Team</p>
</div>`,
    }).catch(() => {});
  }

  return Response.json({ success: true, message: "Verification request submitted" });
}
