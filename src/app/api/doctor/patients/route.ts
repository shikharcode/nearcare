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
    return {
      id: rel.id,
      patientUserId: rel.patientUserId,
      name: patient?.name || "",
      email: patient?.email || "",
      lastLogDate: recentLogs[0]?.date || null,
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
    await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev", to: toEmail,
      subject: "Dr. " + doctorName + " wants to monitor your health on NearCare",
      html: "<div style='font-family:sans-serif;padding:24px'><h2>NearCare Doctor Invitation</h2><p>Dr. <strong>" + doctorName + "</strong> has invited you to connect on NearCare.</p><a href='" + inviteUrl + "' style='display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none'>Accept Invitation</a></div>",
    }).catch(() => {});
  }
  return Response.json({ ...rel, inviteUrl, inviteLink: inviteUrl, token });
}
