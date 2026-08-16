import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorManagedPatients, doctorPatients, doctorNotes, healthLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { today } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [managed] = await db
    .select()
    .from(doctorManagedPatients)
    .where(eq(doctorManagedPatients.claimToken, token));

  if (!managed) {
    return Response.json({ error: "Invalid claim link" }, { status: 404 });
  }

  if (managed.claimedAt) {
    return Response.json({
      alreadyClaimed: true,
      message: "This profile has already been claimed",
    });
  }

  const [doctor] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, managed.doctorUserId));

  return Response.json({
    patient: {
      name: managed.name,
      bloodType: managed.bloodType,
      allergies: managed.allergies,
      doctorName: doctor?.name ?? null,
    },
    alreadyClaimed: false,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;

  const [managed] = await db
    .select()
    .from(doctorManagedPatients)
    .where(eq(doctorManagedPatients.claimToken, token));

  if (!managed) {
    return Response.json({ error: "Invalid claim link" }, { status: 404 });
  }

  if (managed.claimedAt) {
    return Response.json({ error: "Already claimed" }, { status: 400 });
  }

  // Mark the managed patient record as claimed
  await db
    .update(doctorManagedPatients)
    .set({ claimedAt: new Date(), claimedByUserId: userId })
    .where(eq(doctorManagedPatients.id, managed.id));

  // Upsert patient profile data into the users table
  await db
    .update(users)
    .set({
      name: managed.name,
      dateOfBirth: managed.dateOfBirth ?? undefined,
      bloodType: managed.bloodType ?? undefined,
      allergies: managed.allergies ?? undefined,
      emergencyContact: managed.emergencyContact ?? undefined,
    })
    .where(eq(users.id, userId));

  // Migrate vitals stored as doctorNotes (type=vitals_entry) to real healthLogs
  const vitalsNotes = await db
    .select()
    .from(doctorNotes)
    .where(
      and(
        eq(doctorNotes.doctorUserId, managed.doctorUserId),
        eq(doctorNotes.patientUserId, managed.doctorUserId) // stored under doctorUserId as proxy patient
      )
    );

  const vitalsEntries = vitalsNotes.filter((n) => {
    try {
      const parsed = JSON.parse(n.note);
      return parsed.type === "vitals_entry";
    } catch {
      return false;
    }
  });

  for (const entry of vitalsEntries) {
    try {
      const data = JSON.parse(entry.note);
      const logDate = data.date ?? today();
      await db
        .insert(healthLogs)
        .values({
          userId,
          date: logDate,
          mood: data.mood ?? null,
          heartRate: data.heartRate ?? null,
          systolic: data.systolic ?? null,
          diastolic: data.diastolic ?? null,
          bloodSugar: data.bloodSugar ?? null,
          temperature: data.temperature ?? null,
          oxygenSaturation: data.oxygenSaturation ?? null,
          symptoms: data.symptoms ?? null,
          notes: data.notes ?? null,
          painLevel: data.painLevel ?? null,
        })
        .onConflictDoNothing();
    } catch {
      // skip malformed entries
    }
  }

  // Create the doctor-patient relationship
  await db
    .insert(doctorPatients)
    .values({
      doctorUserId: managed.doctorUserId,
      patientUserId: userId,
      status: "active",
    })
    .onConflictDoNothing();

  return Response.json({ success: true, redirectTo: "/dashboard" });
}
