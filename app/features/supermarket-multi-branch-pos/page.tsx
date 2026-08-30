import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Store,
  Printer,
  Copy,
  Layers,
  MapPin,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Supermarket POS & Multi-Branch Retail Fleet Management | WETAEGO",
  description: "Enterprise multi-branch fleet management for supermarkets, grocery stores, and retail chains. Top-left branch switcher, 1-second franchise catalog duplication, and native raw ESC/POS thermal printing.",
  keywords: [
    "supermarket pos software",
    "multi branch retail management",
    "retail chain fleet pos",
    "esc pos thermal receipt printing web",
    "franchise catalog duplication",
    "supermarket aisle software",
    "grocery store pos",
    "multi location inventory management"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/supermarket-multi-branch-pos",
  },
  openGraph: {
    title: "Supermarket POS & Multi-Branch Retail Fleet Management | WETAEGO",
    description: "Run retail chains and supermarkets with unified branch switching, sub-department aisles, instant franchise cloning, and raw ESC/POS thermal printing.",
    url: "https://ourmenuos.online/features/supermarket-multi-branch-pos",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supermarket POS & Multi-Branch Retail Fleet Management | WETAEGO",
    description: "Run retail chains and supermarkets with unified branch switching, sub-department aisles, instant franchise cloning, and raw ESC/POS thermal printing.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function SupermarketFleetPosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/supermarket-multi-branch-pos#software",
        "name": "WETAEGO Supermarket & Multi-Branch Retail Fleet OS",
        "applicationCategory": "BusinessApplication, POSApplication",
        "operatingSystem": "Web, Windows, macOS, Linux, Android, iOS",
        "description": "Enterprise retail chain operating system with cross-branch telemetry, sub-department aisle catalogs, 1-click franchise cloning, and zero-daemon raw ESC/POS thermal printing over WebUSB/WebSerial.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/features/supermarket-multi-branch-pos#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the Top-Left Unified Branch Switcher work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Headquarters and store managers can switch between '🌐 All Businesses (Global View)' (which aggregates revenue, stock pools, and staff across all physical branches) and specific branches/departments with zero page reloads."
            }
          },
          {
            "@type": "Question",
            "name": "How fast can I launch a new supermarket branch or franchise?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Using our 1-click franchise catalog duplication engine (`duplicatePageAction`), managers can recursively clone thousands of grocery SKUs, aisle categories, and tax mappings from a master store in under 1 second."
            }
          },
          {
            "@type": "Question",
            "name": "How does raw ESC/POS thermal printing work in modern browsers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our native ESC/POS bytecode engine communicates directly with receipt printers over WebUSB, WebSerial (RS232), and WebBluetooth. It triggers instant hardware paper cuts and cash drawer kicks (`ESC p`) with zero desktop software or print dialogs."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/supermarket-multi-branch-pos#breadcrumb",
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
            "name": "Supermarket Fleet POS",
            "item": "https://ourmenuos.online/features/supermarket-multi-branch-pos"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Store className="w-3.5 h-3.5" /> Enterprise Multi-Branch Retail OS
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Scale retail chains. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-400">
                Manage 50+ stores in 1 tab.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Unify physical branches, sub-department aisles (Bakery, Butchery, Pharmacy), 1-second franchise catalog duplication, and native raw ESC/POS thermal printing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Launch Supermarket Fleet Free <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
              <Link
                href="/llms-full.txt"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Read Architecture Specs
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Top-Left Unified Switcher</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Toggle between global multi-store aggregate telemetry and local branch views with zero page reloads.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Copy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1-Second Franchise Cloning</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Opening a new branch in a new city? Recursively duplicate 5,000+ SKUs and department structures in under 1 second.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Raw ESC/POS Thermal Driver</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Direct binary receipt printing via WebUSB, WebSerial (RS232), and Bluetooth with instant cash drawer kick pulses.
              </p>
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 mb-24">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-8 text-center">
              Engineered for Enterprise Supermarkets & Multi-Branch Retail
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Departmental Pages: Separate Bakery, Butchery, Fresh Produce, and Electronics under one brand portal",
                "Granular Store RBAC: Store managers restricted cryptographically to their designated branch",
                "Localized Currency & Tax: Configure independent VAT/consumption tax and currency codes per region",
                "Barcode & SKU Lookups: Instant search across tens of thousands of products with zero latency",
                "Desk Pay Cashier Lock: Dedicated hardware terminal locking mode (?terminal=res_xxx) for cash registers",
                "Offline Queue Sync: Keep processing transactions at the checkout register even during network blackouts"
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-300 leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-blue-950/60 via-zinc-900 to-indigo-950/60 border border-blue-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Scale your retail footprint with WETAEGO
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Experience the multi-branch operating layer trusted by forward-thinking supermarkets and retail chains.
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
