import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  UtensilsCrossed,
  Store,
  CalendarCheck,
  ShoppingBag,
  FileSpreadsheet,
  Building2,
  Bot,
  Dices,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  Users,
  Radio,
} from "lucide-react";

export const metadata: Metadata = {
  title: "All Features & Industry Operating Solutions | WETAEGO",
  description: "Explore the comprehensive business operating platform for hospitality, supermarket chains, salons, retail boutiques, consultants, real estate, and automotive dealerships.",
  keywords: [
    "wetaego features",
    "hospitality operating system",
    "supermarket fleet pos",
    "qr menu ordering software",
    "salon booking software",
    "retail boutique ecommerce",
    "digital rate cards",
    "real estate showroom",
    "tego multimodal ai",
    "esc pos web printing",
    "payment roulette",
    "customer iou financing"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features",
  },
  openGraph: {
    title: "All Features & Industry Solutions | WETAEGO",
    description: "Explore the 9 industry templates, AI copilot, POS hardware drivers, and viral growth tools powering modern physical businesses.",
    url: "https://ourmenuos.online/features",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Features & Industry Solutions | WETAEGO",
    description: "Explore the 9 industry templates, AI copilot, POS hardware drivers, and viral growth tools powering modern physical businesses.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

const FEATURE_MODULES = [
  {
    title: "Restaurant QR Digital Menu & Table Ordering",
    slug: "/features/restaurant-qr-menu",
    icon: UtensilsCrossed,
    color: "emerald",
    tag: "Hospitality",
    desc: "Self-ordering QR menus, split bill payments, live kitchen fulfillment boards, offline PWA caching, and waiter call buzzers.",
  },
  {
    title: "Supermarket & Multi-Branch Fleet POS",
    slug: "/features/supermarket-multi-branch-pos",
    icon: Store,
    color: "blue",
    tag: "Supermarkets & Retail Chains",
    desc: "Top-left unified branch switcher, sub-department aisles, 1-second franchise catalog duplication, and native raw ESC/POS thermal printing.",
  },
  {
    title: "Salon, Spa & Wellness Appointment Scheduling",
    slug: "/features/salon-spa-booking-system",
    icon: CalendarCheck,
    color: "pink",
    tag: "Wellness & Appointments",
    desc: "Interactive time-slot booking, deposit and partial billing, staff assignment calendars, and automated WhatsApp reminder alerts.",
  },
  {
    title: "Retail Boutiques & Gadget Store E-Commerce",
    slug: "/features/retail-boutique-ecommerce",
    icon: ShoppingBag,
    color: "amber",
    tag: "Retail & E-Commerce",
    desc: "Digital product catalogs with color/size variants, real-time stock levels, localized delivery rules, and multi-currency checkouts.",
  },
  {
    title: "Digital Rate Cards & B2B Dynamic Quotes",
    slug: "/features/rate-card-consulting-quotes",
    icon: FileSpreadsheet,
    color: "purple",
    tag: "Consultants & Creators",
    desc: "Interactive pricing tiers, media sponsorship cards, custom scope-of-work builders, and milestone deposit invoices.",
  },
  {
    title: "Real Estate & Automotive Dealership Showrooms",
    slug: "/features/real-estate-vehicle-listings",
    icon: Building2,
    color: "cyan",
    tag: "Listings & Dealerships",
    desc: "High-resolution property specs, vehicle mileage/specs galleries, virtual tour links, and instant broker WhatsApp routing.",
  },
  {
    title: "Tego AI: Multimodal Voice, Vision & Concierge",
    slug: "/features/ai-copilot-tego-multimodal",
    icon: Bot,
    color: "emerald",
    tag: "Artificial Intelligence",
    desc: "Real-time multimodal voice/vision dialogue, smartphone camera menu OCR parsing, zero-hallucination dining AI, and staff handoff.",
  },
  {
    title: "Payment Roulette & Bill Splitting Randomizer",
    slug: "/features/payment-roulette",
    icon: Dices,
    color: "teal",
    tag: "Viral Gamification",
    desc: "The viral dining game that decides who pays the bill. Boosts average check size, delights guests, and drives organic social media buzz.",
  },
  {
    title: "Customer IOU Store Credit & Tab Financing",
    slug: "/features/customer-iou-financing",
    icon: CreditCard,
    color: "orange",
    tag: "Financing & Retention",
    desc: "In-house Buy Now Pay Later tab ledger, customer credit limits, automated SMS/email debt reminders, and merchant risk controls.",
  },
  {
    title: "In-Built CRM & SMS/Email Broadcast Marketing",
    slug: "/features/hospitality-crm-customer-broadcasts",
    icon: Users,
    color: "blue",
    tag: "CRM & Retention",
    desc: "Automatic shadow profiles at checkout, guest LTV tracking, VIP tier segmentation, and targeted SMS/Email broadcast marketing.",
  },
  {
    title: "Staff Intercom & Kitchen-Floor Radio",
    slug: "/features/staff-intercom-kitchen-communication",
    icon: Radio,
    color: "emerald",
    tag: "Operations & Team",
    desc: "Zero-latency push-to-talk voice radio, kitchen-to-server ready alerts, table assistance chimes, and floor coordination.",
  },
  {
    title: "PIN-Verified Feedback & CSAT Reputation Loop",
    slug: "/features/customer-feedback-reputation-management",
    icon: ShieldCheck,
    color: "amber",
    tag: "Reputation & Team",
    desc: "Cryptographic PIN receipts for verified reviews, private grievance resolution before negative Google reviews, and staff leaderboards.",
  },
  {
    title: "Flash Deals, Happy Hours & Smart Upselling",
    slug: "/features/flash-deals-upselling-engine",
    icon: Zap,
    color: "rose",
    tag: "Revenue Optimization",
    desc: "Automated recurring happy hours, limited-quantity chef drop pricing, and AI-powered cart cross-selling prompts.",
  },
];

export default function FeaturesDirectoryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": "https://ourmenuos.online/features#itemlist",
        "name": "OurMenu OS Operating Capabilities & Solutions",
        "itemListElement": FEATURE_MODULES.map((f, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": f.title,
          "url": `https://ourmenuos.online${f.slug}`,
          "description": f.desc,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features#breadcrumb",
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
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Layers className="w-3.5 h-3.5" /> Platform Capabilities
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Everything your operation needs. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                In one unified OS.
              </span>
            </h1>
            <p className="text-base md:text-xl text-zinc-300 font-light leading-relaxed">
              Ditch fragile custom websites and expensive disconnected software. Explore our 9 specialized industry templates, AI copilot, hardware drivers, and viral customer tools.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {FEATURE_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.slug}
                  href={item.slug}
                  className="group relative bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 hover:border-emerald-500/30 rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    <span>Explore Capability</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Ready to modernize your business operations?
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Create your branded digital storefront in under 10 minutes. Zero credit card required to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-transform shadow-xl"
              >
                Start Free Workspace <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
              <Link
                href="/affiliates"
                className="px-8 py-3.5 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                Join Affiliate Program (10% Lifetime)
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
