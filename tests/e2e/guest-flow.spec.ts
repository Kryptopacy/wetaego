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

    // Fill in the guest details
    await page.getByPlaceholder('John Doe').fill('E2E Test Guest');
    await page.getByPlaceholder('08012345678').fill('08000000000');
    
    // Check if the table number input is visible
    const tableInput = page.getByPlaceholder(/Enter your Table|e\.g\. 12/i).first();
    if (await tableInput.isVisible()) {
      await tableInput.fill('Table 42');
    }

    // Scroll down and select "Cash on Delivery" or equivalent to bypass Stripe/Paystack in E2E
    // The "Pay on Delivery (Cash)" option is available if the store has it enabled, but we can't guarantee it.
    // However, for the purpose of the test, let's look for any payment method selector.
    const payOnDelivery = page.getByText(/Pay on Delivery \(Cash\)|Pay After Service/i).first();
    if (await payOnDelivery.isVisible()) {
      await payOnDelivery.click();
    }

    // Click the final "Place Order" or "Pay" button
    const placeOrderBtn = page.getByRole('button', { name: /Place Order|Pay ₦/i }).first();
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Assert that we get redirected to the order success page /m/[slug]/order/[id]
    await expect(page).toHaveURL(/\/m\/[^/]+\/order\/[^/]+/);
    
    // Assert the order status client is visible
    await expect(page.getByText(/Awaiting|Order Placed|Success/i).first()).toBeVisible();
  });
});
