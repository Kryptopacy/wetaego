import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Building2,
  Car,
  Camera,
  MapPin,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Real Estate & Automotive Dealership Digital Showroom | WETAEGO",
  description: "Showcase property listings, luxury apartments, and vehicle dealership inventory with high-resolution specs, virtual tour links, and instant WhatsApp broker routing.",
  keywords: [
    "real estate listing software",
    "car dealership digital showroom",
    "vehicle inventory software",
    "property showcase website",
    "broker whatsapp lead capture",
    "automotive inventory management"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/real-estate-vehicle-listings",
  },
  openGraph: {
    title: "Real Estate & Automotive Showroom | WETAEGO",
    description: "High-resolution property specs, vehicle mileage/specs galleries, virtual tour links, and instant broker WhatsApp routing.",
    url: "https://ourmenuos.online/features/real-estate-vehicle-listings",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate & Automotive Showroom | WETAEGO",
    description: "High-resolution property specs, vehicle mileage/specs galleries, virtual tour links, and instant broker WhatsApp routing.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function RealEstateVehiclesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/real-estate-vehicle-listings#software",
        "name": "WETAEGO Real Estate & Automotive Showroom OS",
        "applicationCategory": "BusinessApplication, RealEstateApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Comprehensive digital showroom for real estate developers, property managers, and automotive car dealerships.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/real-estate-vehicle-listings#breadcrumb",
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
            "name": "Real Estate & Vehicles",
            "item": "https://ourmenuos.online/features/real-estate-vehicle-listings"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Building2 className="w-3.5 h-3.5" /> Real Estate & Automotive Showroom
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Showcase high-value assets. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                Capture high-intent buyers.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Present luxury properties, rental units, and vehicle dealership inventory with structured spec tables, virtual video tours, and instant 1-tap WhatsApp broker inquiry routing.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Launch Digital Showroom <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">High-Resolution Galleries</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Full-screen photo swipe galleries and video tour embeds optimized for mobile buyers.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Broker WhatsApp</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Direct lead capture routing inquiries to assigned sales agents with asset details pre-filled.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Structured Asset Specs</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Display mileage, transmission, bedrooms, square footage, and pricing tiers in clean, readable badge arrays.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-blue-950/60 border border-cyan-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Modernize your property or dealership inventory
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Get your digital showroom live today in under 10 minutes.
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
