import { expect, test } from "@playwright/test";

test("portfolio visitor can open the seeded comparison", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /visual testing that feels like reviewing a figma file/i })).toBeVisible();
  await page.getByRole("link", { name: /try live demo/i }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("button", { name: /slider/i })).toBeVisible();
  await page.getByRole("button", { name: /slider/i }).click();
  await expect(page.getByText(/seeded public demo/i)).toBeVisible();
});

test("project flow exposes the two-project guardrail", async ({ page }) => {
  await page.goto("/app/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText(/two projects available/i)).toBeVisible();
  await page.getByRole("link", { name: /new project/i }).click();
  await expect(page.getByRole("heading", { name: "Create project" })).toBeVisible();
});
