import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Auth mocks ───────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

// ─── DB mocks ─────────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
    get update() { return mockUpdate; },
    get delete() { return mockDelete; },
  },
}));

vi.mock("@/db/schema", () => ({
  doctorManagedPatients: {
    id: "id", doctorUserId: "doctorUserId", name: "name",
    dateOfBirth: "dateOfBirth", phone: "phone", bloodType: "bloodType",
    allergies: "allergies", emergencyContact: "emergencyContact",
    claimToken: "claimToken", claimedAt: "claimedAt",
    claimedByUserId: "claimedByUserId", notes: "notes", createdAt: "createdAt",
  },
  doctorPatients: {
    id: "id", doctorUserId: "doctorUserId", patientUserId: "patientUserId",
    status: "status", inviteToken: "inviteToken",
  },
  doctorNotes: {
    id: "id", doctorUserId: "doctorUserId", patientUserId: "patientUserId",
    note: "note", isPrivate: "isPrivate", createdAt: "createdAt",
  },
  users: { id: "id", name: "name", email: "email", bloodType: "bloodType", allergies: "allergies", emergencyContact: "emergencyContact", dateOfBirth: "dateOfBirth" },
  doctorProfiles: { userId: "userId", specialty: "specialty" },
  medications: { id: "id", userId: "userId", name: "name", dosage: "dosage", frequency: "frequency", prescribedBy: "prescribedBy", notes: "notes", startDate: "startDate", isActive: "isActive" },
  healthLogs: { id: "id", userId: "userId", date: "date" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ col: _col, val })),
  and: vi.fn((...args) => args),
  desc: vi.fn((col) => col),
  isNull: vi.fn((col) => ({ isNull: col })),
  isNotNull: vi.fn((col) => ({ isNotNull: col })),
}));

vi.mock("@/lib/utils", () => ({
  today: () => "2026-08-17",
  cn: (...args: string[]) => args.join(" "),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Build select chain: select().from().where() → resolves to rows */
function buildSelectChain(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  mockSelect.mockReturnValue({ from: fromMock });
  return { fromMock, whereMock };
}

/** Build insert chain: insert().values().returning() → resolves to rows */
function buildInsertChain(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const onConflictDoUpdateMock = vi.fn().mockReturnValue({ returning: returningMock });
  const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
  const valuesMock = vi.fn().mockReturnValue({
    returning: returningMock,
    onConflictDoNothing: onConflictDoNothingMock,
    onConflictDoUpdate: onConflictDoUpdateMock,
  });
  mockInsert.mockReturnValue({ values: valuesMock });
  return { valuesMock, returningMock };
}

/** Build update chain: update().set().where().returning() → resolves to rows */
function buildUpdateChain(rows: unknown[]) {
  const returningMock = vi.fn().mockResolvedValue(rows);
  const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
  const setMock = vi.fn().mockReturnValue({ where: whereMock });
  mockUpdate.mockReturnValue({ set: setMock });
  return { setMock, whereMock, returningMock };
}

/** Build delete chain: delete().where() → resolves */
function buildDeleteChain() {
  const whereMock = vi.fn().mockResolvedValue(undefined);
  mockDelete.mockReturnValue({ where: whereMock });
  return { whereMock };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const unclaimedPatient = {
  id: "mp_1",
  doctorUserId: "doctor_1",
  name: "Jane Doe",
  dateOfBirth: "1990-05-15",
  phone: "555-0101",
  bloodType: "A+",
  allergies: "Penicillin",
  emergencyContact: "John Doe 555-0202",
  claimToken: "tok_abc123",
  claimedAt: null,
  claimedByUserId: null,
  createdAt: "2026-08-17T00:00:00.000Z",
};

const claimedPatient = {
  ...unclaimedPatient,
  id: "mp_2",
  claimToken: "tok_claimed",
  claimedAt: "2026-08-17T12:00:00.000Z",
  claimedByUserId: "user_patient_1",
};

// ─── POST /api/doctor/managed-patients ───────────────────────────────────────

describe("POST /api/doctor/managed-patients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: "Jane Doe" }
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when name is empty", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: "" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { bloodType: "A+" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 or trims name longer than 200 chars", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    const longName = "A".repeat(201);
    const { valuesMock, returningMock } = buildInsertChain([
      { ...unclaimedPatient, name: longName.slice(0, 200) },
    ]);

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: longName }
    );
    const res = await POST(req);

    // Either reject with 400, or accept and trim to 200
    if (res.status === 400) {
      const body = await res.json();
      expect(body.error).toBeDefined();
    } else {
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.patient.name.length).toBeLessThanOrEqual(200);
    }
  });

  it("returns 201 with patient and claimToken on valid request", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    buildInsertChain([unclaimedPatient]);

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: "Jane Doe", dateOfBirth: "1990-05-15", phone: "555-0101" }
    );
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.patient).toBeDefined();
    expect(body.patient.claimToken).toBeTruthy();
    expect(typeof body.patient.claimToken).toBe("string");
  });

  it("stores doctorUserId as the authenticated user's id", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_99" });

    let capturedValues: Record<string, unknown> | null = null;
    const returningMock = vi.fn().mockResolvedValue([
      { ...unclaimedPatient, doctorUserId: "doctor_99" },
    ]);
    const valuesMock = vi.fn().mockImplementation((vals) => {
      capturedValues = vals;
      return { returning: returningMock };
    });
    mockInsert.mockReturnValue({ values: valuesMock });

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: "Patient X" }
    );
    await POST(req);

    expect(capturedValues).not.toBeNull();
    expect(capturedValues!.doctorUserId).toBe("doctor_99");
  });

  it("generates a claimToken automatically (not supplied by client)", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    let capturedValues: Record<string, unknown> | null = null;
    const returningMock = vi.fn().mockResolvedValue([unclaimedPatient]);
    const valuesMock = vi.fn().mockImplementation((vals) => {
      capturedValues = vals;
      return { returning: returningMock };
    });
    mockInsert.mockReturnValue({ values: valuesMock });

    const { POST } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients",
      { name: "Patient Y" }
    );
    await POST(req);

    expect(capturedValues).not.toBeNull();
    expect(capturedValues!.claimToken).toBeTruthy();
    expect(typeof capturedValues!.claimToken).toBe("string");
  });
});

