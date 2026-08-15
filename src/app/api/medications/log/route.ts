import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { medicationLogs } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { today } from "@/lib/utils";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const [log] = await db.insert(medicationLogs).values({
    userId,
    medicationId: body.medicationId,
    date: body.date || today(),
    time: body.time,
    taken: body.taken,
    skippedReason: body.skippedReason,
  }).returning();

  return Response.json(log, { status: 201 });
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Range query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  if (startDate && endDate) {
    const logs = await db.select().from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.date, startDate),
          lte(medicationLogs.date, endDate),
        )
      );
    return Response.json(logs);
  }

  // Single date query (default: today)
  const logs = await db.select().from(medicationLogs)
    .where(and(eq(medicationLogs.userId, userId), eq(medicationLogs.date, date || today())));

  return Response.json(logs);
}
