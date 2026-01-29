import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the login page for unauthenticated users", async ({ page }) => {
    // Check that login/signup options are visible
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
  });

  test("should have login form with email and password fields", async ({ page }) => {
    // Navigate to login page
    await page.getByRole("link", { name: /log in/i }).click();

    // Check for email and password inputs
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    // Navigate to login page
    await page.getByRole("link", { name: /log in/i }).click();

    // Enter invalid email
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Should show error
    await expect(page.getByText(/invalid|email/i)).toBeVisible();
  });

  test("should navigate to signup page", async ({ page }) => {
    // Click signup link
    await page.getByRole("link", { name: /sign up|create account/i }).click();

    // Check for signup form fields
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("should have forgot password link on login page", async ({ page }) => {
    // Navigate to login page
    await page.getByRole("link", { name: /log in/i }).click();

    // Check for forgot password link
    await expect(page.getByRole("link", { name: /forgot|reset/i })).toBeVisible();
  });
});

test.describe("Landing Page", () => {
  test("should display the app name and description", async ({ page }) => {
    await page.goto("/");

    // Check for app branding
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should load without horizontal scrollbar
    const body = await page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Allow small margin
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for common navigation elements
    const nav = page.locator("nav, header");
    await expect(nav).toBeVisible();
  });
});
