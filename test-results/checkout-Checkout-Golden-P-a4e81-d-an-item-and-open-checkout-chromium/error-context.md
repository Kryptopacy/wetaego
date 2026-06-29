# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout Golden Path >> User can browse a menu, add an item, and open checkout
- Location: tests\e2e\checkout.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /OurMenu/i
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × unexpected value ""

```

```yaml
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Checkout Golden Path', () => {
  4  |   test('User can browse a menu, add an item, and open checkout', async ({ page }) => {
  5  |     // 1. Visit a live storefront (Assuming 'demo' slug exists for test environments)
  6  |     // Replace 'demo' with the actual storefront slug used in test seeding
  7  |     await page.goto('/m/demo');
  8  |     
  9  |     // 2. Wait for the page to load
> 10 |     await expect(page).toHaveTitle(/OurMenu/i);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  11 |     
  12 |     // 3. Find the first 'Add to Cart' or 'Plus' button on a menu item
  13 |     // Note: Depends on the exact UI implementation, using aria-labels if possible
  14 |     const firstItemAddBtn = page.getByRole('button', { name: /increase quantity/i }).first().or(
  15 |       page.getByRole('button', { name: /add to cart/i }).first()
  16 |     );
  17 |     
  18 |     // Fallback if the above doesn't match the specific UI text
  19 |     if (await firstItemAddBtn.isVisible()) {
  20 |       await firstItemAddBtn.click();
  21 |     } else {
  22 |       // Use a generic locator for the item card plus button
  23 |       await page.locator('.group button').filter({ hasText: '+' }).first().click();
  24 |     }
  25 | 
  26 |     // 4. Verify the Cart FAB appears
  27 |     const cartFab = page.getByRole('button', { name: /checkout cart/i });
  28 |     await expect(cartFab).toBeVisible();
  29 | 
  30 |     // 5. Open Checkout Modal
  31 |     await cartFab.click();
  32 | 
  33 |     // 6. Verify Checkout Modal elements
  34 |     await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
  35 |     await expect(page.getByText('Order Summary')).toBeVisible();
  36 | 
  37 |     // 7. Fill Customer Details
  38 |     await page.getByPlaceholder('John Doe').fill('E2E Test User');
  39 |     await page.getByPlaceholder('08012345678').fill('08012345678');
  40 |     
  41 |     // 8. If Delivery option is visible, click it and fill address
  42 |     const deliveryBtn = page.getByRole('button', { name: 'Delivery' });
  43 |     if (await deliveryBtn.isVisible()) {
  44 |       await deliveryBtn.click();
  45 |       await page.getByPlaceholder(/123 Main St/i).fill('123 Test St, Lagos');
  46 |     } else {
  47 |       // If table/pickup, just fill the table number or pickup instructions
  48 |       const locationInput = page.getByPlaceholder(/Enter your/i).or(page.getByPlaceholder(/e.g. 'Pickup/i));
  49 |       if (await locationInput.isVisible()) {
  50 |         await locationInput.fill('Test Table 1');
  51 |       }
  52 |     }
  53 | 
  54 |     // 9. Checkout Submission
  55 |     const payBtn = page.getByRole('button', { name: /complete order|transfer|pay/i });
  56 |     await expect(payBtn).toBeVisible();
  57 |     
  58 |     // We do NOT click payBtn here to avoid creating junk orders in production,
  59 |     // but in a true E2E CI environment, we would intercept the network request.
  60 |     // await payBtn.click();
  61 |     // await expect(page.getByText(/Order Sent/i)).toBeVisible();
  62 |   });
  63 | });
  64 | 
```