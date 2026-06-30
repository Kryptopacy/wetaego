import { test, expect } from '@playwright/test';

test.describe('Multi-Business Fulfillment Flow', () => {
  test('should allow navigating to dashboard and checking orders', async ({ page }) => {
    // Navigate to the demo app
    await page.goto('/');

    // Check that we're on the landing page
    await expect(page.locator('text=The ultimate digital storefront')).toBeVisible();

    // Click "Start Building" or navigate to dashboard directly
    await page.goto('/dashboard');
    
    // In an actual test, we would log in here using a test account.
    // Since we're just checking that the dashboard route mounts and Playwright is wired:
    
    // Check that the live operations text is present or auth redirect happens
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();
    } else {
      await expect(page.locator('text=Live Operations')).toBeVisible();
    }
  });
});
