import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorProfiles, doctorPatients, doctorNotes, medications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { today } from "@/lib/utils";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { patientUserId, name, dosage, frequency, duration, instructions } = body;

  if (!patientUserId || !name) {
    return Response.json({ error: "patientUserId and name are required" }, { status: 400 });
  }

  // Verify active doctor-patient relationship
  const [rel] = await db
    .select()
    .from(doctorPatients)
    .where(
      and(
        eq(doctorPatients.doctorUserId, userId),
        eq(doctorPatients.patientUserId, patientUserId),
        eq(doctorPatients.status, "active")
      )
    );

  if (!rel) {
    return Response.json({ error: "No active relationship with this patient" }, { status: 403 });
  }

  // Get doctor's profile for name and specialty
  const clerkUser = await currentUser();
  const doctorName = clerkUser?.fullName || "Unknown Doctor";

  const [doctorProfile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId));

  const prescribedBy = doctorProfile?.specialty
    ? `Dr. ${doctorName} (${doctorProfile.specialty})`
    : `Dr. ${doctorName}`;

  // Insert medication into patient's medications
  const [medication] = await db
    .insert(medications)
    .values({
      userId: patientUserId,
      name,
      dosage,
      frequency,
      prescribedBy,
      notes: instructions,
      startDate: today(),
      isActive: true,
    })
    .returning();

  // Record prescription as a doctor note
  const [note] = await db
    .insert(doctorNotes)
    .values({
      doctorUserId: userId,
      patientUserId,
      note: JSON.stringify({
        type: "prescription",
        medication: name,
        dosage,
        frequency,
        duration,
        instructions,
      }),
      isPrivate: false,
    })
    .returning();

  return Response.json({ medication, note }, { status: 201 });
}
