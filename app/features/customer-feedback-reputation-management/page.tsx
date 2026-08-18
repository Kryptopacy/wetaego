import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Trophy,
  MessageSquareCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Feedback & CSAT Reputation Management | OurMenu OS",
  description: "Capture verified post-dining feedback with cryptographic PIN receipts, resolve customer grievances privately before negative reviews hit Google, and track team tip leaderboards.",
  keywords: [
    "restaurant feedback software",
    "csat hospitality management",
    "verified customer reviews",
    "pin receipt feedback loop",
    "staff tip performance leaderboard",
    "prevent negative google reviews restaurant",
    "customer satisfaction software"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/customer-feedback-reputation-management",
  },
  openGraph: {
    title: "Customer Feedback & CSAT Reputation Loop | OurMenu OS",
    description: "PIN-verified customer reviews, private grievance resolution, and gamified staff performance tracking.",
    url: "https://ourmenuos.online/features/customer-feedback-reputation-management",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Feedback & CSAT Reputation Loop | OurMenu OS",
    description: "PIN-verified customer reviews, private grievance resolution, and gamified staff performance tracking.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function CustomerFeedbackPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/customer-feedback-reputation-management#software",
        "name": "OurMenu Customer Feedback & CSAT Engine",
        "applicationCategory": "BusinessApplication, ReputationManagementApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Cryptographically verified post-order customer feedback loop, automated private manager alerts, and gamified team performance analytics.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/customer-feedback-reputation-management#breadcrumb",
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
            "name": "Feedback & CSAT",
            "item": "https://ourmenuos.online/features/customer-feedback-reputation-management"
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
              <Star className="w-3.5 h-3.5" /> Verified Reputation Management
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Intercept negative reviews. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-300">
                Reward star staff.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Capture authentic dining feedback with cryptographic PIN-verified receipts, resolve service issues privately before they hit Google or Yelp, and motivate your team with live performance rankings.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Protect Your Venue Reputation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">PIN-Verified E-Slips</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Only verified paying diners receive the 4-digit PIN on their digital receipt, blocking fake reviews and competitor trolling.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <MessageSquareCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Private Resolution Flow</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Unhappy guests trigger immediate private alerts to the manager on duty to issue apologies or vouchers before public reviews happen.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Staff Leaderboards</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Gamified rankings show which servers deliver the highest CSAT scores, fastest table turns, and biggest tips.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-yellow-950/60 border border-amber-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Turn guest feedback into higher revenue
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Protect your brand reputation and incentivize excellence across your frontline team.
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
