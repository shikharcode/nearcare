import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs, medications, healthAlerts, documents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nlpModel, parseJSON } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { format, subDays } from "date-fns";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(userId, "appointment-prep", 30000);
  if (!allowed) {
    return Response.json(
      { error: "Please wait before generating another summary", retryAfterMs },
      { status: 429 }
    );
  }

  let specialistType: string | undefined;
  try {
    const body = await request.json();
    specialistType = body?.specialistType;
  } catch {
    // body is optional
  }

  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

  const [allLogs, activeMeds, recentAlerts, recentDocs, userProfile] = await Promise.all([
    db
      .select()
      .from(healthLogs)
      .where(eq(healthLogs.userId, userId))
      .orderBy(desc(healthLogs.date))
      .limit(30),
    db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId)),
    db
      .select()
      .from(healthAlerts)
      .where(eq(healthAlerts.userId, userId))
      .orderBy(desc(healthAlerts.createdAt))
      .limit(5),
    db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(5),
    db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const logs30 = allLogs.filter((l) => l.date >= thirtyDaysAgo);
  const logs14 = allLogs.filter((l) => l.date >= fourteenDaysAgo);
  const meds = activeMeds.filter((m) => m.isActive);
  const profile = userProfile[0] ?? null;

  const prompt = `You are a personal health assistant preparing a patient for a doctor's visit. Analyze the data below and produce a concise, structured 1-page appointment preparation summary.

${specialistType ? `The patient is visiting a: ${specialistType}` : "The patient is visiting a General Physician"}

PATIENT PROFILE:
${JSON.stringify({
  name: profile?.name,
  dateOfBirth: profile?.dateOfBirth,
  bloodType: profile?.bloodType,
  allergies: profile?.allergies,
  emergencyContact: profile?.emergencyContact,
})}

HEALTH LOGS (last 30 days, ${logs30.length} entries):
${JSON.stringify(logs30)}

LAST 14 DAYS VITALS (for out-of-range check):
${JSON.stringify(logs14)}

ACTIVE MEDICATIONS (${meds.length}):
${JSON.stringify(meds)}

RECENT HEALTH ALERTS (last 5):
${JSON.stringify(recentAlerts)}

RECENT DOCUMENTS (last 5):
${JSON.stringify(recentDocs.map((d) => ({ name: d.name, type: d.type, date: d.date, extractedSummary: d.extractedData ? (() => { try { return JSON.parse(d.extractedData!).summary; } catch { return null; } })() : null })))}

REFERENCE RANGES (Indian adults):
- Blood pressure: systolic 90-120 mmHg, diastolic 60-80 mmHg
- Heart rate: 60-100 bpm
- Blood sugar fasting: 70-100 mg/dL, post-meal: <140 mg/dL
- Oxygen saturation: 95-100%
- Temperature: 36.1-37.2°C
- BMI: 18.5-24.9 (Indian cut-offs: overweight >23, obese >25)

Respond with a JSON object exactly matching this structure:
{
  "chiefComplaints": [
    { "complaint": "string", "detail": "string", "severity": "mild|moderate|severe" }
  ],
  "vitalsToDiscuss": [
    { "metric": "string", "value": "string", "normalRange": "string", "status": "normal|high|low|critical" }
  ],
  "medicationNotes": [
    { "name": "string", "dosage": "string", "frequency": "string", "note": "string or null" }
  ],
  "questionsToAsk": [
    "string"
  ],
  "dontForget": {
    "bloodType": "string or null",
    "allergies": "string or null",
    "emergencyContact": "string or null",
    "recentSymptoms": "string summarising any symptoms logged",
    "recentDocuments": "string or null"
  },
  "specialistSuggestion": {
    "suggested": true|false,
    "specialist": "string or null",
    "reason": "string or null"
  }
}

Rules:
- chiefComplaints: top 3 concerns based on logs, alerts, and patterns. Be specific (e.g. "Elevated blood pressure on 5 of the last 14 days").
- vitalsToDiscuss: only include metrics that have at least one recorded value; flag any outside reference ranges.
- medicationNotes: include all active meds; set note to an adherence issue, interaction concern, or potential renewal flag if relevant, otherwise null.
- questionsToAsk: exactly 5 specific, actionable questions relevant to the data and specialist type.
- specialistSuggestion: only suggest a referral if patterns clearly warrant it and the suggested specialist is DIFFERENT from who they are already visiting.
- Keep all strings concise — this is a 1-page summary for a busy doctor.`;

  let result;
  try {
    result = await nlpModel.generateContent(prompt);
  } catch (err: unknown) {
    console.error("[appointment-prep] Gemini error:", err);
    const msg = err instanceof Error ? err.message : "Gemini call failed";
    return Response.json({ error: msg }, { status: 500 });
  }
  const text = result.response.text().trim();

  let parsed;
  try {
    parsed = parseJSON(text);
  } catch {
    return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return Response.json(parsed);
}
