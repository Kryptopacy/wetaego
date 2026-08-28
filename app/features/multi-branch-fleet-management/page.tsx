import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Layers, Copy, Globe, MapPin, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Enterprise Multi-Branch Fleet Management & 1s Catalog Cloning | WETAEGO',
  description: 'Manage 2 to 100+ branches from a single unified switcher. Replicate master catalogs to new branches in under 1 second with atomic database cloning (duplicatePageAction), localized currencies, and granular RBAC permissions.',
  keywords: [
    'multi branch fleet management',
    'franchise menu duplication 1 second',
    'multi location retail pos',
    'restaurant chain menu switcher',
    'atomic catalog replication'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/multi-branch-fleet-management',
  },
  openGraph: {
    title: 'Enterprise Multi-Branch Fleet Management & 1s Catalog Cloning | WETAEGO',
    description: 'Scale franchise locations instantly with atomic 1-second catalog replication and unified multi-concept switcher.',
    url: 'https://ourmenuos.online/features/multi-branch-fleet-management',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function MultiBranchFleetPage() {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" /> Fleet Architecture
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Enterprise Multi-Branch <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Fleet Management
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Seamlessly manage 2 to 100+ locations from one unified dashboard. Clone master catalogs, price rules, and modifier groups to new branches in under 1 second while maintaining location-specific taxes, currencies, and inventory limits.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/m/demo"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Experience 9-Concept Demo
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Open Multi-Branch Workspace
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Copy className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">1-Second Atomic Catalog Duplication</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                When opening a new branch or pop-up kiosk, our atomic cloning stored procedure recursively duplicates all collections, categories, items, price rules, and modifier trees from the master branch in under 1 second—saving weeks of manual data entry.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Unified Concept Switcher</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Switch between <code className="text-emerald-400 font-mono">🌐 All Businesses</code> for consolidated executive telemetry and individual branch drill-downs with 1 tap.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Scale your brand without operational chaos</h2>
            <p className="text-zinc-400 text-sm font-light">Built for franchises, supermarkets, multi-brand restaurant groups, and retail chains.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-all"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
