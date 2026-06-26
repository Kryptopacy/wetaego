import { getExchangeRates } from '@/lib/utils/settings'

export async function getUsdToNgnRate(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 }, // cache for 1 hour
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json()
    if (data && data.rates && data.rates.NGN) {
      // Add a 2% buffer for fluctuation risk
      return data.rates.NGN * 1.02
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate', error)
  }
  
  try {
    const settings = await getExchangeRates()
    if (settings && settings.usd_to_ngn) {
        return settings.usd_to_ngn;
    }
  } catch (error) {
    console.error('Failed to fetch DB exchange rates', error)
  }

  return 1250;
}
