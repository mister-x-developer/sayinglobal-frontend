import { test, expect } from '@playwright/test';

test.describe('SAYIN GLOBAL E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root
    await page.goto('http://localhost:3001/');
  });

  test('Homepage loads correctly and has expected title', async ({ page }) => {
    await expect(page).toHaveTitle(/SAYIN GLOBAL|Livestock/);
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();
  });

  test('Auth redirect works for protected routes', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    await expect(page).toHaveURL(/.*\/auth/);
  });
});
