import Link from 'next/link'
import Image from 'next/image'
import { startInteractiveDemo } from './login/actions'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, ArrowRight, Check, Star,
  Users, TrendingUp, Clock, MessageCircle,
  Smartphone, Sparkles, MapPin, CreditCard,
  Bell, FileText, ShieldCheck, Package
} from 'lucide-react'
import { getPricingSettings, getPlanLimits } from '@/lib/utils/settings'
import { FadeIn, StaggerContainer, StaggerItem } from './components/animations'

async function Pricing() {
  const pricing = await getPricingSettings()
  const planLimits = await getPlanLimits()

  const plans = [
    {
      name: 'Starter',
      price: '₦0',
      period: '30-day trial',
      description: 'Perfect for testing the platform at your venue.',
      features: ['AI Waiter (guest-facing chat)', 'Edge Translator (40+ languages)', 'Up to 2 QR codes', '1 active location'],
      cta: 'Start Free Trial',
      href: '/dashboard',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: `₦${pricing.pro_monthly_ngn.toLocaleString()}`,
      period: 'per month',
      description: 'For serious operators who want every edge.',
      features: [
        'Everything in Starter',
        `Includes ${planLimits.pro?.credits || 50} Credits/mo`,
        'AI Copywriter & Image Studio',
        'Smart Request Triaging (KDS)',
        'Demand Forecasting Engine',
        '1 Custom Page (+10 credits/extra)',
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
        'Dedicated account manager',
        'Custom SLA & onboarding',
      ],
      cta: 'Contact Sales',
      href: '/dashboard',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">Simple Pricing</span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Pay for what you need.</h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light">No hidden fees. Cancel any time.</p>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1} className={`relative rounded-3xl p-10 flex flex-col gap-8 transition-all duration-500 ${
              plan.highlighted
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
              <a href={plan.href} className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}>
                {plan.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

const features = [
  // Row 1 — The Operator Command Center
  {
    size: 'lg', // 2/3 width
    icon: ClipboardList,
    color: 'from-red-600 to-orange-600',
    tag: 'Live KDS',
    badge: '< 1s delivery',
    title: '"Table 7 ordered. Kitchen notified."',
    description: 'Realtime order stream powered by Supabase subscriptions. New orders flash onto your Kitchen Display before the guest puts their phone down. No refresh. No delay. Ever.',
  },
  {
    size: 'sm', // 1/3 width
    icon: MessageCircle,
    color: 'from-blue-600 to-cyan-600',
    tag: 'AI Dining Advisor',
    badge: 'Gemini-powered',
    title: 'Your best waiter, always on shift.',
    description: 'Guests chat to get recommendations, ask about allergens, customize items, and add to cart — all without flagging down staff.',
  },
  // Row 2 — Guest Experience
  {
    size: 'third',
    icon: QrCode,
    color: 'from-violet-600 to-indigo-600',
    tag: 'QR Table Mapping',
    badge: 'Per-table precision',
    title: 'Every table has a unique identity.',
    description: 'Generate individual QR codes per table. Orders arrive pre-tagged with the exact table number. Zero confusion at the pass.',
  },
  {
    size: 'third',
    icon: Bell,
    color: 'from-emerald-600 to-teal-600',
    tag: 'WhatsApp Notifications',
    badge: 'via Termii',
    title: 'No shouting. Just a ping.',
    description: 'Guests receive a WhatsApp message the moment their order is ready. Staff spend less time yelling across the floor.',
  },
  {
    size: 'third',
    icon: Globe,
    color: 'from-amber-500 to-orange-600',
    tag: 'Edge Translator',
    badge: '40+ languages',
    title: 'Every tourist reads your menu.',
    description: 'Browser language detected on arrival. The menu auto-translates into French, Mandarin, Yoruba, Arabic, and more in seconds.',
  },
  // Row 3 — AI Intelligence
  {
    size: 'half',
    icon: ChefHat,
    color: 'from-violet-600 to-indigo-600',
    tag: 'AI Copywriter + Cover Studio',
    badge: '3× faster menu updates',
    title: 'Studio-quality menus. Zero effort.',
    description: 'Type a dish name. Gemini generates sensory, appetizing copy — complete with allergen flags, dietary tags, and an AI-generated photo. Your menu becomes your sales pitch.',
  },
  {
    size: 'half',
    icon: BarChart3,
    color: 'from-emerald-600 to-teal-600',
    tag: 'Demand Forecaster',
    badge: '30-day data window',
    title: 'Never stock out on your best-sellers.',
    description: 'Analyses 30 days of sales velocity. Predicts the next 7 days of demand, and fires stock alerts before shelves run dry. Suya trending up? We knew two days ago.',
  },
  // Row 4 — Built for Growth
  {
    size: 'third',
    icon: FileText,
    color: 'from-blue-600 to-indigo-600',
    tag: 'Custom Pages',
    badge: 'Unlimited creativity',
    title: 'More than a menu.',
    description: 'Build a cocktail guide, event calendar, or brand story page — all hosted on your menu URL. No separate website needed.',
  },
  {
    size: 'third',
    icon: ShieldCheck,
    color: 'from-zinc-600 to-zinc-700',
    tag: 'Team Roles',
    badge: 'Granular permissions',
    title: 'Owner. Manager. Viewer.',
    description: 'Every staff member sees exactly what they need and nothing more. Invite your whole team without losing control.',
  },
  {
    size: 'third',
    icon: CreditCard,
    color: 'from-green-600 to-emerald-600',
    tag: 'Paystack Payouts',
    badge: 'Direct to your bank',
    title: 'Get paid when they order.',
    description: 'Connect your Nigerian bank account via Paystack. Revenue lands directly in your account the moment a guest completes an order.',
  },
]

const sizeClass = {
  lg: 'md:col-span-2',
  sm: 'md:col-span-1',
  third: 'md:col-span-1',
  half: 'md:col-span-1',
}

const testimonials = [
  { quote: 'Our tourist orders tripled the week we turned on the translator. It just works.', name: 'Aisha K.', role: 'GM, Nkoyo Lagos' },
  { quote: 'The AI Copywriter made our menu look like it was written by a Michelin-starred consultant.', name: 'Emeka O.', role: 'Owner, The Grillhouse' },
  { quote: 'When a guest typed "spill", staff were already moving before they hit send. Insane.', name: 'Fatima B.', role: 'Operations, Skyview Lounge' },
  { quote: 'The demand forecast told us Suya was trending up two days before we actually sold out.', name: 'David T.', role: 'F&B Director, Heritage Hotels' },
]

export default async function HomePage() {
  return (
    <div className="bg-[#050505] min-h-screen selection:bg-violet-500/30 selection:text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-black/40 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-white to-zinc-300 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Zap className="w-3.5 h-3.5 text-black" aria-hidden="true" />
          </div>
          <span className="font-semibold text-white tracking-tight">OurMenu OS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Platform</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Customers</a>
        </div>
        <div className="flex items-center gap-4">
          <a className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block" href="/dashboard">Log in</a>
          <a className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]" href="/dashboard">Get Started</a>
        </div>
      </nav>

      {/* ── HERO: Cinematic full-bleed background composition ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_restaurant_bg.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Multi-layer gradient overlay for text legibility on left, reveal on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Content grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">

          {/* Left — Copy */}
          <FadeIn className="flex flex-col justify-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium backdrop-blur-sm">
                <Zap className="w-3 h-3 text-violet-400" />
                Enterprise Hospitality OS · Built for Africa
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[1.02] mb-6">
              The OS your guests never see.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-white to-zinc-400">
                The one they'll never forget.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-xl font-light leading-relaxed mb-10">
              Run your entire hospitality operation from a single, intelligent platform. Live orders, AI menus, WhatsApp alerts, demand forecasting — unified in one command center.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <a href="/dashboard" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                Start Building <ArrowRight className="w-4 h-4" />
              </a>
              <form action={startInteractiveDemo}>
                <button type="submit" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 backdrop-blur-md transition-all duration-300">
                  Experience Demo Mode
                </button>
              </form>
            </div>
            {/* Trust signals */}
            <div className="mt-12 flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-black text-white">500+</p>
                <p className="text-zinc-500 text-xs">Active Venues</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">40+</p>
                <p className="text-zinc-500 text-xs">Languages</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">2M+</p>
                <p className="text-zinc-500 text-xs">Orders Processed</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">&lt; 1s</p>
                <p className="text-zinc-500 text-xs">KDS Response</p>
              </div>
            </div>
          </FadeIn>

          {/* Right — Phone mockup with actual guest menu screen */}
          <FadeIn delay={0.3} className="hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/25 blur-[100px] rounded-full pointer-events-none" />

              {/* Phone frame */}
              <div className="relative w-[300px] rotate-[-4deg] drop-shadow-[0_60px_80px_rgba(0,0,0,0.8)]">
                {/* Phone shell */}
                <div className="relative bg-zinc-900 rounded-[48px] p-3 border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  {/* Notch / Dynamic Island */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />
                  {/* Screen */}
                  <div className="rounded-[38px] overflow-hidden bg-[#f5f7f5] aspect-[9/19.5] relative">
                    <Image
                      src="/guest_menu_screen.png"
                      alt="OurMenu OS guest menu interface"
                      fill
                      className="object-cover object-top"
                      quality={95}
                    />
                  </div>
                  {/* Side buttons */}
                  <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-zinc-700 rounded-l-full" />
                  <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-zinc-700 rounded-l-full" />
                  <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-zinc-700 rounded-l-full" />
                  <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-full" />
                </div>

                {/* Floating UI annotation badges */}
                <div className="absolute -right-20 top-16 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                  <span className="text-emerald-400 font-bold">✓</span> Order received
                </div>
                <div className="absolute -left-24 bottom-28 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                  <span className="text-blue-400 font-bold">AI</span> Table 7 ready to order
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10" />
      </section>

      {/* ── FEATURES: Full Bento Grid ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">10 Integrated Modules</span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Not features.<br /><span className="text-zinc-400">A complete hospitality OS.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">Everything your operation needs — from the guest's first QR scan to the last Paystack payout.</p>
        </FadeIn>

        {/* Row 1 — Command Center */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {features.slice(0, 2).map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={f.tag} className={`group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${sizeClass[f.size as keyof typeof sizeClass]}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className="p-8 h-full flex flex-col z-10 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                      <Zap className="w-3 h-3 text-white" aria-hidden="true" />
                      <span className="text-xs font-bold text-white">{f.badge}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">{f.tag}</span>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>

        {/* Row 2 — Guest Experience */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {features.slice(2, 5).map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={f.tag} className="group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className="p-8 h-full flex flex-col z-10 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                      <span className="text-[11px] font-bold text-white">{f.badge}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">{f.tag}</span>
                  <h3 className="text-lg font-bold text-white mb-3 leading-tight">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>

        {/* Row 3 — AI Intelligence */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {features.slice(5, 7).map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={f.tag} className="group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className="p-8 h-full flex flex-col z-10 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                      <Zap className="w-3 h-3 text-white" aria-hidden="true" />
                      <span className="text-xs font-bold text-white">{f.badge}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">{f.tag}</span>
                  <h3 className="text-xl font-bold text-white mb-3 leading-snug">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>

        {/* Row 4 — Built for Growth */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.slice(7, 10).map((f) => {
            const Icon = f.icon
            return (
              <StaggerItem key={f.tag} className="group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className="p-8 h-full flex flex-col z-10 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                      <span className="text-[11px] font-bold text-white">{f.badge}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">{f.tag}</span>
                  <h3 className="text-lg font-bold text-white mb-3 leading-tight">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-32 px-6 bg-[#030303] border-y border-white/[0.03] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Operators love it. Guests notice it.</h2>
            <p className="text-zinc-500 text-lg">Real results from real venues across Africa.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1} className="relative rounded-3xl p-8 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />)}
                </div>
                <p className="text-zinc-300 text-base leading-relaxed mb-8 font-light flex-1">"{t.quote}"</p>
                <div className="mt-auto">
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-zinc-500 text-sm">{t.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full" />
        </div>
        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-widest mb-8">Get Started Today</span>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[1.02] mb-8">
            Your venue deserves<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-white to-zinc-400">better infrastructure.</span>
          </h2>
          <p className="text-zinc-400 text-xl font-light mb-12 max-w-2xl mx-auto">
            Join 500+ venues already running on OurMenu OS. Setup takes under 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 px-10 py-4 rounded-full bg-white text-black text-base font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              Start Free — No Card Required <ArrowRight className="w-5 h-5" />
            </a>
            <form action={startInteractiveDemo}>
              <button type="submit" className="flex items-center gap-2 px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white text-base font-semibold hover:bg-white/10 backdrop-blur-md transition-all duration-300">
                Try Demo Mode
              </button>
            </form>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" aria-hidden="true" />
            </div>
            <span className="font-semibold text-white text-sm">OurMenu OS</span>
          </div>
          <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} OurMenu OS. Built for African hospitality.</p>
          <div className="flex items-center gap-6 text-zinc-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
