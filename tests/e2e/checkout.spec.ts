import { test, expect } from '@playwright/test';

test.describe('Checkout Golden Path', () => {
  test('User can browse a menu, add an item, and open checkout', async ({ page }) => {
    // 1. Create a dynamic demo storefront
    await page.goto('/');
    
    // Click 'Try Demo Mode'
    await page.getByRole('button', { name: /Try Demo Mode/i }).click();

    // Wait for the dashboard to load (demo setup complete)
    await expect(page).toHaveURL(/\/dashboard/);

    // Get the generated location slug from the dashboard or via navigation
    // We can extract it by going to the Live Menu link
    const liveMenuLink = page.getByRole('link', { name: /View Live Menu/i });
    if (await liveMenuLink.isVisible()) {
      const href = await liveMenuLink.getAttribute('href');
      if (href) await page.goto(href);
    } else {
      // Fallback: Just look for a link that starts with /m/
      const anyMenuLink = page.locator('a[href^="/m/"]').first();
      const href = await anyMenuLink.getAttribute('href');
      if (href) await page.goto(href);
    }
    
    // 2. Wait for the page to load
    await expect(page).toHaveTitle(/OurMenu|Pacy/i);
    
    // Wait for items to be rendered (wait for network idle or text)
    await expect(page.getByText('Spicy Asun Rolls').or(page.locator('button', { hasText: /Add to Cart/i }).first())).toBeVisible();
    
    // 3. Wait for and click the first 'Add to Cart' button
    const firstItemAddBtn = page.getByRole('button', { name: /add to cart/i }).first();
    await firstItemAddBtn.click();

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
