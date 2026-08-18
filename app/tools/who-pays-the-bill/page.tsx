import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import { WhoPaysWheel } from "@/components/who-pays-wheel";
import Link from "next/link";
import { ArrowRight, Sparkles, Trophy, Users, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Who Pays The Bill? Free Restaurant Bill Roulette & Randomizer Game | OurMenu OS",
  description: "Can't decide who pays the restaurant bill or how to split the check? Spin our free Payment Roulette wheel randomizer with your friends, dates, or colleagues.",
  keywords: [
    "who pays the bill",
    "who pays the bill randomizer",
    "who pays the bill game",
    "restaurant bill roulette",
    "payment roulette",
    "bill split randomizer",
    "split the check wheel",
    "who pays for dinner game",
    "dinner bill randomizer",
    "restaurant check roulette",
    "free bill spinner"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/tools/who-pays-the-bill",
  },
  openGraph: {
    title: "Who Pays The Bill? Free Restaurant Bill Roulette | OurMenu OS",
    description: "Spin the digital Payment Roulette wheel to settle who pays the restaurant check tonight with zero arguments.",
    url: "https://ourmenuos.online/tools/who-pays-the-bill",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Pays The Bill? Free Restaurant Bill Roulette | OurMenu OS",
    description: "Spin the digital Payment Roulette wheel to settle who pays the restaurant check tonight with zero arguments.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function WhoPaysTheBillPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://ourmenuos.online/tools/who-pays-the-bill#app",
        "name": "Who Pays The Bill? Restaurant Payment Roulette",
        "url": "https://ourmenuos.online/tools/who-pays-the-bill",
        "applicationCategory": "EntertainmentApplication, GameApplication, UtilityApplication",
        "operatingSystem": "All (Web, iOS, Android)",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "description": "A free interactive restaurant bill roulette and payment randomizer to decide who pays for dinner, drinks, or coffee among friends and dining parties.",
      },
      {
        "@type": "HowTo",
        "@id": "https://ourmenuos.online/tools/who-pays-the-bill#howto",
        "name": "How to Use the Restaurant Bill Roulette",
        "description": "Step-by-step instructions on deciding who pays the dinner check using the Payment Roulette spinner.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Add Dining Party Names",
            "text": "Enter the names of everyone at your dinner table, bar, or lunch group into the participant manager."
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Spin the Wheel",
            "text": "Tap the Spin button to trigger the animated high-suspense roulette wheel."
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Pay the Bill & Share",
            "text": "The wheel selects the payer. Share the verdict directly to WhatsApp or social media with 1 tap."
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/tools/who-pays-the-bill#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the 'Who Pays The Bill' roulette work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The game uses a cryptographically fair pseudo-random algorithm to pick one name from your dining party. Simply add 2 to 12 participants and tap 'Spin'. The wheel executes a realistic deceleration curve and stops on the chosen payer."
            }
          },
          {
            "@type": "Question",
            "name": "Is this tool completely free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! The Who Pays The Bill spinner is 100% free with no registration, download, or credit card required. It works instantly on any smartphone, tablet, or desktop browser."
            }
          },
          {
            "@type": "Question",
            "name": "Can restaurants embed Payment Roulette on their QR menus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Payment Roulette is a native feature in OurMenu OS. Restaurants, bars, and lounges can enable Payment Roulette directly on their table QR digital storefronts to entertain guests and drive viral social media buzz."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/tools/who-pays-the-bill#breadcrumb",
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
            "name": "Tools",
            "item": "https://ourmenuos.online/features"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Who Pays The Bill",
            "item": "https://ourmenuos.online/tools/who-pays-the-bill"
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

        <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Free Interactive Tool
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
              Who pays the bill? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Let the roulette decide.
              </span>
            </h1>
            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed">
              No awkward card shuffles, no 15-minute bill splitting arguments. Enter your dining party and spin the wheel.
            </p>
          </div>

          {/* Interactive Wheel Engine */}
          <WhoPaysWheel />

          {/* Value Props & SEO Content Block */}
          <section className="mt-24 pt-16 border-t border-white/10 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Why Diners & Restaurants Love Payment Roulette
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Awkwardness</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Turn the most awkward moment of dining into a thrilling gamified highlight. Everyone agrees to the wheel before spinning.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Up to 12 Players</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Add dates, coworkers, roommates, or whole birthday parties. Custom slice angles dynamically recalculate in real time.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Instant Social Proof</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Export outcomes straight to group chats on WhatsApp and X with pre-formatted bragging rights.
                </p>
              </div>
            </div>

            {/* Platform Integration Banner */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
                Run a restaurant, bar, or physical venue?
              </h3>
              <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
                OurMenu OS gives you smart QR menus with built-in Payment Roulette, instant POS orders, split payments, AI voice ordering, and kitchen display dashboards in under 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-transform shadow-xl"
                >
                  Create Storefront Free <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
                <Link
                  href="/features/restaurant-qr-menu"
                  className="px-8 py-3.5 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
                >
                  See Restaurant Features
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
