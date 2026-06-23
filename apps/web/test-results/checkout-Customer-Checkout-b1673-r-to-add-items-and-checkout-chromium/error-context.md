# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Customer Checkout Flow >> should allow a customer to add items and checkout
- Location: tests\e2e\checkout.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3000/m/demo-lounge", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Customer Checkout Flow', () => {
  4  |   test('should allow a customer to add items and checkout', async ({ page }) => {
  5  |     // 1. Navigate to a demo public menu
  6  |     // We assume /m/demo-lounge is a seeded demo location
> 7  |     await page.goto('/m/demo-lounge');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  8  | 
  9  |     // 2. Wait for items to load
  10 |     await expect(page.locator('text=Add to Order').first()).toBeVisible();
  11 | 
  12 |     // 3. Add an item to the cart
  13 |     await page.locator('text=Add to Order').first().click();
  14 | 
  15 |     // 4. Verify cart floating action button appears and shows 1 item
  16 |     const cartFab = page.locator('button', { hasText: 'View Order' });
  17 |     await expect(cartFab).toBeVisible();
  18 |     await cartFab.click();
  19 | 
  20 |     // 5. Verify we are on the order summary/checkout page
  21 |     await expect(page.url()).toContain('/order');
  22 |     await expect(page.locator('text=Checkout')).toBeVisible();
  23 | 
  24 |     // Note: Actually processing a payment via Playwright requires mocking the Paystack/Stripe API
  25 |     // which goes beyond standard E2E. We assert the checkout button is reachable.
  26 |   });
  27 | });
  28 | 
```