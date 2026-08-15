import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorPatients, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [rel] = await db.select().from(doctorPatients).where(eq(doctorPatients.inviteToken, token));
  if (!rel) return Response.json({ error: "Invalid invite" }, { status: 404 });
  const [doctor] = await db.select().from(users).where(eq(users.id, rel.doctorUserId));
  return Response.json({ doctor, status: rel.status });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await params;
  const [rel] = await db.select().from(doctorPatients).where(eq(doctorPatients.inviteToken, token));
  if (!rel) return Response.json({ error: "Invalid invite" }, { status: 404 });
  if (rel.status !== "pending") return Response.json({ error: "Already processed" }, { status: 400 });
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();
  const [updated] = await db.update(doctorPatients).set({ status: "active", patientUserId: userId }).where(eq(doctorPatients.inviteToken, token)).returning();
  return Response.json(updated);
}
