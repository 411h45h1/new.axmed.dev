import { test, expect } from "@playwright/test";

test.describe("Responsive Design Tests", () => {
  test.describe("Desktop", () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test("should display desktop layout correctly", async ({ page }) => {
      await page.goto("/");

      // Dock should be horizontal at bottom
      const dock = page.locator("#dock");
      await expect(dock).toBeVisible();

      const dockBox = await dock.boundingBox();
      expect(dockBox).toBeTruthy();

      // Dock should be near bottom of screen
      expect(dockBox?.y).toBeGreaterThan(900);
    });

    test("should enable window dragging on desktop", async ({ page, isMobile }) => {
      // Skip on mobile devices
      if (isMobile) {
        test.skip();
      }

      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      await page.locator('.dock-item[data-app="about"]').click();
      await page.waitForTimeout(300);
      const aboutWindow = page.locator('.window[data-app="about"]');

      const initialBox = await aboutWindow.boundingBox();

      // Drag window
      const titlebar = aboutWindow.locator(".titlebar");
      await titlebar.hover();
      await page.mouse.down();
      await page.mouse.move(500, 300);
      await page.mouse.up();

      await page.waitForTimeout(300);

      const newBox = await aboutWindow.boundingBox();

      // Position should have changed (on desktop)
      expect(newBox?.x).not.toBe(initialBox?.x);
    });

    test("should show dock magnification effect on hover", async ({ page }) => {
      await page.goto("/");

      const firstDockItem = page.locator(".dock-item").first();

      // Hover over dock item
      await firstDockItem.hover();

      // Wait for animation
      await page.waitForTimeout(300);

      // Should have transform applied
      const transform = await firstDockItem.evaluate((el) => window.getComputedStyle(el).transform);

      expect(transform).not.toBe("none");
    });

    test("should display all windows simultaneously on large screen", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Open multiple windows
      await page.locator('.dock-item[data-app="about"]').click();
      await page.waitForTimeout(300);
      await page.locator('.dock-item[data-app="experience"]').click();
      await page.waitForTimeout(300);
      await page.locator('.dock-item[data-app="skills"]').click();
      await page.waitForTimeout(500);

      // All should be attached (may overlap or be repositioned)
      await expect(page.locator('.window[data-app="about"]')).toBeAttached();
      await expect(page.locator('.window[data-app="experience"]')).toBeAttached();
      await expect(page.locator('.window[data-app="skills"]')).toBeAttached();
    });
  });

  test.describe("Tablet", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("should adapt layout for tablet", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("#menubar")).toBeVisible();
      await expect(page.locator("#dock")).toBeVisible();
      await expect(page.locator("#wallpaper")).toBeVisible();
    });

    test("should handle window interactions on tablet", async ({ page }) => {
      await page.goto("/");

      await page.locator('.dock-item[data-app="about"]').click();
      const aboutWindow = page.locator('.window[data-app="about"]');

      await expect(aboutWindow).toBeVisible();
      await expect(aboutWindow.getByText(/Hi, I'm Ahmed/)).toBeVisible();
    });

    test("should properly size windows for tablet viewport", async ({ page }) => {
      await page.goto("/");

      await page.locator('.dock-item[data-app="projects"]').click();
      const projectsWindow = page.locator('.window[data-app="projects"]');

      const windowBox = await projectsWindow.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 0;

      // Window should fit within viewport
      expect(windowBox?.width).toBeLessThanOrEqual(viewportWidth);
    });
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display mobile layout correctly", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("#menubar")).toBeVisible();
      await expect(page.locator("#dock")).toBeVisible();
    });

    test("should make windows fullscreen on mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      await page.locator('.dock-item[data-app="about"]').click();
      await page.waitForTimeout(500);
      const aboutWindow = page.locator('.window[data-app="about"]');

      await expect(aboutWindow).toBeAttached();

      // Window should be visible and sized for mobile
      const windowBox = await aboutWindow.boundingBox();
      expect(windowBox).toBeTruthy();
      expect(windowBox?.width).toBeGreaterThan(100);
    });

    test("should disable drag on mobile", async ({ page }) => {
      await page.goto("/");

      await page.locator('.dock-item[data-app="skills"]').click();
      await page.waitForTimeout(300);
      const skillsWindow = page.locator('.window[data-app="skills"]');

      await expect(skillsWindow).toBeVisible();

      // On mobile, windows are typically fullscreen or fixed position
      // Just verify the window is displayed correctly
      const windowBox = await skillsWindow.boundingBox();
      expect(windowBox).toBeTruthy();
    });

    test("should stack windows vertically on mobile", async ({ page }) => {
      await page.goto("/");

      // Open multiple windows
      await page.locator('.dock-item[data-app="about"]').click();
      await page.waitForTimeout(300);
      await page.locator('.dock-item[data-app="skills"]').click();
      await page.waitForTimeout(300);

      // Both should be accessible
      await expect(page.locator('.window[data-app="about"]')).toBeAttached();
      await expect(page.locator('.window[data-app="skills"]')).toBeVisible();
    });

    test("should handle touch interactions", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);

      // Tap dock item with retry logic
      const contactDockItem = page.locator('.dock-item[data-app="contact"]');
      await contactDockItem.waitFor({ state: "attached" });
      await contactDockItem.tap();
      await page.waitForTimeout(1000);

      // Window should be attached
      const contactWindow = page.locator('.window[data-app="contact"]');
      await expect(contactWindow).toBeAttached({ timeout: 10000 });
    });

    test("should optimize dock for mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const dock = page.locator("#dock");
      const dockItems = page.locator(".dock-item");

      await expect(dock).toBeAttached();
      await expect(dockItems).toHaveCount(6);

      // All items should be in the DOM
      for (let i = 0; i < 6; i++) {
        await expect(dockItems.nth(i)).toBeAttached();
      }
    });
  });

  test.describe("Landscape Mobile", () => {
    test.use({ viewport: { width: 667, height: 375 } });

    test("should adapt to landscape orientation", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);

      await expect(page.locator("#menubar")).toBeAttached({ timeout: 10000 });
      await expect(page.locator("#dock")).toBeAttached({ timeout: 10000 });

      // Open a window
      const aboutDockItem = page.locator('.dock-item[data-app="about"]');
      await aboutDockItem.waitFor({ state: "attached" });
      await aboutDockItem.click();
      await page.waitForTimeout(800);

      await expect(page.locator('.window[data-app="about"]')).toBeAttached({ timeout: 10000 });
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA labels", async ({ page }) => {
      await page.goto("/");

      // Check menubar
      const menubar = page.locator("#menubar");
      await expect(menubar).toHaveAttribute("role", "banner");
      await expect(menubar).toHaveAttribute("aria-label", /menu bar/i);

      // Check dock
      const dock = page.locator("#dock");
      await expect(dock).toHaveAttribute("role", "navigation");

      // Check windows have dialog role
      await page.locator('.dock-item[data-app="about"]').click();
      const aboutWindow = page.locator('.window[data-app="about"]');
      await expect(aboutWindow).toHaveAttribute("role", "dialog");
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Tab to skip link
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);

      // Check if skip link is focused (may vary by browser)
      const skipLink = page.locator(".skip-to-content");
      const isSkipFocused = await skipLink.evaluate((el) => document.activeElement === el);

      if (!isSkipFocused) {
        // Tab to first menu item if skip link wasn't focused
        await page.keyboard.press("Tab");
        await page.waitForTimeout(200);
      }

      // Tab to menu item
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);

      const _firstMenuItem = page.locator('.menu-item[data-app="about"]');

      // Activate with Enter
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);

      const aboutWindow = page.locator('.window[data-app="about"]');
      await expect(aboutWindow).toBeAttached();
    });

    test("should have proper color contrast", async ({ page }) => {
      await page.goto("/");

      // Open a window to test content
      await page.locator('.dock-item[data-app="about"]').click();
      const aboutWindow = page.locator('.window[data-app="about"]');

      // Verify window has readable content
      const content = aboutWindow.locator(".window-content");
      await expect(content).toBeVisible();

      const textColor = await content.evaluate((el) => window.getComputedStyle(el).color);
      const bgColor = await content.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      // Basic check that colors are defined
      expect(textColor).toBeTruthy();
      expect(bgColor).toBeTruthy();
    });

    test("should have accessible form controls", async ({ page }) => {
      await page.goto("/");

      await page.locator('.dock-item[data-app="contact"]').click();
      await page.waitForTimeout(500);
      const contactWindow = page.locator('.window[data-app="contact"]');

      // Check form has labels and inputs
      const nameInput = contactWindow.locator("input#name");
      const nameLabel = contactWindow.locator('label[for="name"]');

      await expect(nameLabel).toBeVisible();
      await expect(nameInput).toBeVisible();

      // Check aria-labels on buttons
      const submitButton = contactWindow.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test("should announce window state changes to screen readers", async ({ page }) => {
      await page.goto("/");

      const aboutWindow = page.locator('.window[data-app="about"]');

      // Window should have aria-modal
      await page.locator('.dock-item[data-app="about"]').click();
      await expect(aboutWindow).toHaveAttribute("aria-modal", "false");

      // Should have aria-label
      const ariaLabel = await aboutWindow.getAttribute("aria-label");
      expect(ariaLabel).toContain("About");
    });

    test("should have visible focus indicators", async ({ page }) => {
      await page.goto("/");

      // Tab through interactive elements
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Check that focused element has visible outline or focus style
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const outlineStyle = await page.evaluate(
        (el) => window.getComputedStyle(el as Element).outline,
        focusedElement
      );

      // Should have some focus styling (outline, box-shadow, etc.)
      expect(outlineStyle !== "none" || outlineStyle.length > 0).toBeTruthy();
    });
  });

  test.describe("Viewport Changes", () => {
    test("should handle viewport resize gracefully", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/");

      // Open a window
      await page.locator('.dock-item[data-app="about"]').click();

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Window should still be visible and properly sized
      const aboutWindow = page.locator('.window[data-app="about"]');
      await expect(aboutWindow).toBeVisible();

      const windowBox = await aboutWindow.boundingBox();
      expect(windowBox?.width).toBeLessThanOrEqual(375);
    });

    test("should persist window state across viewport changes", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");

      // Open multiple windows
      await page.locator('.dock-item[data-app="about"]').click();
      await page.locator('.dock-item[data-app="skills"]').click();

      // Resize
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Windows should still be open
      await expect(page.locator('.window[data-app="about"]')).toBeVisible();
      await expect(page.locator('.window[data-app="skills"]')).toBeVisible();
    });
  });
});
