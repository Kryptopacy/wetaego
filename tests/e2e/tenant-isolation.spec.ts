import { test, expect } from '@playwright/test';

test.describe('Tenant Isolation & Security', () => {
  test('Anonymous users cannot access dashboard', async ({ page }) => {
    const _response = await page.goto('/dashboard');
    // Next.js middleware should redirect to /login
    expect(page.url()).toContain('/login');
  });

  test('Public API does not expose sensitive organization data', async ({ request }) => {
    // If there is an API route, test it here
    const response = await request.get('/api/webhooks/paystack');
    // Should return 401 or 405 without valid signature
    expect(response.status()).not.toBe(200);
  });
});
