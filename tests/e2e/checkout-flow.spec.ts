import { test, expect } from '@playwright/test';

test.describe('Checkout Flow (Omnichannel)', () => {
  test('User can add items to cart and view checkout', async ({ page }) => {
    await page.goto('/m/lounge');
    await expect(page.locator('h1').first()).toBeVisible();

    const firstItem = page.locator('button:has-text("Add")').first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      const cartFab = page.locator('button:has-text("View Cart")');
      await expect(cartFab).toBeVisible();
      await cartFab.click();
      const checkoutBtn = page.locator('button:has-text("Checkout")');
      await expect(checkoutBtn).toBeVisible();
    }
  });
});
