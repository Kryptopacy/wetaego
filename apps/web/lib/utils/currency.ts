export function formatCurrency(amountMinor: number, currencyCode: string = 'NGN'): string {
  // Determine if the currency uses minor units natively (most do, but e.g. JPY doesn't usually use decimals the same way)
  // For simplicity, we assume minor = amount * 100 for standard fiat (NGN, USD, GBP, EUR, etc).
  // If we need to support zero-decimal currencies, we'd add logic here.
  const amountMajor = amountMinor / 100

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0, // Avoid trailing .00 for clean UI where possible
  }).format(amountMajor)
}
