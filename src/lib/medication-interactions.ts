import { interactionModel } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export type InteractionResult = {
  hasInteractions: boolean;
  interactions: Array<{
    med1: string;
    med2: string;
    severity: "mild" | "moderate" | "severe";
    description: string;
    recommendation: string;
  }>;
  generalAdvice: string;
};

export async function checkMedicationInteractions(
  userId: string,
  newMedName: string,
  existingMedNames: string[]
): Promise<InteractionResult> {
  if (existingMedNames.length === 0) {
    return {
      hasInteractions: false,
      interactions: [],
      generalAdvice: "No existing medications to check against.",
    };
  }

  const rateLimit = checkRateLimit(userId, "med-interactions", 15_000);
  if (!rateLimit.allowed) {
    return {
      hasInteractions: false,
      interactions: [],
      generalAdvice: "Rate limit reached. Please wait a moment before checking interactions.",
    };
  }

  const prompt = `You are a clinical pharmacist assistant. Check for known drug interactions between ${newMedName} and: ${existingMedNames.join(", ")}. Only report clinically significant, well-documented interactions. Avoid theoretical interactions. For each interaction specify severity: mild (monitor), moderate (use caution), or severe (avoid combination). Always recommend consulting a doctor. Return JSON.

Return a JSON object with this exact shape:
{
  "hasInteractions": true or false,
  "interactions": [
    {
      "med1": "drug name",
      "med2": "drug name",
      "severity": "mild" | "moderate" | "severe",
      "description": "clinical description of the interaction",
      "recommendation": "what to do — always include advice to consult a doctor"
    }
  ],
  "generalAdvice": "brief overall advice string, always recommend consulting a doctor"
}`;

  const result = await interactionModel.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text) as InteractionResult;
    return parsed;
  } catch {
    return {
      hasInteractions: false,
      interactions: [],
      generalAdvice: "Unable to parse interaction data. Please consult your doctor or pharmacist.",
    };
  }
}
