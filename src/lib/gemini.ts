import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Model registry — one instance per task, spread across free tiers ─────────
//
// Model               RPD    Used for
// gemini-2.5-flash-lite  20  AI Chat (quality matters most)
// gemini-3.7-flash       20  Weekly health summary (runs once/week per user)
// gemini-3-flash         20  Prescription/document scan (rare action)
// gemini-2.5-flash       20  Medication interaction check (only on add)
// gemini-3.5-flash-lite 500  NLP log parsing + anomaly detection (fires constantly)
// gemma-4-26b         14400  Future bulk/background tasks

const mk = (model: string, json = false) =>
  genAI.getGenerativeModel({
    model,
    ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });

// User-facing high-quality chat
export const chatModel        = mk("gemini-2.5-flash-lite");

// Weekly summary — quality matters, runs rarely
export const summaryModel     = mk("gemini-3.7-flash", true);

// Document/prescription scan — vision + JSON
export const visionModel      = mk("gemini-3-flash");

// Medication interactions — needs good pharmacology knowledge
export const interactionModel = mk("gemini-2.5-flash", true);

// High-volume background tasks — 500 RPD
export const nlpModel         = mk("gemini-3.5-flash-lite", true);
export const anomalyModel     = mk("gemini-3.5-flash-lite", true);

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

  const result = await visionModel.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType } },
  ]);

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

  const result = await summaryModel.generateContent(prompt);
  const text = result.response.text().trim();
  try {
    return parseJSON(text);
  } catch {
    return { summary: text, overallScore: 5, highlights: [], concerns: [], patterns: [], recommendations: [] };
  }
}

