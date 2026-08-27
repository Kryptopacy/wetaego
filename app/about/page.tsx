import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Cpu, Building2, Store, Users, Zap } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'

export const metadata: Metadata = {
  title: 'About Us | WETAEGO',
  description: 'Learn about WETAEGO, our mission, leadership, multi-business operating system architecture, and hardware-native technology for modern brands, human customers, and AI agents.',
  alternates: {
    canonical: 'https://ourmenuos.online/about',
  },
}

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About WETAEGO",
    "description": "Comprehensive overview of WETAEGO mission, architecture, and company background.",
    "url": "https://ourmenuos.online/about",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://ourmenuos.online/#organization",
      "name": "WETAEGO",
      "legalName": "WETAEGO by CRUISEHQ LTD",
      "url": "https://ourmenuos.online",
      "logo": "https://ourmenuos.online/ourmenu-qr-logo.png",
      "email": "support@ourmenuos.online",
      "telephone": "+234-800-687-6368",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+234-800-687-6368",
          "contactType": "customer service",
          "email": "support@ourmenuos.online",
          "availableLanguage": ["English", "Spanish", "French", "Yoruba", "Igbo", "Hausa"],
          "areaServed": "Global"
        },
        {
          "@type": "ContactPoint",
          "telephone": "+234-800-687-6368",
          "contactType": "sales",
          "email": "partners@ourmenuos.online",
          "availableLanguage": ["English"],
          "areaServed": "Global"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "12 Admiralty Way, Lekki Phase 1",
        "addressLocality": "Lagos",
        "addressRegion": "Lagos State",
        "postalCode": "105102",
        "addressCountry": "NG"
      },
      "sameAs": [
        "https://github.com/Kryptopacy/ourmenuos",
        "https://twitter.com/ourmenuos"
      ]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#050505] min-h-screen text-zinc-300 selection:bg-emerald-500/30 selection:text-white">
        <LandingNavbar />

        {/* Hero Section */}
        <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Zap className="w-3.5 h-3.5" /> Our Mission & Architecture
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Building the Commerce & Service Operating System for Modern Brands.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            WETAEGO was built on a simple conviction: modern brands should not have to stitch together five incompatible software vendors to run digital ordering, hardware printing, staff coordination, and autonomous AI agents.
          </p>
        </section>

        {/* Main Content Body */}
        <section className="pb-24 px-6 max-w-4xl mx-auto space-y-16 text-lg font-light leading-relaxed">
          
          {/* Section 1: The Problem We Solve */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Store className="w-7 h-7 text-emerald-400" />
              1. The Fragmented Commerce Problem
            </h2>
            <p className="text-zinc-300">
              For decades, restaurants, supermarkets, salons, boutiques, and agencies have been trapped between two bad extremes: expensive, rigid custom web development costing thousands of dollars, or clunky legacy POS terminals locked to proprietary desktop hardware.
            </p>
            <p className="text-zinc-400">
              When a guest scans a QR code, they often encounter terrible unzoomable PDF files or slow apps demanding personal logins. When managers want to replicate catalogs across new branches, it takes weeks of manual re-entry. WETAEGO eliminates this friction with a unified, browser-native progressive operating system that works instantly on any device.
            </p>
          </div>

          {/* Section 2: Architectural Innovations */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-7 h-7 text-emerald-400" />
              2. Core Technological Innovations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">Direct ESC/POS Hardware Printing</h3>
                <p className="text-sm text-zinc-400">
                  We engineered a native binary bytecode engine running in the browser that communicates directly with thermal receipt printers over WebUSB, WebSerial (RS232 COM), and WebBluetooth. No background print daemons or operating system print dialogs required.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">Tego Multimodal Live AI</h3>
                <p className="text-sm text-zinc-400">
                  Powered by real-time multimodal live voice and vision intelligence, Tego offers two-way low-latency voice dialogue and 1 FPS camera video ingestion. Store managers point a camera at handwritten menus or store shelves to generate structured catalog databases in seconds.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">1-Second Franchise Replication</h3>
                <p className="text-sm text-zinc-400">
                  Our recursive catalog duplication engine allows supermarket chains and restaurant franchises to clone entire branch structures, collections, and price tiers to new locations in under 1,000 milliseconds.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">Zero-Hallucination Concierge</h3>
                <p className="text-sm text-zinc-400">
                  The frontline guest AI assistant is strictly sandboxed to verified database records. If a guest asks for an unlisted item, the system triggers instant staff handoff chimes rather than fabricating answers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Company & Operational Legitimacy */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-emerald-400" />
              3. Organization, Governance & Security
            </h2>
            <p className="text-zinc-300">
              WETAEGO is engineered by CRUISEHQ LTD, a technology venture studio building high-availability cloud and offline-first infrastructure for emerging markets and global commerce.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm text-zinc-400">
              <div>
                <strong className="text-white block mb-1">Headquarters</strong>
                12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria
              </div>
              <div>
                <strong className="text-white block mb-1">Customer Support SLA</strong>
                24/7 Monitoring with under 24h standard response time
              </div>
              <div>
                <strong className="text-white block mb-1">Compliance</strong>
                NDPR & GDPR Compliant Data Governance
              </div>
              <div>
                <strong className="text-white block mb-1">Financial Settlement</strong>
                PCI-DSS Level 1 Compliant Gateway Infrastructure
              </div>
            </div>
          </div>

          {/* Navigation CTA */}
          <div className="pt-8 text-center border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Explore Our Platform?</h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/features"
                className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
              >
                Browse All Features <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full bg-white/10 border border-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                Get in Touch
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 rounded-full bg-white/10 border border-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                Developer Docs
              </Link>
            </div>
          </div>

        </section>
      </main>
    </>
  )
}
