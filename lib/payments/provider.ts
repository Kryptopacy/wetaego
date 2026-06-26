/**
 * Payment Provider Abstraction Layer
 *
 * All payment logic in OurMenu routes through this interface.
 * Swapping Paystack for Flutterwave or Stripe is a one-line config change.
 */

export interface PaymentParams {
  /** Amount in the smallest currency unit (kobo for NGN) */
  amountMinor: number
  currency: string
  /** Paystack/provider customer email (required by most providers) */
  customerEmail: string
  customerName?: string
  customerPhone?: string
  /** Internal reference we generate — must be unique per transaction */
  reference: string
  /** Where to redirect after payment */
  callbackUrl: string
  /** Free-form metadata we want back in the webhook */
  metadata?: Record<string, unknown>
  /** Paystack Subaccount Code to route the payment to */
  subaccountCode?: string
  /** Paystack Split Code for complex multi-party splits */
  splitCode?: string
  /** Flat fee to deduct for the platform (overrides subaccount default) */
  transactionChargeMinor?: number
  /** Restrict payment methods (e.g. ['card', 'bank_transfer']) */
  channels?: string[]
}

export interface PaymentVerification {
  status: 'success' | 'failed' | 'pending' | 'abandoned'
  /** Amount actually paid in smallest currency unit */
  amountPaid: number
  currency: string
  reference: string
  /** ISO timestamp of when payment completed */
  paidAt?: string
  providerData?: Record<string, unknown>
}

export interface PaymentProvider {
  readonly name: string
  initiatePayment(params: PaymentParams): Promise<{ authorizationUrl: string; reference: string }>
  verifyPayment(reference: string): Promise<PaymentVerification>
  validateWebhookSignature(payload: string, signature: string): boolean
}
