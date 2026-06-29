# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: webhooks.spec.ts >> Webhook Reconciliation >> should process a mock paystack charge.success event
- Location: tests\e2e\webhooks.spec.ts:5:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 400
Received array: [200, 404]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import crypto from 'crypto';
  3  | 
  4  | test.describe('Webhook Reconciliation', () => {
  5  |   test('should process a mock paystack charge.success event', async ({ request }) => {
  6  |     const payload = {
  7  |       event: 'charge.success',
  8  |       data: {
  9  |         reference: 'mock_e2e_order_123',
  10 |         amount: 500000,
  11 |         currency: 'NGN',
  12 |         status: 'success'
  13 |       }
  14 |     };
  15 | 
  16 |     const secret = process.env.PAYSTACK_SECRET_KEY || 'test_secret';
  17 |     const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
  18 | 
  19 |     const response = await request.post('/api/webhooks/paystack', {
  20 |       data: payload,
  21 |       headers: {
  22 |         'x-paystack-signature': hash,
  23 |         'Content-Type': 'application/json'
  24 |       }
  25 |     });
  26 | 
  27 |     // The webhook handler should return 404 because order 'mock_e2e_order_123' doesn't exist in the DB,
  28 |     // or 200 if we seed it. For a pure endpoint test without seeding, we expect it to not 500.
  29 |     // If it returns 404, it means the signature was verified and the DB was queried successfully.
> 30 |     expect([200, 404]).toContain(response.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  31 |   });
  32 | });
  33 | 
```