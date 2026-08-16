import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/medications/route"

// ── Auth ────────────────────────────────────────────────────────────────────
const mockAuth = vi.fn()
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
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
  medications: "medications",
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}))

// ── Lib dependencies ────────────────────────────────────────────────────────
const mockCheckMedicationInteractions = vi.fn()
vi.mock("@/lib/medication-interactions", () => ({
  checkMedicationInteractions: (...args: any[]) => mockCheckMedicationInteractions(...args),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

function buildSelectChain(resolveWith: any[]) {
  const chain: any = {}
  chain.from = vi.fn(() => chain)
  chain.where = vi.fn(() => chain)
  chain.orderBy = vi.fn(() => Promise.resolve(resolveWith))
  return chain
}

function buildSelectWhereChain(resolveWith: any[]) {
  const chain: any = {}
  chain.from = vi.fn(() => chain)
  chain.where = vi.fn(() => Promise.resolve(resolveWith))
  return chain
}

function buildInsertChain(returnedRow: any) {
  const onConflictDoNothing = vi.fn(() => Promise.resolve())
  const returning = vi.fn(() => Promise.resolve([returnedRow]))
  const values = vi.fn(() => ({ returning, onConflictDoNothing }))
  return { values }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/medications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("returns array of meds for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeMeds = [
      { id: 1, userId: "user_abc", name: "Metformin", dosage: "500mg", isActive: true },
      { id: 2, userId: "user_abc", name: "Lisinopril", dosage: "10mg", isActive: true },
    ]
    const chain = buildSelectChain(fakeMeds)
    mockDbSelect.mockReturnValue(chain)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(fakeMeds)
    expect(chain.from).toHaveBeenCalledWith("medications")
  })

  it("returns an empty array when user has no medications", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const chain = buildSelectChain([])
    mockDbSelect.mockReturnValue(chain)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })
})

describe("POST /api/medications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const req = makeRequest("http://localhost/api/medications", {
      method: "POST",
      body: JSON.stringify({ name: "Aspirin", dosage: "100mg" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })

  it("creates a medication and returns it with status 201", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeMed = {
      id: 5,
      userId: "user_abc",
      name: "Aspirin",
      dosage: "100mg",
      frequency: "daily",
      isActive: true,
    }

    // users upsert
    mockDbInsert.mockReturnValueOnce(buildInsertChain(null))
    // medications insert
    mockDbInsert.mockReturnValueOnce(buildInsertChain(fakeMed))

    // select existing active meds for interaction check — return empty (no interactions)
    const existingMedsChain = buildSelectWhereChain([])
    mockDbSelect.mockReturnValue(existingMedsChain)

    const req = makeRequest("http://localhost/api/medications", {
      method: "POST",
      body: JSON.stringify({ name: "Aspirin", dosage: "100mg", frequency: "daily" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({
      id: 5,
      userId: "user_abc",
      name: "Aspirin",
      dosage: "100mg",
    })
  })

  it("includes interactions: null when no existing meds are present", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeMed = { id: 6, userId: "user_abc", name: "Ibuprofen", isActive: true }

    mockDbInsert.mockReturnValueOnce(buildInsertChain(null))
    mockDbInsert.mockReturnValueOnce(buildInsertChain(fakeMed))

    // No existing meds → interaction check is skipped → interactions stays null
    const existingMedsChain = buildSelectWhereChain([])
    mockDbSelect.mockReturnValue(existingMedsChain)

    const req = makeRequest("http://localhost/api/medications", {
      method: "POST",
      body: JSON.stringify({ name: "Ibuprofen" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.interactions).toBeNull()
    expect(mockCheckMedicationInteractions).not.toHaveBeenCalled()
  })

  it("calls checkMedicationInteractions when existing meds are present", async () => {
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeMed = { id: 7, userId: "user_abc", name: "Warfarin", isActive: true }
    mockDbInsert.mockReturnValueOnce(buildInsertChain(null))
    mockDbInsert.mockReturnValueOnce(buildInsertChain(fakeMed))

    const existingMedsChain = buildSelectWhereChain([{ name: "Aspirin" }])
    mockDbSelect.mockReturnValue(existingMedsChain)

    const fakeInteractions = { interactions: [], safe: true }
    mockCheckMedicationInteractions.mockResolvedValue(fakeInteractions)

    const req = makeRequest("http://localhost/api/medications", {
      method: "POST",
      body: JSON.stringify({ name: "Warfarin" }),
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(mockCheckMedicationInteractions).toHaveBeenCalledWith(
      "user_abc",
      "Warfarin",
      ["Aspirin"]
    )
    const body = await res.json()
    expect(body.interactions).toEqual(fakeInteractions)
  })

  it("missing name — still attempts insert (name validation is DB-level)", async () => {
    // The route does not do application-level validation on `name`.
    // It passes body.name (undefined) directly to the DB insert.
    // The DB mock will succeed; real Neon would reject a NOT NULL violation.
    // This test documents the current route behaviour, not ideal business logic.
    mockAuth.mockResolvedValue({ userId: "user_abc" })

    const fakeMed = { id: 8, userId: "user_abc", name: undefined, isActive: true }
    mockDbInsert.mockReturnValueOnce(buildInsertChain(null))
    mockDbInsert.mockReturnValueOnce(buildInsertChain(fakeMed))

    const existingMedsChain = buildSelectWhereChain([])
    mockDbSelect.mockReturnValue(existingMedsChain)

    const req = makeRequest("http://localhost/api/medications", {
      method: "POST",
      body: JSON.stringify({ dosage: "50mg" }), // name omitted
    })
    const res = await POST(req)

    // Route validates name before hitting DB — returns 400
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/name.*required/i)
  })
})
