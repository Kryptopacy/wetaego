import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Zap,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Flash Deals, Happy Hour Promotions & AI Upselling Engine | WETAEGO",
  description: "Boost venue revenue with automated time-based happy hours, limited-quantity flash deals, cart upselling recommendations, and global discount banners.",
  keywords: [
    "restaurant flash deals software",
    "happy hour promotion pos",
    "smart upselling engine hospitality",
    "dynamic restaurant pricing",
    "limited quantity flash sales pos",
    "cart upselling menu software",
    "restaurant promotion management"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/flash-deals-upselling-engine",
  },
  openGraph: {
    title: "Flash Deals & Smart Upselling Engine | WETAEGO",
    description: "Automated happy hours, limited-quantity flash deals, and AI cart upselling to maximize average order value.",
    url: "https://ourmenuos.online/features/flash-deals-upselling-engine",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flash Deals & Smart Upselling Engine | WETAEGO",
    description: "Automated happy hours, limited-quantity flash deals, and AI cart upselling to maximize average order value.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function FlashDealsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/flash-deals-upselling-engine#software",
        "name": "WETAEGO Flash Deals & Dynamic Upselling Engine",
        "applicationCategory": "BusinessApplication, MarketingApplication, ECommerceApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Dynamic promotion engine supporting time-based happy hours, quantity-limited flash deals, and contextual cart upselling to maximize basket sizes.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/flash-deals-upselling-engine#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://ourmenuos.online"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Features",
            "item": "https://ourmenuos.online/features"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Flash Deals & Upselling",
            "item": "https://ourmenuos.online/features/flash-deals-upselling-engine"
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
      <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30 selection:text-white">
        <LandingNavbar />

        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Flame className="w-3.5 h-3.5" /> Revenue & Margin Optimization
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Boost average basket size. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300">
                Automate flash deals.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Run automated happy hours that trigger on schedule, release limited-quantity flash drops to sell out surplus stock, and recommend high-margin upsells at the exact moment of checkout.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Launch Flash Deals Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Time-Based Happy Hours</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Schedule recurring happy hour discounts (e.g., 2-for-1 cocktails Tue-Thu 5PM-7PM) that automatically appear and expire on digital menus.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Quantity-Limited Drops</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Offer special pricing on the first 20 orders of a chef special. Once claimed, pricing automatically reverts with zero manual toggles.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Cart Upselling</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Suggest complementary pairings (truffle fries with burgers, wine with steak) with 1-tap add-to-cart prompts.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-rose-950/60 via-zinc-900 to-amber-950/60 border border-rose-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Maximize your venue profit margins today
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Setup automated promotions and upselling in your dashboard in under 5 minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-transform shadow-xl"
            >
              Start Free Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
