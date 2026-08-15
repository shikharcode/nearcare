import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthLogs, medications, healthAlerts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { chatModel, generateWithFallback } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = checkRateLimit(userId, "ai-chat", 5000);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `Please wait ${Math.ceil(rateLimit.retryAfterMs / 1000)}s before sending another message.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const message: string = body.message ?? "";
  const history: { role: "user" | "model"; text: string }[] = body.history ?? [];

  if (!message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  // Fetch user health data
  const [logs, activeMeds, recentAlerts] = await Promise.all([
    db
      .select()
      .from(healthLogs)
      .where(eq(healthLogs.userId, userId))
      .orderBy(desc(healthLogs.date))
      .limit(30),
    db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.isActive, true))),
    db
      .select()
      .from(healthAlerts)
      .where(eq(healthAlerts.userId, userId))
      .orderBy(desc(healthAlerts.createdAt))
      .limit(10),
  ]);

  // Build system context string
  const systemContext = `You are an AI health assistant for the CareBridge personal health OS. You have access to the user's health data below. Answer questions helpfully, clearly, and with appropriate medical caution (always suggest consulting a doctor for serious concerns).

=== USER HEALTH DATA ===

RECENT HEALTH LOGS (last ${logs.length} entries, newest first):
${
  logs.length === 0
    ? "No health logs recorded yet."
    : logs
        .map(
          (l) =>
            `Date: ${l.date} | Mood: ${l.mood ?? "—"}/5 | Energy: ${l.energy ?? "—"}/5 | Sleep: ${l.sleep ?? "—"}h | Water: ${l.water ?? "—"}L | Exercise: ${l.exercise ?? "—"}min | Steps: ${l.steps ?? "—"} | Weight: ${l.weight ?? "—"}kg | HR: ${l.heartRate ?? "—"}bpm | BP: ${l.systolic ?? "—"}/${l.diastolic ?? "—"}mmHg | Blood Sugar: ${l.bloodSugar ?? "—"}mg/dL | SpO2: ${l.oxygenSaturation ?? "—"}% | Pain: ${l.painLevel ?? "—"}/10 | Symptoms: ${l.symptoms ?? "none"} | Notes: ${l.notes ?? "none"}`
        )
        .join("\n")
}

ACTIVE MEDICATIONS (${activeMeds.length}):
${
  activeMeds.length === 0
    ? "No active medications."
    : activeMeds
        .map(
          (m) =>
            `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.frequency ? `, ${m.frequency}` : ""}${m.prescribedBy ? `, prescribed by ${m.prescribedBy}` : ""}${m.startDate ? `, started ${m.startDate}` : ""}`
        )
        .join("\n")
}

RECENT HEALTH ALERTS (${recentAlerts.length}):
${
  recentAlerts.length === 0
    ? "No recent alerts."
    : recentAlerts
        .map(
          (a) =>
            `- [${a.severity.toUpperCase()}] ${a.message} (${a.type}, ${new Date(a.createdAt).toLocaleDateString()})`
        )
        .join("\n")
}
=== END OF DATA ===

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Be concise, friendly, and evidence-based. If the data is insufficient to answer a question, say so honestly.`;

  const fullPrompt = systemContext + "\n\nUser: " + message;

  // Try streaming first; fall back to non-streaming generateWithFallback on rate limit
  const chatHistory = history.map((h) => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));

  const startChatOpts = {
    history: [
      { role: "user" as const, parts: [{ text: systemContext }] },
      { role: "model" as const, parts: [{ text: "Understood. I have your health data loaded and I'm ready to help you understand your health trends, medications, and any patterns or concerns. What would you like to know?" }] },
      ...chatHistory,
    ],
  };

  // Attempt streaming with primary model; fall back to non-streaming on rate limit
  let useStreaming = true;
  let fallbackText = "";

  try {
    const chat = chatModel.startChat(startChatOpts);
    await chat.sendMessageStream(message); // probe — throws immediately on rate limit
    // If probe succeeds, re-create and stream properly
    const chat2 = chatModel.startChat(startChatOpts);
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat2.sendMessageStream(message);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("exhausted");
    if (!isRateLimit) throw err;
    useStreaming = false;
  }

  if (!useStreaming) {
    // Fall back to generateWithFallback (non-streaming, but works when primary is rate limited)
    const result = await generateWithFallback(fullPrompt);
    fallbackText = result.response.text();
    return new Response(fallbackText, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  }

  return new Response("", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
