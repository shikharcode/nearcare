import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, healthLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Apple Health HKQuantityType / HKCategoryType identifiers
const HK_STEP_COUNT = "HKQuantityTypeIdentifierStepCount";
const HK_HEART_RATE = "HKQuantityTypeIdentifierHeartRate";
const HK_BODY_MASS = "HKQuantityTypeIdentifierBodyMass";
const HK_BP_SYSTOLIC = "HKQuantityTypeIdentifierBloodPressureSystolic";
const HK_BP_DIASTOLIC = "HKQuantityTypeIdentifierBloodPressureDiastolic";
const HK_BLOOD_GLUCOSE = "HKQuantityTypeIdentifierBloodGlucose";
const HK_OXYGEN_SAT = "HKQuantityTypeIdentifierOxygenSaturation";
const HK_SLEEP = "HKCategoryTypeIdentifierSleepAnalysis";

const SUPPORTED_TYPES = new Set([
  HK_STEP_COUNT,
  HK_HEART_RATE,
  HK_BODY_MASS,
  HK_BP_SYSTOLIC,
  HK_BP_DIASTOLIC,
  HK_BLOOD_GLUCOSE,
  HK_OXYGEN_SAT,
  HK_SLEEP,
]);

interface AppleHealthRecord {
  type: string;
  date: string; // YYYY-MM-DD
  value: number;
  unit?: string;
}

interface DayAccumulator {
  steps?: number;
  heartRateSum?: number;
  heartRateCount?: number;
  weight?: number;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
  oxygenSaturation?: number;
  sleepHours?: number;
}

function toYMD(dateStr: string): string | null {
  // Accept ISO strings like "2024-01-15T08:30:00" or "2024-01-15"
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let records: AppleHealthRecord[];
  try {
    const body = await request.json();
    if (!Array.isArray(body.records)) {
      return Response.json({ error: "Body must have a 'records' array" }, { status: 400 });
    }
    records = body.records;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Group records by date
  const byDate = new Map<string, DayAccumulator>();

  for (const rec of records) {
    if (!rec.type || !SUPPORTED_TYPES.has(rec.type)) continue;
    if (rec.value === undefined || rec.value === null) continue;

    const date = toYMD(rec.date);
    if (!date) continue;

    if (!byDate.has(date)) byDate.set(date, {});
    const day = byDate.get(date)!;

    switch (rec.type) {
      case HK_STEP_COUNT:
        day.steps = (day.steps ?? 0) + Math.round(rec.value);
        break;

      case HK_HEART_RATE:
        day.heartRateSum = (day.heartRateSum ?? 0) + rec.value;
        day.heartRateCount = (day.heartRateCount ?? 0) + 1;
        break;

      case HK_BODY_MASS:
        // Take the last reading of the day (overwrites)
        day.weight = rec.value;
        break;

      case HK_BP_SYSTOLIC:
        day.systolic = Math.round(rec.value);
        break;

      case HK_BP_DIASTOLIC:
        day.diastolic = Math.round(rec.value);
        break;

      case HK_BLOOD_GLUCOSE:
        // Apple Health stores in mmol/L; if unit explicitly says mg/dL keep as-is
        if (rec.unit === "mg/dL") {
          day.bloodSugar = rec.value;
        } else {
          // mmol/L to mg/dL
          day.bloodSugar = Math.round(rec.value * 18.0182);
        }
        break;

      case HK_OXYGEN_SAT:
        // Apple stores as decimal 0-1 or integer 0-100
        day.oxygenSaturation = rec.value <= 1 ? Math.round(rec.value * 100) : Math.round(rec.value);
        break;

      case HK_SLEEP:
        // value expected in hours; sum across sleep segments
        day.sleepHours = parseFloat(((day.sleepHours ?? 0) + rec.value).toFixed(2));
        break;
    }
  }

  if (byDate.size === 0) {
    return Response.json({ imported: 0, skipped: 0, errors: ["No supported records found"] });
  }

  // Ensure user row exists
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [date, day] of byDate) {
    const existing = await db
      .select({ id: healthLogs.id })
      .from(healthLogs)
      .where(and(eq(healthLogs.userId, userId), eq(healthLogs.date, date)))
      .limit(1);

    const avgHeartRate =
      day.heartRateSum !== undefined && day.heartRateCount
        ? Math.round(day.heartRateSum / day.heartRateCount)
        : undefined;

    if (existing.length > 0) {
      // Update only fields that came from Apple Health (leave existing user-entered fields intact)
      try {
        await db
          .update(healthLogs)
          .set({
            ...(day.steps !== undefined && { steps: day.steps }),
            ...(avgHeartRate !== undefined && { heartRate: avgHeartRate }),
            ...(day.weight !== undefined && { weight: day.weight }),
            ...(day.systolic !== undefined && { systolic: day.systolic }),
            ...(day.diastolic !== undefined && { diastolic: day.diastolic }),
            ...(day.bloodSugar !== undefined && { bloodSugar: day.bloodSugar }),
            ...(day.oxygenSaturation !== undefined && { oxygenSaturation: day.oxygenSaturation }),
            ...(day.sleepHours !== undefined && { sleep: day.sleepHours }),
          })
          .where(and(eq(healthLogs.userId, userId), eq(healthLogs.date, date)));
        imported++;
      } catch (err) {
        errors.push(`${date}: update failed — ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    } else {
      try {
        await db.insert(healthLogs).values({
          userId,
          date,
          steps: day.steps ?? null,
          heartRate: avgHeartRate ?? null,
          weight: day.weight ?? null,
          systolic: day.systolic ?? null,
          diastolic: day.diastolic ?? null,
          bloodSugar: day.bloodSugar ?? null,
          oxygenSaturation: day.oxygenSaturation ?? null,
          sleep: day.sleepHours ?? null,
        });
        imported++;
      } catch (err) {
        errors.push(`${date}: insert failed — ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    }
  }

  return Response.json({ imported, skipped, errors });
}
