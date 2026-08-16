import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { familyContacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select({ userId: familyContacts.userId })
    .from(familyContacts)
    .where(eq(familyContacts.id, id));

  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(familyContacts).where(and(eq(familyContacts.id, id), eq(familyContacts.userId, userId)));
  return Response.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select({ userId: familyContacts.userId })
    .from(familyContacts)
    .where(eq(familyContacts.id, id));

  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const [contact] = await db.update(familyContacts)
    .set({ alertsEnabled: body.alertsEnabled })
    .where(and(eq(familyContacts.id, id), eq(familyContacts.userId, userId)))
    .returning();
  return Response.json(contact);
}
