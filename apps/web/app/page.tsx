import Link from 'next/link'
import Image from 'next/image'
import { startInteractiveDemo } from './login/actions'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, ArrowRight, Check, Star,
  Users, TrendingUp, Shield, Clock
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, FloatingElement } from './components/animations'

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
    image: '/feature_copywriter.png',
    stat: '3× faster menu updates',
    size: 'lg:col-span-2',
  },
  {
    icon: Globe,
    label: 'Edge Translator',
    headline: 'Every tourist reads your menu.',
    body: 'Browser language detected. Menu translated into French, Mandarin, Yoruba, and 40+ others in seconds.',
    color: 'from-blue-600 to-cyan-600',
    stat: '40+ languages',
    size: 'lg:col-span-1',
  },
  {
    icon: ClipboardList,
    label: 'Smart Triage',
    headline: '"Spill on table 4" goes to the top.',
    body: 'Guests type exactly what they need. Gemini classifies urgency in milliseconds — critical requests flash red on your KDS.',
    color: 'from-red-600 to-orange-600',
    image: '/feature_triage.png',
    stat: '< 1s triage speed',
    size: 'lg:col-span-1',
  },
  {
    icon: BarChart3,
    label: 'Demand Forecaster',
    headline: 'Never stock out on your best-sellers.',
    body: 'Analyses your last 30 days of sales velocity. Predicts the next 7 days of demand, and fires stock alerts before shelves run dry.',
    color: 'from-emerald-600 to-teal-600',
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
    role: 'Owner, The Grillhouse',
    quote: 'The AI Copywriter made our menu look like it was written by a Michelin-starred consultant.',
    stars: 5,
  },
  {
    name: 'Fatima B.',
    role: 'Operations, Skyview Lounge',
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

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-black/40 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-white to-zinc-300 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
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
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 lg:pt-40 overflow-hidden bg-[#050505] px-6">
      {/* Premium deep mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-40 blur-[120px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.1) 40%, rgba(0,0,0,0) 70%)' }} />
      </div>

      <div className="relative z-10 text-center max-w-6xl mx-auto w-full">
        <FadeIn delay={0.1}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Introducing OurMenu OS 2026
          </span>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-5xl md:text-[84px] font-medium text-white tracking-[-0.04em] leading-[1.05] mb-8 max-w-4xl mx-auto">
            Hospitality operations,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/30">engineered for scale.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto tracking-tight font-light leading-relaxed mb-12">
            An enterprise-grade operating system for modern hospitality. Unified menus, intelligent fulfillment, and predictive forecasting.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Start Building
            </a>
            <form action={startInteractiveDemo}>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300"
              >
                Experience Demo Mode
              </button>
            </form>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.5}>
          <FloatingElement className="relative mx-auto max-w-5xl w-full perspective-1000">
            {/* Ambient glow behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-500/20 blur-[120px] rounded-full" />
            
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black/50 backdrop-blur-sm">
              <Image 
                src="/hero_mobile_mockup.png" 
                alt="OurMenu OS Guest Experience" 
                width={2000} 
                height={1125} 
                className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
                priority
              />
              
              {/* Subtle glass reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.05] pointer-events-none" />
            </div>
          </FloatingElement>
        </FadeIn>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-10 bg-[#050505]">
      <FadeIn>
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
            4 AI Modules
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            The complete AI stack<br />for hospitality.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Not gimmicks. Actual intelligence built into every layer of your operation.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, label, headline, body, color, image, stat, size }) => (
          <StaggerItem
            key={label}
            className={`group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${size}`}
          >
            {/* Subtle background glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
            
            <div className="p-8 h-full flex flex-col z-10 relative">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md`}>
                  <Zap className="w-3 h-3 text-white" fill="currentColor" />
                  <span className="text-xs font-bold text-white">{stat}</span>
                </div>
              </div>

              <div className="flex-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">{label}</span>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{headline}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">{body}</p>
              </div>

              {image && (
                <div className="relative mt-auto -mx-8 -mb-8 overflow-hidden rounded-b-3xl border-t border-white/[0.04]">
                  {/* Subtle fade to black at the top of the image to blend it */}
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-zinc-900/40 to-transparent z-10 pointer-events-none" />
                  <Image 
                    src={image} 
                    alt={label} 
                    width={800} 
                    height={400} 
                    className="w-full h-48 md:h-64 object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                  />
                </div>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}

function SocialProof() {
  return (
    <section id="testimonials" className="py-32 px-6 bg-[#030303] border-y border-white/[0.03] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Operators love it. Guests notice it.
          </h2>
          <p className="text-zinc-500 text-lg">Real results from real venues across Africa.</p>
        </FadeIn>
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map(({ name, role, quote, stars }) => (
            <StaggerItem key={name} className="relative rounded-3xl p-8 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-base leading-relaxed mb-8 font-light">&quot;{quote}&quot;</p>
              <div className="mt-auto">
                <p className="text-white font-bold text-sm">{name}</p>
                <p className="text-zinc-500 text-sm">{role}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
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
    <section className="py-24 px-6 bg-[#050505]">
      <StaggerContainer className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
        {items.map(({ label, value, icon: Icon }) => (
          <StaggerItem key={label} className="text-center group">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
              <Icon className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <p className="text-5xl font-black text-white mb-2 tracking-tight">{value}</p>
            <p className="text-zinc-500 text-sm font-medium">{label}</p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M3 12h18M18 6l-12 12M6 6l12 12" />
    </svg>
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
    <section id="pricing" className="py-32 px-6 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Pay for what you need.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light">No hidden fees. Cancel any time.</p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {dynamicPricingTiers.map(({ name, price, period, description, features: feats, cta, href, highlight }) => (
            <StaggerItem
              key={name}
              className={`relative rounded-3xl p-10 flex flex-col gap-8 transition-all duration-500 ${
                highlight
                  ? 'bg-gradient-to-b from-violet-900/30 to-[#0a0a0f] border border-violet-500/40 shadow-2xl shadow-violet-900/20 md:-translate-y-4'
                  : 'bg-white/[0.02] border border-white/[0.05] hover:border-white/10'
              }`}
            >
              {highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-900/50">
                  Most Popular
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{name}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white tracking-tight">{price}</span>
                  <span className="text-zinc-500 text-base">/ {period}</span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
              </div>

              <ul className="space-y-4 flex-1">
                {feats.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-300 font-light">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  highlight
                    ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-[#050505]">
      <FadeIn className="max-w-5xl mx-auto relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-900/20">
        {/* Deep Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-black to-indigo-950 border border-white/10 rounded-[2.5rem]" />
        
        {/* Glow orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px]" />

        <div className="relative z-10 px-8 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white font-medium">No credit card required for 30 days</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-[1.1]">
            Your venue deserves<br />enterprise-grade AI.
          </h2>
          <p className="text-zinc-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
            Join 500+ hospitality operators who replaced chaotic operations with a single, intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-black font-black text-base hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              <Zap className="w-5 h-5" />
              Start Free Trial
            </Link>
            <form action={startInteractiveDemo} className="flex">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300"
              >
                View Dashboard Demo
              </button>
            </form>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-16 px-6 bg-[#030303]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" fill="currentColor" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">OurMenu OS</span>
        </div>
        <p className="text-zinc-600 text-sm font-medium">© 2026 OurMenu OS. Built for modern hospitality.</p>
        <div className="flex gap-8 text-sm text-zinc-500 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Platform</a>
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
    <div className="bg-[#050505] min-h-screen selection:bg-violet-500/30 selection:text-white">
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
