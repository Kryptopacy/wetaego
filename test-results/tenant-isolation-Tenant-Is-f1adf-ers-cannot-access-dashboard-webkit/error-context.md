# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-isolation.spec.ts >> Tenant Isolation & Security >> Anonymous users cannot access dashboard
- Location: tests\e2e\tenant-isolation.spec.ts:4:7

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://127.0.0.1:3000/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Tenant Isolation & Security', () => {
  4  |   test('Anonymous users cannot access dashboard', async ({ page }) => {
> 5  |     const _response = await page.goto('/dashboard');
     |                                  ^ Error: page.goto: Could not connect to server
  6  |     // Next.js middleware should redirect to /login
  7  |     expect(page.url()).toContain('/login');
  8  |   });
  9  | 
  10 |   test('Public API does not expose sensitive organization data', async ({ request }) => {
  11 |     // If there is an API route, test it here
  12 |     const response = await request.get('/api/webhooks/paystack');
  13 |     // Should return 401 or 405 without valid signature
  14 |     expect(response.status()).not.toBe(200);
  15 |   });
  16 | });
  17 | 
```