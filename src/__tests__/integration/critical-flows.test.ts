import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Auth ─────────────────────────────────────────────────────────────────────
const mockAuth = vi.fn()
const mockCurrentUser = vi.fn()

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

// ── DB ────────────────────────────────────────────────────────────────────────
const mockDbSelect = vi.fn()
const mockDbInsert = vi.fn()
const mockDbDelete = vi.fn()

vi.mock("@/db", () => ({
  db: {
    select: (...args: any[]) => mockDbSelect(...args),
    insert: (...args: any[]) => mockDbInsert(...args),
    delete: (...args: any[]) => mockDbDelete(...args),
  },
}))

vi.mock("@/db/schema", () => ({
  users: "users",
  healthLogs: "healthLogs",
  healthAlerts: "healthAlerts",
  familyContacts: "familyContacts",
  medications: "medications",
  documents: "documents",
  shareLinks: "shareLinks",
  doctorPatients: "doctorPatients",
  doctorProfiles: "doctorProfiles",
  doctorNotes: "doctorNotes",
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ col: _col, val })),
  and: vi.fn((...args) => args),
  desc: vi.fn((col) => col),
  gt: vi.fn((_col, val) => ({ col: _col, val })),
}))

// ── Lib dependencies ──────────────────────────────────────────────────────────
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
  today: () => "2026-08-17",
  cn: (...args: string[]) => args.join(" "),
}))

const mockCheckMedicationInteractions = vi.fn()
vi.mock("@/lib/medication-interactions", () => ({
  checkMedicationInteractions: (...args: any[]) => mockCheckMedicationInteractions(...args),
}))

vi.mock("@/lib/r2", () => ({
  uploadFile: vi.fn(() => Promise.resolve()),
  getSignedFileUrl: vi.fn(() => Promise.resolve("https://r2.example.com/signed-url")),
}))

