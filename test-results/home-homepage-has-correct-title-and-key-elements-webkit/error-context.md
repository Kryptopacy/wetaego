# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> homepage has correct title and key elements
- Location: tests\e2e\home.spec.ts:3:5

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://127.0.0.1:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage has correct title and key elements', async ({ page }) => {
  4  |   // Navigate to the root of the application
> 5  |   await page.goto('/');
     |              ^ Error: page.goto: Could not connect to server
  6  | 
  7  |   // Verify the page mounts without hydration errors
  8  |   await expect(page).toHaveTitle(/Ourmenu/i);
  9  | 
  10 |   // Verify the pricing section is rendered
  11 |   const pricingHeading = page.locator('text=Pricing');
  12 |   await expect(pricingHeading).toBeVisible();
  13 | 
  14 |   // Verify the hero section loads properly
  15 |   const ctaButton = page.locator('text=Get Started');
  16 |   if (await ctaButton.count() > 0) {
  17 |     await expect(ctaButton.first()).toBeVisible();
  18 |   }
  19 | });
  20 | 
```