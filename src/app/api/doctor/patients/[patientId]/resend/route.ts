import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorPatients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await params;

  const [rel] = await db
    .select()
    .from(doctorPatients)
    .where(
      and(
        eq(doctorPatients.id, patientId),
        eq(doctorPatients.doctorUserId, userId),
        eq(doctorPatients.status, "pending")
      )
    );

  if (!rel) return Response.json({ error: "Not found" }, { status: 404 });
  if (!rel.inviteToken) return Response.json({ error: "No invite token" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const toEmail: string | undefined = body.email;
  if (!toEmail) return Response.json({ error: "Email is required" }, { status: 400 });

  const clerkUser = await currentUser();
  const doctorName = clerkUser?.fullName || "Your Doctor";
  const inviteUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
    "/doctor-invite/" +
    rel.inviteToken;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: toEmail,
    subject: "Dr. " + doctorName + " wants to monitor your health on NearCare",
    html:
      "<div style='font-family:sans-serif;padding:24px'><h2>NearCare Doctor Invitation</h2><p>Dr. <strong>" +
      doctorName +
      "</strong> has invited you to connect on NearCare.</p><a href='" +
      inviteUrl +
      "' style='display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none'>Accept Invitation</a></div>",
  });

  return Response.json({ success: true });
}