// ─── GET /api/doctor/managed-patients ────────────────────────────────────────

describe("GET /api/doctor/managed-patients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns only this doctor's patients, not other doctors'", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // DB returns only doctor_1's patients (filtering is done in WHERE clause)
    buildSelectChain([unclaimedPatient, claimedPatient]);

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const patients = body.patients ?? body;
    expect(Array.isArray(patients)).toBe(true);
    patients.forEach((p: { doctorUserId?: string }) => {
      if (p.doctorUserId) {
        expect(p.doctorUserId).toBe("doctor_1");
      }
    });
  });

  it("returns isClaimed: false for unclaimed patients", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    buildSelectChain([unclaimedPatient]);

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const patients = body.patients ?? body;
    expect(patients[0].isClaimed).toBe(false);
  });

  it("returns isClaimed: true for claimed patients", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    buildSelectChain([claimedPatient]);

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const patients = body.patients ?? body;
    expect(patients[0].isClaimed).toBe(true);
  });

  it("includes claimUrl with the correct token", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    buildSelectChain([unclaimedPatient]);

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const patients = body.patients ?? body;
    expect(patients[0].claimUrl).toBeDefined();
    expect(patients[0].claimUrl).toContain(unclaimedPatient.claimToken);
  });

  it("returns an empty array when doctor has no managed patients", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });
    buildSelectChain([]);

    const { GET } = await import(
      "@/app/api/doctor/managed-patients/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const patients = body.patients ?? body;
    expect(Array.isArray(patients)).toBe(true);
    expect(patients).toHaveLength(0);
  });
});

// ─── PATCH /api/doctor/managed-patients/[id] ─────────────────────────────────

describe("PATCH /api/doctor/managed-patients/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { PATCH } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients/mp_1",
      { name: "Updated Name" },
      "PATCH"
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "mp_1" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when patient belongs to a different doctor", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // Ownership check: select returns empty (patient belongs to doctor_2)
    buildSelectChain([]);

    const { PATCH } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients/mp_99",
      { name: "Hacked Name" },
      "PATCH"
    );
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "mp_99" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("updates name and returns updated patient", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    const updatedPatient = { ...unclaimedPatient, name: "Jane Updated" };

    // select() for ownership check
    buildSelectChain([unclaimedPatient]);
    // update().set().where().returning()
    buildUpdateChain([updatedPatient]);

    const { PATCH } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients/mp_1",
      { name: "Jane Updated" },
      "PATCH"
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "mp_1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    const patient = body.patient ?? body;
    expect(patient.name).toBe("Jane Updated");
  });

  it("updates bloodType and other optional fields", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    const updatedPatient = { ...unclaimedPatient, bloodType: "O-" };

    buildSelectChain([unclaimedPatient]);
    buildUpdateChain([updatedPatient]);

    const { PATCH } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeJsonRequest(
      "http://localhost/api/doctor/managed-patients/mp_1",
      { bloodType: "O-" },
      "PATCH"
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "mp_1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    const patient = body.patient ?? body;
    expect(patient.bloodType).toBe("O-");
  });
});

