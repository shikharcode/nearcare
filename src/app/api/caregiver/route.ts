import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { caregiverAccess, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(caregiverAccess)
    .where(eq(caregiverAccess.patientUserId, userId));

  return Response.json(rows);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const caregiverEmail: string = body.caregiverEmail ?? "";

  if (!caregiverEmail) {
    return Response.json({ error: "caregiverEmail is required" }, { status: 400 });
  }

  // Ensure user row exists
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const token = randomUUID();

  const [row] = await db
    .insert(caregiverAccess)
    .values({
      patientUserId: userId,
      caregiverEmail,
      token,
      canLogHealth: true,
      canViewData: true,
    })
    .returning();

  return Response.json(row, { status: 201 });
}
