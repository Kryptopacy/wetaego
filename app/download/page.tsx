import { Smartphone, Monitor, Apple, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Download & Install OurMenu OS',
  description: 'Install OurMenu OS on your iPad, POS terminal, Android, Mac, or Windows desktop.',
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Instant App Access
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Install OurMenu OS Anywhere</h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-base">
            No massive downloads or store approvals. OurMenu OS runs as a lightweight, zero-latency desktop and mobile app with full offline queueing and direct thermal printer support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* iOS / iPadOS */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                <Apple className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">iOS & iPadOS</h2>
              <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
                <li>Open <code className="text-zinc-200">ourmenuos.online</code> in <strong>Safari</strong>.</li>
                <li>Tap the <strong>Share button</strong> at the bottom.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500">
              Works seamlessly on iPhone and iPad POS terminals.
            </div>
          </div>

          {/* Android */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Android</h2>
              <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
                <li>Open OurMenu in <strong>Chrome</strong>.</li>
                <li>Tap the <strong>three dots menu (⋮)</strong> top-right.</li>
                <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              </ol>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500">
              Supports background sync and offline orders.
            </div>
          </div>

          {/* Desktop Mac / Windows / Linux */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                <Monitor className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Desktop POS</h2>
              <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
                <li>Open OurMenu in <strong>Chrome</strong> or <strong>Edge</strong>.</li>
                <li>Click the <strong>Install icon</strong> in the address bar.</li>
                <li>Click <strong>Install</strong> to launch as a standalone desktop app.</li>
              </ol>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500">
              Full WebUSB / WebSerial thermal receipt printing.
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-all">
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
