import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Public page smoke tests — verifies pages render without crashing
// ---------------------------------------------------------------------------

test.describe("Home page /", () => {
  test("returns 200 and has NearCare in the title", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/NearCare/i);
  });
});

test.describe("Auth pages", () => {
  test("/sign-in returns 200", async ({ page }) => {
    const response = await page.goto("/sign-in");
    // Clerk renders the sign-in widget; page should load without crashing
    expect(response?.status()).toBe(200);
  });

  test("/sign-up returns 200", async ({ page }) => {
    const response = await page.goto("/sign-up");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Legal / static pages", () => {
  test("/privacy returns 200 and has a Privacy heading", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /privacy/i })
    ).toBeVisible();
  });

  test("/terms returns 200 and has a Terms heading", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /terms/i })
    ).toBeVisible();
  });

  test("/security returns 200", async ({ page }) => {
    const response = await page.goto("/security");
    expect(response?.status()).toBe(200);
  });
});

test.describe("PWA / utility pages", () => {
  test("/offline returns 200", async ({ page }) => {
    const response = await page.goto("/offline");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Dynamic share routes", () => {
  test("/share/nonexistent renders an error gracefully (no 500)", async ({
    page,
  }) => {
    const response = await page.goto("/share/nonexistent");
    // Must not be a 500-level error
    expect((response?.status() ?? 0)).toBeLessThan(500);
    // Page must not be blank — some content should be rendered
    const body = await page.locator("body").textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Doctor invite routes", () => {
  test("/doctor-invite/nonexistent renders an error gracefully (no 500)", async ({
    page,
  }) => {
    const response = await page.goto("/doctor-invite/nonexistent");
    expect((response?.status() ?? 0)).toBeLessThan(500);
    const body = await page.locator("body").textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});
