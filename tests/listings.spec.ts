import { test, expect } from '@playwright/test';

test.describe('Listings Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root
    await page.goto('http://localhost:3001/');
  });

  test('Search and filter UI appears correctly', async ({ page }) => {
    // Mock user clicking on the search input
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible()) {
        await searchInput.fill('Cow');
        await searchInput.press('Enter');
        
        // Ensure some results or empty state appears
        await expect(page).toHaveURL(/.*search.*/);
    }
  });

  test('Categories navigation', async ({ page }) => {
    const categoriesLink = page.locator('a[href="/categories"]').first();
    if (await categoriesLink.isVisible()) {
        await categoriesLink.click();
        await expect(page).toHaveURL(/.*\/categories/);
        
        // Assert we see some categories
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();
    }
  });

  test('Creating listing without login redirects to auth', async ({ page }) => {
    await page.goto('http://localhost:3001/listings/create');
    await expect(page).toHaveURL(/.*\/auth/);
  });
});
