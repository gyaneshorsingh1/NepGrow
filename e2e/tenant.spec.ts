import { test, expect } from "@playwright/test";

test.describe("tenant owner auth", () => {
  test("owner login redirects to /app", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("owner@gmail.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });
  });

  test("owner cannot access /admin and ends on /app", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("owner@gmail.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/admin(?!\/login)/);
  });

  test("owner can open roles page", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("owner@gmail.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });

    await page.goto("/app/roles");
    await expect(
      page.getByRole("heading", { name: /roles & permissions/i }),
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe("receptionist authorization", () => {
  test("receptionist cannot access /app/roles", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("receptionist@abc-sports.local");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });

    await page.goto("/app/roles");
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByRole("heading", { name: /roles & permissions/i }),
    ).toHaveCount(0);
  });

  test("receptionist cannot access /admin", async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("receptionist@abc-sports.local");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin(?!\/login)/);
  });
});
