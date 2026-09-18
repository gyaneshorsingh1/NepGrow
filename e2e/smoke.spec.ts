import { test, expect } from "@playwright/test";

test.describe("public surfaces", () => {
  test("marketing home loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/NepGrow/i).first()).toBeVisible();
  });

  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("app login page loads", async ({ page }) => {
    await page.goto("/app/login");
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("admin dashboard requires auth", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("tenant app requires auth", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/app\/login/);
  });
});

test.describe("admin auth", () => {
  test("super admin can sign in and lands on /admin", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill("admin@nepgrow.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 15000 });
    await expect(
      page.getByText(/super admin|clients|dashboard/i).first(),
    ).toBeVisible();
  });
});
