import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, medications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkMedicationInteractions } from "@/lib/medication-interactions";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const meds = await db.select().from(medications)
    .where(eq(medications.userId, userId))
    .orderBy(medications.createdAt);
  return Response.json(meds);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Validate required field: name
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (!rawName) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (rawName.length > 200) {
    return Response.json({ error: "name must be 200 characters or fewer" }, { status: 400 });
  }

  // Sanitize optional string fields
  const dosage = typeof body.dosage === "string"
    ? body.dosage.trim().slice(0, 100) || null
    : null;
  const frequency = typeof body.frequency === "string"
    ? body.frequency.trim().slice(0, 100) || null
    : null;
  const notes = typeof body.notes === "string"
    ? body.notes.slice(0, 500) || null
    : null;
  const prescribedBy = typeof body.prescribedBy === "string"
    ? body.prescribedBy.trim().slice(0, 200) || null
    : null;

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [med] = await db.insert(medications).values({
    userId,
    name: rawName,
    dosage,
    frequency,
    times: body.times,
    startDate: body.startDate,
    endDate: body.endDate,
    prescribedBy,
    notes,
    isActive: true,
  }).returning();

  // Check interactions against existing active medications (non-blocking)
  let interactions = null;
  try {
    const existingMeds = await db
      .select({ name: medications.name })
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.isActive, true)));

    const existingNames = existingMeds
      .map((m) => m.name)
      .filter((n) => n !== body.name);

    if (existingNames.length > 0) {
      interactions = await checkMedicationInteractions(userId, body.name, existingNames);
    }
  } catch {
    interactions = null;
  }

  return Response.json({ ...med, interactions }, { status: 201 });
}
