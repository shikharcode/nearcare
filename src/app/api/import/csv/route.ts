import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, healthLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const MAX_CSV_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_ROWS = 1000;
const MAX_CELL_LENGTH = 500;

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

// Clamp a nullable number to [min, max]; return null if out of bounds
function clampBounds(
  val: number | null,
  min: number,
  max: number,
  rowNum: number,
  fieldName: string,
  errors: string[],
  skippedRef: { count: number },
): number | null | "skip" {
  if (val === null) return null;
  if (val < min || val > max) {
    errors.push(`Row ${rowNum}: ${fieldName} out of range (${min}–${max}), got ${val}`);
    skippedRef.count++;
    return "skip";
  }
  return val;
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
    const uploadedFile = file as File;

    // File size limit: max 1MB
    if (uploadedFile.size > MAX_CSV_SIZE) {
      return Response.json({ error: "CSV file too large (max 1MB)" }, { status: 400 });
    }

    text = await uploadedFile.text();
  } catch {
    return Response.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim() !== "");
  if (lines.length < 2) {
    return Response.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  // Row limit: max 1000 data rows
  const dataLines = lines.slice(1);
  if (dataLines.length > MAX_ROWS) {
    return Response.json(
      { error: `CSV exceeds maximum row limit of ${MAX_ROWS} rows` },
      { status: 400 }
    );
  }

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const dateIdx = header.indexOf("date");
  if (dateIdx === -1) {
    return Response.json({ error: "CSV must have a 'date' column" }, { status: 400 });
  }

  function col(row: string[], name: string): string | undefined {
    const idx = header.indexOf(name);
    if (idx === -1) return undefined;
    const raw = row[idx]?.replace(/^"|"$/g, "").trim() || undefined;
    // Reject cells exceeding max length
    if (raw && raw.length > MAX_CELL_LENGTH) return undefined;
    return raw;
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

    // Validate date format YYYY-MM-DD strictly
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      errors.push(`Row ${rowNum}: invalid date format "${dateVal}" (expected YYYY-MM-DD)`);
      skipped++;
      continue;
    }

    // Extra date sanity: ensure it parses to a real calendar date
    const parsedDate = new Date(dateVal);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${rowNum}: invalid date value "${dateVal}"`);
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

    // Parse and validate numeric fields with bounds
    const skippedRef = { count: 0 };

    const moodVal = parseIntVal(col(row, "mood"));
    const moodResult = clampBounds(moodVal, 1, 5, rowNum, "mood", errors, skippedRef);
    if (moodResult === "skip") { skipped++; continue; }

    const sleepVal = parseNum(col(row, "sleep"));
    const sleepResult = clampBounds(sleepVal, 0, 24, rowNum, "sleep", errors, skippedRef);
    if (sleepResult === "skip") { skipped++; continue; }

    const heartRateVal = parseIntVal(col(row, "heartRate"));
    const heartRateResult = clampBounds(heartRateVal, 20, 300, rowNum, "heartRate", errors, skippedRef);
    if (heartRateResult === "skip") { skipped++; continue; }

    const systolicVal = parseIntVal(col(row, "systolic"));
    const systolicResult = clampBounds(systolicVal, 40, 250, rowNum, "systolic", errors, skippedRef);
    if (systolicResult === "skip") { skipped++; continue; }

    const diastolicVal = parseIntVal(col(row, "diastolic"));
    const diastolicResult = clampBounds(diastolicVal, 40, 250, rowNum, "diastolic", errors, skippedRef);
    if (diastolicResult === "skip") { skipped++; continue; }

    const oxygenVal = parseIntVal(col(row, "oxygenSaturation"));
    const oxygenResult = clampBounds(oxygenVal, 50, 100, rowNum, "oxygenSaturation", errors, skippedRef);
    if (oxygenResult === "skip") { skipped++; continue; }

    const tempVal = parseNum(col(row, "temperature"));
    const tempResult = clampBounds(tempVal, 30, 45, rowNum, "temperature", errors, skippedRef);
    if (tempResult === "skip") { skipped++; continue; }

    const bloodSugarVal = parseNum(col(row, "bloodSugar"));
    const bloodSugarResult = clampBounds(bloodSugarVal, 20, 600, rowNum, "bloodSugar", errors, skippedRef);
    if (bloodSugarResult === "skip") { skipped++; continue; }

    try {
      await db.insert(healthLogs).values({
        userId,
        date: dateVal,
        mood: moodResult as number | null,
        sleep: sleepResult as number | null,
        water: parseNum(col(row, "water")),
        exercise: parseIntVal(col(row, "exercise")),
        steps: parseIntVal(col(row, "steps")),
        weight: parseNum(col(row, "weight")),
        heartRate: heartRateResult as number | null,
        systolic: systolicResult as number | null,
        diastolic: diastolicResult as number | null,
        bloodSugar: bloodSugarResult as number | null,
        temperature: tempResult as number | null,
        oxygenSaturation: oxygenResult as number | null,
        calories: parseIntVal(col(row, "calories")),
        symptoms: parseStr(col(row, "symptoms")),
        notes: parseStr(col(row, "notes")),
      });
      imported++;
    } catch (err) {
      errors.push(`Row ${rowNum}: insert failed`);
      skipped++;
    }
  }

  return Response.json({ imported, skipped, errors });
}
