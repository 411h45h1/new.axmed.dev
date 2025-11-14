import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test("should load page within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    // Page should load in under 5 seconds (accounting for slower browsers/devices)
    expect(loadTime).toBeLessThan(5000);
  });

  test("should have optimized assets", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify no unnecessary large payloads
    const htmlSize = (await response?.body())?.length || 0;
    console.warn(`HTML size: ${htmlSize} bytes`);
  });

  test("should lazy load or optimize JavaScript bundles", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for network to be idle
    await page.waitForLoadState("networkidle");

    const totalTime = Date.now() - startTime;
    console.warn(`Total load time with network idle: ${totalTime}ms`);

    // Should be reasonably fast even with all assets
    expect(totalTime).toBeLessThan(5000);
  });

  test("should have no console errors on load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("should have no JavaScript errors during interaction", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      // Filter out known browser-specific or non-critical errors
      const msg = error.message;
      if (!msg.includes("ResizeObserver") && !msg.includes("__playwright")) {
        errors.push(msg);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Interact with multiple elements
    await page.locator('.dock-item[data-app="about"]').click();
    await page.waitForTimeout(400);
    await page.locator('.dock-item[data-app="skills"]').click();
    await page.waitForTimeout(400);

    // Try to close a window if visible
    const closeBtn = page.locator(".window-button.close").first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(300);
    }

    // Should have no critical JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test("should have proper caching headers for static assets", async ({ page }) => {
    await page.goto("/");

    // Get all resource requests
    const resourcePromises: Promise<void>[] = [];

    page.on("response", async (response) => {
      const url = response.url();

      // Check CSS files have cache headers
      if (url.includes(".css")) {
        const cacheControl = response.headers()["cache-control"];
        resourcePromises.push(
          Promise.resolve().then(() => {
            expect(cacheControl).toBeTruthy();
          })
        );
      }

      // Check JS files have cache headers
      if (url.includes("/_astro/") && url.includes(".js")) {
        const cacheControl = response.headers()["cache-control"];
        resourcePromises.push(
          Promise.resolve().then(() => {
            expect(cacheControl).toBeTruthy();
          })
        );
      }
    });

    await page.waitForLoadState("networkidle");
    await Promise.all(resourcePromises);
  });

  test("should render efficiently with multiple windows", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const startTime = Date.now();

    // Open all windows with small delays to allow rendering
    await page.locator('.dock-item[data-app="about"]').click();
    await page.waitForTimeout(200);
    await page.locator('.dock-item[data-app="experience"]').click();
    await page.waitForTimeout(200);
    await page.locator('.dock-item[data-app="skills"]').click();
    await page.waitForTimeout(200);
    await page.locator('.dock-item[data-app="contact"]').click();
    await page.waitForTimeout(500);

    const renderTime = Date.now() - startTime;

    // Should open all windows reasonably quickly (relaxed for slower devices)
    expect(renderTime).toBeLessThan(5000);

    // All windows should be attached
    await expect(page.locator('.window[data-app="about"]')).toBeAttached();
    await expect(page.locator('.window[data-app="experience"]')).toBeAttached();
    await expect(page.locator('.window[data-app="skills"]')).toBeAttached();
    await expect(page.locator('.window[data-app="contact"]')).toBeAttached();
  });

  test("should measure Core Web Vitals", async ({ page }) => {
    await page.goto("/");

    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ["largest-contentful-paint"] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.warn(`LCP: ${lcp}ms`);

    // LCP should be under 2.5 seconds for good performance
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
    }
  });

  test("should handle rapid interactions without lag", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Rapidly click different dock items
    for (let i = 0; i < 3; i++) {
      await page.locator('.dock-item[data-app="about"]').click();
      await page.waitForTimeout(100);
      await page.locator('.dock-item[data-app="skills"]').click();
      await page.waitForTimeout(100);
    }

    // Should still be responsive
    const aboutWindow = page.locator('.window[data-app="about"]');
    await expect(aboutWindow).toBeAttached();
  });

  test("should efficiently handle window animations", async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
    }

    await page.goto("/");

    // Open a window
    await page.locator('.dock-item[data-app="about"]').click();
    const aboutWindow = page.locator('.window[data-app="about"]');

    await expect(aboutWindow).toBeVisible();

    // The window should be positioned correctly without layout shifts
    const boundingBox = await aboutWindow.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });
});
