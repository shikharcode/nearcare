import { db } from "@/db";
import { healthLogs, healthAlerts } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subDays } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: { responseMimeType: "application/json" },
});

interface AnomalyResult {
  type: string;
  severity: "warning" | "pattern";
  message: string;
  recommendation: string;
}

interface GeminiAnomalyResponse {
  anomalies: AnomalyResult[];
}

export async function detectAnomalies(userId: string, latestLog: object): Promise<void> {
  // Fetch last 30 logs for this user
  const logs = await db
    .select()
    .from(healthLogs)
    .where(eq(healthLogs.userId, userId))
    .orderBy(desc(healthLogs.date))
    .limit(30);

  // Need at least 7 logs to detect meaningful trends
  if (logs.length < 7) return;

  const prompt = `You are a health trend analyst. Analyze the following health logs (most recent first) and detect TRENDS and PATTERNS — not just single-point threshold violations.

Health logs: ${JSON.stringify(logs)}
Latest log: ${JSON.stringify(latestLog)}

Look specifically for:
- Blood pressure trending up 5+ points (systolic or diastolic) over the last 2 weeks
- Sleep consistently under 6 hours for 5 or more days
- Mood declining steadily (decreasing score) over the past week
- Weight gain of 3+ kg over 2 weeks
- Energy consistently low (1-2) for 5+ days
- Heart rate elevated above 100 bpm for multiple consecutive logs
- Blood sugar trending upward over recent logs
- Pain level consistently 6+ for several days
- Exercise/activity dropping significantly compared to earlier logs

Return a JSON object in exactly this format:
{
  "anomalies": [
    {
      "type": "short_snake_case_identifier",
      "severity": "warning" or "pattern",
      "message": "Plain English description of the trend detected, be specific with numbers and timeframes",
      "recommendation": "Specific, actionable advice the user can follow"
    }
  ]
}

Use severity "warning" for concerning health trends that need attention, and "pattern" for notable behavioral patterns worth noting.
Only return anomalies you are confident about based on the data. Return an empty anomalies array if no significant trends are found.
Do not invent anomalies — only report what the data clearly shows.`;

  let parsed: GeminiAnomalyResponse;
  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned) as GeminiAnomalyResponse;
  } catch (err) {
    console.error("[anomaly-detection] Gemini parse error:", err);
    return;
  }

  if (!Array.isArray(parsed?.anomalies) || parsed.anomalies.length === 0) return;

  // Cutoff: 3 days ago to avoid duplicate alerts
  const threeDaysAgo = subDays(new Date(), 3);

  // Fetch recent anomaly_detected alerts to deduplicate
  const recentAlerts = await db
    .select()
    .from(healthAlerts)
    .where(
      and(
        eq(healthAlerts.userId, userId),
        eq(healthAlerts.type, "anomaly_detected"),
        gte(healthAlerts.createdAt, threeDaysAgo)
      )
    );

  const recentTypes = new Set(recentAlerts.map((a) => a.value ?? ""));

  const toInsert = parsed.anomalies.filter((anomaly) => {
    if (!anomaly.type || !anomaly.message) return false;
    // Use type as dedup key
    return !recentTypes.has(anomaly.type);
  });

  if (toInsert.length === 0) return;

  // message stores JSON: { message, recommendation } — value stores the anomaly type for dedup
  await db.insert(healthAlerts).values(
    toInsert.map((anomaly) => ({
      userId,
      logId: null,
      type: "anomaly_detected",
      severity: anomaly.severity === "warning" ? "warning" : "pattern",
      message: JSON.stringify({
        message: anomaly.message,
        recommendation: anomaly.recommendation,
      }),
      value: anomaly.type,
      emailSent: false,
    }))
  );
}
