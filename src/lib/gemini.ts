import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const jsonModel = genAI.getGenerativeModel({
  model: "gemini-flash-lite-latest",
  generationConfig: { responseMimeType: "application/json" },
});

const visionModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

function parseJSON(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function extractDocumentInfo(base64Data: string, mimeType: string) {
  const prompt = `You are a medical document analyzer. Extract key information from this medical document.
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

export async function generateHealthSummary(logs: object[], medications: object[]) {
  const prompt = `You are a personal health assistant. Analyze this health data and provide insights.

Health logs (last 7 days): ${JSON.stringify(logs)}
Active medications: ${JSON.stringify(medications)}

Provide a JSON response with:
{
  "overallScore": 1-10,
  "highlights": ["positive observation 1", "positive observation 2"],
  "concerns": ["concern 1 if any"],
  "patterns": ["pattern you noticed"],
  "recommendations": ["actionable tip 1", "actionable tip 2"],
  "summary": "2-3 sentence friendly plain English summary of their week"
}
Be encouraging, specific, and actionable.`;

  const result = await jsonModel.generateContent(prompt);
  const text = result.response.text().trim();
  try {
    return parseJSON(text);
  } catch {
    return { summary: text, overallScore: 5, highlights: [], concerns: [], patterns: [], recommendations: [] };
  }
}

