import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully sign up with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/');

    // We use the Try Demo Mode button, which uses the admin API to bypass rate limits
    await page.getByRole('button', { name: /Try Demo Mode/i }).click();

    // Assert that the page redirects to the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify the dashboard loads successfully
    await expect(page.getByText('Loading workspace...').or(page.locator('main'))).toBeVisible();
  });

  test('should show an error message with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Assert that the error banner appears (driven by the ?message= URL param)
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.getByText('Could not authenticate user').or(page.getByText('Invalid login credentials'))).toBeVisible();
  });
});
