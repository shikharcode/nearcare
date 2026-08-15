import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shareLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const links = await db.select().from(shareLinks).where(eq(shareLinks.userId, userId));
  return Response.json(links);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const token = randomUUID();

  const [link] = await db.insert(shareLinks).values({
    userId,
    token,
    label: body.label || "Doctor Share",
    includeDocuments: body.includeDocuments || false,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  }).returning();

  return Response.json(link, { status: 201 });
}
