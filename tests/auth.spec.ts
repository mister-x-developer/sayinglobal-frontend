import { test, expect } from '@playwright/test';

test.describe('Auth Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/auth');
  });

  test('Shows error on invalid phone format', async ({ page }) => {
    // Assuming there's a phone input field
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await phoneInput.isVisible() && await submitButton.isVisible()) {
        await phoneInput.fill('1234'); // invalid short number
        await submitButton.click();
        
        // Assert error message exists
        const errorText = page.locator('text=/invalid|error|too short/i').first();
        await expect(errorText).toBeVisible();
    }
  });

  test('OTP input edge cases', async ({ page }) => {
    // Navigate to OTP page directly if possible, or assume it's part of auth flow
    await page.goto('http://localhost:3001/auth/verify');
    
    const otpInput = page.locator('input[name="code"], input[type="text"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await otpInput.isVisible() && await submitButton.isVisible()) {
        await otpInput.fill('ABCDE'); // Characters instead of numbers
        await submitButton.click();
        const errorText = page.locator('text=/invalid|error|digits/i').first();
        await expect(errorText).toBeVisible();
    }
  });
});
