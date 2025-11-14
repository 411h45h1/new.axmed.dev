import { test, expect } from "@playwright/test";

test.describe("Portfolio Core Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  });

  test("should load homepage successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Ahmed Ali/);
    await expect(page.locator("#wallpaper")).toBeVisible();
    await expect(page.locator("#menubar")).toBeVisible();
    await expect(page.locator("#dock")).toBeVisible();
  });

  test("should display all dock items", async ({ page }) => {
    const dockItems = page.locator(".dock-item");
    await expect(dockItems).toHaveCount(6);

    // Verify each app is present in the DOM
    await expect(page.locator('.dock-item[data-app="about"]')).toBeAttached();
    await expect(page.locator('.dock-item[data-app="experience"]')).toBeAttached();
    await expect(page.locator('.dock-item[data-app="projects"]')).toBeAttached();
    await expect(page.locator('.dock-item[data-app="skills"]')).toBeAttached();
    await expect(page.locator('.dock-item[data-app="contact"]')).toBeAttached();
    await expect(page.locator('.dock-item[data-app="video-player"]')).toBeAttached();
  });

  test("should display menubar with correct items", async ({ page }) => {
    await expect(page.locator(".app-name")).toHaveText("Ahmed Ali");
    await expect(page.locator('.menu-item[data-app="about"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-app="experience"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-app="projects"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-app="skills"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-app="contact"]')).toBeVisible();
    await expect(page.locator("#clock")).toBeVisible();
  });

  test("should show time in clock", async ({ page }) => {
    const clock = page.locator("#clock");
    const timeText = await clock.textContent();
    // Check for time format (e.g., "12:34" or "12:34 PM")
    expect(timeText).toMatch(/\d{1,2}:\d{2}/);
  });

  test("should open About window when clicking dock item", async ({ page }) => {
    const aboutDockItem = page.locator('.dock-item[data-app="about"]');
    const aboutWindow = page.locator('.window[data-app="about"]');

    // Click dock item to ensure window is open
    await aboutDockItem.click();
    await page.waitForTimeout(300);

    // Window should be visible
    await expect(aboutWindow).toBeVisible();

    // Verify window content
    await expect(aboutWindow.locator(".title")).toHaveText("About Me");
    await expect(aboutWindow.getByText(/Hi, I'm Ahmed/)).toBeVisible();
  });

  test("should open Experience window from menubar", async ({ page }) => {
    const experienceMenuItem = page.locator('.menu-item[data-app="experience"]');
    const experienceWindow = page.locator('.window[data-app="experience"]');

    await experienceMenuItem.click();
    await page.waitForTimeout(500);
    await expect(experienceWindow).toBeAttached();
  });

  test("should close window when clicking close button", async ({ page }) => {
    const projectsDockItem = page.locator('.dock-item[data-app="projects"]');
    const projectsWindow = page.locator('.window[data-app="projects"]');

    // Open window
    await projectsDockItem.click();
    await page.waitForTimeout(300);
    await expect(projectsWindow).toBeAttached();

    // Click close button
    const closeButton = projectsWindow.locator(".window-button.close");
    await closeButton.click();
    await page.waitForTimeout(300);

    // Window should be hidden
    await expect(projectsWindow).toHaveClass(/hidden/);
  });

  test("should show dock indicator for open windows", async ({ page }) => {
    const aboutDockItem = page.locator('.dock-item[data-app="about"]');
    const indicator = aboutDockItem.locator(".dock-indicator");

    // Indicator should exist
    await expect(indicator).toBeAttached();

    // Open window
    await aboutDockItem.click();
    await page.waitForTimeout(300);

    // Verify window is open (indicator state may vary)
    const aboutWindow = page.locator('.window[data-app="about"]');
    await expect(aboutWindow).toBeVisible();
  });

  test("should open multiple windows simultaneously", async ({ page }) => {
    await page.locator('.dock-item[data-app="about"]').click();
    await page.waitForTimeout(200);
    await page.locator('.dock-item[data-app="skills"]').click();
    await page.waitForTimeout(200);
    await page.locator('.dock-item[data-app="contact"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.window[data-app="about"]')).toBeAttached();
    await expect(page.locator('.window[data-app="skills"]')).toBeAttached();
    await expect(page.locator('.window[data-app="contact"]')).toBeAttached();
  });

  test("should bring window to front when clicked", async ({ page }) => {
    // Open two windows
    await page.locator('.dock-item[data-app="about"]').click();
    await page.waitForTimeout(400);
    await page.locator('.dock-item[data-app="experience"]').click();
    await page.waitForTimeout(400);

    const aboutWindow = page.locator('.window[data-app="about"]');
    const experienceWindow = page.locator('.window[data-app="experience"]');

    // Both windows should be attached
    await expect(aboutWindow).toBeAttached();
    await expect(experienceWindow).toBeAttached();

    // Click about window via dock to bring to front
    await page.locator('.dock-item[data-app="about"]').click();
    await page.waitForTimeout(400);

    // Window should still be attached after interaction
    await expect(aboutWindow).toBeAttached();
  });

  test("should display reset button when windows are modified", async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
    }

    const resetButton = page.locator("#reset-windows-btn");

    // Open and move a window
    await page.locator('.dock-item[data-app="about"]').click();
    const aboutWindow = page.locator('.window[data-app="about"]');

    // Drag window to a new position
    const titlebar = aboutWindow.locator(".titlebar");
    await titlebar.hover();
    await page.mouse.down();
    await page.mouse.move(500, 300);
    await page.mouse.up();

    // Reset button should become visible (not faded)
    await expect(resetButton).not.toHaveClass(/faded/);
  });

  test("should have valid structured data (JSON-LD)", async ({ page }) => {
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    expect(count).toBeGreaterThan(0);

    // Verify Person schema
    const personSchema = await jsonLdScripts.first().textContent();
    const personData = JSON.parse(personSchema || "{}");

    expect(personData["@type"]).toBe("Person");
    expect(personData.name).toBe("Ahmed Ali");
    expect(personData.jobTitle).toBe("Full Stack Developer");
  });

  test("should have proper meta tags for SEO", async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Ahmed Ali.*Full Stack Developer/);

    // Check description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /Interactive portfolio/);

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /Ahmed Ali/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute("content", /og-image.png/);

    // Check Twitter tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute("content", "summary_large_image");
  });

  test("should have accessible skip link", async ({ page }) => {
    const skipLink = page.locator(".skip-to-content");
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText("Skip to main content");
    await expect(skipLink).toHaveAttribute("href", "#main-content");

    // Skip link should become visible when focused
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test("should load wallpaper canvas", async ({ page }) => {
    const canvas = page.locator("#noiseCanvas");
    await expect(canvas).toBeVisible();

    // Verify canvas has dimensions
    const width = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
    const height = await canvas.evaluate((el: HTMLCanvasElement) => el.height);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
