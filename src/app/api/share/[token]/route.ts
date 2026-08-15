import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shareLinks, healthLogs, medications, documents } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [link] = await db.select().from(shareLinks).where(eq(shareLinks.token, token));

  if (!link) return Response.json({ error: "Share link not found" }, { status: 404 });
  if (link.expiresAt && link.expiresAt < new Date()) {
    return Response.json({ error: "Share link has expired" }, { status: 410 });
  }

  const [logs, meds] = await Promise.all([
    db.select().from(healthLogs).where(eq(healthLogs.userId, link.userId)),
    db.select().from(medications).where(eq(medications.userId, link.userId)),
  ]);

  const docs = link.includeDocuments
    ? await db.select().from(documents).where(eq(documents.userId, link.userId))
    : [];

  return Response.json({ logs, medications: meds, documents: docs, label: link.label });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await params;
  await db.delete(shareLinks).where(and(eq(shareLinks.token, token), eq(shareLinks.userId, userId)));
  return Response.json({ success: true });
}
