import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorManagedPatients, medications, doctorNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [patient] = await db
    .select()
    .from(doctorManagedPatients)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    );

  if (!patient) return Response.json({ error: "Not found" }, { status: 404 });

  const [patientMedications, notes] = await Promise.all([
    patient.claimedByUserId
      ? db
          .select()
          .from(medications)
          .where(eq(medications.userId, patient.claimedByUserId))
      : Promise.resolve([]),
    // doctorNotes uses patientUserId; for managed patients store managedPatientId as patientUserId
    db
      .select()
      .from(doctorNotes)
      .where(
        and(
          eq(doctorNotes.doctorUserId, userId),
          eq(doctorNotes.patientUserId, id)
        )
      ),
  ]);

  return Response.json({
    patient: {
      ...patient,
      isClaimed: patient.claimedAt !== null,
      claimUrl: `${APP_URL}/claim/${patient.claimToken}`,
    },
    medications: patientMedications,
    notes,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(doctorManagedPatients)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    );

  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  const updates: Partial<{
    name: string;
    dateOfBirth: string | null;
    phone: string | null;
    bloodType: string | null;
    allergies: string | null;
    emergencyContact: string | null;
    notes: string | null;
  }> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return Response.json({ error: "name cannot be empty" }, { status: 400 });
    if (name.length > 200) return Response.json({ error: "name must be 200 characters or fewer" }, { status: 400 });
    updates.name = name;
  }
  if ("dateOfBirth" in body) updates.dateOfBirth = body.dateOfBirth ?? null;
  if ("phone" in body) updates.phone = body.phone ?? null;
  if ("bloodType" in body) updates.bloodType = body.bloodType ?? null;
  if ("allergies" in body) updates.allergies = body.allergies ?? null;
  if ("emergencyContact" in body) updates.emergencyContact = body.emergencyContact ?? null;
  if ("notes" in body) updates.notes = body.notes ?? null;

  const [updated] = await db
    .update(doctorManagedPatients)
    .set(updates)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    )
    .returning();

  return Response.json({
    patient: {
      ...updated,
      isClaimed: updated.claimedAt !== null,
      claimUrl: `${APP_URL}/claim/${updated.claimToken}`,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(doctorManagedPatients)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    );

  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  if (existing.claimedAt !== null) {
    return Response.json(
      { error: "Cannot delete a claimed patient profile" },
      { status: 400 }
    );
  }

  await db
    .delete(doctorManagedPatients)
    .where(
      and(
        eq(doctorManagedPatients.id, id),
        eq(doctorManagedPatients.doctorUserId, userId)
      )
    );

  return Response.json({ success: true });
}
