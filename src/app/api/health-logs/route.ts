import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, healthLogs, healthAlerts, familyContacts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { today } from "@/lib/utils";
import { checkThresholds, sendAlertEmails } from "@/lib/alerts";
import { detectAnomalies } from "@/lib/anomaly-detection";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 500);

  const logs = await db.select().from(healthLogs)
    .where(eq(healthLogs.userId, userId))
    .orderBy(desc(healthLogs.date))
    .limit(limit);

  return Response.json(logs);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const date = body.date || today();

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [log] = await db.insert(healthLogs).values({
    userId, date,
    mood: body.mood, energy: body.energy, sleep: body.sleep, water: body.water,
    exercise: body.exercise, steps: body.steps, weight: body.weight,
    heartRate: body.heartRate, systolic: body.systolic, diastolic: body.diastolic,
    bloodSugar: body.bloodSugar, temperature: body.temperature,
    oxygenSaturation: body.oxygenSaturation, calories: body.calories,
    symptoms: body.symptoms, notes: body.notes, painLevel: body.painLevel,
  }).returning();

  const alerts = checkThresholds(body, { exerciseMinutes: body.exercise ?? null });

  if (alerts.length > 0) {
    await db.insert(healthAlerts).values(
      alerts.map(a => ({
        userId,
        logId: log.id,
        type: a.type,
        severity: a.severity,
        message: a.message,
        value: a.value,
      }))
    );

    const contacts = await db.select().from(familyContacts).where(
      and(
        eq(familyContacts.userId, userId),
        eq(familyContacts.alertsEnabled, true)
      )
    );

    if (contacts.length > 0) {
      const clerkUser = await currentUser();
      const name = clerkUser?.fullName || clerkUser?.firstName || "Your family member";
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

      sendAlertEmails(name, email, contacts, alerts).catch((err) => {
        console.error("[alerts] Failed to send alert emails:", err?.message ?? err);
      });
    }
  }

  // Fire-and-forget AI anomaly detection — does not block the response
  detectAnomalies(userId, log).catch((err) => {
    console.error("[anomaly-detection] Background analysis failed:", err?.message ?? err);
  });

  return Response.json({ ...log, alerts }, { status: 201 });
}
