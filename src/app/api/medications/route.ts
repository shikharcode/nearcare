import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, medications } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [med] = await db.insert(medications).values({
    userId,
    name: body.name,
    dosage: body.dosage,
    frequency: body.frequency,
    times: body.times,
    startDate: body.startDate,
    endDate: body.endDate,
    prescribedBy: body.prescribedBy,
    notes: body.notes,
    isActive: true,
  }).returning();

  return Response.json(med, { status: 201 });
}
