import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module-level mocks ───────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

// Chainable db mock — each method returns a fresh proxy so tests can override
// individual chain segments without cross-contamination.
const mockReturning = vi.fn();
const mockOnConflictDoNothing = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockInsertValues = vi.fn();
const mockInsert = vi.fn();

const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();

const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
  },
}));

vi.mock("@/db/schema", () => ({
  users: {},
  doctorProfiles: { userId: "userId" },
  doctorPatients: { doctorUserId: "doctorUserId", patientUserId: "patientUserId", status: "status" },
  doctorNotes: { doctorUserId: "doctorUserId", patientUserId: "patientUserId", createdAt: "createdAt" },
  medications: {},
  healthAlerts: { userId: "userId", createdAt: "createdAt", type: "type" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ col: _col, val })),
  and: vi.fn((...args) => args),
  desc: vi.fn((col) => col),
}));

vi.mock("@/lib/utils", () => ({
  today: () => "2026-08-16",
  cn: (...args: string[]) => args.join(" "),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

function makeJsonRequest(url: string, body: unknown, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Build a select chain: select().from().where() → resolves to `rows`
// Optionally supports .orderBy().limit() for alerts
function buildSelectChain(rows: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(rows);
  const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
  const whereMock = vi.fn().mockResolvedValue(rows);
  // where() may be followed by orderBy in alerts
  const whereWithOrder = vi.fn().mockReturnValue({ orderBy: orderByMock });
  // notes uses where().orderBy() directly (no limit)
  const whereOrderByMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn().mockReturnValue({
    where: whereMock,
  });
  mockSelect.mockReturnValue({ from: fromMock });
  return { fromMock, whereMock, orderByMock, limitMock };
}

// Build an insert chain: insert().values().returning() → resolves to `rows`
function buildInsertChain(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
  const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
  const valuesMock = vi.fn().mockReturnValue({
    returning: returningMock,
    onConflictDoUpdate: onConflictDoUpdateMock,
    onConflictDoNothing: onConflictDoNothingMock,
  });
  mockInsert.mockReturnValue({ values: valuesMock });
  return { valuesMock, returningMock, onConflictDoUpdateMock, onConflictDoNothingMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Doctor Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // GET /api/doctor/profile
  describe("GET", () => {
    it("returns 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { GET } = await import("@/app/api/doctor/profile/route");
      const res = await GET();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns empty object {} if no profile exists", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      const whereMock = vi.fn().mockResolvedValue([]); // no rows
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockSelect.mockReturnValue({ from: fromMock });

      const { GET } = await import("@/app/api/doctor/profile/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({});
    });

    it("returns profile object if exists", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      const profile = {
        id: "prof_1",
        userId: "doctor_1",
        specialty: "Cardiology",
        licenseNumber: "LIC123",
        hospital: "City Hospital",
        phone: "555-0100",
        bio: "Experienced cardiologist",
        yearsOfExperience: 15,
        languages: "English,Hindi",
        isVerified: true,
      };

      const whereMock = vi.fn().mockResolvedValue([profile]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockSelect.mockReturnValue({ from: fromMock });

      const { GET } = await import("@/app/api/doctor/profile/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(profile);
    });
  });

  // POST /api/doctor/profile
  describe("POST", () => {
    it("returns 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { POST } = await import("@/app/api/doctor/profile/route");
      const req = makeJsonRequest("http://localhost/api/doctor/profile", {
        specialty: "Cardiology",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("creates/updates profile and returns it", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });
      mockCurrentUser.mockResolvedValue({
        fullName: "Dr. Alice",
        emailAddresses: [{ emailAddress: "alice@hospital.com" }],
      });

      const savedProfile = {
        id: "prof_1",
        userId: "doctor_1",
        specialty: "Cardiology",
        licenseNumber: "LIC999",
        hospital: "City Hospital",
        phone: "555-0200",
        bio: null,
        yearsOfExperience: 10,
        languages: "English",
      };

      // insert().values().onConflictDoNothing() for users upsert
      // insert().values().onConflictDoUpdate().returning() for profile upsert
      const returningMock = vi.fn().mockResolvedValue([savedProfile]);
      const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
      const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        returning: returningMock,
        onConflictDoUpdate: onConflictDoUpdateMock,
        onConflictDoNothing: onConflictDoNothingMock,
      });
      mockInsert.mockReturnValue({ values: valuesMock });

      const { POST } = await import("@/app/api/doctor/profile/route");
      const req = makeJsonRequest("http://localhost/api/doctor/profile", {
        specialty: "Cardiology",
        licenseNumber: "LIC999",
        hospital: "City Hospital",
        phone: "555-0200",
        bio: null,
        yearsOfExperience: 10,
        languages: "English",
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(savedProfile);
    });

    it("stores null when yearsOfExperience is empty string", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });
      mockCurrentUser.mockResolvedValue({
        fullName: "Dr. Alice",
        emailAddresses: [{ emailAddress: "alice@hospital.com" }],
      });

      const savedProfile = { id: "prof_1", userId: "doctor_1", yearsOfExperience: null };

      const returningMock = vi.fn().mockResolvedValue([savedProfile]);
      const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
      const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        returning: returningMock,
        onConflictDoUpdate: onConflictDoUpdateMock,
        onConflictDoNothing: onConflictDoNothingMock,
      });
      mockInsert.mockReturnValue({ values: valuesMock });

      const { POST } = await import("@/app/api/doctor/profile/route");
      const req = makeJsonRequest("http://localhost/api/doctor/profile", {
        specialty: "Cardiology",
        yearsOfExperience: "", // empty string → should be stored as null
      });
      await POST(req);

      // insert() is called twice: first for users upsert, second for doctorProfiles upsert.
      // The profile fields are in the second values() call.
      const callArgs = valuesMock.mock.calls[1][0];
      expect(callArgs).toMatchObject({ yearsOfExperience: null });
    });
  });
});

