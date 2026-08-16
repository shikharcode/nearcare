import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorManagedPatients, doctorProfiles, doctorNotes, medications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { today } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify this managed patient belongs to the authenticated doctor
  const [managed] = await db
    .select()
    .from(doctorManagedPatients)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    );

  if (!managed) {
    return Response.json({ error: "Managed patient not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, dosage, frequency, instructions, duration } = body;

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  // Build prescribedBy string from doctor profile
  const clerkUser = await currentUser();
  const doctorName = clerkUser?.fullName ?? "Unknown Doctor";

  const [doctorProfile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId));

  const prescribedBy = doctorProfile?.specialty
    ? `Dr. ${doctorName} (${doctorProfile.specialty})`
    : `Dr. ${doctorName}`;

  // If the patient has claimed their account, insert directly into medications
  if (managed.claimedByUserId) {
    const [medication] = await db
      .insert(medications)
      .values({
        userId: managed.claimedByUserId,
        name,
        dosage,
        frequency,
        prescribedBy,
        notes: instructions ?? null,
        startDate: today(),
        isActive: true,
      })
      .returning();

    return Response.json({ medication, stored: "medications" }, { status: 201 });
  }

  // Patient hasn't claimed yet — store as a doctorNote with type medication_entry
  // patientUserId is set to doctorUserId as a proxy key for unclaimed managed patients
  const [note] = await db
    .insert(doctorNotes)
    .values({
      doctorUserId: userId,
      patientUserId: userId,
      note: JSON.stringify({
        type: "medication_entry",
        managedPatientId: managed.id,
        name,
        dosage,
        frequency,
        instructions,
        duration,
        prescribedBy,
        date: today(),
      }),
      isPrivate: false,
    })
    .returning();

  return Response.json({ medication: note, stored: "notes" }, { status: 201 });
}
