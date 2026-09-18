import { test, expect } from "@playwright/test";

/**
 * Full overlapping-booking conflict is covered in vitest
 * (`src/server/services/booking-conflict.test.ts`) matching createBooking rules.
 * This suite asserts the tenant bookings UI is reachable and the create form exists.
 */
test.describe("tenant bookings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/login");
    await page.getByLabel(/email/i).fill("owner@gmail.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/app(?!\/login)/, { timeout: 15000 });
  });

  test("bookings page loads with create form", async ({ page }) => {
    await page.goto("/app/bookings");
    await expect(page).toHaveURL(/\/app\/bookings/);
    await expect(page.getByRole("heading", { name: /bookings/i })).toBeVisible();
    await expect(page.getByLabel(/court/i)).toBeVisible();
    await expect(page.getByLabel(/^start$/i)).toBeVisible();
    await expect(page.getByLabel(/^end$/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create booking/i }),
    ).toBeVisible();
  });
});
