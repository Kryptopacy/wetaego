import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Bot, Sparkles, ShieldCheck, Terminal, ArrowRight, CheckCircle2, Cpu, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'WebMCP Autonomous Agent Commerce Protocol | WETAEGO',
  description: 'The in-browser agent commerce standard. Dynamically registers 8 canonical client-side tools on document.modelContext for ChatGPT Desktop, Google Chrome 149+, and autonomous web assistants with an architectural Human-in-the-Loop Safe Payment Gate.',
  keywords: [
    'webmcp protocol',
    'webmcp commerce',
    'document modelcontext tools',
    'autonomous agent shopping',
    'ai browser co browsing',
    'agentic ecommerce tools',
    'openai webmcp challenge'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/webmcp-agentic-commerce',
  },
  openGraph: {
    title: 'WebMCP Autonomous Agent Commerce Protocol | WETAEGO',
    description: 'Transform any storefront into an autonomous AI tool suite registered on document.modelContext with Human-in-the-Loop financial safety.',
    url: 'https://ourmenuos.online/features/webmcp-agentic-commerce',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function WebMcpCommercePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'WETAEGO WebMCP In-Browser Commerce Engine',
    'applicationCategory': 'BusinessApplication, DeveloperApplication',
    'operatingSystem': 'Web, ChatGPT Desktop, Google Chrome 149+',
    'description': 'Standardized in-browser WebMCP tool suite registered on document.modelContext with Human-in-the-Loop payment confirmation.',
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
              <Bot className="w-3.5 h-3.5" /> Agent-Native Commerce
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              In-Browser WebMCP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Autonomous Agent Commerce
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Every WETAEGO storefront dynamically synthesizes 8 canonical client-side tools directly onto <code className="text-emerald-400 font-mono">document.modelContext</code>. Browsing agents like ChatGPT Desktop and Chrome 149+ can discover, filter, customize items, and co-browse with the user in real time.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/m/demo"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
              >
                Launch WebMCP Playground (/m/demo)
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Read WebMCP Specification
              </Link>
            </div>
          </div>

          {/* Canonical 8 Tools */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
            <h3 className="text-xl font-bold text-white">The Canonical 8-Tool WebMCP Commerce Suite</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">1. search_catalog</span>
                <p className="text-zinc-400 font-sans text-xs">Search items with query, category, dietary tags, price ceiling, and stock status.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">2. get_item_details</span>
                <p className="text-zinc-400 font-sans text-xs">Inspect full modifier trees, dietary tags, allergens, and inventory limits.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">3. create_cart</span>
                <p className="text-zinc-400 font-sans text-xs">Initialize a clean session-scoped cart bound to IndexedDB.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">4. add_to_cart</span>
                <p className="text-zinc-400 font-sans text-xs">Add items with complex multi-modifier options and special instructions.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">5. get_cart</span>
                <p className="text-zinc-400 font-sans text-xs">Retrieve authoritative line items, subtotal, taxes, and delivery fees.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">6. update_cart</span>
                <p className="text-zinc-400 font-sans text-xs">Update item quantity (0 = remove) or modify special notes.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">7. initiate_checkout</span>
                <p className="text-zinc-400 font-sans text-xs">Prepare checkout with fulfillment mode, table, or address.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1 bg-emerald-950/20">
                <span className="text-emerald-300 font-bold">8. submit_order (Human Gate)</span>
                <p className="text-zinc-300 font-sans text-xs">Mandatory human biometric confirmation gate before financial authorization.</p>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Make your brand accessible to autonomous AI agents</h2>
            <p className="text-zinc-400 text-sm font-light">Join the open agentic economy with automated WebMCP tool synthesis.</p>
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