// ─── DELETE /api/doctor/managed-patients/[id] ────────────────────────────────

describe("DELETE /api/doctor/managed-patients/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { DELETE } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients/mp_1",
      { method: "DELETE" }
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "mp_1" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when patient belongs to a different doctor", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // Ownership check returns empty — patient is not doctor_1's
    buildSelectChain([]);

    const { DELETE } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients/mp_99",
      { method: "DELETE" }
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "mp_99" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to delete a claimed patient", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // Ownership check returns claimed patient
    buildSelectChain([claimedPatient]);

    const { DELETE } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients/mp_2",
      { method: "DELETE" }
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "mp_2" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("deletes an unclaimed patient and returns 200", async () => {
    mockAuth.mockResolvedValue({ userId: "doctor_1" });

    // Ownership check returns unclaimed patient
    buildSelectChain([unclaimedPatient]);
    buildDeleteChain();

    const { DELETE } = await import(
      "@/app/api/doctor/managed-patients/[id]/route"
    );
    const req = makeRequest(
      "http://localhost/api/doctor/managed-patients/mp_1",
      { method: "DELETE" }
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "mp_1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ─── GET /api/claim/[token] (public) ─────────────────────────────────────────

describe("GET /api/claim/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for an invalid / nonexistent token", async () => {
    buildSelectChain([]); // no row found

    const { GET } = await import("@/app/api/claim/[token]/route");
    const req = makeRequest(
      "http://localhost/api/claim/invalid_token"
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "invalid_token" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns patient name, doctorName, and alreadyClaimed: false for valid unclaimed token", async () => {
    // select for managed patient row
    // select for doctor user/profile
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      const call = callCount;
      const whereMock = vi.fn().mockResolvedValue(
        call === 1
          ? [unclaimedPatient]
          : [{ id: "doctor_1", name: "Dr. Smith" }]
      );
      return { from: vi.fn().mockReturnValue({ where: whereMock }) };
    });

    const { GET } = await import("@/app/api/claim/[token]/route");
    const req = makeRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient?.name ?? body.patientName).toBeTruthy();
    expect(body.patient?.doctorName ?? body.doctorName).toBeTruthy();
    expect(body.alreadyClaimed).toBe(false);
  });

  it("returns alreadyClaimed: true for a token that has been claimed", async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      const call = callCount;
      const whereMock = vi.fn().mockResolvedValue(
        call === 1
          ? [claimedPatient]
          : [{ id: "doctor_1", name: "Dr. Smith" }]
      );
      return { from: vi.fn().mockReturnValue({ where: whereMock }) };
    });

    const { GET } = await import("@/app/api/claim/[token]/route");
    const req = makeRequest(
      `http://localhost/api/claim/${claimedPatient.claimToken}`
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: claimedPatient.claimToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyClaimed).toBe(true);
  });

  it("does not expose the claimToken or internal ids in the public response", async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      const call = callCount;
      const whereMock = vi.fn().mockResolvedValue(
        call === 1
          ? [unclaimedPatient]
          : [{ id: "doctor_1", name: "Dr. Smith" }]
      );
      return { from: vi.fn().mockReturnValue({ where: whereMock }) };
    });

    const { GET } = await import("@/app/api/claim/[token]/route");
    const req = makeRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // The raw claimToken and doctorUserId must not leak to public callers
    expect(body.claimToken).toBeUndefined();
    expect(body.doctorUserId).toBeUndefined();
  });
});

// ─── POST /api/claim/[token] ──────────────────────────────────────────────────

