import { test, expect } from '@playwright/test';

test.describe('Checkout Golden Path', () => {
  test('User can browse a menu, add an item, and open checkout', async ({ page }) => {
    // 1. Visit a live storefront (Assuming 'demo' slug exists for test environments)
    // Replace 'demo' with the actual storefront slug used in test seeding
    await page.goto('/m/demo');
    
    // 2. Wait for the page to load
    await expect(page).toHaveTitle(/OurMenu/i);
    
    // 3. Find the first 'Add to Cart' or 'Plus' button on a menu item
    // Note: Depends on the exact UI implementation, using aria-labels if possible
    const firstItemAddBtn = page.getByRole('button', { name: /increase quantity/i }).first().or(
      page.getByRole('button', { name: /add to cart/i }).first()
    );
    
    // Fallback if the above doesn't match the specific UI text
    if (await firstItemAddBtn.isVisible()) {
      await firstItemAddBtn.click();
    } else {
      // Use a generic locator for the item card plus button
      await page.locator('.group button').filter({ hasText: '+' }).first().click();
    }

    // 4. Verify the Cart FAB appears
    const cartFab = page.getByRole('button', { name: /checkout cart/i });
    await expect(cartFab).toBeVisible();

    // 5. Open Checkout Modal
    await cartFab.click();

    // 6. Verify Checkout Modal elements
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
    await expect(page.getByText('Order Summary')).toBeVisible();

    // 7. Fill Customer Details
    await page.getByPlaceholder('John Doe').fill('E2E Test User');
    await page.getByPlaceholder('08012345678').fill('08012345678');
    
    // 8. If Delivery option is visible, click it and fill address
    const deliveryBtn = page.getByRole('button', { name: 'Delivery' });
    if (await deliveryBtn.isVisible()) {
      await deliveryBtn.click();
      await page.getByPlaceholder(/123 Main St/i).fill('123 Test St, Lagos');
    } else {
      // If table/pickup, just fill the table number or pickup instructions
      const locationInput = page.getByPlaceholder(/Enter your/i).or(page.getByPlaceholder(/e.g. 'Pickup/i));
      if (await locationInput.isVisible()) {
        await locationInput.fill('Test Table 1');
      }
    }

    // 9. Checkout Submission
    const payBtn = page.getByRole('button', { name: /complete order|transfer|pay/i });
    await expect(payBtn).toBeVisible();
    
    // We do NOT click payBtn here to avoid creating junk orders in production,
    // but in a true E2E CI environment, we would intercept the network request.
    // await payBtn.click();
    // await expect(page.getByText(/Order Sent/i)).toBeVisible();
  });
});
