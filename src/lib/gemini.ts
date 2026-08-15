import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Model registry ────────────────────────────────────────────────────────────
//
// Model                RPD    Used for
// gemini-3.5-flash-lite 500   Primary for everything (high volume, reliable)
// gemini-2.5-flash-lite  20   Fallback 1 (better reasoning)
// gemma-4-26b         14400   Fallback 2 (bulk, always available)

const mk = (model: string, json = false) =>
  genAI.getGenerativeModel({
    model,
    ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });

// ── Named model instances ─────────────────────────────────────────────────────

// Primary — 500 RPD, used for everything by default
export const nlpModel      = mk("gemini-3.5-flash-lite", true);
export const anomalyModel  = mk("gemini-3.5-flash-lite", true);

// Vision — for prescription/document scan (no JSON mode, vision capable)
export const visionModel   = mk("gemini-3.5-flash-lite");

// Chat — text generation (no JSON mode)
export const chatModel     = mk("gemini-3.5-flash-lite");

// Aliases kept for compatibility
export const summaryModel     = nlpModel;
export const interactionModel = nlpModel;

// ── Fallback chain ────────────────────────────────────────────────────────────
//
// Usage: const result = await generateWithFallback(prompt, { json: true })
//
// Chain: gemini-3.5-flash-lite (500 RPD)
//     → gemini-2.5-flash-lite  (20 RPD, better quality)
//     → gemma-4-26b            (14400 RPD, always available)
//
// Triggers fallback on: 429 (rate limit), 503 (overloaded), quota errors

type GenerateOptions = {
  json?: boolean         // use JSON response mode
  vision?: {             // for multimodal (image) requests
    base64: string
    mimeType: string
  }
}

const FALLBACK_CHAIN = [
  { model: "gemini-3.5-flash-lite", rpd: 500  },
  { model: "gemini-2.5-flash-lite",  rpd: 20   },
  { model: "gemma-4-26b",            rpd: 14400 },
]

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("503") ||
    msg.includes("overloaded")
  );
}

export async function generateWithFallback(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<GenerateContentResult> {
  let lastError: unknown;

  for (const { model, rpd } of FALLBACK_CHAIN) {
    // gemma-4-26b doesn't support JSON response mode
    const useJson = opts.json && model !== "gemma-4-26b";
    const instance = genAI.getGenerativeModel({
      model,
      ...(useJson ? { generationConfig: { responseMimeType: "application/json" } } : {}),
    });

    try {
      let result: GenerateContentResult;
      if (opts.vision) {
        result = await instance.generateContent([
          prompt,
          { inlineData: { data: opts.vision.base64, mimeType: opts.vision.mimeType } },
        ]);
      } else {
        result = await instance.generateContent(prompt);
      }
      if (model !== "gemini-3.5-flash-lite") {
        console.warn(`[gemini] Fell back to ${model} (RPD: ${rpd})`);
      }
      return result;
    } catch (err) {
      if (isRateLimitError(err)) {
        console.warn(`[gemini] ${model} rate limited — trying next model`);
        lastError = err;
        continue;
      }
      throw err; // non-rate-limit error → don't retry
    }
  }

  throw lastError ?? new Error("All Gemini models exhausted");
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function parseJSON(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── extractDocumentInfo — uses visionModel (gemini-3-flash, 20 RPD) ──────────

export async function extractDocumentInfo(base64Data: string, mimeType: string) {
  const prompt = `You are a medical document analyzer specializing in Indian medical documents. Extract key information from this medical document.

Document handling notes:
- Many Indian prescriptions are handwritten and may mix Hindi and English text — do your best to interpret both scripts
- Doctor names often follow Indian formats such as "Dr. Arvind Kumar MD", "Dr. Priya Sharma MBBS MS", or include qualifications like FRCS, DNB, DM
- Clinic/hospital letterheads may be in Hindi or regional languages — extract what you can
- Common abbreviations on Indian prescriptions: OD (once daily), BD (twice daily), TDS (thrice daily), HS (at bedtime), AC (before meals), PC (after meals), SOS (as needed)
- Medication names may be Indian brand names — note them as-is alongside any generic name visible
- Dates may be in DD/MM/YYYY format — convert to YYYY-MM-DD
- Dosages may be in ml, mg, tablet count, or described as "1-0-1" style (morning-afternoon-night)

Return a JSON object with these fields (use null if not found):
{
  "documentType": "prescription|lab_report|scan|other",
  "patientName": "",
  "doctorName": "",
  "date": "YYYY-MM-DD",
  "medications": [{"name": "", "dosage": "", "frequency": "", "duration": ""}],
  "labResults": [{"test": "", "value": "", "unit": "", "normalRange": "", "status": "normal|high|low"}],
  "diagnosis": "",
  "instructions": "",
  "nextVisit": "",
  "summary": "2-3 sentence plain English summary"
}`;

  const result = await generateWithFallback(prompt, {
    vision: { base64: base64Data, mimeType },
  });

  const text = result.response.text().trim();
  try {
    return parseJSON(text);
  } catch {
    return { summary: text, documentType: "other" };
  }
}

// ── generateHealthSummary — uses summaryModel (gemini-3.7-flash, 20 RPD) ─────

export async function generateHealthSummary(logs: object[], medications: object[]) {
  const prompt = `You are a personal health assistant for an Indian health tracking app. Analyze this health data and provide insights tailored to Indian users.

Health logs (last 7 days): ${JSON.stringify(logs)}
Active medications: ${JSON.stringify(medications)}

Context about the user base:
- This app is used primarily in India. Common conditions include Type 2 diabetes, hypertension, and coronary artery disease.
- Advice should be relevant to Indian lifestyle: diet (roti, rice, daal, sabzi, chai, spicy foods), climate (hot summers, monsoon humidity, winter fog), and seasonal illnesses (dengue/malaria in monsoon, flu in winter, heat exhaustion in summer).
- Reference Indian dietary habits where applicable — for example, suggest reducing refined carbs (maida, white rice) or increasing fibre from dals and vegetables.
- Be mindful that many users may have a family history of diabetes or heart disease.

Provide a JSON response with:
{
  "overallScore": 1-10,
  "highlights": ["positive observation 1", "positive observation 2"],
  "concerns": ["concern 1 if any"],
  "patterns": ["pattern you noticed"],
  "recommendations": ["actionable tip 1", "actionable tip 2"],
  "summary": "2-3 sentence friendly plain English summary of their week"
}
Be encouraging, specific, and actionable. Tailor recommendations to Indian context where relevant.`;

  const result = await generateWithFallback(prompt, { json: true });
  const text = result.response.text().trim();
  try {
    return parseJSON(text);
  } catch {
    return { summary: text, overallScore: 5, highlights: [], concerns: [], patterns: [], recommendations: [] };
  }
}

