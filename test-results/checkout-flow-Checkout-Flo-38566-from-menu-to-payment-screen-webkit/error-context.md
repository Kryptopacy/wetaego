# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout-flow.spec.ts >> Checkout Flow (Omnichannel) >> User can complete a full order from menu to payment screen
- Location: tests\e2e\checkout-flow.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').first()

```

```yaml
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Checkout Flow (Omnichannel)', () => {
  4  |   test('User can complete a full order from menu to payment screen', async ({ page }) => {
  5  |     // 1. Visit the guest menu
  6  |     await page.goto('/m/lounge');
  7  |     
  8  |     // Ensure the menu loads
> 9  |     await expect(page.locator('h1').first()).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     // 2. Add an item to the cart
  12 |     const firstItemAddBtn = page.locator('button:has-text("Add")').first();
  13 |     await expect(firstItemAddBtn).toBeVisible();
  14 |     await firstItemAddBtn.click();
  15 | 
  16 |     // 3. Open the floating cart
  17 |     const cartFab = page.locator('button:has-text("View Cart")');
  18 |     await expect(cartFab).toBeVisible();
  19 |     await cartFab.click();
  20 | 
  21 |     // Verify the cart modal opened
  22 |     await expect(page.locator('text=Your Order')).toBeVisible();
  23 | 
  24 |     // 4. Proceed to Checkout
  25 |     const checkoutBtn = page.locator('button:has-text("Checkout")');
  26 |     await expect(checkoutBtn).toBeVisible();
  27 |     await checkoutBtn.click();
  28 | 
  29 |     // Verify transition to checkout page
  30 |     await expect(page).toHaveURL(/\/m\/lounge\/checkout/);
  31 | 
  32 |     // 5. Fill out the checkout form
  33 |     // Note: Depends on whether it's dine-in or takeaway, we'll fill out generic customer details
  34 |     await page.fill('input[name="customerName"], input[placeholder*="Name"]', 'Test Customer');
  35 |     
  36 |     // Optionally fill phone or email if visible
  37 |     const phoneInput = page.locator('input[type="tel"]');
  38 |     if (await phoneInput.isVisible()) {
  39 |       await phoneInput.fill('08012345678');
  40 |     }
  41 | 
  42 |     // 6. Select Payment Method (e.g. Card/Paystack)
  43 |     // Assume there is a radio or button for payment method
  44 |     const payOnlineBtn = page.locator('text=Pay Online').or(page.locator('text=Card'));
  45 |     if (await payOnlineBtn.isVisible()) {
  46 |         await payOnlineBtn.click();
  47 |     }
  48 | 
  49 |     // 7. Place Order
  50 |     const placeOrderBtn = page.locator('button:has-text("Place Order"), button:has-text("Pay Now")');
  51 |     await expect(placeOrderBtn).toBeVisible();
  52 |     await placeOrderBtn.click();
  53 | 
  54 |     // 8. Assert Order Success / Payment redirect
  55 |     // The system should generate an order and redirect to /pay/[order_id] or show a success screen
  56 |     await expect(page).toHaveURL(/\/pay\/|\/success/);
  57 |     
  58 |     // Check for success or payment gateway elements
  59 |     await expect(page.locator('text=Order Summary').or(page.locator('text=Processing'))).toBeVisible();
  60 |   });
  61 | });
  62 | 
```