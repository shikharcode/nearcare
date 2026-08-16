import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorManagedPatients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(_request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patients = await db
    .select()
    .from(doctorManagedPatients)
    .where(eq(doctorManagedPatients.doctorUserId, userId));

  const result = patients.map((p) => ({
    ...p,
    isClaimed: p.claimedAt !== null,
    claimUrl: `${APP_URL}/claim/${p.claimToken}`,
  }));

  return Response.json({ patients: result });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });
  if (name.length > 200) return Response.json({ error: "name must be 200 characters or fewer" }, { status: 400 });

  const claimToken = randomUUID();

  const [patient] = await db
    .insert(doctorManagedPatients)
    .values({
      doctorUserId: userId,
      name,
      dateOfBirth: body.dateOfBirth ?? null,
      phone: body.phone ?? null,
      bloodType: body.bloodType ?? null,
      allergies: body.allergies ?? null,
      emergencyContact: body.emergencyContact ?? null,
      notes: body.notes ?? null,
      claimToken,
    })
    .returning();

  const claimUrl = `${APP_URL}/claim/${claimToken}`;

  // Send claim email if we have the patient's email in the body
  if (body.email && typeof body.email === "string") {
    try {
      const clerkUser = await currentUser();
      const doctorName = clerkUser?.fullName || "Your Doctor";
      await resend.emails.send({
        from: "CareBridge <noreply@carebridge.app>",
        to: body.email,
        subject: `${doctorName} has created a health profile for you`,
        html: `
          <p>Hello ${name},</p>
          <p>${doctorName} has created a health profile for you on CareBridge.</p>
          <p>Click the link below to claim your profile and gain access to your health records:</p>
          <p><a href="${claimUrl}">${claimUrl}</a></p>
          <p>This link is unique to you. Once you sign in, your health data will be linked to your account.</p>
          <p>— The CareBridge Team</p>
        `,
      });
    } catch {
      // Email failure is non-fatal
    }
  }

  return Response.json({ patient: { ...patient, isClaimed: false, claimUrl } }, { status: 201 });
}
