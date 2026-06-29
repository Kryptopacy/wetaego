# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard Tenant Management >> should load the live fulfillment grid and business metrics
- Location: tests\e2e\dashboard.spec.ts:23:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://127.0.0.1:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://127.0.0.1:3000/login"

```

```yaml
- img "OurMenu Logo"
- heading "OurMenu OS" [level=1]
- paragraph: Sign in to your dashboard
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
  - text: test-admin@ourmenuos.online
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
  - text: testpassword123
- button:
  - img
- button "Sign In"
- text: Or continue with
- button "Google":
  - img
  - text: Google
- paragraph:
  - text: Don't have an account?
  - button "Sign up"
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Tenant Management', () => {
  4  |   // We use beforeAll to authenticate once and reuse the session state, 
  5  |   // or beforeEach to login fresh depending on Playwright global-setup config.
  6  |   // For this test, we simulate the UI login flow directly to ensure the dashboard
  7  |   // loads fully hydrated with the user session.
  8  |   
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Authenticate as a tenant
  11 |     await page.goto('/login');
  12 |     await page.fill('input[name="email"]', 'test-admin@ourmenuos.online');
  13 |     await page.fill('input[name="password"]', 'testpassword123');
  14 |     await page.click('button[type="submit"]');
  15 |     
  16 |     // Wait for redirect
> 17 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  18 |     
  19 |     // Wait for the dashboard shell to load
  20 |     await expect(page.locator('main')).toBeVisible();
  21 |   });
  22 | 
  23 |   test('should load the live fulfillment grid and business metrics', async ({ page }) => {
  24 |     // Check that key KPI metrics cards exist
  25 |     const kpiCards = page.locator('text=Total Orders').or(page.locator('text=Revenue'));
  26 |     if (await kpiCards.count() > 0) {
  27 |       await expect(kpiCards.first()).toBeVisible();
  28 |     }
  29 | 
  30 |     // Check that the Live Orders/Fulfillment section renders
  31 |     const liveOrdersHeader = page.locator('h2:has-text("Active Orders"), h2:has-text("Live Orders")');
  32 |     if (await liveOrdersHeader.count() > 0) {
  33 |       await expect(liveOrdersHeader).toBeVisible();
  34 |     }
  35 | 
  36 |     // Check that the Sidebar navigation is functional
  37 |     const menuLink = page.locator('nav a:has-text("Menu")');
  38 |     await expect(menuLink).toBeVisible();
  39 |     await menuLink.click();
  40 | 
  41 |     // Verify it navigates to the Menu editor
  42 |     await expect(page).toHaveURL(/\/dashboard\/menu/);
  43 |     await expect(page.locator('h1:has-text("Menu Management")')).toBeVisible();
  44 |   });
  45 | 
  46 |   test('should allow interacting with business settings', async ({ page }) => {
  47 |     // Navigate to settings
  48 |     const settingsLink = page.locator('nav a:has-text("Settings")');
  49 |     await expect(settingsLink).toBeVisible();
  50 |     await settingsLink.click();
  51 | 
  52 |     await expect(page).toHaveURL(/\/dashboard\/settings/);
  53 |     
  54 |     // Check if the business profile form loads
  55 |     const profileHeader = page.locator('h2:has-text("Business Profile"), text=Store Settings');
  56 |     await expect(profileHeader).toBeVisible();
  57 |   });
  58 | });
  59 | 
```