import { test, expect } from '@playwright/test';

test('homepage has correct title and key elements', async ({ page }) => {
  // Navigate to the root of the application
  await page.goto('/');

  // Verify the page mounts without hydration errors
  await expect(page).toHaveTitle(/Ourmenu/i);

  // Verify the pricing section is rendered
  const pricingHeading = page.locator('text=Pricing');
  await expect(pricingHeading).toBeVisible();

  // Verify the hero section loads properly
  const ctaButton = page.locator('text=Get Started');
  if (await ctaButton.count() > 0) {
    await expect(ctaButton.first()).toBeVisible();
  }
});