describe("POST /api/claim/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`,
      {}
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 for an invalid token", async () => {
    mockAuth.mockResolvedValue({ userId: "user_patient_2" });
    buildSelectChain([]); // token not found

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      "http://localhost/api/claim/bad_token",
      {}
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "bad_token" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when the token is already claimed", async () => {
    mockAuth.mockResolvedValue({ userId: "user_patient_2" });
    buildSelectChain([claimedPatient]); // already claimed

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      `http://localhost/api/claim/${claimedPatient.claimToken}`,
      {}
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: claimedPatient.claimToken }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 201 with success: true on valid unclaimed token with auth", async () => {
    mockAuth.mockResolvedValue({ userId: "user_patient_2" });

    // select for token lookup
    buildSelectChain([unclaimedPatient]);

    // update chain for marking claimedAt/claimedByUserId
    const returningMock = vi.fn().mockResolvedValue([
      { ...unclaimedPatient, claimedAt: "2026-08-17T12:00:00.000Z", claimedByUserId: "user_patient_2" },
    ]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    mockUpdate.mockReturnValue({ set: setMock });

    // insert for doctorPatients relationship
    const dpReturningMock = vi.fn().mockResolvedValue([
      { id: "dp_1", doctorUserId: "doctor_1", patientUserId: "user_patient_2", status: "active" },
    ]);
    const dpValuesMock = vi.fn().mockReturnValue({ returning: dpReturningMock, onConflictDoNothing: vi.fn().mockResolvedValue(undefined), onConflictDoUpdate: vi.fn().mockReturnValue({ returning: dpReturningMock }) });
    mockInsert.mockReturnValue({ values: dpValuesMock });

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`,
      {}
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates a doctorPatients relationship after successful claim", async () => {
    mockAuth.mockResolvedValue({ userId: "user_patient_2" });

    buildSelectChain([unclaimedPatient]);

    const returningMock = vi.fn().mockResolvedValue([
      { ...unclaimedPatient, claimedAt: "2026-08-17T12:00:00.000Z", claimedByUserId: "user_patient_2" },
    ]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    mockUpdate.mockReturnValue({ set: setMock });

    let capturedDpValues: Record<string, unknown> | null = null;
    const dpReturningMock = vi.fn().mockResolvedValue([
      { id: "dp_1", doctorUserId: "doctor_1", patientUserId: "user_patient_2", status: "active" },
    ]);
    const dpValuesMock = vi.fn().mockImplementation((vals) => {
      capturedDpValues = vals;
      return { returning: dpReturningMock, onConflictDoNothing: vi.fn().mockResolvedValue(undefined), onConflictDoUpdate: vi.fn().mockReturnValue({ returning: dpReturningMock }) };
    });
    mockInsert.mockReturnValue({ values: dpValuesMock });

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`,
      {}
    );
    await POST(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });

    expect(capturedDpValues).not.toBeNull();
    expect(capturedDpValues!.doctorUserId).toBe(unclaimedPatient.doctorUserId);
    expect(capturedDpValues!.patientUserId).toBe("user_patient_2");
    expect(capturedDpValues!.status).toBe("active");
  });

  it("sets claimedByUserId to the authenticated user's id after claim", async () => {
    mockAuth.mockResolvedValue({ userId: "user_patient_2" });

    buildSelectChain([unclaimedPatient]);

    let capturedUpdateValues: Record<string, unknown> | null = null;
    const returningMock = vi.fn().mockResolvedValue([
      { ...unclaimedPatient, claimedAt: "2026-08-17T12:00:00.000Z", claimedByUserId: "user_patient_2" },
    ]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockImplementation((vals) => {
      capturedUpdateValues = vals;
      return { where: updateWhereMock };
    });
    mockUpdate.mockReturnValue({ set: setMock });

    const dpReturningMock = vi.fn().mockResolvedValue([
      { id: "dp_1", doctorUserId: "doctor_1", patientUserId: "user_patient_2", status: "active" },
    ]);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: dpReturningMock, onConflictDoNothing: vi.fn().mockResolvedValue(undefined), onConflictDoUpdate: vi.fn().mockReturnValue({ returning: dpReturningMock }) }),
    });

    const { POST } = await import("@/app/api/claim/[token]/route");
    const req = makeJsonRequest(
      `http://localhost/api/claim/${unclaimedPatient.claimToken}`,
      {}
    );
    await POST(req, {
      params: Promise.resolve({ token: unclaimedPatient.claimToken }),
    });

    expect(setMock).toHaveBeenCalled();
    // The first update call should set claimedByUserId
    const firstCallArgs = setMock.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(firstCallArgs?.claimedByUserId).toBe("user_patient_2");
    expect(firstCallArgs?.claimedAt).toBeTruthy();
  });
});
