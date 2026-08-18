import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  BellRing,
  Wallet,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customer IOU Store Credit & Tab Financing Ledger | OurMenu OS",
  description: "Track customer tabs and offer in-house Buy Now Pay Later credit with risk controls, customer credit limits, and automated SMS/email payment reminders.",
  keywords: [
    "customer iou ledger",
    "restaurant tab software",
    "in house store credit system",
    "customer credit ledger software",
    "tab financing pos",
    "automated debt reminder sms",
    "retail customer credit management"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/customer-iou-financing",
  },
  openGraph: {
    title: "Customer IOU Store Credit & Tab Financing | OurMenu OS",
    description: "Manage in-house customer credit limits, track unpaid tabs, and automate reminder notifications with full risk control.",
    url: "https://ourmenuos.online/features/customer-iou-financing",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer IOU Store Credit & Tab Financing | OurMenu OS",
    description: "Manage in-house customer credit limits, track unpaid tabs, and automate reminder notifications with full risk control.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function CustomerIouFeaturePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/customer-iou-financing#software",
        "name": "OurMenu Customer IOU Tab Financing Ledger",
        "applicationCategory": "BusinessApplication, FinanceApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Risk-managed customer store credit ledger with automated balance tracking and scheduled payment reminder notifications.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/customer-iou-financing#breadcrumb",
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
            "name": "Customer IOU Financing",
            "item": "https://ourmenuos.online/features/customer-iou-financing"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
              <CreditCard className="w-3.5 h-3.5" /> Customer Credit & Retention
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Offer trusted store credit. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300">
                Without the debt risk.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Extend credit tabs to VIP regulars, manage strict credit ceilings, generate customer payment links, and send automated WhatsApp/SMS debt reminders.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Start IOU Ledger Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Custom Credit Limits</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Define individual credit ceilings per customer. Checkout stops further IOU tabs once the limit is reached.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1-Tap Repayment Links</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Customers receive a personalized payment link via SMS/WhatsApp to settle balances with card or transfer in seconds.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automated Reminders</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Scheduled automated cron notifications gently alert customers when their tab repayment is due.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-orange-950/60 via-zinc-900 to-amber-950/60 border border-orange-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Turn regular customers into loyal VIPs
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Manage in-house store credit with total confidence on OurMenu OS.
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
