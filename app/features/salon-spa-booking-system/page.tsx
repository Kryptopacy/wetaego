import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  UserCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Salon, Spa & Wellness Appointment Booking System | OurMenu OS",
  description: "Automate appointment bookings for beauty salons, barbershops, wellness spas, clinics, and tutors. Calendar slots, deposit billing, and WhatsApp reminders.",
  keywords: [
    "salon booking software",
    "spa appointment system",
    "barbershop online booking",
    "wellness scheduling software",
    "deposit billing appointments",
    "service booking software",
    "spa management software"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/salon-spa-booking-system",
  },
  openGraph: {
    title: "Salon, Spa & Wellness Booking System | OurMenu OS",
    description: "Automated calendar booking, deposit billing, and customer notifications for beauty, wellness, and appointment services.",
    url: "https://ourmenuos.online/features/salon-spa-booking-system",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salon, Spa & Wellness Booking System | OurMenu OS",
    description: "Automated calendar booking, deposit billing, and customer notifications for beauty, wellness, and appointment services.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function SalonSpaBookingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/salon-spa-booking-system#software",
        "name": "OurMenu Salon & Spa Appointment Booking OS",
        "applicationCategory": "BusinessApplication, HealthAndBeautyApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Seamless calendar scheduling, tiered service packages, automated deposit billing, and multi-therapist assignments for wellness businesses.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/features/salon-spa-booking-system#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Can I require deposit payments to stop no-shows?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! OurMenu OS allows configuring customized deposit percentages (e.g. 20%, 50%, or full upfront payment) to lock in client bookings securely."
            }
          },
          {
            "@type": "Question",
            "name": "Does it support staff and therapist assignments?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Clients can pick their preferred stylist, therapist, or practitioner, and booking slots automatically check availability in real time."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/salon-spa-booking-system#breadcrumb",
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
            "name": "Salon & Spa Bookings",
            "item": "https://ourmenuos.online/features/salon-spa-booking-system"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest mb-6">
              <CalendarCheck className="w-3.5 h-3.5" /> Wellness & Service Scheduling
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Eliminate no-shows. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300">
                Automate your calendar.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Transform appointment management for salons, barbershops, wellness spas, and clinics with online slot selection, automated deposit billing, and instant WhatsApp reminders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Launch Booking Storefront <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Time-Slot Grid</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Clients choose available times and view service durations with zero back-and-forth messaging.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deposit & Card Billing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Collect partial deposits or 100% upfront payments automatically through card, transfer, or crypto.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Staff Availability</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Assign specific stylists, therapists, and treatment rooms with independent shift schedules.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-pink-950/60 via-zinc-900 to-rose-950/60 border border-pink-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Start accepting client appointments in minutes
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Give your clients a luxury booking experience tailored to your salon or spa brand.
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
