import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/LandingNavbar'
import Link from 'next/link'
import { Server, Terminal, ShieldCheck, ArrowRight, Bot, Layers, BarChart3, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Staff MCP Server & Multi-Branch Enterprise Automation | WETAEGO',
  description: 'Bearer-authenticated JSON-RPC 2.0 Model Context Protocol (MCP) server for external AI agents (Claude Desktop, ChatGPT Enterprise, automated scripts). Automate multi-branch order tracking, KDS status updates, and nightly sales audits at /api/mcp.',
  keywords: [
    'staff mcp server',
    'enterprise mcp pos',
    'claude desktop pos integration',
    'automated restaurant auditing ai',
    'json rpc 2.0 mcp endpoint',
    'multi branch ai fleet management'
  ],
  alternates: {
    canonical: 'https://ourmenuos.online/features/staff-mcp-automation',
  },
  openGraph: {
    title: 'Staff MCP Server & Multi-Branch Enterprise Automation | WETAEGO',
    description: 'Bearer-authenticated Model Context Protocol (MCP) server for enterprise AI fleet automation at /api/mcp.',
    url: 'https://ourmenuos.online/features/staff-mcp-automation',
    type: 'website',
    images: ['/hero_emerald_gemstone.png'],
  },
}

export default function StaffMcpPage() {
  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-[#050505] text-white pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest">
              <Server className="w-3.5 h-3.5" /> Enterprise Backoffice MCP
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Staff MCP Server for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Enterprise AI Automation
              </span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Exposes an RFC-compliant JSON-RPC 2.0 endpoint at <code className="text-blue-400 font-mono">https://ourmenuos.online/api/mcp</code>. Connect external AI agents (Claude Desktop, ChatGPT, nightly cron bots) to audit sales across 20 branches, update live fulfillment statuses, and manage inventory automatically.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/docs"
                className="px-8 py-3.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
              >
                Inspect MCP JSON Manifest
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
              >
                Generate Staff Bearer Token
              </Link>
            </div>
          </div>

          {/* Core Tools */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
            <h3 className="text-xl font-bold text-white">Automate Operations with 7 Enterprise Staff Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• get_active_orders</span>
                <p className="text-zinc-400 font-sans text-xs">Fetch live orders filtered by location and fulfillment status.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• update_order_status</span>
                <p className="text-zinc-400 font-sans text-xs">Advance tickets from accepted → preparing → ready → completed.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• mark_item_unavailable</span>
                <p className="text-zinc-400 font-sans text-xs">86 out-of-stock items in real time across digital storefronts.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• get_daily_sales</span>
                <p className="text-zinc-400 font-sans text-xs">Pull consolidated daily sales volume, GMV, and payment breakdowns.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• duplicate_catalog_to_branch</span>
                <p className="text-zinc-400 font-sans text-xs">1-second atomic catalog replication across franchise locations.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-blue-400 font-bold">• get_table_status</span>
                <p className="text-zinc-400 font-sans text-xs">Audit active dining tables, open checks, and seated guests.</p>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Give your management team autonomous superpowers</h2>
            <p className="text-zinc-400 text-sm font-light">Connect your AI assistants directly to your store operations via Staff MCP.</p>
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
