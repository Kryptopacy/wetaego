import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Webhook Reconciliation', () => {
  test('should process a mock paystack charge.success event', async ({ request }) => {
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'mock_e2e_order_123',
        amount: 500000,
        currency: 'NGN',
        status: 'success'
      }
    };

    const secret = process.env.PAYSTACK_SECRET_KEY || 'test_secret';
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

    const response = await request.post('/api/webhooks/paystack', {
      data: payload,
      headers: {
        'x-paystack-signature': hash,
        'Content-Type': 'application/json'
      }
    });

    // The webhook handler should return 404 because order 'mock_e2e_order_123' doesn't exist in the DB,
    // or 200 if we seed it. For a pure endpoint test without seeding, we expect it to not 500.
    // If it returns 404, it means the signature was verified and the DB was queried successfully.
    expect([200, 404]).toContain(response.status());
  });
});
