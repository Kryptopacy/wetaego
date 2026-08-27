import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Dices,
  Trophy,
  Share2,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Roulette: Gamified Restaurant Bill Randomizer | WETAEGO",
  description: "Eliminate awkward bill splitting with Payment Roulette. An interactive dining game built into smart QR menus that randomly picks who pays the check.",
  keywords: [
    "payment roulette",
    "restaurant bill roulette",
    "bill split randomizer",
    "who pays the bill game",
    "gamified dining checkout",
    "restaurant check randomizer",
    "split the bill game"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/payment-roulette",
  },
  openGraph: {
    title: "Payment Roulette: Gamified Bill Randomizer | WETAEGO",
    description: "Built-in interactive game for QR menus that lets dining parties spin to decide who pays the restaurant bill.",
    url: "https://ourmenuos.online/features/payment-roulette",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Payment Roulette: Gamified Bill Randomizer | WETAEGO",
    description: "Built-in interactive game for QR menus that lets dining parties spin to decide who pays the restaurant bill.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function PaymentRouletteFeaturePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/payment-roulette#software",
        "name": "Payment Roulette Gamification Engine",
        "applicationCategory": "BusinessApplication, EntertainmentApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Viral table-side bill randomizer integrated into digital QR menus, driving guest engagement and social media shares.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/payment-roulette#breadcrumb",
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
            "name": "Payment Roulette",
            "item": "https://ourmenuos.online/features/payment-roulette"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Dices className="w-3.5 h-3.5" /> Viral Guest Engagement
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Turn awkward check splits <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-green-400">
                into dining highlights.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Payment Roulette is the viral interactive wheel built into OurMenu OS that lets dinner tables, bar parties, and dates spin to decide who pays the check.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/tools/who-pays-the-bill"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
              >
                Play Web Demo Tool 🎲
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                Enable On Your Venue QR
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Group Dining Thrill</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Table guests enter their names directly on their mobile phones and spin the synchronized wheel with suspenseful audio and vibrations.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Organic Word-Of-Mouth</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Diners post the victory / defeat card straight to WhatsApp and social media, tagging your restaurant location.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Higher Average Spend</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Gamified table ordering encourages parties to order extra dessert or cocktails when knowing the wheel is in play.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-teal-950/60 via-zinc-900 to-emerald-950/60 border border-teal-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Bring Payment Roulette to your tables
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Toggle Payment Roulette on or off in 1 click from your venue dashboard settings.
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
