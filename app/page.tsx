import { ActionForm } from '@/components/ActionForm'
import Image from 'next/image'
import Link from 'next/link'
import { startInteractiveDemo } from './login/actions'
import { DemoSubmitButton } from '../components/DemoSubmitButton'
import { ArrowRight, Star } from 'lucide-react'
import { FadeIn } from './components/animations'
import { FeatureTabs } from './components/feature-tabs'
import { TrustedBy } from './components/trusted-by'
import { DirectorySearch } from './components/directory-search'
import { Pricing } from './components/pricing'
import { LandingNavbar } from '../components/LandingNavbar'
import { UseCases } from './components/use-cases'

export default async function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "OurMenu OS",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "The ultimate operating layer for multi-business operations. Supports dynamic templates for Hospitality, Retail Boutiques, Wellness Services, Real Estate Listings, Consultant Rate Cards, and Multi-venue Portals.",
    "featureList": [
      "Omnichannel Checkout",
      "Live Fulfillment Dashboard",
      "AI Demand Forecasting",
      "Smart Upselling Engine",
      "Payment Roulette Game",
      "Progressive Web App (PWA)"
    ],
    "url": "https://ourmenuos.online",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free Starter Plan available"
    },
    "provider": {
      "@type": "Organization",
      "name": "CruiseHQ"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#050505] min-h-screen selection:bg-violet-500/30 selection:text-white">
        {/* ── Navbar ── */}
        <LandingNavbar />

      {/* ── HERO: Cinematic full-bleed background composition ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_restaurant_bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
            quality={75}
          />
          {/* Multi-layer gradient overlay for text legibility on left, reveal on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Content grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">

          {/* Top right Search Bar */}
          <div className="absolute top-32 right-6 md:right-12 z-50 w-full max-w-sm hidden lg:block">
            <DirectorySearch />
          </div>

          {/* Left — Copy */}
          <FadeIn className="flex flex-col justify-center">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[1.02] mb-6 mt-8">
              The ultimate digital storefront.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-white to-zinc-400">
                A complete operating layer.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-xl font-light leading-relaxed mb-10">
              <strong>OurMenu OS is the complete platform to build your online presence, manage operations, and engage clients.</strong><br /><br />
              Ditch expensive custom websites and terrible PDF links. Whether you are processing restaurant orders, booking salon appointments, selling retail inventory, or quoting consulting retainers, our dynamic templates instantly generate a stunning digital storefront. Delight your clients with an AI Digital Concierge that handles inquiries and processes payments, while your team stays flawlessly synced with the Live Fulfillment Dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/login" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                Start Building <ArrowRight className="w-4 h-4" />
              </Link>
              <ActionForm action={startInteractiveDemo}>
                <DemoSubmitButton className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 backdrop-blur-md transition-all duration-300">
                  Experience Demo Mode
                </DemoSubmitButton>
              </ActionForm>
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
                      alt="OurMenu guest menu interface"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 300px"
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

        {/* Scroll Nudge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce opacity-70 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Explore Platform</span>
          <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-10" />
      </section>

      {/* ── FEATURES: Full Bento Grid ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Not just features.<br /><span className="text-zinc-400">A complete business suite.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">Everything your operation needs — from the client&apos;s first scan to the last Paystack payout.</p>
        </FadeIn>

        <FeatureTabs />
      </section>

      {/* ── USE CASES: MULTI-BUSINESS ── */}
      <UseCases />

      {/* ── DYNAMIC TRUSTED BY ── */}
      <TrustedBy />

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── AFFILIATES TEASER ── */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Star className="w-3.5 h-3.5" /> Partner Program
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Grow with us. <span className="text-zinc-400">Earn recurring revenue.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light mb-10">
            Join our affiliate program and earn a percentage of the revenue for every venue you refer. Rack up invites, track your conversions, and get paid out automatically via our transparent dashboard.
          </p>
          <Link href="/affiliate" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
            Learn about Affiliates <ArrowRight className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </section>

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
            Join forward-thinking venues running on OurMenu. Setup takes under 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="flex items-center gap-2 px-10 py-4 rounded-full bg-white text-black text-base font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <ActionForm action={startInteractiveDemo}>
              <DemoSubmitButton className="flex items-center gap-2 px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white text-base font-semibold hover:bg-white/10 backdrop-blur-md transition-all duration-300">
                Try Demo Mode
              </DemoSubmitButton>
            </ActionForm>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/ourmenu-qr-icon.svg" alt="OurMenu Logo" width={20} height={20} className="object-contain grayscale opacity-70" />
            <span className="font-semibold text-white text-sm">OurMenu</span>
          </div>
          <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} OurMenu. A CruiseHQ concept.</p>
          <div className="flex items-center gap-6 text-zinc-500 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:support@ourmenuos.online" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}
