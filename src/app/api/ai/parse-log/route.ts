import { auth } from "@clerk/nextjs/server";
import { generateWithFallback } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(userId, "ai/parse-log", 3000);
  if (!allowed) {
    return Response.json(
      { error: "Please wait before parsing again", retryAfterMs },
      { status: 429 }
    );
  }

  let text: string;
  try {
    const body = await request.json();
    text = body.text;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const prompt = `You are a health data extraction assistant for an Indian health app. Parse the following plain English health description and extract any health metrics mentioned.

User input: "${text.trim()}"

Return a JSON object with ONLY the fields that were explicitly mentioned in the text. Use null for fields not mentioned.

The available fields and their types are:
- mood: integer 1-5 (1=terrible, 2=bad, 3=okay, 4=good, 5=great)
- energy: integer 1-5 (1=exhausted, 2=tired, 3=okay, 4=energetic, 5=very energetic)
- sleep: number in hours (e.g. 7, 7.5)
- water: number in litres (e.g. 2 glasses = 0.5L, 8 glasses = 2L, convert glasses to litres: 1 glass = 0.25L)
- exercise: number in minutes
- steps: integer
- weight: number in kg
- heartRate: integer in bpm
- systolic: integer in mmHg (the top number in blood pressure like 135/88)
- diastolic: integer in mmHg (the bottom number in blood pressure like 135/88)
- bloodSugar: number in mg/dL
- temperature: number in Celsius (if Fahrenheit given, convert to Celsius)
- oxygenSaturation: number percentage 0-100
- calories: integer
- painLevel: integer 0-10 (0=none, 10=worst)
- symptoms: comma-separated string of symptoms mentioned (e.g. "headache, nausea")
- notes: any additional context or observations not captured in other fields

Indian food and drink references for water/calorie estimation:
- chai / chai tea = tea, approximately 150ml water (count toward water intake)
- daal / dal = lentil soup, approximately 200ml water per serving (count toward water intake)
- roti / chapati / phulka = Indian flatbread, approximately 40g per piece
- rice / chawal = cooked rice, approximately 150g per standard serving
- sabzi / curry = vegetable dish; note in the notes field if no calorie count is given
- lassi = yogurt drink, approximately 250ml; count toward water intake
- nimbu pani / shikanji = lemon water, approximately 250ml; count toward water intake
- If the user mentions food items, estimate calories where reasonable and note Indian food items in the notes field.

Mood inference rules:
- "feeling great/wonderful/excellent/amazing" → 5
- "feeling good/well/fine" → 4
- "feeling okay/alright/so-so" → 3
- "feeling bad/not great/tired/unwell" → 2
- "feeling terrible/awful/horrible/very sick" → 1
- If mood is explicitly a number (e.g. "mood 4"), use that number.

Also return:
- confidence: "high" if most values are explicit numbers, "medium" if some were inferred, "low" if mostly inferred
- interpreted: a plain English sentence summarising exactly what was parsed (e.g. "Logged 7 hours of sleep, 0.5L water, blood pressure 135/88 mmHg, mood: okay")

Example input: "I slept 7 hours, drank 2 glasses of water, BP was 135/88, feeling okay today"
Example output:
{
  "sleep": 7,
  "water": 0.5,
  "systolic": 135,
  "diastolic": 88,
  "mood": 3,
  "energy": null,
  "steps": null,
  "weight": null,
  "heartRate": null,
  "bloodSugar": null,
  "temperature": null,
  "oxygenSaturation": null,
  "calories": null,
  "exercise": null,
  "painLevel": null,
  "symptoms": null,
  "notes": null,
  "confidence": "high",
  "interpreted": "Logged 7 hours of sleep, 0.5L water, blood pressure 135/88 mmHg, mood: okay"
}`;

  try {
    const result = await generateWithFallback(prompt, { json: true });
    const raw = result.response.text().trim();

    let parsed: Record<string, unknown>;
    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    return Response.json(parsed);
  } catch {
    return Response.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
