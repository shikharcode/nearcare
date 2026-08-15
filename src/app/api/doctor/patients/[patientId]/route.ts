import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorPatients, healthLogs, medications, documents, healthAlerts, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { patientId } = await params;
  const [rel] = await db.select().from(doctorPatients).where(and(eq(doctorPatients.doctorUserId, userId), eq(doctorPatients.patientUserId, patientId), eq(doctorPatients.status, "active")));
  if (!rel) return Response.json({ error: "Not authorized" }, { status: 403 });
  const [patient, logs, meds, docs, alerts] = await Promise.all([
    db.select().from(users).where(eq(users.id, patientId)).then(r => r[0]),
    db.select().from(healthLogs).where(eq(healthLogs.userId, patientId)).orderBy(desc(healthLogs.date)).limit(30),
    db.select().from(medications).where(eq(medications.userId, patientId)),
    db.select().from(documents).where(eq(documents.userId, patientId)),
    db.select().from(healthAlerts).where(eq(healthAlerts.userId, patientId)).orderBy(desc(healthAlerts.createdAt)).limit(20),
  ]);
  const patientDetail = { ...patient, patientUserId: patientId, healthLogs: logs, medications: meds, alerts };
  return Response.json({ patient: patientDetail, documents: docs });
}

// DELETE — cancel a pending invite or remove an active patient relationship
export async function DELETE(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { patientId } = await params;
  const [rel] = await db.select().from(doctorPatients).where(
    and(eq(doctorPatients.id, patientId), eq(doctorPatients.doctorUserId, userId))
  );
  if (!rel) return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(doctorPatients).where(
    and(eq(doctorPatients.id, patientId), eq(doctorPatients.doctorUserId, userId))
  );
  return Response.json({ success: true });
}
