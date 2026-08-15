import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [log] = await db.update(healthLogs)
    .set({ mood: body.mood, energy: body.energy, sleep: body.sleep, water: body.water, exercise: body.exercise, symptoms: body.symptoms, notes: body.notes, painLevel: body.painLevel })
    .where(and(eq(healthLogs.id, id), eq(healthLogs.userId, userId)))
    .returning();

  if (!log) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(log);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(healthLogs).where(and(eq(healthLogs.id, id), eq(healthLogs.userId, userId)));
  return Response.json({ success: true });
}
