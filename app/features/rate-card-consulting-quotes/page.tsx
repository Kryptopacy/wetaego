import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  FileSpreadsheet,
  Calculator,
  Briefcase,
  FileCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Digital Rate Cards & B2B Dynamic Quote Generator | WETAEGO",
  description: "Create interactive digital rate cards, media sponsorship packages, and custom scope-of-work quote builders for creators, agencies, and consultants.",
  keywords: [
    "digital rate card",
    "media rate card generator",
    "creator sponsorship pricing",
    "consulting quote builder",
    "b2b quote generator",
    "freelance rate sheet software",
    "agency pricing packages"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/rate-card-consulting-quotes",
  },
  openGraph: {
    title: "Digital Rate Cards & B2B Quotes | WETAEGO",
    description: "Interactive pricing tiers, media rate cards, and dynamic scope quote builders with deposit billing.",
    url: "https://ourmenuos.online/features/rate-card-consulting-quotes",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Rate Cards & B2B Quotes | WETAEGO",
    description: "Interactive pricing tiers, media rate cards, and dynamic scope quote builders with deposit billing.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function RateCardQuotesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/rate-card-consulting-quotes#software",
        "name": "WETAEGO Digital Rate Card & B2B Quote OS",
        "applicationCategory": "BusinessApplication, FinanceApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Interactive rate cards and scope quotation platform for digital creators, marketing agencies, and professional consultants.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/rate-card-consulting-quotes#breadcrumb",
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
            "name": "Rate Cards & Quotes",
            "item": "https://ourmenuos.online/features/rate-card-consulting-quotes"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Creators, Agencies & Consultants
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Ditch static PDF rate sheets. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300">
                Close high-ticket clients.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Empower sponsors, brands, and B2B clients to customize their deliverables, calculate retainer pricing in real-time, and submit retainer deposits instantly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Build Your Digital Rate Card <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dynamic Scope Builder</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Clients select deliverables (e.g. 2x TikTok videos, 1x Newsletter dedicated blast) and see pricing update instantly.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Deposit Billing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Lock in client retainers with upfront deposit invoicing via Paystack, bank transfer, or crypto (USDC/USDT).
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lead Capture Pipeline</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Inquiries and project proposals land directly on your dashboard with complete client contact info and project requirements.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-purple-950/60 via-zinc-900 to-indigo-950/60 border border-purple-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Level up your client quotation workflow
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Impress brands and enterprise clients with a modern interactive digital rate card.
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
