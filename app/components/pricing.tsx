import { getPricingSettings, getPlanLimits } from '@/lib/utils/settings'
import { PricingClient } from './pricing-client'

export async function Pricing() {
  const pricing = await getPricingSettings()
  const planLimits = await getPlanLimits()

  const liteMonthly = pricing.lite_monthly_ngn || 19999
  const proMonthly = pricing.pro_monthly_ngn || 69000
  const liteAnnualTotal = (pricing as Record<string, number>).lite_annual_ngn || 191990
  const proAnnualTotal = (pricing as Record<string, number>).pro_annual_ngn || 662400

  return (
    <PricingClient
      liteMonthly={liteMonthly}
      proMonthly={proMonthly}
      liteAnnualTotal={liteAnnualTotal}
      proAnnualTotal={proAnnualTotal}
      liteAnnualPerMonth={Math.round(liteAnnualTotal / 12)}
      proAnnualPerMonth={Math.round(proAnnualTotal / 12)}
      creditPacks={[
        { amount: 10, price: pricing.credits_10_ngn || 6000, popular: false },
        { amount: 25, price: pricing.credits_25_ngn || 12000, popular: true },
        { amount: 50, price: pricing.credits_50_ngn || 20000, popular: false },
      ]}
      liteFeatures={[
        'Includes 10 Credits/mo',
        'Customizable AI Assistant (guest-facing)',
        'Edge Translator (40+ languages)',
        'Up to 2 QR codes',
        '1 active location',
        '0 Extra Custom Pages (10 credits/page)',
      ]}
      proFeatures={[
        'Everything in Lite',
        `Includes ${planLimits.pro?.credits || 50} Credits/mo`,
        'AI Copywriter & Image Studio',
        'Smart Request Triaging (KDS)',
        'Demand Forecasting Engine',
        '1 Extra Custom Page (10 credits/page)',
        'Priority WhatsApp support',
      ]}
      enterpriseFeatures={[
        'Everything in Pro',
        `Includes ${planLimits.enterprise?.credits || 200} Credits/mo`,
        'Dedicated AI model fine-tuning',
        'Multi-location dashboard',
        'API access for PMS integration',
        'Unlimited Extra Custom Pages',
        'Dedicated account manager',
        'Custom SLA & onboarding',
      ]}
    />
  )
}

