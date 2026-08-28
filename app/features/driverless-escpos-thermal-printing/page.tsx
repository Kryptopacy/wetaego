import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Printer, Cpu, Zap, Radio, CheckCircle2, ArrowRight, Layers, ShieldCheck, Terminal } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Driverless Web ESC/POS Thermal Receipt Printing | WETAEGO',
  description: 'Connect thermal receipt printers directly over WebUSB, WebSerial (RS232 COM), and WebBluetooth. Trigger instant hardware paper cuts and cash drawer kick pulses (ESC p) with zero print drivers, external daemons, or OS print dialogs.',
  keywords: [
    'web-based esc pos printing',
    'driverless thermal receipt printer',
    'webusb receipt printer',
    'webserial pos printer',
    'esc pos cash drawer kick web',
    'browser thermal printing sdk',
    'kitchen ticket printer web'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/driverless-escpos-thermal-printing',
  },
  openGraph: {
    title: 'Driverless Web ESC/POS Thermal Receipt Printing | WETAEGO',
    description: 'Direct browser-to-printer binary ESC/POS engine over WebUSB, WebSerial, and WebBluetooth with 0 background software.',
    url: 'https://ourmenuos.online/features/driverless-escpos-thermal-printing',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function DriverlessPrintingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'WETAEGO Driverless ESC/POS Hardware Printing SDK',
    'applicationCategory': 'BusinessApplication, HardwareSDK',
    'operatingSystem': 'Web, Windows, macOS, Linux, ChromeOS, Android',
    'description': 'Direct binary ESC/POS thermal printing engine over WebUSB, WebSerial, and WebBluetooth without print daemons or OS dialogs.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <Printer className="w-3.5 h-3.5" /> Hardware Layer
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Driverless ESC/POS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Thermal Receipt Printing
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Connect directly from any modern web browser to 58mm & 80mm thermal receipt printers over WebUSB, WebSerial (RS232 COM), and WebBluetooth. Zero print drivers. Zero background software. Zero OS print dialogs.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/m/demo"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Test in Live Demo Storefront
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Developer Docs & Hex Codes
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Raw Binary Command Pipeline</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                WETAEGO bypasses standard OS print dialogs entirely. It constructs raw ESC/POS byte buffers in JavaScript and streams them directly into USB endpoints, serial ports, or Bluetooth GATT characteristics at wire speed.
              </p>
              <div className="pt-3 flex flex-wrap gap-2 text-xs font-mono text-emerald-400">
                <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/5">ESC p (Cash Drawer Kick)</span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/5">GS V (Paper Full/Partial Cut)</span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/5">ESC ! (Bold / Double-Height)</span>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Zero Print Daemons</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Forget QZ Tray, CUPS, or local Node.js print daemons that crash during service. If a laptop, tablet, or phone can run Chrome, it can print receipts.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">WebUSB & Serial RS232</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Auto-discovers EPSON, Star Micronics, Xprinter, MUNBYN, and generic POS-58/80 printers over standard USB and COM baud rates.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Multi-Station Kitchen & Counter Ticket Routing</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Route drinks and cocktails to the Bar printer, appetizers and steaks to the Kitchen display, and customer checkout slips to the Front Counter register simultaneously with zero cross-talk.
              </p>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to modernize your receipt printing?</h2>
            <p className="text-zinc-400 text-sm font-light">No hardware lock-in. Works with your existing USB and Bluetooth thermal printers.</p>
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
