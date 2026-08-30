import { describe, expect, it, vi, beforeEach } from 'vitest'
import { processCheckout } from '../app/m/[slug]/actions'

// --- Supabase mock setup ---
vi.mock('../lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue({ value: 'test-session' }) }),
}))
vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({})
  class Resend {
    emails = { send: mockSend }
     
    constructor(_key: string) {}
  }
  return { Resend }
})
vi.mock('@/emails/receipt-email', () => ({ ReceiptEmail: vi.fn() }))
vi.mock('../lib/notifications/termii', () => ({ sendWhatsAppMessage: vi.fn() }))
vi.mock('../lib/notifications/dispatcher', () => ({ notifyBusiness: vi.fn() }))
vi.mock('../lib/utils/settings', () => ({
  getPlatformFees: vi.fn().mockResolvedValue({ business_subaccount: 5 }),
}))
vi.mock('../lib/payments/paystack', () => ({
  paymentProvider: {
    initiatePayment: vi.fn().mockResolvedValue({ authorizationUrl: 'https://paystack.com/pay/test' }),
  },
}))
// Mock dynamic imports used inside processCheckout
vi.mock('../lib/upstash', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  withIdempotency: vi.fn().mockImplementation((_key: string, fn: () => unknown) => fn()),
}))
vi.mock('../lib/notifications/push', () => ({
  sendPushToOrg: vi.fn().mockResolvedValue(undefined),
  newOrderNotification: vi.fn().mockReturnValue({}),
}))

import { createClient, createAdminClient } from '../lib/supabase/server'


// ---- Reusable base payload ----
const BASE_ITEMS = [{ id: 'item-1', name: 'Jollof Rice', quantity: 2, price_minor: 1500 }]
const BASE_PARAMS = {
  organizationId: 'org-1',
  locationId: 'loc-1',
  items: BASE_ITEMS,
  totalAmountMinor: 3000, // 2 × 1500
}

