import { test, expect } from '@playwright/test';

test.describe('Customer Checkout Flow', () => {
  test('should allow a customer to add items, fill out checkout modal, and place an order', async ({ page }) => {
    // 1. Navigate to a demo public menu
    await page.goto('/m/demo-lounge');

    // Wait for the hydration and items to load
    await expect(page.locator('text=Add to Order').first()).toBeVisible();

    // 2. Add an item to the cart
    await page.locator('text=Add to Order').first().click();

    // 3. Verify cart floating action button appears and shows 1 item
    const cartFab = page.locator('button', { hasText: 'View Order' });
    await expect(cartFab).toBeVisible();
    await cartFab.click();

    // 4. Verify checkout modal opens
    await expect(page.locator('h2', { hasText: 'Checkout' })).toBeVisible();

    // 5. Fill out customer details
    await page.getByPlaceholder('Your Name *').fill('Playwright Tester');
    // Ensure we provide a phone number if required by the UI for pickup/table
    const phoneInput = page.getByPlaceholder('Phone Number *');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('08000000000');
    }

    // 6. Click Place Order
    // The button might say 'Place Order' (offline) or 'Pay X' (online). 
    // We target the submit button within the form.
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 7. Verify we are redirected to the order success/tracking page
    // The URL should transition to /m/demo-lounge/order/<uuid>
    await page.waitForURL(/\/order\/[0-9a-fA-F-]+/);
    
    // Verify success UI elements are present
    await expect(page.locator('text=Order Status')).toBeVisible();
    
    // 8. Verify the local cart was cleared (Cart FAB should no longer be visible)
    await expect(cartFab).not.toBeVisible();
  });
});