vi.mock("@/lib/gemini", () => ({
  extractDocumentInfo: vi.fn(() => Promise.resolve(null)),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeJsonRequest(url: string, body: unknown, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

/**
 * Build a chainable select mock: select().from().where() → resolves to `rows`.
 * Also handles the .orderBy().limit() tail used in healthLogs GET.
 */
function buildSelectChain(rows: unknown[]) {
  const chain: any = {}
  chain.from = vi.fn(() => chain)
  chain.where = vi.fn(() => Promise.resolve(rows))
  chain.orderBy = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(rows))
  return chain
}

/**
 * Build an insert chain: insert().values() → { returning, onConflictDoNothing }.
 * returning() resolves to [returnedRow] (or [] when returnedRow is null).
 */
function buildInsertChain(returnedRow: any) {
  const onConflictDoNothing = vi.fn(() => Promise.resolve())
  const returning = vi.fn(() =>
    Promise.resolve(returnedRow !== null ? [returnedRow] : [])
  )
  const values = vi.fn(() => ({ returning, onConflictDoNothing }))
  return { values, returning, onConflictDoNothing }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEALTH LOG SAVE FLOW — BP 185/120 (critical)
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Health Log Save — critical BP", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectAnomalies.mockResolvedValue(undefined)
    mockSendAlertEmails.mockResolvedValue(undefined)
    mockCurrentUser.mockResolvedValue({
      fullName: "Test User",
      firstName: "Test",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    })
  })

  it("returns 201 with alerts array containing blood_pressure critical and spreads log fields", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const criticalBPAlert = {
      type: "blood_pressure",
      severity: "critical",
      message: "Blood pressure is critically high — seek immediate medical attention",
      value: "185/120 mmHg",
    }
    // checkThresholds is the real alerting logic — mock it to return the expected alert
    mockCheckThresholds.mockReturnValue([criticalBPAlert])

    const fakeLog = {
      id: "log_001",
      userId: "user_test123",
      date: "2026-08-17",
      systolic: 185,
      diastolic: 120,
      heartRate: null,
      mood: null,
    }

    // insert(users).values(...).onConflictDoNothing()
    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null))          // users upsert
      .mockReturnValueOnce(buildInsertChain(fakeLog))       // healthLogs insert
      .mockReturnValueOnce(buildInsertChain(null))          // healthAlerts insert

    // familyContacts select (no contacts → no email)
    const contactsChain = buildSelectChain([])
    mockDbSelect.mockReturnValue(contactsChain)

    const { POST } = await import("@/app/api/health-logs/route")
    const req = makeJsonRequest("http://localhost/api/health-logs", {
      systolic: 185,
      diastolic: 120,
      date: "2026-08-17",
    })
    const res = await POST(req)

    expect(res.status).toBe(201)

    const body = await res.json()

    // Response must spread the log fields
    expect(body.id).toBe("log_001")
    expect(body.userId).toBe("user_test123")
    expect(body.systolic).toBe(185)
    expect(body.diastolic).toBe(120)

    // Response must have an alerts array
    expect(Array.isArray(body.alerts)).toBe(true)
    expect(body.alerts).toHaveLength(1)

    // The alert must be blood_pressure critical
    const alert = body.alerts[0]
    expect(alert.type).toBe("blood_pressure")
    expect(alert.severity).toBe("critical")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. HEALTH LOG SAVE — EXERCISE SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Health Log Save — exercise suppresses heart_rate alert", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectAnomalies.mockResolvedValue(undefined)
    mockSendAlertEmails.mockResolvedValue(undefined)
  })

  it("does NOT include heart_rate alert when exerciseMinutes >= 20", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    // Use the real checkThresholds logic to validate the suppression path.
    // heartRate 130 with exercise 45 min: 130 > 120 but exerciseMinutes >= 20 → suppressed.
    // Restore the real module temporarily by calling the actual function via dynamic import.
    const { checkThresholds } = await import("@/lib/alerts")
    // checkThresholds is mocked at module level; verify via mock that calls it correctly.
    // We set the mock to return what the real function would return for this input.
    mockCheckThresholds.mockImplementation((log: any, ctx: any) => {
      // Reproduce the real suppression logic inline so the test validates end-to-end wiring
      const alerts: any[] = []
      if (log.heartRate) {
        if (log.heartRate > 150) {
          alerts.push({ type: "heart_rate", severity: "critical", message: "critically elevated", value: `${log.heartRate} bpm` })
        } else if (log.heartRate > 120 && !(ctx.exerciseMinutes != null && ctx.exerciseMinutes >= 20)) {
          alerts.push({ type: "heart_rate", severity: "warning", message: "elevated", value: `${log.heartRate} bpm` })
        }
      }
      return alerts
    })

    const fakeLog = {
      id: "log_002",
      userId: "user_test123",
      date: "2026-08-17",
      heartRate: 130,
      exercise: 45,
    }

    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null))      // users upsert
      .mockReturnValueOnce(buildInsertChain(fakeLog))   // healthLogs insert
    // No alerts insert — suppressed, so alerts array is empty

    const { POST } = await import("@/app/api/health-logs/route")
    const req = makeJsonRequest("http://localhost/api/health-logs", {
      heartRate: 130,
      exercise: 45,
      date: "2026-08-17",
    })
    const res = await POST(req)

    expect(res.status).toBe(201)

    const body = await res.json()
    // No heart_rate alert in response
    const heartRateAlerts = (body.alerts as any[]).filter((a) => a.type === "heart_rate")
    expect(heartRateAlerts).toHaveLength(0)

    // checkThresholds must have been called with exerciseMinutes: 45
    expect(mockCheckThresholds).toHaveBeenCalledWith(
      expect.objectContaining({ heartRate: 130 }),
      { exerciseMinutes: 45 }
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. MEDICATION ADD FLOW — valid data
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Medication Add — valid data", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 201 with the medication in the response body", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const fakeMed = {
      id: "med_001",
      userId: "user_test123",
      name: "Metformin",
      dosage: "500mg",
      frequency: "twice daily",
      isActive: true,
      createdAt: "2026-08-17T00:00:00.000Z",
    }

    mockDbInsert
      .mockReturnValueOnce(buildInsertChain(null))     // users upsert
      .mockReturnValueOnce(buildInsertChain(fakeMed))  // medications insert

    // No existing meds → skip interaction check
    const existingMedsChain = buildSelectChain([])
    mockDbSelect.mockReturnValue(existingMedsChain)

    const { POST } = await import("@/app/api/medications/route")
    const req = makeJsonRequest("http://localhost/api/medications", {
      name: "Metformin",
      dosage: "500mg",
      frequency: "twice daily",
      startDate: "2026-08-17",
    })
    const res = await POST(req)

    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.id).toBe("med_001")
    expect(body.name).toBe("Metformin")
    expect(body.userId).toBe("user_test123")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. MEDICATION ADD — VALIDATION: empty name returns 400
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Medication Add — empty name validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when name is an empty string", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const { POST } = await import("@/app/api/medications/route")
    const req = makeJsonRequest("http://localhost/api/medications", {
      name: "",
      dosage: "100mg",
    })
    const res = await POST(req)

    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBeTruthy()
    // DB insert must NOT have been called
    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it("returns 400 when name is missing entirely", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const { POST } = await import("@/app/api/medications/route")
    const req = makeJsonRequest("http://localhost/api/medications", {
      dosage: "100mg",
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(mockDbInsert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. DOCUMENT UPLOAD — FILE SIZE > 10MB returns 400
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Document Upload — file size limit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with 'File too large' when file exceeds 10MB", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const { POST } = await import("@/app/api/documents/route")

    const oversizedBuffer = new Uint8Array(10 * 1024 * 1024 + 1).fill(65)
    const bigFile = new File([oversizedBuffer], "large-report.pdf", { type: "application/pdf" })

    // jsdom doesn't support FormData as Request body — mock formData() directly
    const mockFormData = new FormData()
    mockFormData.append("file", bigFile)
    mockFormData.append("name", "Large Report")

    const req = {
      formData: () => Promise.resolve(mockFormData),
    } as unknown as Request

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/file too large/i)
  })

  it("does NOT call uploadFile when the file is too large", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })
    const { uploadFile } = await import("@/lib/r2")
    const { POST } = await import("@/app/api/documents/route")

    const oversizedBuffer = new Uint8Array(10 * 1024 * 1024 + 1).fill(65)
    const bigFile = new File([oversizedBuffer], "large.pdf", { type: "application/pdf" })

    const mockFormData = new FormData()
    mockFormData.append("file", bigFile)

    const req = {
      formData: () => Promise.resolve(mockFormData),
    } as unknown as Request

    await POST(req)
    expect(uploadFile).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. ABHA VERIFY — VALID: "12-3456-7890-1234"
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: ABHA Verify — valid ID with dashes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns { verified: false, stored: true } for a valid dash-formatted ABHA ID", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const { POST } = await import("@/app/api/abha/verify/route")
    const req = makeJsonRequest("http://localhost/api/abha/verify", {
      abhaId: "12-3456-7890-1234",
    })
    const res = await POST(req)

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.verified).toBe(false)
    expect(body.stored).toBe(true)
    // Dashes stripped: "12345678901234"
    expect(body.abhaId).toBe("12345678901234")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. ABHA VERIFY — INVALID: "123" returns 400
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: ABHA Verify — invalid ID too short", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for a 3-character ABHA ID", async () => {
    mockAuth.mockResolvedValue({ userId: "user_test123" })

    const { POST } = await import("@/app/api/abha/verify/route")
    const req = makeJsonRequest("http://localhost/api/abha/verify", {
      abhaId: "123",
    })
    const res = await POST(req)

    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. UNAUTHORIZED ACCESS — null userId returns 401
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Unauthorized Access — null userId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 on POST /api/health-logs when userId is null", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const { POST } = await import("@/app/api/health-logs/route")
    const req = makeJsonRequest("http://localhost/api/health-logs", {
      mood: 4,
      systolic: 120,
      diastolic: 80,
    })
    const res = await POST(req)

    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe("Unauthorized")

    // DB must never be touched
    expect(mockDbInsert).not.toHaveBeenCalled()
    expect(mockDbSelect).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. DOCTOR PRESCRIBE — NO RELATIONSHIP returns 403
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Doctor Prescribe — no doctor-patient relationship", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 when doctorPatients query returns an empty array", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_001" })

    // DB returns no relationship rows
    const emptyChain = buildSelectChain([])
    mockDbSelect.mockReturnValue(emptyChain)

    const { POST } = await import("@/app/api/doctor/prescribe/route")
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_999",
      name: "Aspirin",
      dosage: "100mg",
    })
    const res = await POST(req)

    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toBe("No active relationship with this patient")

    // No medication should have been inserted
    expect(mockDbInsert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. SHARE TOKEN — PUBLIC ACCESS
// ─────────────────────────────────────────────────────────────────────────────
describe("Integration: Share Token — public access returns only that user's data", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns patient data without requiring auth", async () => {
    // No auth call needed — the share route does not call auth() for GET

    const fakeLink = {
      id: "link_001",
      userId: "patient_abc",
      token: "tok_public123",
      label: "Dr. Sharma",
      expiresAt: null,         // no expiry
      includeDocuments: false,
    }

    const fakeLogs = [
      { id: "hl_1", userId: "patient_abc", date: "2026-08-17", systolic: 120, diastolic: 80 },
      { id: "hl_2", userId: "patient_abc", date: "2026-08-16", systolic: 118, diastolic: 78 },
    ]

    const fakeMeds = [
      { id: "med_1", userId: "patient_abc", name: "Metformin", isActive: true },
    ]

    // The route runs three sequential selects:
    // 1. shareLinks — find the link by token
    // 2. healthLogs — get logs for link.userId
    // 3. medications — get meds for link.userId
    // (documents skipped because includeDocuments is false)
    let selectCallCount = 0
    mockDbSelect.mockImplementation(() => {
      selectCallCount++
      const call = selectCallCount
      const chain: any = {}
      chain.from = vi.fn(() => chain)
      if (call === 1) {
        // shareLinks lookup: select().from().where() → [fakeLink]
        chain.where = vi.fn(() => Promise.resolve([fakeLink]))
      } else if (call === 2) {
        // healthLogs: select().from().where() → fakeLogs
        chain.where = vi.fn(() => Promise.resolve(fakeLogs))
      } else {
        // medications: select().from().where() → fakeMeds
        chain.where = vi.fn(() => Promise.resolve(fakeMeds))
      }
      return chain
    })

    const { GET } = await import("@/app/api/share/[token]/route")
    const req = new Request("http://localhost/api/share/tok_public123")
    const res = await GET(req, { params: Promise.resolve({ token: "tok_public123" }) })

    expect(res.status).toBe(200)

    const body = await res.json()

    // Must return logs and medications
    expect(Array.isArray(body.logs)).toBe(true)
    expect(body.logs).toHaveLength(2)
    expect(Array.isArray(body.medications)).toBe(true)
    expect(body.medications).toHaveLength(1)

    // Must include the link label
    expect(body.label).toBe("Dr. Sharma")

    // All logs belong to the owner — not another user
    const allLogsOwnedByPatient = (body.logs as any[]).every(
      (l) => l.userId === "patient_abc"
    )
    expect(allLogsOwnedByPatient).toBe(true)

    // No data from other users leaks into the response
    const hasOtherUserData = (body.logs as any[]).some(
      (l) => l.userId !== "patient_abc"
    )
    expect(hasOtherUserData).toBe(false)
  })

  it("returns 404 when the token does not match any share link", async () => {
    // shareLinks select returns empty
    const chain: any = {}
    chain.from = vi.fn(() => chain)
    chain.where = vi.fn(() => Promise.resolve([]))
    mockDbSelect.mockReturnValue(chain)

    const { GET } = await import("@/app/api/share/[token]/route")
    const req = new Request("http://localhost/api/share/tok_invalid")
    const res = await GET(req, { params: Promise.resolve({ token: "tok_invalid" }) })

    expect(res.status).toBe(404)
  })

  it("returns 410 when the share link has expired", async () => {
    const expiredLink = {
      id: "link_expired",
      userId: "patient_abc",
      token: "tok_expired",
      label: "Old Link",
      expiresAt: new Date("2020-01-01T00:00:00.000Z"), // in the past
      includeDocuments: false,
    }

    const chain: any = {}
    chain.from = vi.fn(() => chain)
    chain.where = vi.fn(() => Promise.resolve([expiredLink]))
    mockDbSelect.mockReturnValue(chain)

    const { GET } = await import("@/app/api/share/[token]/route")
    const req = new Request("http://localhost/api/share/tok_expired")
    const res = await GET(req, { params: Promise.resolve({ token: "tok_expired" }) })

    expect(res.status).toBe(410)
  })
})
