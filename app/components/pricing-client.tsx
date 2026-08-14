'use client'

import { useState } from 'react'
import { Zap, Check, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { FadeIn } from './animations'
import { EnterpriseQuoteModal } from '@/components/enterprise-quote-modal'

interface CreditPack {
  amount: number
  price: number
  popular: boolean
}

interface PricingClientProps {
  liteMonthly: number
  proMonthly: number
  liteAnnualTotal: number
  proAnnualTotal: number
  liteAnnualPerMonth: number
  proAnnualPerMonth: number
  creditPacks: CreditPack[]
  liteFeatures: string[]
  proFeatures: string[]
  enterpriseFeatures: string[]
}

export function PricingClient({
  liteMonthly,
  proMonthly,
  liteAnnualTotal,
  proAnnualTotal,
  liteAnnualPerMonth,
  proAnnualPerMonth,
  creditPacks,
  liteFeatures,
  proFeatures,
  enterpriseFeatures,
}: PricingClientProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false)

  const litePrice = isAnnual ? liteAnnualPerMonth : liteMonthly
  const proPrice = isAnnual ? proAnnualPerMonth : proMonthly
  const liteSavings = liteMonthly * 12 - liteAnnualTotal
  const proSavings = proMonthly * 12 - proAnnualTotal

  const plans = [
    {
      name: 'Lite',
      price: formatCurrency(litePrice * 100),
      period: 'per month',
      annualNote: isAnnual ? `${formatCurrency(liteAnnualTotal * 100)} billed annually · saves ${formatCurrency(liteSavings * 100)}` : null,
      description: 'Perfect for testing the platform at your venue. Free trial included.',
      features: liteFeatures,
      cta: 'Start Free Trial',
      href: '/dashboard',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: formatCurrency(proPrice * 100),
      period: 'per month',
      annualNote: isAnnual ? `${formatCurrency(proAnnualTotal * 100)} billed annually · saves ${formatCurrency(proSavings * 100)}` : null,
      description: 'For serious operators who want every edge.',
      features: proFeatures,
      cta: 'Get Pro',
      href: '/dashboard',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      annualNote: null,
      description: 'For hotel chains and multi-location brands.',
      features: enterpriseFeatures,
      cta: 'Contact Sales',
      href: '/dashboard',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Pay for what you need.</h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light mb-10">No hidden fees. Cancel any time.</p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-full p-1.5 gap-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isAnnual
                  ? 'bg-white text-black shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                isAnnual
                  ? 'bg-white text-black shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Annual
              <span className={`ml-1.5 text-[10px] font-bold transition-colors ${isAnnual ? 'text-emerald-600' : 'text-emerald-400'}`}>
                −20%
              </span>
            </button>
          </div>

          {isAnnual && (
            <p className="mt-3 text-sm text-emerald-400 font-medium animate-fade-in">
              🎉 You save up to {formatCurrency(proSavings * 100)} a year on Pro!
            </p>
          )}
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1} className={`relative rounded-3xl p-10 flex flex-col gap-6 transition-all duration-500 ${plan.highlighted
                ? 'bg-linear-to-b from-emerald-900/30 to-[#0a0a0f] border border-emerald-500/40 shadow-2xl shadow-emerald-900/20 md:-translate-y-4'
                : 'bg-white/2 border border-white/5 hover:border-white/10'
              }`}>
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-linear-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-lg shadow-emerald-900/50">Most Popular</div>
              )}
              {isAnnual && plan.name !== 'Enterprise' && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  20% off
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-black text-white tracking-tight">{plan.price}</span>
                  <span className="text-zinc-500 text-base">/ {plan.period}</span>
                </div>
                {plan.annualNote && (
                  <p className="text-xs text-emerald-400 font-medium mt-1 mb-2">{plan.annualNote}</p>
                )}
                <p className="text-zinc-400 text-sm leading-relaxed mt-2">{plan.description}</p>
              </div>
              <ul className="space-y-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300 font-light">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.name === 'Enterprise' ? (
                <button
                  type="button"
                  onClick={() => setIsEnterpriseModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  {plan.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <a href={plan.href} className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${plan.highlighted
                    ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}>
                  {plan.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </FadeIn>
          ))}
        </div>

        <EnterpriseQuoteModal
          isOpen={isEnterpriseModalOpen}
          onClose={() => setIsEnterpriseModalOpen(false)}
          initialBranches={4}
        />

        {/* Credit Packs */}
        <div className="mt-32 max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Need more power?</h3>
            <p className="text-zinc-400 text-lg">Top up your workspace with credits. Credits never expire.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack, i) => (
              <FadeIn key={pack.amount} delay={i * 0.1} className={`relative rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 ${pack.popular
                  ? 'bg-linear-to-b from-emerald-900/20 to-zinc-900/50 border border-emerald-500/30 shadow-lg shadow-emerald-900/10'
                  : 'bg-white/2 border border-white/5 hover:border-white/10'
                }`}>
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
                )}
                <Zap className={`w-8 h-8 mb-6 ${pack.popular ? 'text-emerald-400' : 'text-zinc-500'}`} aria-hidden="true" />
                <h4 className="text-2xl font-bold text-white mb-2">{pack.amount} Credits</h4>
                <div className="text-3xl font-black text-white mb-8">{formatCurrency(pack.price * 100)}</div>
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
