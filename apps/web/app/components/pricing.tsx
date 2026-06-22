import { Zap, Check, ArrowRight } from 'lucide-react'
import { getPricingSettings, getPlanLimits } from '@/lib/utils/settings'
import { FadeIn } from './animations'

export async function Pricing() {
  const pricing = await getPricingSettings()
  const planLimits = await getPlanLimits()

  const litePrice = pricing.lite_monthly_ngn || 14999
  const proPrice = pricing.pro_monthly_ngn || 49999

  const plans = [
    {
      name: 'Lite',
      price: `₦${litePrice.toLocaleString()}`,
      period: 'per month',
      description: 'Perfect for testing the platform at your venue. 30-day free trial included.',
      features: ['Includes 10 Credits/mo', 'Customizable AI Assistant (guest-facing)', 'Edge Translator (40+ languages)', 'Up to 2 QR codes', '1 active location', '0 Extra Custom Pages (10 credits/page)'],
      cta: 'Start Free Trial',
      href: '/dashboard',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: `₦${proPrice.toLocaleString()}`,
      period: 'per month',
      description: 'For serious operators who want every edge.',
      features: [
        'Everything in Lite',
        `Includes ${planLimits.pro?.credits || 50} Credits/mo`,
        'AI Copywriter & Image Studio',
        'Smart Request Triaging (KDS)',
        'Demand Forecasting Engine',
        '1 Extra Custom Page (10 credits/page)',
        'Priority WhatsApp support',
      ],
      cta: 'Get Pro',
      href: '/dashboard',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For hotel chains and multi-location brands.',
      features: [
        'Everything in Pro',
        `Includes ${planLimits.enterprise?.credits || 200} Credits/mo`,
        'Dedicated AI model fine-tuning',
        'Multi-location dashboard',
        'API access for PMS integration',
        'Unlimited Extra Custom Pages',
        'Dedicated account manager',
        'Custom SLA & onboarding',
      ],
      cta: 'Contact Sales',
      href: '/dashboard',
      highlighted: false,
    },
  ]

  const creditPacks = [
    { amount: 10, price: pricing.credits_10_ngn || 6000, popular: false },
    { amount: 25, price: pricing.credits_25_ngn || 12000, popular: true },
    { amount: 50, price: pricing.credits_50_ngn || 20000, popular: false }
  ]

  return (
    <section id="pricing" className="py-32 px-6 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Pay for what you need.</h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light">No hidden fees. Cancel any time.</p>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1} className={`relative rounded-3xl p-10 flex flex-col gap-8 transition-all duration-500 ${plan.highlighted
                ? 'bg-gradient-to-b from-violet-900/30 to-[#0a0a0f] border border-violet-500/40 shadow-2xl shadow-violet-900/20 md:-translate-y-4'
                : 'bg-white/[0.02] border border-white/[0.05] hover:border-white/10'
              }`}>
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/50">Most Popular</div>
              )}
              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white tracking-tight">{plan.price}</span>
                  <span className="text-zinc-500 text-base">/ {plan.period}</span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{plan.description}</p>
              </div>
              <ul className="space-y-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300 font-light">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={plan.href} className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${plan.highlighted
                  ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}>
                {plan.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </FadeIn>
          ))}
        </div>

        {/* Credit Packs */}
        <div className="mt-32 max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Need more power?</h3>
            <p className="text-zinc-400 text-lg">Top up your workspace with credits. Credits never expire.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack, i) => (
              <FadeIn key={pack.amount} delay={i * 0.1} className={`relative rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 ${pack.popular
                  ? 'bg-gradient-to-b from-violet-900/20 to-zinc-900/50 border border-violet-500/30 shadow-lg shadow-violet-900/10'
                  : 'bg-white/[0.02] border border-white/[0.05] hover:border-white/10'
                }`}>
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
                )}
                <Zap className={`w-8 h-8 mb-6 ${pack.popular ? 'text-violet-400' : 'text-zinc-500'}`} aria-hidden="true" />
                <h4 className="text-2xl font-bold text-white mb-2">{pack.amount} Credits</h4>
                <div className="text-3xl font-black text-white mb-8">₦{pack.price.toLocaleString()}</div>
                <a href="/dashboard/billing" className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 ${pack.popular
                    ? 'bg-white text-black hover:scale-105'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}>
                  Buy Pack
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
