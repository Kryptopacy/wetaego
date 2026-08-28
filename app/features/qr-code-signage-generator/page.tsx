import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { QrCode, Download, Printer, Layers, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Branded Vector QR Code & Table Signage Studio | WETAEGO',
  description: 'Generate high-resolution vector SVG and PNG QR codes with embedded brand logos, dynamic table/room/desk target routing, custom brand colors, and print-ready card layouts.',
  keywords: [
    'branded qr code generator for restaurants',
    'table qr code signage',
    'vector qr code svg generator',
    'hotel room qr ordering signage',
    'custom branded qr code print'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/qr-code-signage-generator',
  },
  openGraph: {
    title: 'Branded Vector QR Code & Table Signage Studio | WETAEGO',
    description: 'High-resolution vector QR code generator with embedded logos, room/table/desk routing, and print-ready layouts.',
    url: 'https://ourmenuos.online/features/qr-code-signage-generator',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function QrStudioPage() {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <QrCode className="w-3.5 h-3.5" /> Signage & Hardware
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Branded Vector QR & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Table Signage Studio
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Design and export high-resolution vector SVG and PNG QR codes with embedded brand logos, custom brand palette accents, room/table/desk target routing, and print-ready card layouts in seconds.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Generate Branded QRs in Dashboard
              </Link>
              <Link
                href="/m/demo"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Test QR Destination
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Dual-Mode Output: Branded Card vs Simple Raw QR</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Export print-ready display cards with embedded high-contrast brand icons, crisp typography, and scan instructions, or download raw high-density vector SVGs for laser etching onto acrylic, wood, or metal table tents.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Batch Table Generator</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Generate 50 table, desk, or room identifiers with one click. Each QR automatically tags the guest&apos;s active session with their exact physical location for staff delivery.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Upgrade your in-venue guest scan experience</h2>
            <p className="text-zinc-400 text-sm font-light">Zero design software required. Generate print-ready vector cards directly from your browser.</p>
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
