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
  title: "Restaurant QR Digital Menu & Table Ordering System | OurMenu OS",
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
    title: "Restaurant QR Digital Menu & Table Ordering | OurMenu OS",
    description: "Instant contactless ordering, split payments, live kitchen fulfillment, and zero PDF menus.",
    url: "https://ourmenuos.online/features/restaurant-qr-menu",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant QR Digital Menu & Table Ordering | OurMenu OS",
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
        "name": "OurMenu Restaurant QR Menu & Ordering System",
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
            "name": "How does OurMenu OS replace static PDF menus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Unlike terrible pinch-and-zoom PDF menus, OurMenu OS renders an interactive, lightning-fast digital storefront with dietary allergen filters, high-resolution food imagery, live modifier options, and 1-tap table ordering."
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
              "text": "Yes! OurMenu OS is built as an offline-first Progressive Web App (PWA). Carts are persisted locally in IndexedDB and queued mutations sync automatically once connection is restored."
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

        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Hospitality Operating Layer
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Ditch terrible PDF menus. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Run intelligent table dining.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Give your guests an instant, visual digital menu that lets them customize modifiers, split checks, request waiter assistance, and pay via card, bank transfer, or crypto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Launch Restaurant Menu Free <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
              <Link
                href="/tools/who-pays-the-bill"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Try Payment Roulette 🎲
              </Link>
            </div>
          </div>

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
              Why Top Restaurants Choose OurMenu OS
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
