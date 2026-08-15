import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, healthLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const EXPECTED_COLUMNS = [
  "date", "mood", "sleep", "water", "exercise", "steps", "weight",
  "heartRate", "systolic", "diastolic", "bloodSugar", "temperature",
  "oxygenSaturation", "calories", "symptoms", "notes",
];

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = Number(val.trim());
  return isNaN(n) ? null : n;
}

function parseIntVal(val: string | undefined): number | null {
  const n = parseNum(val);
  return n !== null ? Math.round(n) : null;
}

function parseStr(val: string | undefined): string | null {
  if (!val || val.trim() === "") return null;
  return val.trim();
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let text: string;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }
    text = await (file as File).text();
  } catch {
    return Response.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim() !== "");
  if (lines.length < 2) {
    return Response.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const dateIdx = header.indexOf("date");
  if (dateIdx === -1) {
    return Response.json({ error: "CSV must have a 'date' column" }, { status: 400 });
  }

  function col(row: string[], name: string): string | undefined {
    const idx = header.indexOf(name);
    if (idx === -1) return undefined;
    return row[idx]?.replace(/^"|"$/g, "").trim() || undefined;
  }

  // Ensure user row exists
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const row = rawLine.split(",");
    const rowNum = i + 1;

    const dateVal = col(row, "date");
    if (!dateVal) {
      errors.push(`Row ${rowNum}: missing date`);
      skipped++;
      continue;
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      errors.push(`Row ${rowNum}: invalid date format "${dateVal}" (expected YYYY-MM-DD)`);
      skipped++;
      continue;
    }

    // Check if a log for this date already exists
    const existing = await db
      .select({ id: healthLogs.id })
      .from(healthLogs)
      .where(and(eq(healthLogs.userId, userId), eq(healthLogs.date, dateVal)))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const moodVal = parseIntVal(col(row, "mood"));
    if (moodVal !== null && (moodVal < 1 || moodVal > 5)) {
      errors.push(`Row ${rowNum}: mood must be 1-5, got ${moodVal}`);
      skipped++;
      continue;
    }

    try {
      await db.insert(healthLogs).values({
        userId,
        date: dateVal,
        mood: moodVal,
        sleep: parseNum(col(row, "sleep")),
        water: parseNum(col(row, "water")),
        exercise: parseIntVal(col(row, "exercise")),
        steps: parseIntVal(col(row, "steps")),
        weight: parseNum(col(row, "weight")),
        heartRate: parseIntVal(col(row, "heartRate")),
        systolic: parseIntVal(col(row, "systolic")),
        diastolic: parseIntVal(col(row, "diastolic")),
        bloodSugar: parseNum(col(row, "bloodSugar")),
        temperature: parseNum(col(row, "temperature")),
        oxygenSaturation: parseIntVal(col(row, "oxygenSaturation")),
        calories: parseIntVal(col(row, "calories")),
        symptoms: parseStr(col(row, "symptoms")),
        notes: parseStr(col(row, "notes")),
      });
      imported++;
    } catch (err) {
      errors.push(`Row ${rowNum}: insert failed — ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  return Response.json({ imported, skipped, errors });
}
