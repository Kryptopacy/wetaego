# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guest-flow.spec.ts >> Guest Checkout Flow >> should allow a guest to view menu, add to cart, and reach checkout
- Location: tests\e2e\guest-flow.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3000/m/demo", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Guest Checkout Flow', () => {
  4  |   test('should allow a guest to view menu, add to cart, and reach checkout', async ({ page }) => {
  5  |     // Navigate to a demo menu
> 6  |     await page.goto('/m/demo');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  7  |     
  8  |     // Check if the menu page loaded
  9  |     await expect(page.locator('h1').first()).toBeVisible();
  10 |     
  11 |     // Look for an "Add to Cart" or "Add" button and click the first one
  12 |     const addButton = page.locator('button', { hasText: /Add/i }).first();
  13 |     await expect(addButton).toBeVisible();
  14 |     await addButton.click();
  15 |     
  16 |     // Look for Cart or Checkout button
  17 |     const cartButton = page.locator('button', { hasText: /Cart|Checkout/i }).first();
  18 |     await expect(cartButton).toBeVisible();
  19 |     await cartButton.click();
  20 |     
  21 |     // Assert we reach a state where payment or order confirmation is possible
  22 |     const checkoutHeader = page.locator('text=/Checkout|Order Summary/i').first();
  23 |     await expect(checkoutHeader).toBeVisible();
  24 |   });
  25 | });
  26 | 
```