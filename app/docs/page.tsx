import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Code, Terminal, Bot, Key, Webhook, FileText, ArrowRight, CheckCircle2, Download } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'

export const metadata: Metadata = {
  title: 'Developer Resources & API Documentation | OurMenu OS',
  description: 'Complete developer documentation, REST API references, Webhooks, Model Context Protocol (MCP) tools, and OpenAPI 3.1.0 specification for OurMenu OS.',
  alternates: {
    canonical: 'https://ourmenuos.online/docs',
  },
}

export default function DocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "OurMenu OS Developer Resources & API Documentation",
    "description": "Comprehensive developer reference for OurMenu OS APIs, webhooks, and MCP agent tools.",
    "url": "https://ourmenuos.online/docs",
    "author": {
      "@type": "Organization",
      "name": "OurMenu OS"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-[#050505] min-h-screen text-zinc-300 selection:bg-emerald-500/30 selection:text-white">
        <LandingNavbar />

        {/* Hero Section */}
        <section className="pt-36 pb-16 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Terminal className="w-3.5 h-3.5" /> Developer Portal & APIs
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            OurMenu OS Developer Resources & API Reference
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Build custom integrations, automate order routing, connect hardware peripherals, or equip autonomous AI agents with the OurMenu OS API suite.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/openapi.json"
              download
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" /> Download OpenAPI 3.1 Spec
            </a>
            <a
              href="/.well-known/mcp.json"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-sm transition-all inline-flex items-center gap-2"
            >
              <Bot className="w-4 h-4" /> View MCP Manifest
            </a>
            <Link
              href="/llms.txt"
              className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 font-semibold text-sm transition-all inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> View llms.txt
            </Link>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="pb-24 px-6 max-w-5xl mx-auto space-y-16">
          
          {/* Section 1: Authentication */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">1. Authentication & Base URL</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              All merchant and administrative API endpoints require standard HTTP Bearer token authentication in the <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">Authorization</code> header. Public storefront endpoints require a valid <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">location_id</code> or venue <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">slug</code>.
            </p>
            <div className="bg-black/80 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto text-zinc-300">
              <span className="text-zinc-500"># API Base URL</span><br />
              <span className="text-emerald-400">https://ourmenuos.online/api</span><br /><br />
              <span className="text-zinc-500"># Example Request Header</span><br />
              <span className="text-zinc-400">Authorization: Bearer &lt;YOUR_MERCHANT_SECRET_KEY&gt;</span><br />
              <span className="text-zinc-400">Content-Type: application/json</span>
            </div>
          </div>

          {/* Section 2: Core Endpoints Reference */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">2. Public & Merchant REST Endpoints</h2>
            </div>

            <div className="space-y-4">
              
              {/* Endpoint A: AI Concierge */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">POST</span>
                  <code className="text-white font-mono text-sm">/api/chat</code>
                </div>
                <h3 className="text-lg font-bold text-white">Frontline AI Concierge Stream</h3>
                <p className="text-sm text-zinc-400">
                  Sends conversational guest queries to the venue-grounded Tego AI concierge. Returns streaming token responses with zero hallucination guarantee and automatic staff handoff routing.
                </p>
              </div>

              {/* Endpoint B: Menu OCR */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">POST</span>
                  <code className="text-white font-mono text-sm">/api/ai/parse-menu</code>
                </div>
                <h3 className="text-lg font-bold text-white">Multimodal Menu & Inventory OCR</h3>
                <p className="text-sm text-zinc-400">
                  Ingests physical menu pictures, PDF invoices, or camera frames to parse categories, items, prices, dietary tags, and descriptions into structured JSON.
                </p>
              </div>

              {/* Endpoint C: Gemini Live Token */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">POST</span>
                  <code className="text-white font-mono text-sm">/api/ai/live-token</code>
                </div>
                <h3 className="text-lg font-bold text-white">Live Gemini Ephemeral Token Minting</h3>
                <p className="text-sm text-zinc-400">
                  Mints short-lived cryptographic session tokens for direct bidirectional WebAudio (16kHz in / 24kHz out) and 1 FPS camera video streaming via Gemini 3.1 Flash Live.
                </p>
              </div>

              {/* Endpoint D: Orders API */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 font-mono text-xs font-bold">POST / GET</span>
                  <code className="text-white font-mono text-sm">/api/orders</code>
                </div>
                <h3 className="text-lg font-bold text-white">Orders & Transaction Dispatch</h3>
                <p className="text-sm text-zinc-400">
                  Submits guest orders with table numbers, variant selections, split bill instructions, and payment tokens. Real-time updates push directly to kitchen display systems via WebSockets.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Webhooks */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Webhook className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">3. Webhook Infrastructure</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              OurMenu OS handles real-time payment gateway settlement callbacks from Paystack and Bachs at <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">/api/paystack/webhook</code>. Every webhook payload is verified using HMAC SHA512 signatures via the <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">x-paystack-signature</code> header.
            </p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span><strong className="text-white">charge.success</strong>: Automatically updates order payment status and triggers thermal kitchen ticket printing.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span><strong className="text-white">transfer.success</strong>: Confirms automated merchant split payouts and affiliate commission disbursements.</span>
              </li>
            </ul>
          </div>

          {/* Section 4: Model Context Protocol (MCP) */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">4. Model Context Protocol (MCP) for AI Agents</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Autonomous AI agents can connect to OurMenu OS as an MCP server to query catalogs, create orders, and verify table availability. The server manifest is discoverable at <a href="/.well-known/mcp.json" className="text-emerald-400 underline">https://ourmenuos.online/.well-known/mcp.json</a>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">ourmenu_query_catalog</span>
                <p className="text-zinc-400 font-sans text-xs">Search menu/product catalog with dietary (vegan, halal, keto) and stock status filters.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">ourmenu_create_order</span>
                <p className="text-zinc-400 font-sans text-xs">Place an order with line items, quantity, notes, and payment mode.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">ourmenu_check_availability</span>
                <p className="text-zinc-400 font-sans text-xs">Query open appointment calendar slots for spa, salon, and consulting services.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">ourmenu_request_staff</span>
                <p className="text-zinc-400 font-sans text-xs">Trigger live floor staff notification chimes on venue intercom devices.</p>
              </div>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Back to Platform Overview
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-zinc-400 hover:text-white transition-colors">About Us</Link>
              <Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact Support</Link>
              <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

        </section>
      </main>
    </>
  )
}
