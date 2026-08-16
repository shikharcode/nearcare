/**
 * NearCare — Test Data Seeding Script
 *
 * Creates realistic dummy data for a 62-year-old Indian male with
 * hypertension and pre-diabetes. Safe to run multiple times.
 *
 * Usage:
 *   npm run seed
 *   TEST_USER_ID=user_xxxx npm run seed
 */

import "dotenv/config";
import { subDays, format } from "date-fns";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db/index";
import {
  users,
  healthLogs,
  medications,
  medicationLogs,
  familyContacts,
  healthAlerts,
  shareLinks,
} from "../src/db/schema";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const testUserId = process.env.TEST_USER_ID || "user_test_nearcare_demo";

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

// ---------------------------------------------------------------------------
// Counters for summary
// ---------------------------------------------------------------------------

const summary = {
  user: 0,
  healthLogs: 0,
  medications: 0,
  medicationLogs: 0,
  familyContacts: 0,
  healthAlerts: 0,
  shareLinks: 0,
};

// ---------------------------------------------------------------------------
// 1. Seed User
// ---------------------------------------------------------------------------

async function seedUser(): Promise<void> {
  console.log("\n[1/7] Seeding user...");
  try {
    await db
      .insert(users)
      .values({
        id: testUserId,
        email: "demo@nearcare.app",
        name: "Rajan Sharma",
        dateOfBirth: "1964-03-15",
        bloodType: "B+",
        allergies: "Penicillin",
        emergencyContact: "Priya Sharma +91 98765 43210",
      })
      .onConflictDoNothing();
    summary.user = 1;
    console.log(`   Created user: Rajan Sharma (${testUserId})`);
  } catch (err) {
    console.error("   Error seeding user:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Helpers for realistic data variation
// ---------------------------------------------------------------------------

/** Pseudo-random deterministic value in [min, max] seeded by day offset */
function vary(min: number, max: number, seed: number): number {
  // Simple LCG-style spread — deterministic per seed, no external dependency
  const t = Math.abs(Math.sin(seed * 9301 + 49297)) % 1;
  return Math.round((min + t * (max - min)) * 10) / 10;
}

function pickSymptoms(seed: number): string | null {
  const pool = ["headache", "fatigue", "dizziness", "shortness of breath", "blurred vision"];
  // ~30% chance of having a symptom
  if (vary(0, 9, seed + 77) < 3) {
    const idx = Math.floor(vary(0, pool.length - 1, seed + 13));
    // occasionally two symptoms
    if (vary(0, 9, seed + 91) > 7) {
      const idx2 = (idx + 2) % pool.length;
      return `${pool[idx]},${pool[idx2]}`;
    }
    return pool[idx];
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. Seed Health Logs — 30 days, with 5 gaps
// ---------------------------------------------------------------------------

// Days to skip (to simulate logging gaps), expressed as daysAgo values
const GAP_DAYS = new Set([3, 8, 14, 21, 27]);

async function seedHealthLogs(): Promise<void> {
  console.log("\n[2/7] Seeding health logs (30 days)...");

  const rows = [];

  for (let i = 0; i < 30; i++) {
    if (GAP_DAYS.has(i)) continue; // intentional gap

    const seed = i + 1;

    // Occasional critical spikes on specific days
    const bpCritical = [5, 17].includes(i);
    const sugarHigh = [10, 22].includes(i);

    const systolic = bpCritical ? 155 : Math.round(vary(135, 147, seed));
    const diastolic = bpCritical ? 98 : Math.round(vary(85, 93, seed + 5));
    const bloodSugar = sugarHigh ? 185 : Math.round(vary(138, 172, seed + 3));

    // Weight drifts slightly upward over the month (index 29 = oldest)
    const weight = Math.round((78 + (29 - i) * 0.04 + vary(-0.3, 0.3, seed + 7)) * 10) / 10;

    rows.push({
      userId: testUserId,
      date: dateStr(i),
      mood: Math.round(vary(2, 4, seed + 11)),
      energy: Math.round(vary(2, 4, seed + 19)),
      sleep: Math.round(vary(5.5, 7.0, seed + 23) * 10) / 10,
      water: Math.round(vary(1.5, 2.5, seed + 31) * 10) / 10,
      exercise: Math.round(vary(0, 20, seed + 37)),
      steps: Math.round(vary(2000, 5000, seed + 41)),
      weight,
      heartRate: Math.round(vary(68, 82, seed + 47)),
      systolic,
      diastolic,
      bloodSugar,
      temperature: Math.round(vary(36.4, 37.1, seed + 53) * 10) / 10,
      oxygenSaturation: Math.round(vary(96, 99, seed + 59)),
      calories: Math.round(vary(1800, 2400, seed + 67)),
      symptoms: pickSymptoms(seed),
      notes: null,
      painLevel: Math.round(vary(0, 3, seed + 73)),
    });
  }

  let inserted = 0;
  for (const row of rows) {
    try {
      // Check if a log for this date already exists
      const existing = await db
        .select({ id: healthLogs.id })
        .from(healthLogs)
        .where(and(eq(healthLogs.userId, testUserId), eq(healthLogs.date, row.date)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(healthLogs).values(row);
        inserted++;
      } else {
        // Already exists — skip (idempotent)
      }
    } catch (err) {
      console.error(`   Error inserting log for ${row.date}:`, (err as Error).message);
    }
  }

  summary.healthLogs = inserted;
  console.log(`   Inserted ${inserted} health logs (${GAP_DAYS.size} days intentionally skipped)`);
}

// ---------------------------------------------------------------------------
// 3. Seed Medications
// ---------------------------------------------------------------------------

const MED_DEFS = [
  {
    name: "Metformin",
    dosage: "500mg",
    frequency: "twice daily",
    times: JSON.stringify(["08:00", "20:00"]),
    startDate: dateStr(90),
    endDate: null,
    prescribedBy: "Dr. Arvind Kumar",
    notes: "Take with meals. For type 2 diabetes management.",
    isActive: true,
  },
  {
    name: "Amlodipine",
    dosage: "5mg",
    frequency: "once daily",
    times: JSON.stringify(["08:00"]),
    startDate: dateStr(180),
    endDate: null,
    prescribedBy: "Dr. Arvind Kumar",
    notes: "Calcium channel blocker for hypertension.",
    isActive: true,
  },
  {
    name: "Aspirin",
    dosage: "75mg",
    frequency: "once daily",
    times: JSON.stringify(["08:00"]),
    startDate: dateStr(60),
    endDate: null,
    prescribedBy: "Dr. Arvind Kumar",
    notes: "Low-dose antiplatelet therapy.",
    isActive: true,
  },
  {
    name: "Vitamin D3",
    dosage: "60000 IU",
    frequency: "weekly",
    times: JSON.stringify(["09:00"]),
    startDate: dateStr(365),
    endDate: dateStr(180),
    prescribedBy: null,
    notes: "Discontinued after Vitamin D levels normalised.",
    isActive: false,
  },
] as const;

// We need the inserted IDs to seed medication_logs, so store them here.
const insertedMedIds: Record<string, string> = {};

async function seedMedications(): Promise<void> {
  console.log("\n[3/7] Seeding medications...");

  let inserted = 0;
  for (const med of MED_DEFS) {
    try {
      // Check by name + userId to stay idempotent
      const existing = await db
        .select({ id: medications.id })
        .from(medications)
        .where(and(eq(medications.userId, testUserId), eq(medications.name, med.name)))
        .limit(1);

      if (existing.length > 0) {
        insertedMedIds[med.name] = existing[0].id;
        continue;
      }

      const [row] = await db
        .insert(medications)
        .values({ userId: testUserId, ...med })
        .returning({ id: medications.id });

      insertedMedIds[med.name] = row.id;
      inserted++;
    } catch (err) {
      console.error(`   Error inserting medication ${med.name}:`, (err as Error).message);
    }
  }

  summary.medications = inserted;
  console.log(`   Inserted ${inserted} medications (${MED_DEFS.length - inserted} already existed)`);
}

// ---------------------------------------------------------------------------
// 4. Seed Medication Logs — last 14 days
// ---------------------------------------------------------------------------

// Adherence config: day indices (0 = today) on which each med is MISSED
const METFORMIN_MISSED_DAYS = new Set([2, 6, 10]); // ~85% (miss 3 of 14 * 2 doses)
const ASPIRIN_MISSED_DAYS = new Set([1, 4, 7, 9]); // ~70% (miss 4 of 14)
// Amlodipine: 100% adherence — never missed

async function seedMedicationLogs(): Promise<void> {
  console.log("\n[4/7] Seeding medication logs (14 days)...");

  const metforminId = insertedMedIds["Metformin"];
  const amlodipineId = insertedMedIds["Amlodipine"];
  const aspirinId = insertedMedIds["Aspirin"];

  if (!metforminId || !amlodipineId || !aspirinId) {
    console.error("   Skipping medication logs — one or more medication IDs missing.");
    return;
  }

  let inserted = 0;

  for (let i = 0; i < 14; i++) {
    const date = dateStr(i);

    // Metformin — twice daily (AM + PM)
    for (const dose of [
      { time: "08:00", missedSet: METFORMIN_MISSED_DAYS },
      { time: "20:00", missedSet: METFORMIN_MISSED_DAYS },
    ]) {
      const taken = !dose.missedSet.has(i);
      try {
        const existing = await db
          .select({ id: medicationLogs.id })
          .from(medicationLogs)
          .where(
            and(
              eq(medicationLogs.userId, testUserId),
              eq(medicationLogs.medicationId, metforminId),
              eq(medicationLogs.date, date),
              eq(medicationLogs.time, dose.time)
            )
          )
          .limit(1);
        if (existing.length === 0) {
          await db.insert(medicationLogs).values({
            userId: testUserId,
            medicationId: metforminId,
            date,
            time: dose.time,
            taken,
            skippedReason: taken ? null : "Forgot",
          });
          inserted++;
        }
      } catch (err) {
        console.error(`   Error inserting Metformin log ${date} ${dose.time}:`, (err as Error).message);
      }
    }

    // Amlodipine — once daily, 100% adherence
    try {
      const existing = await db
        .select({ id: medicationLogs.id })
        .from(medicationLogs)
        .where(
          and(
            eq(medicationLogs.userId, testUserId),
            eq(medicationLogs.medicationId, amlodipineId),
            eq(medicationLogs.date, date),
            eq(medicationLogs.time, "08:00")
          )
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(medicationLogs).values({
          userId: testUserId,
          medicationId: amlodipineId,
          date,
          time: "08:00",
          taken: true,
          skippedReason: null,
        });
        inserted++;
      }
    } catch (err) {
      console.error(`   Error inserting Amlodipine log ${date}:`, (err as Error).message);
    }

    // Aspirin — once daily, ~70% adherence
    const aspirinTaken = !ASPIRIN_MISSED_DAYS.has(i);
    try {
      const existing = await db
        .select({ id: medicationLogs.id })
        .from(medicationLogs)
        .where(
          and(
            eq(medicationLogs.userId, testUserId),
            eq(medicationLogs.medicationId, aspirinId),
            eq(medicationLogs.date, date),
            eq(medicationLogs.time, "08:00")
          )
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(medicationLogs).values({
          userId: testUserId,
          medicationId: aspirinId,
          date,
          time: "08:00",
          taken: aspirinTaken,
          skippedReason: aspirinTaken ? null : "Forgot",
        });
        inserted++;
      }
    } catch (err) {
      console.error(`   Error inserting Aspirin log ${date}:`, (err as Error).message);
    }
  }

  summary.medicationLogs = inserted;
  console.log(`   Inserted ${inserted} medication log entries`);
}

// ---------------------------------------------------------------------------
// 5. Seed Family Contact
// ---------------------------------------------------------------------------

async function seedFamilyContact(): Promise<void> {
  console.log("\n[5/7] Seeding family contact...");
  try {
    const existing = await db
      .select({ id: familyContacts.id })
      .from(familyContacts)
      .where(
        and(
          eq(familyContacts.userId, testUserId),
          eq(familyContacts.email, "priya@example.com")
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(familyContacts).values({
        userId: testUserId,
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "+91 98765 43210",
        relationship: "daughter",
        alertsEnabled: true,
      });
      summary.familyContacts = 1;
      console.log("   Created family contact: Priya Sharma (daughter)");
    } else {
      console.log("   Family contact already exists — skipped");
    }
  } catch (err) {
    console.error("   Error seeding family contact:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// 6. Seed Health Alerts
// ---------------------------------------------------------------------------

const ALERT_DEFS = [
  {
    type: "blood_pressure",
    severity: "warning",
    message: "Blood pressure is above normal range",
    value: "145/92 mmHg",
    emailSent: true,
  },
  {
    type: "blood_sugar",
    severity: "warning",
    message: "Blood sugar is above normal range",
    value: "185 mg/dL",
    emailSent: true,
  },
  {
    type: "anomaly_detected",
    severity: "warning",
    message: "Health pattern anomaly detected",
    value: JSON.stringify({
      message: "BP trending up over last 2 weeks",
      recommendation: "Schedule a doctor visit",
    }),
    emailSent: false,
  },
] as const;

async function seedHealthAlerts(): Promise<void> {
  console.log("\n[6/7] Seeding health alerts...");

  let inserted = 0;
  for (const alert of ALERT_DEFS) {
    try {
      const existing = await db
        .select({ id: healthAlerts.id })
        .from(healthAlerts)
        .where(
          and(
            eq(healthAlerts.userId, testUserId),
            eq(healthAlerts.type, alert.type),
            eq(healthAlerts.message, alert.message)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(healthAlerts).values({
          userId: testUserId,
          logId: null,
          ...alert,
        });
        inserted++;
      }
    } catch (err) {
      console.error(`   Error inserting alert (${alert.type}):`, (err as Error).message);
    }
  }

  summary.healthAlerts = inserted;
  console.log(`   Inserted ${inserted} health alerts`);
}

// ---------------------------------------------------------------------------
// 7. Seed Share Link
// ---------------------------------------------------------------------------

async function seedShareLink(): Promise<void> {
  console.log("\n[7/7] Seeding share link...");
  try {
    await db
      .insert(shareLinks)
      .values({
        userId: testUserId,
        token: "demo-share-token-nearcare-2026",
        label: "Dr. Sharma - Apollo",
        expiresAt: null,
        includeDocuments: false,
      })
      .onConflictDoNothing();

    // Check if it was inserted or already existed
    const existing = await db
      .select({ id: shareLinks.id })
      .from(shareLinks)
      .where(eq(shareLinks.token, "demo-share-token-nearcare-2026"))
      .limit(1);

    if (existing.length > 0) {
      summary.shareLinks = 1;
      console.log("   Share link ready: demo-share-token-nearcare-2026");
    }
  } catch (err) {
    console.error("   Error seeding share link:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("NearCare — Test Data Seed Script");
  console.log("=".repeat(60));
  console.log(`Test user ID : ${testUserId}`);
  console.log(`Seed date    : ${todayStr()}`);
  console.log("=".repeat(60));

  await seedUser();
  await seedHealthLogs();
  await seedMedications();
  await seedMedicationLogs();
  await seedFamilyContact();
  await seedHealthAlerts();
  await seedShareLink();

  console.log("\n" + "=".repeat(60));
  console.log("Seed complete — Summary");
  console.log("=".repeat(60));
  console.log(`  Users              : ${summary.user}`);
  console.log(`  Health logs        : ${summary.healthLogs} (25 days with data, 5 gap days)`);
  console.log(`  Medications        : ${summary.medications} (${MED_DEFS.length} total defined)`);
  console.log(`  Medication logs    : ${summary.medicationLogs}`);
  console.log(`  Family contacts    : ${summary.familyContacts}`);
  console.log(`  Health alerts      : ${summary.healthAlerts}`);
  console.log(`  Share links        : ${summary.shareLinks}`);
  console.log("=".repeat(60));
  console.log("\nShare URL (local): http://localhost:3000/share/demo-share-token-nearcare-2026");
  console.log("Sign in with:      demo@nearcare.app (Clerk user must exist in your tenant)");
  console.log("");
}

main().catch((err) => {
  console.error("\nFatal error during seed:", err);
  process.exit(1);
});
