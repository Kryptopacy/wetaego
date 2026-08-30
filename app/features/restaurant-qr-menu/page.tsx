import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  UtensilsCrossed,
  QrCode,
  CreditCard,
  WifiOff,
  ChefHat,
  Bell,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Restaurant QR Digital Menu & Table Ordering System | WETAEGO",
  description: "Transform dine-in hospitality with smart QR menus, instant table ordering, split-bill checkouts, live kitchen display boards, and offline PWA reliability.",
  keywords: [
    "restaurant qr menu",
    "qr code digital menu",
    "table ordering system",
    "restaurant pos software",
    "split bill payments",
    "kitchen display system",
    "contactless dining menu",
    "food truck pos",
    "hospitality software",
    "restaurant bill roulette"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/restaurant-qr-menu",
  },
  openGraph: {
    title: "Restaurant QR Digital Menu & Table Ordering | WETAEGO",
    description: "Instant contactless ordering, split payments, live kitchen fulfillment, and zero PDF menus.",
    url: "https://ourmenuos.online/features/restaurant-qr-menu",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant QR Digital Menu & Table Ordering | WETAEGO",
    description: "Instant contactless ordering, split payments, live kitchen fulfillment, and zero PDF menus.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function RestaurantQrMenuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/restaurant-qr-menu#software",
        "name": "WETAEGO Restaurant QR Menu & POS",
        "applicationCategory": "BusinessApplication, FoodAndDrinkApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Comprehensive hospitality operating layer featuring contactless QR menus, table-service routing, split payments, kitchen sound alerts, and offline reliability.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/features/restaurant-qr-menu#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does WETAEGO replace static PDF menus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Unlike terrible pinch-and-zoom PDF menus, WETAEGO renders an interactive, lightning-fast digital storefront with dietary allergen filters, high-resolution food imagery, live modifier options, and 1-tap table ordering."
            }
          },
          {
            "@type": "Question",
            "name": "Can dining guests split the check directly from the QR menu?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Guests can split payments equally, pay per item, or play the built-in 'Payment Roulette' game to randomly select who pays the bill tonight."
            }
          },
          {
            "@type": "Question",
            "name": "Does it work if restaurant Wi-Fi drops?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! WETAEGO is built as an offline-first Progressive Web App (PWA). Carts are persisted locally in IndexedDB and queued mutations sync automatically once connection is restored."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/restaurant-qr-menu#breadcrumb",
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
            "name": "Restaurant QR Menu",
            "item": "https://ourmenuos.online/features/restaurant-qr-menu"
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

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Hospitality OS</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none mb-6">
                Ditch the Boring PDF. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                  Experience Interactive Menus.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
                Turn dining tables into frictionless ordering hubs. Lightning-fast visual menus, multi-currency pricing, allergen filters, and instant kitchen POS sync.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-base shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all"
                >
                  <span>Launch Your Menu Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/m/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 font-semibold text-base transition-all"
                >
                  <span>Live Interactive Demo</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Comparison Section */}
        <section className="py-20 border-y border-zinc-800/60 bg-zinc-950/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Why Top Restaurants Choose WETAEGO
              </h2>
            </div>
          </div>

          <main className="px-6 max-w-7xl mx-auto">
            {/* Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Dynamic Table QRs</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Print generic branded table tents once. Managers can reassign or move tables digitally in 2 taps without reprinting physical QR stickers.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Kitchen Dispatch</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Orders appear instantaneously on the fulfillment dashboard with distinct sound chimes and table identifiers for floor and kitchen staff.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Offline-First PWA</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Never lose an order to weak venue Wi-Fi. IndexedDB caching preserves carts and mutations sync automatically on reconnection.
                </p>
              </div>
            </div>

            {/* Feature Checklist Comparison */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 mb-24">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-8 text-center">
                Why Top Restaurants Choose WETAEGO
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "AI Menu Parser: Upload a photo/PDF of your physical menu to generate your storefront in 30 seconds",
                  "Dietary & Allergen Filtering: Instant tags for Halal, Vegan, Gluten-Free, Nut-Free, and Keto",
                  "Instant Waiter & Bill Calling: Guests tap a button to request water, service, or a paper check",
                  "Payment Roulette Gamification: Gamified check randomizer to entertain dining parties",
                  "Direct ESC/POS Receipt Printing: Automatic ticket printing to kitchen and bar printers",
                  "Multi-Gateway Settlement: Receive local cards, bank transfers, and crypto instantly"
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
                Modernize your restaurant tables today
              </h3>
              <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
                Setup takes under 10 minutes. Zero credit card or hardware lock-in required.
              </p>
              <Link
                href="/login"
          {/* Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dynamic Table QRs</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Print generic branded table tents once. Managers can reassign or move tables digitally in 2 taps without reprinting physical QR stickers.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Kitchen Dispatch</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Orders appear instantaneously on the fulfillment dashboard with distinct sound chimes and table identifiers for floor and kitchen staff.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Offline-First PWA</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Never lose an order to weak venue Wi-Fi. IndexedDB caching preserves carts and mutations sync automatically on reconnection.
              </p>
            </div>
          </div>

          {/* Feature Checklist Comparison */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 mb-24">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-8 text-center">
              Why Top Restaurants Choose WETAEGO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "AI Menu Parser: Upload a photo/PDF of your physical menu to generate your storefront in 30 seconds",
                "Dietary & Allergen Filtering: Instant tags for Halal, Vegan, Gluten-Free, Nut-Free, and Keto",
                "Instant Waiter & Bill Calling: Guests tap a button to request water, service, or a paper check",
                "Payment Roulette Gamification: Gamified check randomizer to entertain dining parties",
                "Direct ESC/POS Receipt Printing: Automatic ticket printing to kitchen and bar printers",
                "Multi-Gateway Settlement: Receive local cards, bank transfers, and crypto instantly"
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-300 leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Modernize your restaurant tables today
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Setup takes under 10 minutes. Zero credit card or hardware lock-in required.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-transform shadow-xl"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
