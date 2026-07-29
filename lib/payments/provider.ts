/**
 * Unified Payment Provider
 * 
 * Abstracted payment execution layer. 
 * Swapping Paystack for Flutterwave or Bachs is a one-line config change.
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
  /** Override to use test environment keys (Admin Testing only) */
  useTestKeys?: boolean
  /** 
   * Specifies if this is an immediate charge, or a card tokenization (Auth Hold). 
   * Defaults to 'charge'.
   */
  chargeType?: 'auth' | 'charge'
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
  verifyPayment(reference: string, useTestKeys?: boolean): Promise<PaymentVerification>
  refundPayment?(reference: string, amountMinor?: number, useTestKeys?: boolean): Promise<{ success: boolean; message?: string }>
  /** Charge a previously tokenized card on file (e.g., for a No-Show fee) */
  chargeCardOnFile?(token: string, amountMinor: number, email: string, reference: string, useTestKeys?: boolean): Promise<PaymentVerification>
  validateWebhookSignature(payload: string, signature: string): boolean
}
