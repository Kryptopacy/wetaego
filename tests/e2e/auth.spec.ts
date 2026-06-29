import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully log in with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Wait for the form to be ready
    await expect(page.getByRole('heading', { name: 'OurMenu OS' })).toBeVisible();

    // Fill in the login credentials
    // Note: Use a dedicated test account or mock the backend in the CI pipeline
    await page.fill('input[name="email"]', 'test-admin@ourmenuos.online');
    await page.fill('input[name="password"]', 'testpassword123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Ensure the Sign In button shows the loading state
    await expect(page.getByRole('button', { name: 'Signing In...' })).toBeVisible();

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
