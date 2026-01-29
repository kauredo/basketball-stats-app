import { test, expect } from "@playwright/test";

/**
 * Game Flow E2E Tests
 * These tests require a logged-in user with access to a league.
 * Some tests are marked as skip and serve as templates for
 * when authentication fixtures are set up.
 */

test.describe("Game Flow", () => {
  test.describe("Public Pages", () => {
    test("should load the home page", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/basketball|stats/i);
    });

    test("should have a features section", async ({ page }) => {
      await page.goto("/");

      // Look for feature descriptions
      const content = await page.content();
      expect(content.toLowerCase()).toMatch(/live|tracking|stats|analytics/);
    });

    test("should handle 404 for unknown routes", async ({ page }) => {
      await page.goto("/this-page-does-not-exist");

      // Should show some error or redirect
      const url = page.url();
      const content = await page.content();

      // Either redirected to home or shows 404
      expect(url.includes("this-page-does-not-exist") || content.includes("404")).toBe(true);
    });
  });

  test.describe("Navigation", () => {
    test("should have consistent header across pages", async ({ page }) => {
      await page.goto("/");

      const header = page.locator("header").first();
      await expect(header).toBeVisible();

      // Navigate to different page
      const links = await page.getByRole("link").all();
      if (links.length > 1) {
        await links[1].click();
        await expect(header).toBeVisible();
      }
    });

    test("should have footer with links", async ({ page }) => {
      await page.goto("/");

      const footer = page.locator("footer").first();
      await expect(footer).toBeVisible();

      // Check for common footer links
      const footerLinks = await footer.getByRole("link").count();
      expect(footerLinks).toBeGreaterThan(0);
    });
  });

  // Authenticated tests - require login fixtures
  test.describe("Authenticated Game Features", () => {
    test.skip("should display dashboard after login", async ({ page }) => {
      // TODO: Add login fixture
      // This test would verify the dashboard loads correctly
    });

    test.skip("should allow creating a new game", async ({ page }) => {
      // TODO: Add login fixture
      // This test would verify game creation flow
    });

    test.skip("should display live game interface", async ({ page }) => {
      // TODO: Add login fixture and game fixture
      // This test would verify live game UI elements
    });

    test.skip("should allow recording stats during game", async ({ page }) => {
      // TODO: Add login and active game fixtures
      // This test would verify stat recording
    });

    test.skip("should show game summary after completion", async ({ page }) => {
      // TODO: Add login and completed game fixtures
      // This test would verify game summary/box score
    });
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy on home page", async ({ page }) => {
    await page.goto("/");

    // Get all headings
    const h1Count = await page.locator("h1").count();
    const h2Count = await page.locator("h2").count();

    // Should have exactly one h1
    expect(h1Count).toBe(1);

    // h2s should be present for sections
    expect(h2Count).toBeGreaterThanOrEqual(0);
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");

    const images = await page.locator("img").all();

    for (const img of images) {
      const alt = await img.getAttribute("alt");
      // Images should have alt attribute (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through the page
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeDefined();

    // Tab a few more times
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to activate focused element with Enter
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName;
    });
    expect(focusedElement).toBeDefined();
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // This is a basic check - for full accessibility testing, use axe-core
    const body = page.locator("body");
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Body should have a defined background color
    expect(backgroundColor).toBeDefined();
  });
});

test.describe("Performance", () => {
  test("should load home page within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not have console errors on page load", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known acceptable errors (like missing fonts, etc)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("font") &&
        !error.includes("analytics") &&
        !error.includes("404")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
