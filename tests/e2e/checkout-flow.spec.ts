import { test, expect } from '@playwright/test';

test.describe('Checkout Flow (Omnichannel)', () => {
  test('User can complete a full order from menu to payment screen', async ({ page }) => {
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
    
    // Ensure the menu loads
    await expect(page.locator('h1').first()).toBeVisible();

    // Wait for items to appear
    await expect(page.getByText('Spicy Asun Rolls').or(page.locator('button', { hasText: /Add/i }).first())).toBeVisible();

    // 2. Add an item to the cart
    const firstItemAddBtn = page.locator('button:has-text("Add")').first();
    await expect(firstItemAddBtn).toBeVisible();
    await firstItemAddBtn.click();

    // 3. Open the floating cart
    const cartFab = page.locator('button:has-text("View Cart")');
    await expect(cartFab).toBeVisible();
    await cartFab.click();

    // Verify the cart modal opened
    await expect(page.locator('text=Your Order')).toBeVisible();

    // 4. Proceed to Checkout
    const checkoutBtn = page.locator('button:has-text("Checkout")');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Verify transition to checkout page
    await expect(page).toHaveURL(/\/m\/lounge\/checkout/);

    // 5. Fill out the checkout form
    // Note: Depends on whether it's dine-in or takeaway, we'll fill out generic customer details
    await page.fill('input[name="customerName"], input[placeholder*="Name"]', 'Test Customer');
    
    // Optionally fill phone or email if visible
    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('08012345678');
    }

    // 6. Select Payment Method (e.g. Card/Paystack)
    // Assume there is a radio or button for payment method
    const payOnlineBtn = page.locator('text=Pay Online').or(page.locator('text=Card'));
    if (await payOnlineBtn.isVisible()) {
        await payOnlineBtn.click();
    }

    // 7. Place Order
    const placeOrderBtn = page.locator('button:has-text("Place Order"), button:has-text("Pay Now")');
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 8. Assert Order Success / Payment redirect
    // The system should generate an order and redirect to /pay/[order_id] or show a success screen
    await expect(page).toHaveURL(/\/pay\/|\/success/);
    
    // Check for success or payment gateway elements
    await expect(page.locator('text=Order Summary').or(page.locator('text=Processing'))).toBeVisible();
  });
});
