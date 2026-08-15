import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/health-logs/route"

// ── Auth ────────────────────────────────────────────────────────────────────
const mockAuth = vi.fn()
const mockCurrentUser = vi.fn()
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

// ── DB ──────────────────────────────────────────────────────────────────────
const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()
vi.mock("@/db", () => ({
  db: {
    select: (...args: any[]) => mockDbSelect(...args),
    insert: (...args: any[]) => mockDbInsert(...args),
  },
}))

vi.mock("@/db/schema", () => ({
  users: "users",
  healthLogs: "healthLogs",
  healthAlerts: "healthAlerts",
  familyContacts: "familyContacts",
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
}))

// ── Lib dependencies ────────────────────────────────────────────────────────
const mockCheckThresholds = vi.fn()
const mockSendAlertEmails = vi.fn()
vi.mock("@/lib/alerts", () => ({
  checkThresholds: (...args: any[]) => mockCheckThresholds(...args),
  sendAlertEmails: (...args: any[]) => mockSendAlertEmails(...args),
}))

const mockDetectAnomalies = vi.fn()
vi.mock("@/lib/anomaly-detection", () => ({
  detectAnomalies: (...args: any[]) => mockDetectAnomalies(...args),
}))

vi.mock("@/lib/utils", () => ({
  today: () => "2026-08-16",
}))

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

function buildSelectChain(resolveWith: any[]) {
  const chain: any = {}
  chain.from = vi.fn(() => chain)
  chain.where = vi.fn(() => chain)
  chain.orderBy = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(resolveWith))
  return chain
}

function buildInsertChain(returnedRow: any) {
  const onConflictDoNothing = vi.fn(() => Promise.resolve())
  const returning = vi.fn(() => Promise.resolve([returnedRow]))
  const values = vi.fn(() => ({ returning, onConflictDoNothing }))
  return { values }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/health-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await GET(makeRequest("http://localhost/api/health-logs"))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("returns array of logs for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeLogs = [
      { id: 1, userId: "user_abc", date: "2026-08-16", mood: 4 },
      { id: 2, userId: "user_abc", date: "2026-08-15", mood: 3 },
    ]
    const chain = buildSelectChain(fakeLogs)
    mockDbSelect.mockReturnValue(chain)

    const res = await GET(makeRequest("http://localhost/api/health-logs"))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(fakeLogs)
    expect(chain.from).toHaveBeenCalledWith("healthLogs")
  })

  it("respects limit query param", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const chain = buildSelectChain([])
    mockDbSelect.mockReturnValue(chain)

    const res = await GET(makeRequest("http://localhost/api/health-logs?limit=5"))

    expect(res.status).toBe(200)
    // limit(5) — Math.min(5, 500) = 5
    expect(chain.limit).toHaveBeenCalledWith(5)
  })

  it("caps limit at 500", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const chain = buildSelectChain([])
    mockDbSelect.mockReturnValue(chain)

    await GET(makeRequest("http://localhost/api/health-logs?limit=9999"))

    expect(chain.limit).toHaveBeenCalledWith(500)
  })
})

describe("POST /api/health-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectAnomalies.mockResolvedValue(undefined)
    mockSendAlertEmails.mockResolvedValue(undefined)
  })

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const req = makeRequest("http://localhost/api/health-logs", {
      method: "POST",
      body: JSON.stringify({ mood: 4 }),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("inserts a log and returns it with status 201", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })
    mockCheckThresholds.mockReturnValue([])

    const fakeLog = { id: 42, userId: "user_abc", date: "2026-08-16", mood: 5 }

    // First insert call is users (onConflictDoNothing), second is healthLogs (returning)
    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null)) // users upsert
      .mockReturnValueOnce(buildInsertChain(fakeLog)) // health_logs insert

    const req = makeRequest("http://localhost/api/health-logs", {
      method: "POST",
      body: JSON.stringify({ mood: 5, date: "2026-08-16" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ id: 42, userId: "user_abc", alerts: [] })
  })

  it("calls checkThresholds with the request body", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })
    mockCheckThresholds.mockReturnValue([])

    const fakeLog = { id: 10, userId: "user_abc", date: "2026-08-16", heartRate: 80 }
    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null))
      .mockReturnValueOnce(buildInsertChain(fakeLog))

    const reqBody = { heartRate: 80, exercise: 30 }
    const req = makeRequest("http://localhost/api/health-logs", {
      method: "POST",
      body: JSON.stringify(reqBody),
    })
    await POST(req)

    expect(mockCheckThresholds).toHaveBeenCalledWith(
      expect.objectContaining({ heartRate: 80 }),
      { exerciseMinutes: 30 }
    )
  })

  it("inserts health_alerts when thresholds are triggered", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const triggeredAlerts = [
      { type: "blood_pressure", severity: "critical", message: "BP critically high", value: "190/125 mmHg" },
    ]
    mockCheckThresholds.mockReturnValue(triggeredAlerts)

    const fakeLog = { id: 7, userId: "user_abc", date: "2026-08-16" }

    const usersInsertChain = buildInsertChain(null)
    const logsInsertChain = buildInsertChain(fakeLog)
    const alertsInsertChain = buildInsertChain(null)

    // familyContacts select — return empty to skip email
    const contactsChain = buildSelectChain([])
    mockDbSelect.mockReturnValue(contactsChain)

    mockDbInsert
      .mockReturnValueOnce(usersInsertChain)   // users upsert
      .mockReturnValueOnce(logsInsertChain)    // health_logs insert
      .mockReturnValueOnce(alertsInsertChain)  // health_alerts insert

    const req = makeRequest("http://localhost/api/health-logs", {
      method: "POST",
      body: JSON.stringify({ systolic: 190, diastolic: 125 }),
    })
    await POST(req)

    // Third insert should be health_alerts
    expect(mockDbInsert).toHaveBeenCalledTimes(3)
    expect(alertsInsertChain.values).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user_abc",
          logId: 7,
          type: "blood_pressure",
          severity: "critical",
        }),
      ])
    )
  })

  it("returns { ...log, alerts } shape", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const triggeredAlerts = [
      { type: "spo2", severity: "warning", message: "SpO2 low", value: "93%" },
    ]
    mockCheckThresholds.mockReturnValue(triggeredAlerts)

    const fakeLog = { id: 99, userId: "user_abc", date: "2026-08-16", oxygenSaturation: 93 }

    const contactsChain = buildSelectChain([])
    mockDbSelect.mockReturnValue(contactsChain)

    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null))    // users
      .mockReturnValueOnce(buildInsertChain(fakeLog)) // health_logs
      .mockReturnValueOnce(buildInsertChain(null))    // health_alerts

    const req = makeRequest("http://localhost/api/health-logs", {
      method: "POST",
      body: JSON.stringify({ oxygenSaturation: 93 }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toEqual({
      id: 99,
      userId: "user_abc",
      date: "2026-08-16",
      oxygenSaturation: 93,
      alerts: triggeredAlerts,
    })
  })
})
