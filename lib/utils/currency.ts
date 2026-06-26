export function formatCurrency(amountMinor: number, currencyCode: string = 'NGN'): string {
  const amountMajor = amountMinor / 100

  const localeMap: Record<string, string> = {
    'NGN': 'en-NG',
    'USD': 'en-US',
    'GBP': 'en-GB',
    'EUR': 'en-IE',
  }
  const locale = localeMap[currencyCode] || 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0, // Avoid trailing .00 for clean UI where possible
  }).format(amountMajor)
}
