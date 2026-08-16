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

function sanitizeIntRange(val: unknown, min: number, max: number): number | null {
  if (val === undefined || val === null) return null;
  const n = Number(val);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

function sanitizeNumberRange(val: unknown, min: number, max: number): number | null {
  if (val === undefined || val === null) return null;
  const n = Number(val);
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

function sanitizeString(val: unknown, maxLen: number): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length <= maxLen ? trimmed : null;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Validate/sanitize date
  const rawDate = body.date;
  const date =
    typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : today();

  // Sanitize all health fields
  const mood             = sanitizeIntRange(body.mood, 1, 5);
  const energy           = sanitizeIntRange(body.energy, 1, 5);
  const sleep            = sanitizeNumberRange(body.sleep, 0, 24);
  const heartRate        = sanitizeIntRange(body.heartRate, 20, 300);
  const systolic         = sanitizeIntRange(body.systolic, 40, 300);
  const diastolic        = sanitizeIntRange(body.diastolic, 40, 300);
  const bloodSugar       = sanitizeNumberRange(body.bloodSugar, 20, 600);
  const temperature      = sanitizeNumberRange(body.temperature, 30, 45);
  const oxygenSaturation = sanitizeIntRange(body.oxygenSaturation, 50, 100);
  const painLevel        = sanitizeIntRange(body.painLevel, 0, 10);
  const symptoms         = sanitizeString(body.symptoms, 1000);
  const notes            = sanitizeString(body.notes, 1000);

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [log] = await db.insert(healthLogs).values({
    userId, date,
    mood, energy, sleep,
    water: body.water, exercise: body.exercise, steps: body.steps, weight: body.weight,
    heartRate, systolic, diastolic,
    bloodSugar, temperature,
    oxygenSaturation, calories: body.calories,
    symptoms, notes, painLevel,
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