function buildSupabaseMock(overrides: Record<string, unknown> = {}) {
  // Default happy-path chain responses
  const defaults = {
    paySettings: { data: { provider_account_id: null, is_active: false }, error: null },
    location:    { data: { delivery_fee_minor: 0, delivery_minimum_order_minor: null, custom_milestones: null }, error: null },
    menuItems:   { data: [{ id: 'item-1', price_minor: 1500, department: null }], error: null },
    order:       { data: { id: 'order-abc' }, error: null },
    orderItems:  { data: null, error: null },
    stockRpc:    { data: null, error: null },
    ...overrides,
  }

   
  const mockSingle = vi.fn()
  const mockIn = vi.fn()
  const mockInsert = vi.fn()
  const mockRpc = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  // Promise.all([paySettings, location]) called first as a pair, then menuItems
  const paySettingsCall = 0
  mockSingle
    .mockImplementationOnce(() => Promise.resolve(defaults.paySettings)) // paySettings
    .mockImplementationOnce(() => Promise.resolve(defaults.location))    // location
    .mockImplementationOnce(() => Promise.resolve(defaults.order))       // order insert

  mockIn.mockResolvedValue(defaults.menuItems)

  // order_items insert
  mockInsert.mockImplementation((table?: string) => {
    if (table === 'order_items') return { error: defaults.orderItems.error }
    return { error: null, data: null }
  })

  // stock rpc
  mockRpc.mockResolvedValue(defaults.stockRpc)

  // delete (rollback)
  mockDelete.mockReturnValue({ eq: mockEq.mockResolvedValue({ error: null }) })

  mockSelect.mockReturnThis()
  mockEq.mockReturnThis()

  const mockOr = vi.fn().mockResolvedValue({ data: [], error: null }) // item_ingredients BOM query

  mockFrom.mockImplementation((table: string) => {
    // item_ingredients uses .select().or() for the BOM query
    if (table === 'item_ingredients') {
      return { select: () => ({ or: mockOr }) }
    }
    // orders insert returns a select/single chain
    if (table === 'orders') {
      return {
        select: mockSelect.mockReturnThis(),
        eq:     mockEq.mockReturnThis(),
        insert: () => ({ select: () => ({ single: () => Promise.resolve(defaults.order) }) }),
        single: mockSingle,
        delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        limit:  () => ({ single: () => Promise.resolve({ data: { slug: 'test-page' }, error: null }) }),
      }
    }
    // Default table handler for all others
    return {
      select: mockSelect.mockReturnThis(),
      eq:     mockEq.mockReturnThis(),
      in:     mockIn,
      or:     mockOr,
      insert: () => {
        if (table === 'order_items') return Promise.resolve(defaults.orderItems)
        if (table === 'order_milestones') return Promise.resolve({ error: null })
        if (table === 'platform_fee_ledger') return Promise.resolve({ error: null })
        return Promise.resolve({ error: null })
      },
      single: mockSingle,
      delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      limit:  () => ({ single: () => Promise.resolve({ data: { slug: 'test-page' }, error: null }) }),
    }
  })

  const mockObj = { from: mockFrom, rpc: mockRpc, auth: { getUser: vi.fn() } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(createClient as any).mockResolvedValue(mockObj)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(createAdminClient as any).mockResolvedValue(mockObj)

  return {
    mock: mockObj,
    mockSingle,
    mockIn,
    mockInsert,
    mockRpc,
  }
}

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ------------------------------------------------------------------
  // 1. GUARD: Empty cart
  // ------------------------------------------------------------------
  it('rejects an empty cart', async () => {
    const { mock } = buildSupabaseMock()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({ ...BASE_PARAMS, items: [] })
    expect(result.serverError).toMatch(/cart is empty/i)
  })

  // ------------------------------------------------------------------
  // 2. GUARD: Rate limit exceeded
  // ------------------------------------------------------------------
  it('rejects when rate limit is exceeded', async () => {
    const { mock } = buildSupabaseMock()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const { checkRateLimit } = await import('../lib/upstash')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false } as never)

    const result = await processCheckout(BASE_PARAMS)
    expect(result.serverError).toMatch(/Too many requests/i)
  })

  // ------------------------------------------------------------------
  // 3. GUARD: Server-side price fraud detection (>5% deviation)
  // ------------------------------------------------------------------
  it('rejects when client total deviates more than 5% from server total', async () => {
    const { mock } = buildSupabaseMock()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({
      ...BASE_PARAMS,
      totalAmountMinor: 1000, // real total is 3000 — >5% off
    })
    expect(result.serverError).toMatch(/Order total mismatch/i)
  })

  // ------------------------------------------------------------------
  // 4. GUARD: Delivery minimum order not met
  // ------------------------------------------------------------------
  it('rejects delivery order that does not meet minimum order amount', async () => {
    const { mock } = buildSupabaseMock({
      location: {
        data: {
          delivery_fee_minor: 500,
          delivery_minimum_order_minor: 5000, // minimum is ₦50
          custom_milestones: null,
        },
        error: null,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({
      ...BASE_PARAMS,
      fulfillmentType: 'delivery',
      totalAmountMinor: 3000, // server subtotal is 3000, minimum is 5000
    })
    expect(result.serverError).toMatch(/Minimum order amount for delivery not met/i)
  })

  // ------------------------------------------------------------------
  // 5. HAPPY PATH: Offline payment (pay_after_service)
  // ------------------------------------------------------------------
  it('returns orderId for offline pay_after_service order', async () => {
    const { mock, mockRpc } = buildSupabaseMock()
    mockRpc.mockResolvedValue({ data: null, error: null }) // stock decrement OK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({
      ...BASE_PARAMS,
      paymentMethod: 'pay_after_service',
    })

    expect(result.data?.orderId).toBe('order-abc')
    expect(result.data?.paymentMethod).toBe('pay_after_service')
    expect(result.serverError).toBeUndefined()
  })

  // ------------------------------------------------------------------
  // 6. HAPPY PATH: Card payment → returns Paystack checkoutUrl
  // ------------------------------------------------------------------
  it('returns Paystack checkoutUrl for card payment when gateway is active', async () => {
    const { mock, mockRpc } = buildSupabaseMock({
      paySettings: { data: { provider_account_id: 'ACCT_test123', is_active: true }, error: null },
    })
    mockRpc.mockResolvedValue({ data: null, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({
      ...BASE_PARAMS,
      paymentMethod: 'card',
      customerEmail: 'customer@test.com',
    })

    expect(result.data?.checkoutUrl).toBe('https://paystack.com/pay/test')
    expect(result.data?.orderId).toBe('order-abc')
  })

  // ------------------------------------------------------------------
  // 7. ROLLBACK: Stock decrement failure rolls back the order
  // ------------------------------------------------------------------
  it('rolls back the order when stock decrement fails', async () => {
    const { mock, mockRpc } = buildSupabaseMock()
    // Make the stock decrement RPC fail
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Out of stock' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as any).mockResolvedValue(mock)

    const result = await processCheckout({ ...BASE_PARAMS, paymentMethod: 'pay_after_service' })
    expect(result.serverError).toMatch(/Out of stock/i)
  })
})
