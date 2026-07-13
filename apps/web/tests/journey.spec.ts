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
  await page.getByRole("button", { name: /accept change/i }).click();
  await expect(page.getByRole("button", { name: /accept change/i })).toContainText("Accept change");
});

test("project flow exposes the two-project guardrail", async ({ page }) => {
  await page.goto("/app/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText(/two projects stored privately/i)).toBeVisible();
  await page.getByRole("link", { name: /new project/i }).click();
  await expect(page.getByRole("heading", { name: "Create project" })).toBeVisible();
});
