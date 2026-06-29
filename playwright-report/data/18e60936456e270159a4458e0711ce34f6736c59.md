# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-business-flow.spec.ts >> Multi-Business Fulfillment Flow >> should allow navigating to dashboard and checking orders
- Location: tests\e2e\multi-business-flow.spec.ts:4:7

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
  3  | test.describe('Multi-Business Fulfillment Flow', () => {
  4  |   test('should allow navigating to dashboard and checking orders', async ({ page }) => {
  5  |     // Navigate to the demo app
> 6  |     await page.goto('/');
     |                ^ Error: page.goto: Could not connect to server
  7  | 
  8  |     // Check that we're on the landing page
  9  |     await expect(page.locator('text=The ultimate digital menu')).toBeVisible();
  10 | 
  11 |     // Click "Start Building" or navigate to dashboard directly
  12 |     await page.goto('/dashboard');
  13 |     
  14 |     // In an actual test, we would log in here using a test account.
  15 |     // Since we're just checking that the dashboard route mounts and Playwright is wired:
  16 |     
  17 |     // Check that the live operations text is present or auth redirect happens
  18 |     const currentUrl = page.url();
  19 |     if (currentUrl.includes('/login')) {
  20 |       await expect(page.locator('text=Sign In')).toBeVisible();
  21 |     } else {
  22 |       await expect(page.locator('text=Live Operations')).toBeVisible();
  23 |     }
  24 |   });
  25 | });
  26 | 
```