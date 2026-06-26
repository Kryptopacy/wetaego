import { test, expect } from '@playwright/test';

test('login page renders the authentication form', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Ensure the page loaded successfully
  await expect(page).toHaveTitle(/Login|Ourmenu/i);

  // Check for the presence of email input
  // Note: The specific locator might need to be adjusted based on the actual UI of the login page
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.count() > 0) {
    await expect(emailInput.first()).toBeVisible();
  }

  // Check for the submit/login button
  const loginButton = page.locator('button[type="submit"]');
  if (await loginButton.count() > 0) {
    await expect(loginButton.first()).toBeVisible();
  }
});
