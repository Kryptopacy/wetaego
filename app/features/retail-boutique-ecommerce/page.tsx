import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Retail Boutique & Gadget Store Digital Storefront | WETAEGO",
  description: "Sell retail products, fashion apparel, electronics, and gadgets with instant digital catalogs, inventory variants (size, color, storage), and localized delivery zones.",
  keywords: [
    "boutique ecommerce software",
    "retail store pos",
    "gadget shop digital catalog",
    "inventory variant management",
    "fashion store digital catalog",
    "online retail storefront",
    "whatsapp ordering store"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/retail-boutique-ecommerce",
  },
  openGraph: {
    title: "Retail Boutique & Gadget Store E-Commerce | WETAEGO",
    description: "Launch your boutique digital catalog with color/size variants, stock counts, and instant payment links.",
    url: "https://ourmenuos.online/features/retail-boutique-ecommerce",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Retail Boutique & Gadget Store E-Commerce | WETAEGO",
    description: "Launch your boutique digital catalog with color/size variants, stock counts, and instant payment links.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function RetailBoutiquePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/retail-boutique-ecommerce#software",
        "name": "WETAEGO Retail Boutique & Digital Storefront OS",
        "applicationCategory": "BusinessApplication, ShoppingApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Dynamic digital storefront for retail boutiques, fashion designers, and gadget shops with inventory variant tracking, local delivery pricing, and instant checkout.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/retail-boutique-ecommerce#breadcrumb",
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
            "name": "Retail Boutiques",
            "item": "https://ourmenuos.online/features/retail-boutique-ecommerce"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
              <ShoppingBag className="w-3.5 h-3.5" /> Retail & Boutique E-Commerce
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Sell retail inventory. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-300">
                In-store and online.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Showcase fashion collections, electronics, or cosmetics with high-definition image galleries, variant selectors (sizes, colors, specs), live stock badges, and direct delivery checkouts.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Launch Retail Storefront <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Attribute Variants</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Manage clothing sizes (S, M, L, XL), phone storage specs (128GB, 256GB), and colorways seamlessly on single product cards.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Local Delivery Rules</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Configure delivery fees, minimum order thresholds, and neighborhood notes with instant WhatsApp order dispatch.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Stock Alerts</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Mark items 'Available', 'Low Stock', or 'Sold Out' in 1 click from your mobile phone or dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-yellow-950/60 border border-amber-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Start selling your retail inventory today
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Transform your physical boutique or online shop with WETAEGO.
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
