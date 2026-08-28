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
  Package,
  QrCode,
  RefreshCw,
  Server
} from "lucide-react";

export const metadata: Metadata = {
  title: "All Features & Industry Operating Solutions | WETAEGO",
  description: "Explore the comprehensive business operating platform for hospitality, supermarket chains, salons, retail boutiques, consultants, real estate, hardware POS, and WebMCP autonomous agent commerce.",
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
    "webmcp agent commerce",
    "staff mcp server",
    "payment roulette",
    "customer iou financing",
    "pos telemetry ingestion"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features",
  },
  openGraph: {
    title: "All Features & Industry Solutions | WETAEGO",
    description: "Explore the 9 industry templates, WebMCP agent commerce suite, POS hardware drivers, and viral growth tools powering modern physical businesses.",
    url: "https://ourmenuos.online/features",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Features & Industry Solutions | WETAEGO",
    description: "Explore the 9 industry templates, WebMCP agent commerce suite, POS hardware drivers, and viral growth tools powering modern physical businesses.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

const FEATURE_MODULES = [
  // ── 1. Commercial Industry Engines ──
  {
    title: "Restaurant QR Digital Menu & Table Ordering",
    slug: "/features/restaurant-qr-menu",
    icon: UtensilsCrossed,
    color: "emerald",
    tag: "Hospitality & Dining",
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
    tag: "Retail & Variants",
    desc: "Digital product catalogs with color/size/spec variant matrices, real-time stock levels, localized delivery rules, and multi-currency checkouts.",
  },
  {
    title: "Digital Rate Cards & B2B Dynamic Quotes",
    slug: "/features/rate-card-consulting-quotes",
    icon: FileSpreadsheet,
    color: "purple",
    tag: "Consultants & Creators",
    desc: "Interactive pricing tiers, media sponsorship cards, custom scope-of-work builders, and 2-tap milestone deposit invoices.",
  },
  {
    title: "Real Estate & Automotive Dealership Showrooms",
    slug: "/features/real-estate-vehicle-listings",
    icon: Building2,
    color: "cyan",
    tag: "Listings & Dealerships",
    desc: "High-resolution property specs, vehicle mileage/specs galleries, virtual tour links, and instant broker WhatsApp routing.",
  },

  // ── 2. Hardware & Point of Sale Suite ──
  {
    title: "Driverless Web ESC/POS Thermal Receipt Printing",
    slug: "/features/driverless-escpos-thermal-printing",
    icon: Printer,
    color: "emerald",
    tag: "Hardware & POS",
    desc: "Direct binary printing over WebUSB, WebSerial (RS232 COM), and WebBluetooth. Hardware paper cuts and cash drawer kick (ESC p) with zero daemons.",
  },
  {
    title: "High-Speed Counter POS & Barcode Scanner",
    slug: "/features/counter-pos-barcode-scanner",
    icon: Zap,
    color: "amber",
    tag: "Point of Sale",
    desc: "Lightning-fast counter checkout with USB/Camera barcode scanning, custom line items, split cash/card payments, and instant cash drawer kick.",
  },
  {
    title: "Branded Vector QR Code & Table Signage Studio",
    slug: "/features/qr-code-signage-generator",
    icon: QrCode,
    color: "teal",
    tag: "Signage & QR",
    desc: "Generate high-resolution vector SVG and PNG QR codes with embedded brand logos, table/room/desk target routing, and print-ready card layouts.",
  },
  {
    title: "Enterprise Multi-Branch Fleet Management",
    slug: "/features/multi-branch-fleet-management",
    icon: Layers,
    color: "blue",
    tag: "Fleet Management",
    desc: "Unified switcher across 2 to 100+ branches, 1-second atomic catalog cloning (duplicatePageAction), and localized tax/currency management.",
  },
  {
    title: "Bill of Materials (BOM) & Inventory Tracking",
    slug: "/features/inventory-bom-tracking",
    icon: Package,
    color: "rose",
    tag: "Inventory & BOM",
    desc: "Map finished items to raw ingredients. Automatic ingredient decrement per sale, low-stock threshold alerts, and supplier reorder sheets.",
  },

  // ── 3. AI & Agent-Native Infrastructure ──
  {
    title: "WebMCP In-Browser Autonomous Agent Commerce",
    slug: "/features/webmcp-agentic-commerce",
    icon: Bot,
    color: "emerald",
    tag: "WebMCP Protocol",
    desc: "Canonical 8-tool client-side commerce suite on document.modelContext with an architectural Human-in-the-Loop Safe Payment Gate.",
  },
  {
    title: "Staff MCP Server & Enterprise Fleet Automation",
    slug: "/features/staff-mcp-automation",
    icon: Server,
    color: "blue",
    tag: "Staff MCP Server",
    desc: "Bearer-authenticated JSON-RPC 2.0 endpoint at /api/mcp for Claude Desktop, ChatGPT, and bots to automate orders, KDS, and daily audits.",
  },
  {
    title: "Tego AI: Multimodal Voice, Vision & Concierge",
    slug: "/features/ai-copilot-tego-multimodal",
    icon: Sparkles,
    color: "emerald",
    tag: "Artificial Intelligence",
    desc: "Real-time multimodal voice/vision dialogue, smartphone camera menu OCR parsing, zero-hallucination dining AI, and staff handoff.",
  },

  // ── 4. Growth, Finance & Operations ──
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
        "name": "WETAEGO Platform Operating Capabilities & Solutions",
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
                In one modular operating system.
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
              Explore 20 specialized engines covering storefront commerce, driverless ESC/POS printing, WebMCP agent protocols, and multi-branch operations.
            </p>
          </div>

          {/* Grid of All Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_MODULES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.slug}
                  className="group relative flex flex-col justify-between p-8 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/20 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-zinc-400 text-sm font-light leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    Explore Solution <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA Footer */}
          <div className="mt-24 p-10 md:p-14 rounded-3xl bg-gradient-to-br from-zinc-900/80 via-black to-emerald-950/30 border border-white/10 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Ready to modernize your business infrastructure?
            </h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto font-light">
              Launch in under 10 minutes. No specialized hardware required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                href="/m/demo"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Explore Live Demo
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
