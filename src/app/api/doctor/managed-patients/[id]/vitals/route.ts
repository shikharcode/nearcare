import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorManagedPatients, healthLogs, doctorNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { today } from "@/lib/utils";

export async function POST(
  request: Request,
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

  const body = await request.json();

  if (patient.claimedByUserId) {
    // Patient has claimed their profile — write directly into health_logs
    const rawDate = body.date;
    const date =
      typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : today();

    const [log] = await db
      .insert(healthLogs)
      .values({
        userId: patient.claimedByUserId,
        date,
        mood: body.mood != null ? Number(body.mood) : null,
        energy: body.energy != null ? Number(body.energy) : null,
        sleep: body.sleep != null ? Number(body.sleep) : null,
        water: body.water != null ? Number(body.water) : null,
        exercise: body.exercise != null ? Number(body.exercise) : null,
        steps: body.steps != null ? Number(body.steps) : null,
        weight: body.weight != null ? Number(body.weight) : null,
        heartRate: body.heartRate != null ? Number(body.heartRate) : null,
        systolic: body.systolic != null ? Number(body.systolic) : null,
        diastolic: body.diastolic != null ? Number(body.diastolic) : null,
        bloodSugar: body.bloodSugar != null ? Number(body.bloodSugar) : null,
        temperature: body.temperature != null ? Number(body.temperature) : null,
        oxygenSaturation:
          body.oxygenSaturation != null ? Number(body.oxygenSaturation) : null,
        calories: body.calories != null ? Number(body.calories) : null,
        symptoms:
          typeof body.symptoms === "string" ? body.symptoms : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        painLevel: body.painLevel != null ? Number(body.painLevel) : null,
      })
      .returning();

    return Response.json({ log, stored: "health_logs" }, { status: 201 });
  } else {
    // Patient has not claimed yet — store vitals as a doctor note
    const [note] = await db
      .insert(doctorNotes)
      .values({
        doctorUserId: userId,
        patientUserId: id,
        note: JSON.stringify({ type: "vitals_entry", ...body }),
        isPrivate: true,
      })
      .returning();

    return Response.json({ log: note, stored: "notes" }, { status: 201 });
  }
}
