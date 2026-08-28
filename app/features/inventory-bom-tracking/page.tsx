import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Package, Layers, TrendingDown, ArrowRight, CheckCircle2, ShieldAlert, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bill of Materials (BOM) & Automated Inventory Decrement | WETAEGO',
  description: 'Track raw ingredient and component inventory with Bill of Materials (BOM) mapping. Automatically decrement raw stock on every sale, receive low-threshold stock alerts, and generate automated supplier reorder purchase sheets.',
  keywords: [
    'bill of materials inventory pos',
    'raw ingredient decrement software',
    'restaurant recipe inventory tracking',
    'retail stock threshold alerts',
    'automated supplier reorder sheets'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/inventory-bom-tracking',
  },
  openGraph: {
    title: 'Bill of Materials (BOM) & Automated Inventory Decrement | WETAEGO',
    description: 'Track raw ingredient and component inventory per order with low-stock alerts and supplier purchase sheets.',
    url: 'https://ourmenuos.online/features/inventory-bom-tracking',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function InventoryBomPage() {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <Package className="w-3.5 h-3.5" /> Inventory & Supply Chain
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Bill of Materials (BOM) & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Automated Inventory Tracking
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Connect finished products to their raw components and ingredients. Every order sold across digital storefronts, AI agents, or counter registers automatically decrements raw stock levels in real time, triggering instant reorder alerts before you run out.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Manage Inventory in Sandbox
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Developer Docs
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Recipe & Component Mapping</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Map complex assemblies: 1x Cheeseburger automatically decrements 1x Brioche Bun, 150g Angus Beef Patty, 1x Cheddar Slice, and 15g Truffle Mayo. Know your exact unit economics and cost of goods sold (COGS).
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Low-Stock Alerts</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Set custom threshold limits. WETAEGO flags low-stock items in the dashboard and automatically marks items out-of-stock across storefronts when raw ingredients hit zero.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Eliminate 86 surprises and ingredient waste</h2>
            <p className="text-zinc-400 text-sm font-light">Accurate COGS, automated supplier reorder sheets, and real-time inventory synchronization.</p>
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
