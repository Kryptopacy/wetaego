import { getExchangeRates } from '@/lib/utils/settings'

export async function getUsdToNgnRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // cache for 1 hour
    })
    const data = await res.json()
    if (data && data.rates && data.rates.NGN) {
      // Add a 2% buffer for fluctuation risk
      return data.rates.NGN * 1.02
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate', error)
  }
  
  const settings = await getExchangeRates()
  return settings.usd_to_ngn || 1500;
}
