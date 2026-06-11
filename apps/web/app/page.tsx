import Link from 'next/link'
import { startInteractiveDemo } from './login/actions'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, Sparkles, ArrowRight, Check, Star,
  Users, TrendingUp, Shield, Clock
} from 'lucide-react'

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */

const features = [
  {
    icon: ChefHat,
    label: 'AI Copywriter',
    headline: 'Studio-quality descriptions, zero effort.',
    body: 'Type a dish name. Gemini instantly generates sensory, appetizing copy — complete with allergen flags, dietary tags, and SEO-ready language.',
    color: 'from-violet-600 to-indigo-600',
    glow: 'glow-violet',
    stat: '3× faster menu updates',
    size: 'lg:col-span-2',
  },
  {
    icon: Globe,
    label: 'Edge Translator',
    headline: 'Every tourist reads your menu.',
    body: 'Browser language detected. Menu translated into French, Mandarin, Yoruba, and 40+ others in seconds. Cultural terms preserved perfectly.',
    color: 'from-blue-600 to-cyan-600',
    glow: 'glow-indigo',
    stat: '40+ languages',
    size: 'lg:col-span-1',
  },
  {
    icon: ClipboardList,
    label: 'Smart Triage',
    headline: '"Spill on table 4" goes to the top.',
    body: 'Guests type exactly what they need. Gemini classifies urgency in milliseconds — critical requests flash red on your KDS before staff even reach the table.',
    color: 'from-red-600 to-orange-600',
    glow: '',
    stat: '< 1s triage speed',
    size: 'lg:col-span-1',
  },
  {
    icon: BarChart3,
    label: 'Demand Forecaster',
    headline: 'Never stock out on your best-sellers.',
    body: 'Analyses your last 30 days of sales velocity. Predicts the next 7 days of demand, surfaces rising stars, and fires stock alerts before shelves run dry.',
    color: 'from-emerald-600 to-teal-600',
    glow: 'glow-emerald',
    stat: '30-day data window',
    size: 'lg:col-span-2',
  },
]

const testimonials = [
  {
    name: 'Aisha K.',
    role: 'GM, Nkoyo Lagos',
    quote: 'Our tourist orders tripled the week we turned on the translator. It just works.',
    stars: 5,
  },
  {
    name: 'Emeka O.',
    role: 'Owner, The Grillhouse Abuja',
    quote: 'The AI Copywriter made our menu look like it was written by a Michelin-starred consultant.',
    stars: 5,
  },
  {
    name: 'Fatima B.',
    role: 'Operations Lead, Skyview Lounge',
    quote: 'When a guest typed "spill", staff were already moving before they hit send. Insane.',
    stars: 5,
  },
  {
    name: 'David T.',
    role: 'F&B Director, Heritage Hotels',
    quote: 'The demand forecast told us Suya was trending up two days before we actually sold out.',
    stars: 5,
  },
]

