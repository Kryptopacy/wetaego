import { paymentProvider } from './paystack'
import { bachsProvider } from './bachs'
import type { PaymentProvider } from './provider'

export function getPaymentProvider(name: string): PaymentProvider {
  if (name === 'bachs') {
    return bachsProvider
  }
  return paymentProvider
}

export { paymentProvider, bachsProvider }
export * from './provider'
