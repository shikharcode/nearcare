import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthAlerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const alerts = await db.select().from(healthAlerts)
    .where(eq(healthAlerts.userId, userId))
    .orderBy(desc(healthAlerts.createdAt))
    .limit(100);

  const result = type ? alerts.filter(a => a.type === type) : alerts;
  return Response.json(result);
}