describe("Doctor Prescribe API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import("@/app/api/doctor/prescribe/route");
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_1",
      name: "Aspirin",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 if doctor has no active relationship with patient", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // select() for relationship check returns empty array
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockSelect.mockReturnValue({ from: fromMock });

    const { POST } = await import("@/app/api/doctor/prescribe/route");
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_1",
      name: "Aspirin",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("No active relationship with this patient");
  });

  it("inserts medication with userId = patient userId, not doctor userId", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    mockCurrentUser.mockResolvedValue({
      fullName: "Dr. Alice",
      emailAddresses: [{ emailAddress: "alice@hospital.com" }],
    });

    const activeRel = {
      id: "rel_1",
      doctorUserId: "doctor_1",
      patientUserId: "patient_99",
      status: "active",
    };

    const doctorProfile = {
      userId: "doctor_1",
      specialty: "Cardiology",
    };

    const insertedMedication = {
      id: "med_1",
      userId: "patient_99", // must be patient's userId
      name: "Aspirin",
      dosage: "100mg",
      frequency: "once daily",
      prescribedBy: "Dr. Dr. Alice (Cardiology)",
      notes: "Take with food",
      startDate: "2026-08-16",
      isActive: true,
    };

    const insertedNote = {
      id: "note_1",
      doctorUserId: "doctor_1",
      patientUserId: "patient_99",
    };

    // select() is called twice: once for relationship, once for doctor profile
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      const call = selectCallCount;
      const whereMock = vi.fn().mockResolvedValue(
        call === 1 ? [activeRel] : [doctorProfile]
      );
      return { from: vi.fn().mockReturnValue({ where: whereMock }) };
    });

    // insert() is called twice: once for medication, once for doctor note
    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      const call = insertCallCount;
      const returningMock = vi.fn().mockResolvedValue(
        call === 1 ? [insertedMedication] : [insertedNote]
      );
      return { values: vi.fn().mockReturnValue({ returning: returningMock }) };
    });

    const { POST } = await import("@/app/api/doctor/prescribe/route");
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_99",
      name: "Aspirin",
      dosage: "100mg",
      frequency: "once daily",
      instructions: "Take with food",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    // Response shape must be { medication, note }
    expect(body).toHaveProperty("medication");
    expect(body).toHaveProperty("note");

    // medication.userId must be the patient, not the doctor
    expect(body.medication.userId).toBe("patient_99");
    expect(body.medication.userId).not.toBe("doctor_1");
  });

  it("sets prescribedBy to doctor name and specialty", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    mockCurrentUser.mockResolvedValue({
      fullName: "Alice Smith",
      emailAddresses: [{ emailAddress: "alice@hospital.com" }],
    });

    const activeRel = { id: "rel_1", doctorUserId: "doctor_1", patientUserId: "patient_99", status: "active" };
    const doctorProfile = { userId: "doctor_1", specialty: "Neurology" };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      const call = selectCallCount;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(call === 1 ? [activeRel] : [doctorProfile]),
        }),
      };
    });

    let capturedMedValues: Record<string, unknown> | null = null;
    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      const call = insertCallCount;
      const valuesMock = vi.fn().mockImplementation((vals) => {
        if (call === 1) capturedMedValues = vals;
        return { returning: vi.fn().mockResolvedValue([{ id: `inserted_${call}`, ...vals }]) };
      });
      return { values: valuesMock };
    });

    const { POST } = await import("@/app/api/doctor/prescribe/route");
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_99",
      name: "Ibuprofen",
      dosage: "400mg",
      frequency: "twice daily",
    });
    await POST(req);

    expect(capturedMedValues).not.toBeNull();
    expect(capturedMedValues!.prescribedBy).toBe("Dr. Alice Smith (Neurology)");
  });

  it("sets prescribedBy without specialty when doctor has no specialty", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    mockCurrentUser.mockResolvedValue({
      fullName: "Bob Jones",
      emailAddresses: [{ emailAddress: "bob@hospital.com" }],
    });

    const activeRel = { id: "rel_1", doctorUserId: "doctor_1", patientUserId: "patient_99", status: "active" };
    // No specialty in profile
    const doctorProfile = { userId: "doctor_1", specialty: null };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      const call = selectCallCount;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(call === 1 ? [activeRel] : [doctorProfile]),
        }),
      };
    });

    let capturedMedValues: Record<string, unknown> | null = null;
    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      const call = insertCallCount;
      const valuesMock = vi.fn().mockImplementation((vals) => {
        if (call === 1) capturedMedValues = vals;
        return { returning: vi.fn().mockResolvedValue([{ id: `ins_${call}`, ...vals }]) };
      });
      return { values: valuesMock };
    });

    const { POST } = await import("@/app/api/doctor/prescribe/route");
    const req = makeJsonRequest("http://localhost/api/doctor/prescribe", {
      patientUserId: "patient_99",
      name: "Paracetamol",
    });
    await POST(req);

    expect(capturedMedValues!.prescribedBy).toBe("Dr. Bob Jones");
  });
});

