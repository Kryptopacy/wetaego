import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNavbar } from '@/components/LandingNavbar'
import { ShieldCheck, Lock, Globe, FileText, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | WETAEGO',
  description: 'How we collect, protect, and process data at WETAEGO in compliance with NDPR and GDPR regulations.',
  alternates: {
    canonical: 'https://ourmenuos.online/privacy',
  },
}

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy — WETAEGO",
    "description": "How WETAEGO protects merchant and customer data under NDPR and GDPR frameworks.",
    "url": "https://ourmenuos.online/privacy",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://ourmenuos.online/#organization",
      "name": "WETAEGO",
      "legalName": "WETAEGO by CRUISEHQ LTD",
      "url": "https://ourmenuos.online",
      "logo": "https://ourmenuos.online/ourmenu-qr-logo.png",
      "email": "privacy@ourmenuos.online",
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
          "contactType": "data protection officer",
          "email": "privacy@ourmenuos.online",
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
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-emerald-500/30 selection:text-white pb-24 pt-36 px-6">
        <LandingNavbar />
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Legal & Data Protection
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-500 mb-12">Effective Date: June 2026 • Version 2.4 (NDPR & GDPR Compliant)</p>
          
          <div className="space-y-12 text-lg font-light leading-relaxed">
            <section className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-10 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-400" />
                1. Introduction & Regulatory Framework
              </h2>
              <p className="text-zinc-300">
                WETAEGO (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides a cloud-based operating system and digital storefront platform for restaurants, supermarkets, spas, salons, retail boutiques, and B2B services. We are dedicated to maintaining the highest levels of privacy and data security for both businesses using our platform (Merchants) and guests who interact with digital storefronts (End-Users).
              </p>
              <p className="text-zinc-400 text-base">
                This Privacy Policy is designed to comply with the <strong>Nigerian Data Protection Act / NDPR</strong> and the international <strong>General Data Protection Regulation (GDPR)</strong>.
              </p>
            </section>

            <section className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-10 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-emerald-400" />
                2. Categories of Data We Process
              </h2>
              <p className="text-zinc-300">
                <strong>A. From Merchants & Operators:</strong> Account credentials, business registration names, official phone numbers, payout bank subaccount numbers (via Paystack), physical store addresses, item catalog specifications, and staff access roles.
              </p>
              <p className="text-zinc-300">
                <strong>B. From End-Users & Storefront Guests:</strong> Table identifiers, order selections, appointment time preferences, and optional email addresses for electronic receipt delivery (E-Slips). We do NOT store credit card numbers; payment data is handled via PCI-DSS certified gateways.
              </p>
            </section>

            <section className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-10 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-400" />
                3. Artificial Intelligence & Zero Training on User PII
              </h2>
              <p className="text-zinc-300">
                WETAEGO features Tego Multimodal AI (powered by Google Gemini 3.1 Flash Live). We maintain a strict data boundary:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-base">
                <li>End-user personal information and payment details are <strong>never</strong> used to train public or commercial foundation models.</li>
                <li>Camera video feeds ingested for menu parsing are processed ephemerally in server RAM and immediately discarded once catalog items are extracted.</li>
                <li>Voice audio streams sent during Gemini Live sessions are transmitted securely over encrypted WebSockets and are not permanently archived.</li>
              </ul>
            </section>

            <section className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-10 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">4. Your Data Rights & Contact Information</h2>
              <p className="text-zinc-300">
                Under NDPR and GDPR, you have the right to request access to your data, demand correction, or request complete deletion (&quot;Right to be Forgotten&quot;).
              </p>
              <p className="text-zinc-400 text-base">
                To exercise any privacy rights, reach our designated Data Protection Officer directly at <a href="mailto:privacy@ourmenuos.online" className="text-emerald-400 underline font-medium">privacy@ourmenuos.online</a> or visit our <Link href="/contact" className="text-emerald-400 underline font-medium">Contact Page</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
