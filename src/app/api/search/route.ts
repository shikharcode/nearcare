import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { medications, documents, healthLogs } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return Response.json({ medications: [], documents: [], logs: [] });
  }

  const pattern = `%${q}%`;

  const [meds, docs, logs] = await Promise.all([
    db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.userId, userId),
          or(
            ilike(medications.name, pattern),
            ilike(medications.notes, pattern)
          )
        )
      )
      .limit(5),

    db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          ilike(documents.name, pattern)
        )
      )
      .limit(5),

    db
      .select()
      .from(healthLogs)
      .where(
        and(
          eq(healthLogs.userId, userId),
          or(
            ilike(healthLogs.symptoms, pattern),
            ilike(healthLogs.notes, pattern)
          )
        )
      )
      .limit(5),
  ]);

  return Response.json({ medications: meds, documents: docs, logs });
}
