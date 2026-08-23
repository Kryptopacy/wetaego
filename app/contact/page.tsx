import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, MessageSquare, Clock, ShieldAlert, ArrowRight } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'

export const metadata: Metadata = {
  title: 'Contact Us & Support | OurMenu OS',
  description: 'Get in touch with the OurMenu OS team for customer support, enterprise franchise sales, partnership opportunities, and technical developer assistance.',
  alternates: {
    canonical: 'https://ourmenuos.online/contact',
  },
}

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact OurMenu OS",
    "description": "Official contact channels, email addresses, phone lines, and physical office location for OurMenu OS.",
    "url": "https://ourmenuos.online/contact",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://ourmenuos.online/#organization",
      "name": "OurMenu OS",
      "legalName": "OurMenu OS by CRUISEHQ LTD",
      "url": "https://ourmenuos.online",
      "email": "support@ourmenuos.online",
      "telephone": "+234-800-687-6368",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+234-800-687-6368",
          "contactType": "customer support",
          "email": "support@ourmenuos.online",
          "availableLanguage": ["English", "Spanish", "French", "Yoruba", "Igbo", "Hausa"],
          "areaServed": "Global"
        },
        {
          "@type": "ContactPoint",
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
      }
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
        <section className="pt-36 pb-16 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <MessageSquare className="w-3.5 h-3.5" /> Official Channels
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            We are here to assist your operation.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Have a question about deploying OurMenu OS, integrating hardware thermal printers, or onboarding an enterprise supermarket fleet? Reach our direct response channels below.
          </p>
        </section>

        {/* Contact Cards Grid */}
        <section className="pb-24 px-6 max-w-5xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Customer Support */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Customer Support</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  For merchant account support, digital menu configuration, billing queries, and general platform help.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <a
                  href="mailto:support@ourmenuos.online"
                  className="text-emerald-400 font-bold text-sm hover:underline block"
                >
                  support@ourmenuos.online
                </a>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Avg response: &lt; 24h
                </span>
              </div>
            </div>

            {/* Card 2: Enterprise & Partnerships */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Phone className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Enterprise & Fleet Sales</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  For multi-branch supermarket chains, restaurant groups, custom POS integrations, and reseller programs.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <a
                  href="mailto:partners@ourmenuos.online"
                  className="text-blue-400 font-bold text-sm hover:underline block"
                >
                  partners@ourmenuos.online
                </a>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Dedicated account manager
                </span>
              </div>
            </div>

            {/* Card 3: Developer & Security */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Security & API Support</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  For API integrations, webhook troubleshooting, MCP tools, and responsible security vulnerability disclosures.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <a
                  href="mailto:security@ourmenuos.online"
                  className="text-rose-400 font-bold text-sm hover:underline block"
                >
                  security@ourmenuos.online
                </a>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Priority triage: &lt; 12h
                </span>
              </div>
            </div>

          </div>

          {/* Physical Address & Company Details */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2.5">
                  <MapPin className="w-6 h-6 text-emerald-400" /> Headquarters & Physical Presence
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Our core engineering and business development team operates from Lagos, Nigeria, serving venues globally across Africa, Europe, North America, and Asia.
                </p>
                <div className="space-y-2 text-sm text-zinc-300">
                  <p><strong className="text-white">Address:</strong> 12 Admiralty Way, Lekki Phase 1, Lagos, 105102, Nigeria</p>
                  <p><strong className="text-white">Phone:</strong> +234-800-OUR-MENU (+234-800-687-6368)</p>
                  <p><strong className="text-white">Hours:</strong> Monday – Friday, 8:00 AM – 6:00 PM WAT (24/7 Incident Escalation)</p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Trust & Compliance Quick Links</h3>
                <ul className="space-y-2.5 text-sm text-zinc-400">
                  <li>
                    <Link href="/about" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                      <span>About Our Company & Architecture</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                      <span>Privacy Policy (NDPR & GDPR)</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                      <span>Terms of Service</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                      <span>Developer & API Documentation</span>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </section>
      </main>
    </>
  )
}
