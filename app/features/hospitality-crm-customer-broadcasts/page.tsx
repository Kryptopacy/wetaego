import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Users,
  Radio,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Mail,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "In-Built CRM, Customer Shadow Profiles & SMS/Email Broadcasts | OurMenu OS",
  description: "Turn one-off guests into high-LTV regulars with automatic CRM shadow profiles, lifetime spend analytics, and targeted SMS & Email marketing broadcasts.",
  keywords: [
    "hospitality crm",
    "restaurant crm software",
    "customer shadow profiles",
    "sms marketing restaurant",
    "email broadcast hospitality",
    "guest lifetime value tracking",
    "restaurant customer retention",
    "customer communication software"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts",
  },
  openGraph: {
    title: "Hospitality CRM & Customer Broadcasts | OurMenu OS",
    description: "Automatic shadow profiles at checkout, LTV tracking, and targeted SMS & Email broadcast marketing for restaurants and physical venues.",
    url: "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hospitality CRM & Customer Broadcasts | OurMenu OS",
    description: "Automatic shadow profiles at checkout, LTV tracking, and targeted SMS & Email broadcast marketing for restaurants and physical venues.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function HospitalityCrmPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts#software",
        "name": "OurMenu In-Built CRM & Customer Broadcast Engine",
        "applicationCategory": "BusinessApplication, MarketingApplication, CRMApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Comprehensive customer relationship management and broadcast communication suite designed specifically for physical hospitality, retail, and appointment businesses.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How are customer shadow profiles created automatically?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Every time a customer places an order, books an appointment, or requests an e-receipt, OurMenu OS automatically aggregates their visit history, average check size, dietary preferences, and total lifetime spend into a unified shadow profile without requiring friction-filled app downloads."
            }
          },
          {
            "@type": "Question",
            "name": "Can I broadcast SMS and email campaigns to specific customer segments?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! From the Customers Dashboard, you can filter guests by total spend, visit recency (e.g. haven't visited in 30 days), or top VIP status, and broadcast targeted SMS or Email promotions in 1 click."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts#breadcrumb",
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
            "name": "CRM & Broadcasts",
            "item": "https://ourmenuos.online/features/hospitality-crm-customer-broadcasts"
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
              <Users className="w-3.5 h-3.5" /> Built-In CRM & Marketing Suite
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Know your guests. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-400">
                Drive repeat visits.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Automatically build rich guest profiles at checkout, track Lifetime Value (LTV), segment your most valuable VIPs, and broadcast high-converting SMS and email campaigns directly from your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Launch Customer CRM Free <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automatic Shadow Profiles</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                No friction app signups. Guest phone numbers, preferences, and visit frequencies sync automatically on every transaction.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Targeted Broadcast Campaigns</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Send flash deal announcements, weekend invitations, or holiday greetings via SMS & Email with 1-click segmentation.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automated Re-Engagement</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Trigger automated rewards and reminders for lapsed customers who haven't ordered in 30+ days.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-blue-950/60 via-zinc-900 to-indigo-950/60 border border-blue-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Turn one-off transactions into lifetime regulars
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Access the full CRM & Broadcast suite with zero third-party subscription fees.
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
