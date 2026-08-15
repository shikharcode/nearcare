const REQUIRED = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "GEMINI_API_KEY",
  "RESEND_API_KEY",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "R2_BUCKET_NAME",
]

export function validateEnv(): void {
  if (typeof window !== "undefined") return // client side skip
  const missing = REQUIRED.filter(k => !process.env[k])
  if (missing.length === 0) return
  const msg = "NearCare: Missing required environment variables: " + missing.join(", ")
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg)
  }
  console.warn(msg)
}

export function isFeatureEnabled(feature: string): boolean {
  const map: Record<string, string> = {
    abha: "ABHA_CLIENT_ID",
    cron: "CRON_SECRET",
    r2: "R2_BUCKET_NAME",
  }
  return Boolean(map[feature] && process.env[map[feature]])
}
