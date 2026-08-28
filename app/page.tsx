import { ActionForm } from '@/components/ActionForm'
import heroBg from '../public/hero_emerald_gemstone.png'
import Image from 'next/image'
import Link from 'next/link'
import { startInteractiveDemo } from './login/actions'
import { DemoSubmitButton } from '../components/DemoSubmitButton'
import { ArrowRight, Store, Cpu, Printer, Radio, CreditCard, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { FadeIn } from './components/animations'
import { FeatureTabs } from './components/feature-tabs'
import { TrustedBy } from './components/trusted-by'
import { DirectorySearch } from './components/directory-search'
import { Pricing } from './components/pricing'
import { LandingNavbar } from '../components/LandingNavbar'
import { UseCases } from './components/use-cases'
import { RouletteTeaser } from './components/roulette-teaser'
import { IouTeaser } from './components/iou-teaser'
import { FAQSection } from './components/faq-section'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WETAEGO | The Commerce & Service Operating System for Modern Brands',
  description: 'The complete operating layer for modern businesses. Build your digital storefront, manage operations, and process payments instantly with 9 specialized industry templates and Tego Multimodal AI.',
  alternates: {
    canonical: 'https://ourmenuos.online',
  },
}

export default async function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://ourmenuos.online/#organization",
        "name": "WETAEGO",
        "legalName": "WETAEGO by CRUISEHQ LTD",
        "url": "https://ourmenuos.online",
        "logo": "https://ourmenuos.online/ourmenu-qr-logo.png",
        "email": "support@ourmenuos.online",
        "telephone": "+234-800-687-6368",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+234-800-687-6368",
            "contactType": "customer service",
            "email": "support@ourmenuos.online",
            "availableLanguage": ["English", "Spanish", "French", "Yoruba", "Igbo", "Hausa"],
            "areaServed": "Global"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+234-800-687-6368",
            "contactType": "sales",
            "email": "partners@ourmenuos.online",
            "availableLanguage": ["English"],
            "areaServed": "Global"
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "12 Admiralty Way, Lekki Phase 1",
          "addressLocality": "Lagos",
          "addressRegion": "Lagos State",
          "postalCode": "105102",
          "addressCountry": "NG"
        },
        "sameAs": [
          "https://github.com/Kryptopacy/ourmenuos",
          "https://twitter.com/ourmenuos"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/#software",
        "name": "WETAEGO",
        "alternateName": ["wetaego", "WETAEGO", "Wetaego"],
        "operatingSystem": "Web, iOS, Android, PWA",
        "applicationCategory": "BusinessApplication",
        "description": "The ultimate operating layer for multi-business operations. Supports dynamic templates for Hospitality, Supermarket Chains, Retail Boutiques, Wellness Services, Real Estate Listings, Consultant Rate Cards, Automotive Dealerships, and Multi-venue Portals.",
        "featureList": [
          "Omnichannel POS & Digital Checkout",
          "Tego Multimodal Live Voice & Vision AI",
          "Dynamic QR Digital Menu & Table Intercom",
          "Supermarket & Multi-Branch Fleet Management",
          "Native Raw ESC/POS Thermal Printing Driver (WebUSB/WebSerial/WebBluetooth)",
          "Salon & Spa Calendar Booking with Deposit Billing",
          "B2B Interactive Dynamic Quotes & Rate Cards",
          "Payment Roulette & Bill Splitting Randomizer Game",
          "Customer IOU Store Credit & Tab Financing Ledger",
          "1-Click Franchise Catalog Duplication in <1s",
          "Multi-Gateway Settlement (Paystack, Bachs, USDC/USDT/SOL)"
        ],
        "url": "https://ourmenuos.online",
        "provider": {
          "@id": "https://ourmenuos.online/#organization"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free Starter Plan available"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://ourmenuos.online/#website",
        "url": "https://ourmenuos.online",
        "name": "WETAEGO",
        "description": "Instant multi-template digital presence and operating system for physical and service businesses.",
        "publisher": {
          "@id": "https://ourmenuos.online/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://ourmenuos.online/m/{search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What businesses can use WETAEGO?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "WETAEGO supports 9 tailored industry templates: Restaurants & Bars (QR digital menus, split bills, kitchen display), Supermarkets & Retail Chains (multi-branch fleet switcher, sub-department aisles, ESC/POS printing), Salons & Spas (appointment bookings, deposit billing), Retail Boutiques (variants, inventory), Consultants & Agencies (media rate cards, dynamic quotes), Real Estate & Automotive (property/car showrooms), and Multi-venue Portals."
            }
          },
          {
            "@type": "Question",
            "name": "What is Tego Multimodal AI?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tego AI is our dual-layer real-time intelligence engine. It provides bidirectional low-latency voice dialogue and 1 FPS camera video ingestion for managers to parse physical menus or stock shelves, plus a zero-hallucination frontline concierge on customer storefronts."
            }
          },
          {
            "@type": "Question",
            "name": "Does WETAEGO support direct thermal receipt printing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! WETAEGO features a native raw ESC/POS bytecode engine that writes direct binary commands over WebUSB, WebSerial (RS232 COM), and WebBluetooth to thermal receipt printers without needing print daemons, third-party software, or print dialogs."
            }
          },
          {
            "@type": "Question",
            "name": "What is the Payment Roulette game?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Payment Roulette is an interactive, gamified bill randomizer built into WETAEGO that lets dining parties spin a digital wheel to randomly decide who pays the restaurant bill or how the check is split."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#050505] min-h-screen selection:bg-emerald-500/30 selection:text-white">
        {/* ── Navbar ── */}
        <LandingNavbar />

      {/* ── HERO: Cinematic full-bleed background composition ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <style>{`
          @keyframes breathe-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .animate-breathe {
            animation: breathe-scale 25s ease-in-out infinite;
            will-change: transform;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes glow-pulse {
            0%, 100% { filter: drop-shadow(0px 0px 10px rgba(16,185,129,0.4)); opacity: 0.9; }
            50% { filter: drop-shadow(0px 0px 25px rgba(16,185,129,1)); opacity: 1; }
          }
          .animate-glow-pulse {
            animation: glow-pulse 4s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-breathe, .animate-glow-pulse, .animate-float {
              animation: none !important;
              transform: none !important;
              filter: none !important;
            }
          }
        `}</style>
        {/* Background image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 animate-breathe origin-center">
            <Image
              src={heroBg}
              placeholder="blur"
              alt="Hero Background"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-75 md:opacity-50 brightness-100 md:brightness-75"
              priority
              quality={100}
            />
          </div>
          {/* Multi-layer gradient overlay for text legibility on left, reveal on right */}
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#050505]/85 via-[#050505]/60 md:via-[#050505]/80 to-[#050505]/20 md:to-[#050505]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 md:via-transparent to-transparent" />
        </div>

        {/* Content grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center min-h-screen">

          {/* Left — Copy */}
          <FadeIn className="flex flex-col justify-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[1.05] mb-5 drop-shadow-md">
              The Commerce & Service
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-green-300">
                Operating System.
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-zinc-100 font-normal leading-snug mb-4 max-w-xl">
              Built for <span className="text-amber-300 font-semibold">modern brands</span>, their <span className="text-sky-300 font-semibold">human customers</span>, and the <span className="text-emerald-300 font-semibold">AI agents</span> who serve them.
            </p>

            <p className="text-sm sm:text-base text-zinc-400 max-w-lg font-light leading-relaxed mb-8 drop-shadow-sm">
              WETAEGO powers your digital storefront, live operations, and booking workflows—while instantly equipping your brand with actionable AI assistants and in-browser WebMCP agent discovery.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2">
              <Link href="/login" className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Start Building <ArrowRight className="w-4 h-4" />
              </Link>
              <ActionForm action={startInteractiveDemo} className="w-full sm:w-auto">
                <DemoSubmitButton className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 backdrop-blur-md transition-all duration-300">
                  Experience Demo Mode
                </DemoSubmitButton>
              </ActionForm>
            </div>

            {/* Live Storefront Search Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 w-full max-w-md">
              <p className="text-xs font-semibold text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <span>Looking for an existing venue or digital menu?</span>
              </p>
              <DirectorySearch />
            </div>
          </FadeIn>

          {/* Right — Phone mockup with actual guest menu screen */}
          <FadeIn delay={0.3} className="hidden lg:flex items-center justify-center">
            <div className="relative animate-float">
              {/* Glow behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/25 blur-[100px] rounded-full pointer-events-none" />

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
                      alt="WETAEGO guest menu interface"
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

      {/* ── USE CASES: 9 INDUSTRY OPERATING ENGINES ── */}
      <UseCases />

      {/* ── FEATURES: Full Bento Grid (AI, Hardware POS, Fleet, Experience) ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Not just features.<br /><span className="text-zinc-400">A complete business suite.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">Everything your operation needs — from the client&apos;s first scan to the last Paystack payout.</p>
        </FadeIn>

        <FeatureTabs />
      </section>

      {/* ── DYNAMIC TRUSTED BY ── */}
      <TrustedBy />

      {/* ── ROULETTE GAMIFICATION ── */}
      <RouletteTeaser />

      {/* ── IOU FINANCING ── */}
      <IouTeaser />

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── AFFILIATES TEASER ── */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">

          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Grow with us. <span className="text-zinc-400">Earn recurring revenue.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light mb-10">
            Join our affiliate program and earn a percentage of the revenue for every venue you refer. Rack up invites, track your conversions, and get paid out automatically via our transparent dashboard.
          </p>
          <Link href="/affiliates" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
            Learn about Affiliates <ArrowRight className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </section>

      {/* ── INTELLIGENCE & OPERATIONAL FAQ SECTION ── */}
      <FAQSection />

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full" />
        </div>
        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-[-0.04em] leading-[1.02] mb-8">
            Your venue deserves<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-white to-zinc-400">better infrastructure.</span>
          </h2>
          <p className="text-zinc-400 text-xl font-light mb-12 max-w-2xl mx-auto">
            Join forward-thinking venues running on WETAEGO. Setup takes under 10 minutes.
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
      <footer className="border-t border-white/[0.04] py-16 px-6 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/ourmenu-qr-icon.svg" alt="WETAEGO Logo" width={24} height={24} className="object-contain" />
              <span className="font-bold text-white text-base tracking-tight">WETAEGO</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The universal operating layer for modern hospitality, supermarkets, retail chains, and service businesses.
            </p>
            <p className="text-zinc-600 text-xs">
              © {new Date().getFullYear()} WETAEGO. A CRUISEHQ LTD concept.
            </p>
          </div>

          {/* Col 2: Solutions */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li><Link href="/features/restaurant-qr-menu" className="hover:text-emerald-400 transition-colors">Restaurant QR & Dining</Link></li>
              <li><Link href="/features/supermarket-multi-branch-pos" className="hover:text-emerald-400 transition-colors">Supermarkets & Fleet POS</Link></li>
              <li><Link href="/features/salon-spa-booking-system" className="hover:text-emerald-400 transition-colors">Salon & Spa Bookings</Link></li>
              <li><Link href="/features/retail-boutique-ecommerce" className="hover:text-emerald-400 transition-colors">Retail Boutiques & Gadgets</Link></li>
              <li><Link href="/features/rate-card-consulting-quotes" className="hover:text-emerald-400 transition-colors">Rate Cards & B2B Quotes</Link></li>
              <li><Link href="/features/real-estate-vehicle-listings" className="hover:text-emerald-400 transition-colors">Real Estate & Dealerships</Link></li>
            </ul>
          </div>

          {/* Col 3: Capabilities & Tools */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Platform & Tools</h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">All Features Index</Link></li>
              <li><Link href="/features/ai-copilot-tego-multimodal" className="hover:text-emerald-400 transition-colors">Tego Multimodal AI</Link></li>
              <li><Link href="/tools/who-pays-the-bill" className="hover:text-emerald-400 transition-colors">Payment Roulette Tool 🎲</Link></li>
              <li><Link href="/features/customer-iou-financing" className="hover:text-emerald-400 transition-colors">Customer IOU Financing</Link></li>
              <li><Link href="/affiliates" className="hover:text-emerald-400 transition-colors">Affiliate Partner Program</Link></li>
              <li><Link href="/docs" className="hover:text-emerald-400 transition-colors">Developer Portal & APIs</Link></li>
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Trust & Legal</h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Our Company</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Us & Support</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/llms.txt" className="hover:text-emerald-400 transition-colors">LLMs / Agent Feed</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}
