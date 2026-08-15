import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { medications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.dosage !== undefined) updateFields.dosage = body.dosage;
  if (body.frequency !== undefined) updateFields.frequency = body.frequency;
  if (body.times !== undefined) updateFields.times = body.times;
  if (body.startDate !== undefined) updateFields.startDate = body.startDate;
  if (body.endDate !== undefined) updateFields.endDate = body.endDate;
  if (body.prescribedBy !== undefined) updateFields.prescribedBy = body.prescribedBy;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.isActive !== undefined) updateFields.isActive = body.isActive;

  const [med] = await db.update(medications)
    .set(updateFields)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  if (!med) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(med);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [med] = await db.update(medications)
    .set({ name: body.name, dosage: body.dosage, frequency: body.frequency, times: body.times, startDate: body.startDate, endDate: body.endDate, prescribedBy: body.prescribedBy, notes: body.notes, isActive: body.isActive })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  if (!med) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(med);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(medications).where(and(eq(medications.id, id), eq(medications.userId, userId)));
  return Response.json({ success: true });
}
