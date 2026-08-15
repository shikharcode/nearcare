import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs, medications } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { generateHealthSummary } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { format, subDays } from "date-fns";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(userId, "ai/summary", 60000);
  if (!allowed) {
    return Response.json(
      { error: "Please wait before generating another summary", retryAfterMs },
      { status: 429 }
    );
  }

  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [logs, meds] = await Promise.all([
    db.select().from(healthLogs).where(eq(healthLogs.userId, userId)),
    db.select().from(medications).where(eq(medications.userId, userId)),
  ]);

  const recentLogs = logs.filter(l => l.date >= sevenDaysAgo);

  const summary = await generateHealthSummary(recentLogs, meds.filter(m => m.isActive));
  return Response.json(summary);
}
