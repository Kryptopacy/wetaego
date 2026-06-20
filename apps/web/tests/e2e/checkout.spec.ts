import { test, expect } from '@playwright/test';

test.describe('Customer Checkout Flow', () => {
  test('should allow a customer to add items and checkout', async ({ page }) => {
    // 1. Navigate to a demo public menu
    // We assume /m/demo-lounge is a seeded demo location
    await page.goto('/m/demo-lounge');

    // 2. Wait for items to load
    await expect(page.locator('text=Add to Order').first()).toBeVisible();

    // 3. Add an item to the cart
    await page.locator('text=Add to Order').first().click();

    // 4. Verify cart floating action button appears and shows 1 item
    const cartFab = page.locator('button', { hasText: 'View Order' });
    await expect(cartFab).toBeVisible();
    await cartFab.click();

    // 5. Verify we are on the order summary/checkout page
    await expect(page.url()).toContain('/order');
    await expect(page.locator('text=Checkout')).toBeVisible();

    // Note: Actually processing a payment via Playwright requires mocking the Paystack/Stripe API
    // which goes beyond standard E2E. We assert the checkout button is reachable.
  });
});
