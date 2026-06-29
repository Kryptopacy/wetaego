# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should successfully log in with valid credentials and redirect to dashboard
- Location: tests\e2e\auth.spec.ts:4:7

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
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should successfully log in with valid credentials and redirect to dashboard', async ({ page }) => {
  5  |     await page.goto('/login');
  6  | 
  7  |     // Wait for the form to be ready
  8  |     await expect(page.getByRole('heading', { name: 'OurMenu OS' })).toBeVisible();
  9  | 
  10 |     // Fill in the login credentials
  11 |     // Note: Use a dedicated test account or mock the backend in the CI pipeline
  12 |     await page.fill('input[name="email"]', 'test-admin@ourmenuos.online');
  13 |     await page.fill('input[name="password"]', 'testpassword123');
  14 | 
  15 |     // Submit the form
  16 |     await page.click('button[type="submit"]');
  17 | 
  18 |     // Assert that the page redirects to the dashboard
> 19 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  20 |     
  21 |     // Verify the dashboard loads successfully
  22 |     await expect(page.getByText('Loading workspace...').or(page.locator('main'))).toBeVisible();
  23 |   });
  24 | 
  25 |   test('should show an error message with invalid credentials', async ({ page }) => {
  26 |     await page.goto('/login');
  27 | 
  28 |     await page.fill('input[name="email"]', 'invalid@example.com');
  29 |     await page.fill('input[name="password"]', 'wrongpassword');
  30 | 
  31 |     await page.click('button[type="submit"]');
  32 | 
  33 |     // Assert that the error banner appears (driven by the ?message= URL param)
  34 |     await expect(page).toHaveURL(/\/login\?message=/);
  35 |     await expect(page.getByText('Could not authenticate user').or(page.getByText('Invalid login credentials'))).toBeVisible();
  36 |   });
  37 | });
  38 | 
```