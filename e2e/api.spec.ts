import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Public / unauthenticated API endpoint tests
// ---------------------------------------------------------------------------

test.describe("GET /api/health", () => {
  test("returns 200 with status ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("GET /api/status", () => {
  test("returns 200 with a services object", async ({ request }) => {
    const response = await request.get("/api/status");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("services");
    expect(typeof body.services).toBe("object");
  });

  test("services.gemini is 'configured' or 'missing'", async ({ request }) => {
    const response = await request.get("/api/status");
    const body = await response.json();
    expect(["configured", "missing"]).toContain(body.services.gemini);
  });

  test("services.database is 'ok' or 'error'", async ({ request }) => {
    const response = await request.get("/api/status");
    const body = await response.json();
    expect(["ok", "error"]).toContain(body.services.database);
  });
});

test.describe("Authenticated endpoints return 401 when unauthenticated", () => {
  test("GET /api/health-logs → 401", async ({ request }) => {
    const response = await request.get("/api/health-logs");
    // Clerk may redirect to sign-in (3xx) or return 401 directly
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test("GET /api/medications → 401", async ({ request }) => {
    const response = await request.get("/api/medications");
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test("GET /api/profile → 401", async ({ request }) => {
    const response = await request.get("/api/profile");
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test("GET /api/alerts → 401", async ({ request }) => {
    const response = await request.get("/api/alerts");
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test("POST /api/doctor/prescribe → 401", async ({ request }) => {
    const response = await request.post("/api/doctor/prescribe", {
      data: {},
    });
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test("GET /api/doctor/profile → 401", async ({ request }) => {
    const response = await request.get("/api/doctor/profile");
    expect([401, 302, 307, 308]).toContain(response.status());
  });
});

test.describe("POST /api/abha/verify", () => {
  test("returns 401 when not authenticated (even with valid-looking body)", async ({
    request,
  }) => {
    const response = await request.post("/api/abha/verify", {
      data: { abhaId: "123" },
    });
    // Clerk auth check fires before body validation, so expect 401 (or redirect)
    expect([401, 302, 307, 308]).toContain(response.status());
  });
});

test.describe("GET /api/specialists/search", () => {
  test("responds without a server error (no 5xx)", async ({ request }) => {
    const response = await request.get("/api/specialists/search");
    // The route is public — it either returns results or a graceful fallback.
    // It should never throw a 500.
    expect(response.status()).toBeLessThan(500);
  });

  test("returns a JSON body with a facilities array on success or fallback", async ({
    request,
  }) => {
    const response = await request.get("/api/specialists/search");
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("facilities");
      expect(Array.isArray(body.facilities)).toBe(true);
    }
  });
});
