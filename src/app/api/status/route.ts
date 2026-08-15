import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  let databaseStatus: "ok" | "error" = "ok";

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    databaseStatus = "error";
  }

  const geminiStatus = process.env.GEMINI_API_KEY ? "configured" : "missing";
  const resendStatus = process.env.RESEND_API_KEY ? "configured" : "missing";
  const r2Status =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET
      ? "configured"
      : "missing";

  const overallStatus =
    databaseStatus === "error" ||
    geminiStatus === "missing" ||
    resendStatus === "missing" ||
    r2Status === "missing"
      ? "degraded"
      : "ok";

  return Response.json({
    status: overallStatus,
    services: {
      database: databaseStatus,
      gemini: geminiStatus,
      resend: resendStatus,
      r2: r2Status,
    },
  });
}
