import { auth } from "@clerk/nextjs/server";
import { extractDocumentInfo } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(userId, "ai/extract", 10000);
  if (!allowed) {
    return Response.json(
      { error: "Please wait before generating another summary", retryAfterMs },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const extracted = await extractDocumentInfo(base64, file.type);

  return Response.json(extracted);
}
