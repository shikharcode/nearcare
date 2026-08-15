import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorNotes, doctorPatients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });
  const notes = await db.select().from(doctorNotes).where(and(eq(doctorNotes.doctorUserId, userId), eq(doctorNotes.patientUserId, patientId))).orderBy(desc(doctorNotes.createdAt));
  return Response.json({ notes });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const [rel] = await db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.patientUserId, body.patientId), eq(doctorPatients.status, "active")));
  if (!rel) return Response.json({ error: "Not authorized" }, { status: 403 });
  const [note] = await db.insert(doctorNotes).values({ doctorUserId: userId, patientUserId: body.patientId, note: body.note, isPrivate: body.isPrivate || false }).returning();
  return Response.json({ note }, { status: 201 });
}
