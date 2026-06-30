import { test, expect } from '@playwright/test';

test.describe('Guest Checkout Flow', () => {
  test('should allow a guest to view menu, add to cart, and reach checkout', async ({ page }) => {
    // 1. Create a dynamic demo storefront
    await page.goto('/');
    await page.getByRole('button', { name: /Try Demo Mode/i }).click();

    // Wait for the dashboard to load (demo setup complete)
    await expect(page).toHaveURL(/\/dashboard/);

    // Click the live menu link to navigate to the guest view
    const liveMenuLink = page.getByRole('link', { name: /View Live Menu/i });
    if (await liveMenuLink.isVisible()) {
      const href = await liveMenuLink.getAttribute('href');
      if (href) await page.goto(href);
    } else {
      const anyMenuLink = page.locator('a[href^="/m/"]').first();
      const href = await anyMenuLink.getAttribute('href');
      if (href) await page.goto(href);
    }
    
    // Check if the menu page loaded
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Wait for items to appear
    await expect(page.getByText('Spicy Asun Rolls').or(page.locator('button', { hasText: /Add/i }).first())).toBeVisible();

    // Look for an "Add to Cart" or "Add" button and click the first one
    const addButton = page.locator('button', { hasText: /Add/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Look for Cart or Checkout button
    const cartButton = page.locator('button', { hasText: /Cart|Checkout/i }).first();
    await expect(cartButton).toBeVisible();
    await cartButton.click();
    
    // Assert we reach a state where payment or order confirmation is possible
    const checkoutHeader = page.locator('text=/Checkout|Order Summary/i').first();
    await expect(checkoutHeader).toBeVisible();
  });
});
