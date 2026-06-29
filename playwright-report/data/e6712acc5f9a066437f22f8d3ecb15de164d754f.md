# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: webhooks.spec.ts >> Webhook Reconciliation >> should process a mock paystack charge.success event
- Location: tests\e2e\webhooks.spec.ts:5:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000
Call log:
  - → POST http://127.0.0.1:3000/api/webhooks/paystack
    - user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - x-paystack-signature: 53747b4769feb589a566b94218237ce8ff19afe9db2013aefb432b278de5e4eb8854f00e186327937b425c26ad36b637db19bceba2f9c1b1edcf905740227ff5
    - Content-Type: application/json
    - content-length: 120

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
> 19 |     const response = await request.post('/api/webhooks/paystack', {
     |                                    ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000
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
  30 |     expect([200, 404]).toContain(response.status());
  31 |   });
  32 | });
  33 | 
```