// Static pricing tiers removed, dynamically generated in Pricing()

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-black/50 backdrop-blur-md border-b border-white/[0.08]">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-black" fill="currentColor" />
        </div>
        <span className="font-semibold text-white tracking-tight">OurMenu OS</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">Platform</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        <a href="#testimonials" className="hover:text-white transition-colors">Customers</a>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">
          Log in
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-40 overflow-hidden bg-black px-6">
      {/* Premium subtle mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)' }} />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto w-full">
        {/* Headline */}
        <h1 className="text-6xl md:text-[84px] font-medium text-white tracking-[-0.04em] leading-[1.05] mb-8 max-w-4xl mx-auto">
          Hospitality operations,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">engineered for scale.</span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto tracking-tight font-light leading-relaxed mb-12">
          An enterprise-grade operating system for modern hospitality. Unified menus, intelligent fulfillment, and predictive forecasting for high-volume restaurants, lounges, and hotels.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-3 rounded-md bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all"
          >
            Start Building
          </a>
          <form action={startInteractiveDemo}>
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 rounded-md bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all"
            >
              Experience Demo Mode
            </button>
          </form>
        </div>
        
        <div className="relative mx-auto max-w-4xl w-full">
          {/* Subtle top glow */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          {/* Mock dashboard frame */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-black">
            {/* Fake browser chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-6 py-1.5 bg-white/[0.03] rounded-md text-xs text-zinc-500 font-mono border border-white/[0.02]">
                  app.ourmenu.os/dashboard
                </div>
              </div>
              <div className="w-16" /> {/* spacer */}
            </div>
            {/* Fake dashboard content */}
            <div className="p-8 grid grid-cols-3 gap-4 text-left bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
              {[
                { label: 'Total Orders', val: '2,841', trend: '+14%' },
                { label: 'Active Menus', val: '12', trend: 'Stable' },
                { label: 'Requests', val: '4', trend: 'Needs action' },
              ].map(({ label, val, trend }, i) => (
                <div key={label} className="bg-black rounded-xl p-5 border border-white/[0.06] shadow-sm">
                  <p className="text-xs font-medium text-zinc-500 mb-2">{label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-medium text-white tracking-tight">{val}</p>
                    <span className={`text-xs ${i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>{trend}</span>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



function Features() {
  return (
    <section id="features" className="py-32 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4">
          4 AI Modules
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          The complete AI stack<br />for hospitality.
        </h2>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Not gimmicks. Actual intelligence built into every layer of your operation.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, label, headline, body, color, glow, stat, size }) => (
          <div
            key={label}
            className={`group relative rounded-2xl border border-white/[0.06] bg-zinc-900/50 backdrop-blur p-8 overflow-hidden hover:border-white/10 transition-all duration-500 hover:-translate-y-1 ${size}`}
          >
            {/* BG gradient orb on hover */}
            <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-3xl transition-all duration-500`} />

            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">{label}</span>
            <h3 className="text-xl font-bold text-white mb-3 leading-snug">{headline}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{body}</p>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${color} bg-opacity-10`}>
              <Zap className="w-3 h-3 text-white" />
              <span className="text-xs font-bold text-white">{stat}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SocialProof() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-zinc-950/60 border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Operators love it. Guests notice it.
          </h2>
          <p className="text-zinc-500 text-base">Real results from real venues.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map(({ name, role, quote, stars }) => (
            <div key={name} className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-white/10 transition-all duration-300">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">&quot;{quote}&quot;</p>
              <div>
                <p className="text-white font-semibold text-sm">{name}</p>
                <p className="text-zinc-500 text-xs">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const items = [
    { label: 'Active Venues', value: '500+', icon: Users },
    { label: 'Languages Supported', value: '40+', icon: Globe },
    { label: 'Orders Processed', value: '2M+', icon: TrendingUp },
    { label: 'Avg. Response Time', value: '< 1s', icon: Clock },
  ]
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="text-center">
            <Icon className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
            <p className="text-4xl font-black text-white mb-1">{value}</p>
            <p className="text-zinc-500 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

async function Pricing() {
  const { getPricingSettings, getPlanLimits } = await import('@/lib/utils/settings')
  const pricing = await getPricingSettings() as any
  const limits = await getPlanLimits() as any

  const dynamicPricingTiers = [
    {
      name: 'Starter',
      price: '₦0',
      period: '30-day trial',
      description: 'Perfect for testing the system at your venue.',
      features: [
        'AI Waiter (guest-facing chat)',
        'Edge Translator (40+ languages)',
        'Up to 2 QR codes',
        '1 active location',
      ],
      cta: 'Start Free Trial',
      href: '/dashboard',
      highlight: false,
    },
    {
      name: 'Pro',
      price: `₦${(pricing.pro_monthly_ngn || 49000).toLocaleString()}`,
      period: 'per month',
      description: 'For serious operators who want every edge.',
      features: [
        'Everything in Starter',
        `Includes ${limits.pro?.credits || 50} Credits/mo`,
        'AI Copywriter & Image Studio',
        'Smart Request Triaging (KDS)',
        'Demand Forecasting Engine',
        `${limits.pro?.pages || 1} Custom Page (+10 credits/extra)`,
        'Priority WhatsApp support',
        'Team management & roles',
      ],
      cta: 'Get Pro',
      href: '/dashboard',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For hotel chains and multi-location brands.',
      features: [
        'Everything in Pro',
        `Includes ${limits.enterprise?.credits || 200} Credits/mo`,
        'Dedicated AI model fine-tuning',
        'Multi-location dashboard',
        'API access for PMS integration',
        'Dedicated account manager',
        'Custom SLA & onboarding',
      ],
      cta: 'Contact Sales',
      href: 'mailto:hello@ourmenu.os',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Pay for what you need.
          </h2>
          <p className="text-zinc-400 text-lg">No hidden fees. Cancel any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {dynamicPricingTiers.map(({ name, price, period, description, features: feats, cta, href, highlight }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 ${
                highlight
                  ? 'bg-gradient-to-b from-violet-900/40 to-indigo-900/30 border-2 border-violet-500/50 shadow-2xl shadow-violet-900/30 scale-[1.02]'
                  : 'glass hover:border-white/10'
              }`}
            >
              {highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/40">
                  Most Popular
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-zinc-400 mb-1">{name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{price}</span>
                  <span className="text-zinc-500 text-sm">/ {period}</span>
                </div>
                <p className="text-zinc-400 text-sm mt-2">{description}</p>
              </div>

              <ul className="space-y-3 flex-1">
                {feats.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  highlight
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-indigo-900/70 to-violet-950/90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgxMHYtMmgtNHptMC0zMFY0aC0ydjRoLTRWNmgxMFY0aC00em0tMTggMHY0aC0yVjRoLTR2MmgxMFY0aC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative z-10 px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <Shield className="w-4 h-4 text-violet-300" />
            <span className="text-sm text-white font-medium">No credit card required</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Your venue deserves<br />enterprise-grade AI.
          </h2>
          <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
            Join 500+ hospitality operators who replaced chaotic operations with a single, intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-violet-900 font-black text-base hover:bg-zinc-100 transition-all shadow-2xl"
            >
              <Zap className="w-5 h-5" />
              Start Free for 30 Days
            </Link>
            <Link
              href="/api/demo"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-base hover:bg-white/20 transition-all"
            >
              View Dashboard Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">OurMenu OS</span>
        </div>
        <p className="text-zinc-600 text-sm">© 2026 OurMenu OS. Built for African hospitality.</p>
        <div className="flex gap-6 text-sm text-zinc-500">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/dashboard" className="hover:text-white transition-colors">Log in</Link>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────
   PAGE ASSEMBLY
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-[#09090f] min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <SocialProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
