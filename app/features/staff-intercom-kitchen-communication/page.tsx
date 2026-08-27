import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Radio,
  Volume2,
  Headphones,
  ChefHat,
  BellRing,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Intercom, Workstation Dispatch & Floor Communication | WETAEGO",
  description: "Eliminate floor chaos with real-time staff intercom, kitchen-to-server alerts, push-to-talk audio radio, and table escalation dispatching.",
  keywords: [
    "restaurant staff intercom",
    "kitchen to server communication",
    "hospitality push to talk",
    "kitchen display system intercom",
    "restaurant floor communication software",
    "workstation dispatch pos"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/staff-intercom-kitchen-communication",
  },
  openGraph: {
    title: "Staff Intercom & Kitchen-Floor Communication | WETAEGO",
    description: "Zero-latency WebSocket intercom, push-to-talk radio, and kitchen dispatch for high-traffic restaurants and venues.",
    url: "https://ourmenuos.online/features/staff-intercom-kitchen-communication",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Staff Intercom & Kitchen-Floor Communication | WETAEGO",
    description: "Zero-latency WebSocket intercom, push-to-talk radio, and kitchen dispatch for high-traffic restaurants and venues.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function StaffIntercomPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/staff-intercom-kitchen-communication#software",
        "name": "WETAEGO Staff Intercom & Workstation Dispatch OS",
        "applicationCategory": "BusinessApplication, CommunicationApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Real-time internal staff intercom and departmental workstation dispatching for kitchens, bars, and floor teams.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/staff-intercom-kitchen-communication#breadcrumb",
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
            "name": "Staff Intercom",
            "item": "https://ourmenuos.online/features/staff-intercom-kitchen-communication"
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
              <Radio className="w-3.5 h-3.5" /> Real-Time Floor Operations
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Connect kitchen, bar & floor. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Zero yelling. Zero delays.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Enable push-to-talk voice radio, instant dish-ready alerts, and table assistance chimes directly across your staff devices with zero extra hardware.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Enable Staff Intercom Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Kitchen to Server Dispatch</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Chefs tap "Order Ready" on the KDS and assigned table servers receive instant audio alerts on their phones or smartwatches.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Push-To-Talk Audio</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                High-speed voice radio lets hosts, bartenders, and managers coordinate table turns and 86'd items hands-free.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Table Request Chimes</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Guest table calls (water, cutlery, bill) flash contextually with table numbers on the active floor dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Streamline floor and kitchen communication today
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Experience the real-time intercom trusted by high-volume venues.
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
