import { expect, test } from "@playwright/test";

test("portfolio visitor can enter a local guest workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /visual testing that feels like reviewing a figma file/i })).toBeVisible();
  await page.getByRole("link", { name: /start local workspace/i }).click();
  await expect(page.getByRole("heading", { name: /open a local workspace/i })).toBeVisible();
  await page.getByRole("link", { name: /continue as guest/i }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
});

test("guest can capture and compare a real local page", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/app/projects/new");
  await expect(page.getByRole("heading", { name: "Create project" })).toBeVisible();
  await page.waitForTimeout(750);
  await page.getByLabel("Baseline URL").fill("http://127.0.0.1:3100");
  await page.getByLabel("Candidate URL").fill("http://127.0.0.1:3100");
  await page.getByLabel("Project name").fill("Local UI");
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/.+/);
  await page.getByLabel("Route path").fill("/demo-pages/baseline/pricing");
  await page.getByRole("button", { name: /save and run/i }).click();
  await expect(page).toHaveURL(/\/capture$/);
  await page.waitForURL(/\/app\/runs\/[^/]+$/, { timeout: 45_000 });
  await expect(page.getByRole("button", { name: /side by side/i })).toBeVisible();
  await expect(page.getByText("Local UI", { exact: true })).toHaveCount(1);
  await expect(page.getByText(/127\.0\.0\.1:3100/, { exact: true })).toHaveCount(2);
  await expect(page.getByText("main@a1b2c3d", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Run #1247", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: /accept change/i }).click();
  await expect(page.getByRole("button", { name: /accept change/i })).toContainText("Accept change");
  await page.goto("/app/projects");
  await expect(page.getByRole("link", { name: /Local UI.*127\.0\.0\.1/ })).toBeVisible();
  await expect(page.getByText("1 of 2 projects stored privately in this browser.")).toBeVisible();
});

test("failed capture reports the real URL and offers recovery", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/app/projects/new");
  await page.getByLabel("Project name").fill("Broken route test");
  await page.getByLabel("Baseline URL").fill("http://127.0.0.1:3100");
  await page.getByLabel("Candidate URL").fill("http://127.0.0.1:3100");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Route path").fill("/this-route-does-not-exist");
  await page.getByRole("button", { name: /save and run/i }).click();
  await expect(page.getByRole("heading", { name: "Capture failed" })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("paragraph").filter({ hasText: /Page returned 404.*this-route-does-not-exist/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry capture" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit route or URLs" })).toBeVisible();
  await expect(page.getByText("Run #1247", { exact: false })).toHaveCount(0);
  await expect(page.getByText("feat/pricing-refresh", { exact: true })).toHaveCount(0);
});

test("project flow exposes the two-project guardrail", async ({ page }) => {
  await page.goto("/app/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText(/of 2 projects stored privately/i)).toBeVisible();
  await page.getByRole("link", { name: /new project/i }).click();
  await expect(page.getByRole("heading", { name: "Create project" })).toBeVisible();
});

test("custom public HTTPS domains enable project creation", async ({ page }) => {
  await page.goto("/app/projects/new");
  await page.getByLabel("Baseline URL").fill("https://adavia.com");
  await page.getByLabel("Candidate URL").fill("https://dev.adavia.com");
  await page.getByLabel("Project name").fill("Adavia");
  await expect(page.getByText("Ready for local capture", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
});
