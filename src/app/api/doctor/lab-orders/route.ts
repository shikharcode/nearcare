import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { doctorPatients, doctorNotes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { patientUserId, testName, priority, instructions } = body;

  if (!patientUserId || !testName) {
    return Response.json({ error: "patientUserId and testName are required" }, { status: 400 });
  }

  // Verify active doctor-patient relationship
  const [rel] = await db
    .select()
    .from(doctorPatients)
    .where(
      and(
        eq(doctorPatients.doctorUserId, userId),
        eq(doctorPatients.patientUserId, patientUserId),
        eq(doctorPatients.status, "active")
      )
    );

  if (!rel) {
    return Response.json({ error: "No active relationship with this patient" }, { status: 403 });
  }

  const [note] = await db
    .insert(doctorNotes)
    .values({
      doctorUserId: userId,
      patientUserId,
      note: JSON.stringify({
        type: "lab_order",
        testName,
        priority,
        instructions,
        orderedAt: new Date().toISOString(),
      }),
      isPrivate: false,
    })
    .returning();

  return Response.json({ note }, { status: 201 });
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return Response.json({ error: "patientId required" }, { status: 400 });
  }

  const notes = await db
    .select()
    .from(doctorNotes)
    .where(
      and(
        eq(doctorNotes.doctorUserId, userId),
        eq(doctorNotes.patientUserId, patientId)
      )
    )
    .orderBy(desc(doctorNotes.createdAt));

  const labOrders = notes.flatMap((n) => {
    try {
      const parsed = JSON.parse(n.note);
      if (parsed.type === "lab_order") {
        return [{ ...n, parsedNote: parsed }];
      }
    } catch {
      // not valid JSON or not a lab order
    }
    return [];
  });

  return Response.json({ labOrders });
}
