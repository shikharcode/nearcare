import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads with expected content", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/NearCare/);
    await expect(
      page.getByRole("link", { name: /get started free/i }).or(
        page.getByRole("button", { name: /get started free/i })
      )
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sign in/i })
    ).toBeVisible();
  });
});

test.describe("Sign-in page", () => {
  test("loads Clerk sign-in component and NearCare branding", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/sign-in", { waitUntil: "networkidle" });
    // Clerk renders an email input or a form
    const emailInput = page.locator('input[type="email"]');
    const form = page.locator("form");
    await expect(emailInput.or(form).first()).toBeVisible();
    // NearCare branding should be present somewhere on the page
    await expect(page.getByText(/NearCare/i).first()).toBeVisible();
  });
});

test.describe("Sign-up page", () => {
  test("loads Clerk sign-up component", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/sign-up", { waitUntil: "networkidle" });
    const emailInput = page.locator('input[type="email"]');
    const form = page.locator("form");
    await expect(emailInput.or(form).first()).toBeVisible();
  });
});

test.describe("Unauthenticated redirect", () => {
  test("redirects /dashboard to /sign-in when not logged in", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/sign-in/);
    // Dashboard-specific content should not be visible
    await expect(page.getByRole("heading", { name: /dashboard/i })).not.toBeVisible();
  });
});

test.describe("Static pages", () => {
  test("privacy page loads with Privacy heading", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/privacy", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/privacy/i);
  });

  test("terms page loads with Terms heading", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/terms", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/terms/i);
  });

  test("security page loads with Security heading", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/security", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/security/i);
  });
});

test.describe("Share page", () => {
  test("handles invalid token without crashing", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/share/invalid-token-xyz", { waitUntil: "networkidle" });
    // Page must not show an unhandled error boundary / blank screen
    await expect(page.locator("body")).not.toBeEmpty();
    // Should show some error or invalid-state indicator
    const errorText = page
      .getByText(/invalid/i)
      .or(page.getByText(/not found/i))
      .or(page.getByText(/expired/i))
      .or(page.getByText(/error/i));
    await expect(errorText.first()).toBeVisible();
  });
});

test.describe("Doctor invite page", () => {
  test("handles invalid token without crashing", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/doctor-invite/invalid-token-xyz", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toBeEmpty();
    const invalidState = page
      .getByText(/invalid/i)
      .or(page.getByText(/not found/i))
      .or(page.getByText(/expired/i))
      .or(page.getByText(/error/i));
    await expect(invalidState.first()).toBeVisible();
  });
});

test.describe("Offline page", () => {
  test("loads with offline content", async ({ page }) => {
    test.setTimeout(10_000);
    await page.goto("/offline", { waitUntil: "networkidle" });
    await expect(page.getByText(/offline/i).first()).toBeVisible();
  });
});
