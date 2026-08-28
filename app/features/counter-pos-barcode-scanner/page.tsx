import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Store, QrCode, CreditCard, Zap, ArrowRight, CheckCircle2, Cpu, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'High-Speed Counter POS & USB/Camera Barcode Scanner | WETAEGO',
  description: 'High-speed cashier point of sale for retail stores, supermarkets, and boutiques. Instant barcode scanning via USB handheld or device camera, custom line items, split cash/card payments, manual discounts, and automatic cash drawer kick.',
  keywords: [
    'web pos barcode scanner',
    'high speed counter pos',
    'browser pos cash drawer kick',
    'retail point of sale barcode',
    'split cash card payment pos'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/counter-pos-barcode-scanner',
  },
  openGraph: {
    title: 'High-Speed Counter POS & USB/Camera Barcode Scanner | WETAEGO',
    description: 'High-speed counter POS with barcode scanning, split payments, manual discounts, and cash drawer kick.',
    url: 'https://ourmenuos.online/features/counter-pos-barcode-scanner',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function CounterPosPage() {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <Store className="w-3.5 h-3.5" /> Point of Sale
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              High-Speed Counter POS & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Barcode Scanner
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Designed for lightning-fast counter checkout in retail stores, supermarkets, and boutiques. Scan barcodes with standard USB laser guns or device cameras, apply manual discounts, split payments across Cash/Card/Bank, and pop the cash drawer instantly.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Launch Sandbox POS
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                POS Ingestion API
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Zero-Latency Barcode Detection</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Listens for standard USB/Bluetooth HID keyboard wedges and scans via device camera. Products are added to the active cart in sub-10ms with automatic price calculation and inventory deduction.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Split Payments</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Split a single bill across multiple payment methods: Cash, Credit Card, Bank Transfer, or Customer IOU store credit tabs with automated change calculation.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Turn any tablet, laptop, or phone into a professional POS</h2>
            <p className="text-zinc-400 text-sm font-light">Zero monthly hardware rental fees. Works with all standard receipt printers and cash drawers.</p>
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