describe("Doctor Notes API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // GET /api/doctor/notes
  describe("GET", () => {
    it("returns 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { GET } = await import("@/app/api/doctor/notes/route");
      const req = makeRequest("http://localhost/api/doctor/notes?patientId=patient_1");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 400 if no patientId is provided", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      const { GET } = await import("@/app/api/doctor/notes/route");
      const req = makeRequest("http://localhost/api/doctor/notes");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("patientId required");
    });

    it("returns { notes: [] } shape, not a flat array", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      const noteRows = [
        { id: "n1", doctorUserId: "doctor_1", patientUserId: "patient_1", note: "All good", isPrivate: false },
        { id: "n2", doctorUserId: "doctor_1", patientUserId: "patient_1", note: "Follow up needed", isPrivate: true },
      ];

      const orderByMock = vi.fn().mockResolvedValue(noteRows);
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockSelect.mockReturnValue({ from: fromMock });

      const { GET } = await import("@/app/api/doctor/notes/route");
      const req = makeRequest("http://localhost/api/doctor/notes?patientId=patient_1");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Must be { notes: [...] }, not a flat array
      expect(body).toHaveProperty("notes");
      expect(Array.isArray(body.notes)).toBe(true);
      expect(body.notes).toHaveLength(2);
      expect(body.notes[0].id).toBe("n1");
    });
  });

  // POST /api/doctor/notes
  describe("POST", () => {
    it("returns 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { POST } = await import("@/app/api/doctor/notes/route");
      const req = makeJsonRequest("http://localhost/api/doctor/notes", {
        patientId: "patient_1",
        note: "Patient is recovering well.",
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 403 if no active relationship", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      // Relationship check returns empty
      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockSelect.mockReturnValue({ from: fromMock });

      const { POST } = await import("@/app/api/doctor/notes/route");
      const req = makeJsonRequest("http://localhost/api/doctor/notes", {
        patientId: "patient_1",
        note: "Some note.",
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Not authorized");
    });

    it("creates note and returns { note: {...} } shape, not flat", async () => {
      mockAuth.mockResolvedValue({ userId: "doctor_1" });

      const activeRel = { id: "rel_1", doctorUserId: "doctor_1", patientUserId: "patient_1", status: "active" };
      const createdNote = {
        id: "note_42",
        doctorUserId: "doctor_1",
        patientUserId: "patient_1",
        note: "Patient is recovering well.",
        isPrivate: false,
        createdAt: "2026-08-16T00:00:00.000Z",
      };

      // select() for relationship check
      const whereMock = vi.fn().mockResolvedValue([activeRel]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockSelect.mockReturnValue({ from: fromMock });

      // insert().values().returning()
      const returningMock = vi.fn().mockResolvedValue([createdNote]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockInsert.mockReturnValue({ values: valuesMock });

      const { POST } = await import("@/app/api/doctor/notes/route");
      const req = makeJsonRequest("http://localhost/api/doctor/notes", {
        patientId: "patient_1",
        note: "Patient is recovering well.",
        isPrivate: false,
      });
      const res = await POST(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      // Must be { note: {...} }, not the raw note object at top level
      expect(body).toHaveProperty("note");
      expect(body.note).toEqual(createdNote);
      // Sanity: top-level id should NOT exist
      expect(body.id).toBeUndefined();
    });
  });
});

describe("Alerts API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { GET } = await import("@/app/api/alerts/route");
    const req = makeRequest("http://localhost/api/alerts");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns all alerts when no type param is provided", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });

    const alerts = [
      { id: "a1", userId: "user_1", type: "anomaly_detected", severity: "warning", message: "BP high", createdAt: "2026-08-16T10:00:00Z" },
      { id: "a2", userId: "user_1", type: "blood_pressure", severity: "critical", message: "Very high BP", createdAt: "2026-08-15T10:00:00Z" },
    ];

    const limitMock = vi.fn().mockResolvedValue(alerts);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockSelect.mockReturnValue({ from: fromMock });

    const { GET } = await import("@/app/api/alerts/route");
    const req = makeRequest("http://localhost/api/alerts");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it("filters alerts by type when ?type= param is provided", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });

    const allAlerts = [
      { id: "a1", userId: "user_1", type: "anomaly_detected", severity: "warning", message: "Anomaly", createdAt: "2026-08-16T10:00:00Z" },
      { id: "a2", userId: "user_1", type: "blood_pressure", severity: "critical", message: "High BP", createdAt: "2026-08-15T10:00:00Z" },
      { id: "a3", userId: "user_1", type: "anomaly_detected", severity: "warning", message: "Another anomaly", createdAt: "2026-08-14T10:00:00Z" },
    ];

    const limitMock = vi.fn().mockResolvedValue(allAlerts);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockSelect.mockReturnValue({ from: fromMock });

    const { GET } = await import("@/app/api/alerts/route");
    const req = makeRequest("http://localhost/api/alerts?type=anomaly_detected");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    // Only anomaly_detected rows pass through the filter
    expect(body).toHaveLength(2);
    expect(body.every((a: { type: string }) => a.type === "anomaly_detected")).toBe(true);
  });

  it("returns an array (not an object) for alerts response", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });

    const limitMock = vi.fn().mockResolvedValue([]);
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockSelect.mockReturnValue({ from: fromMock });

    const { GET } = await import("@/app/api/alerts/route");
    const req = makeRequest("http://localhost/api/alerts");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
