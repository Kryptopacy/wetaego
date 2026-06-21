import { test, expect } from '@playwright/test';

test.describe('Guest Checkout Flow', () => {
  test('should allow a guest to view menu, add to cart, and reach checkout', async ({ page }) => {
    // Navigate to a demo menu
    await page.goto('/m/demo');
    
    // Check if the menu page loaded
    await expect(page.locator('h1').first()).toBeVisible();
    
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
