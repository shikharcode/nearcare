import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile, getSignedFileUrl } from "@/lib/r2";
import { extractDocumentInfo } from "@/lib/gemini";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_NAME_LENGTH = 200;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(documents.createdAt);

  const docsWithUrls = await Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      signedUrl: await getSignedFileUrl(doc.fileKey),
    }))
  );

  return Response.json(docsWithUrls);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const rawName = formData.get("name") as string | null;
  const type = formData.get("type") as string;

  // Check that file is actually a File object (not empty or a plain string)
  if (!file || typeof file === "string" || !(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: "File is empty" }, { status: 400 });
  }

  // File size limit
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // File type allowlist
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return Response.json({ error: "File type not supported" }, { status: 400 });
  }

  // Validate and sanitize name field
  const name = rawName ? rawName.trim().slice(0, MAX_NAME_LENGTH) : null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = `${userId}/${randomUUID()}-${file.name}`;

  await uploadFile(fileKey, buffer, file.type);

  // Extract info with Gemini
  const base64 = buffer.toString("base64");
  const extracted = await extractDocumentInfo(base64, file.type).catch(() => null);

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [doc] = await db.insert(documents).values({
    userId,
    name: name || file.name,
    type: type || extracted?.documentType || "other",
    fileKey,
    extractedData: extracted ? JSON.stringify(extracted) : null,
    doctorName: extracted?.doctorName,
    date: extracted?.date,
  }).returning();

  return Response.json({ ...doc, extractedData: extracted }, { status: 201 });
}
