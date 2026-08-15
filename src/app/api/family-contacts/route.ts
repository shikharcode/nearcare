import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { familyContacts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await db.select().from(familyContacts).where(eq(familyContacts.userId, userId));
  return Response.json(contacts);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();
  const [contact] = await db.insert(familyContacts).values({
    userId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    relationship: body.relationship,
    alertsEnabled: true,
  }).returning();
  return Response.json(contact, { status: 201 });
}
