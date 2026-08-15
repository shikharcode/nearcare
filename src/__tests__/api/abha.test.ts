import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/abha/verify/route"

// ── Auth ────────────────────────────────────────────────────────────────────
const mockAuth = vi.fn()
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────
function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/abha/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeMalformedRequest() {
  return new Request("http://localhost/api/abha/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not valid json{{{",
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/abha/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await POST(makePostRequest({ abhaId: "12345678901234" }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("valid 14-digit ABHA returns { verified: false, stored: true }", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "12345678901234" }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.verified).toBe(false)
    expect(body.stored).toBe(true)
    expect(body.abhaId).toBe("12345678901234")
    expect(body.message).toBeTruthy()
  })

  it("valid ABHA with dashes strips them and validates", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    // "12-3456-7890-1234" → cleaned = "12345678901234" (14 digits)
    const res = await POST(makePostRequest({ abhaId: "12-3456-7890-1234" }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.verified).toBe(false)
    expect(body.stored).toBe(true)
    expect(body.abhaId).toBe("12345678901234")
  })

  it("13-digit ABHA returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "1234567890123" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("15-digit ABHA returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "123456789012345" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("non-numeric ABHA '1234567890123A' returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "1234567890123A" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("empty string returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("missing abhaId field returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    // body.abhaId is undefined → raw = "" → cleaned = "" → fails regex
    const res = await POST(makePostRequest({}))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("non-string abhaId (number) returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    // typeof body.abhaId !== "string" → raw = "" → fails regex
    const res = await POST(makePostRequest({ abhaId: 12345678901234 }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/14 digits/i)
  })

  it("malformed request body returns 400", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makeMalformedRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid request body/i)
  })

  it("ABHA with spaces around it (no dashes) fails validation", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    // trim() is called after replace(/-/g, ""), so " 12345678901234 " → "12345678901234"
    // This should PASS (trimmed correctly)
    const res = await POST(makePostRequest({ abhaId: " 12345678901234 " }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.abhaId).toBe("12345678901234")
  })

  it("response includes a message field", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const res = await POST(makePostRequest({ abhaId: "12345678901234" }))
    const body = await res.json()

    expect(typeof body.message).toBe("string")
    expect(body.message.length).toBeGreaterThan(0)
  })
})
