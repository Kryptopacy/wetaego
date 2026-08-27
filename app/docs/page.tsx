import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Code, Terminal, Bot, Key, Webhook, FileText, CheckCircle2, Download, Cpu, Printer, Radio, CreditCard, Sparkles, Network, ShieldCheck, Zap } from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'

export const metadata: Metadata = {
  title: 'Developer Documentation & Extended Capabilities | WETAEGO',
  description: 'Comprehensive developer portal, REST API references, Webhooks, Model Context Protocol (MCP), WebMCP, RFC 9727 API Catalog, x402/MPP agent payments, and hardware printing SDK.',
  alternates: {
    canonical: 'https://ourmenuos.online/docs',
  },
}

export default function DocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "WETAEGO Developer Documentation & Extended Capabilities",
    "description": "Comprehensive developer reference for WETAEGO APIs, webhooks, MCP tools, WebMCP, x402 payments, and hardware printing.",
    "url": "https://ourmenuos.online/docs",
    "author": {
      "@type": "Organization",
      "name": "WETAEGO"
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
        <section className="pt-36 pb-16 px-6 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Terminal className="w-3.5 h-3.5" /> Developer Portal & Extended Capabilities
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            WETAEGO Developer Architecture & API Reference
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Build custom integrations, automate real-time order dispatch, connect ESC/POS hardware peripherals, or equip autonomous AI agents with the WETAEGO protocol suite.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/openapi.json"
              download
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs md:text-sm transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" /> OpenAPI 3.1 Spec
            </a>
            <a
              href="/.well-known/mcp.json"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <Bot className="w-4 h-4" /> MCP Manifest
            </a>
            <a
              href="/.well-known/api-catalog"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <Network className="w-4 h-4" /> RFC 9727 Catalog
            </a>
            <a
              href="/.well-known/ai-catalog.json"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> ARD Catalog
            </a>
            <Link
              href="/llms.txt"
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> llms.txt
            </Link>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="pb-24 px-6 max-w-6xl mx-auto space-y-16">
          
          {/* Section 1: Authentication & Agent Registration */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">1. Authentication & Agent Registration (Auth.md & RFC 8414)</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              All merchant and administrative API endpoints require standard HTTP Bearer token authentication in the <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">Authorization</code> header. Autonomous AI agents can self-register using the WorkOS <a href="/auth.md" className="text-emerald-400 underline">Auth.md specification</a>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/80 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto text-zinc-300">
                <span className="text-zinc-500"># API Base URL</span><br />
                <span className="text-emerald-400">https://ourmenuos.online/api</span><br /><br />
                <span className="text-zinc-500"># Example Request Header</span><br />
                <span className="text-zinc-400">Authorization: Bearer &lt;YOUR_MERCHANT_SECRET_KEY&gt;</span><br />
                <span className="text-zinc-400">Content-Type: application/json</span>
              </div>
              <div className="bg-black/80 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto text-zinc-300">
                <span className="text-zinc-500"># OAuth2 & OIDC Endpoints</span><br />
                <span className="text-zinc-400">OIDC Config: </span><span className="text-emerald-400">/.well-known/openid-configuration</span><br />
                <span className="text-zinc-400">OAuth Authz: </span><span className="text-emerald-400">/.well-known/oauth-authorization-server</span><br />
                <span className="text-zinc-400">Protected Res: </span><span className="text-emerald-400">/.well-known/oauth-protected-resource</span>
              </div>
            </div>
          </div>

          {/* Section 2: Core REST Endpoints */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">2. Public & Merchant REST Endpoints</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
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
                <h3 className="text-lg font-bold text-white">Live Multimodal Ephemeral Token Minting</h3>
                <p className="text-sm text-zinc-400">
                  Mints short-lived cryptographic session tokens for direct bidirectional WebAudio (16kHz in / 24kHz out) and 1 FPS camera video streaming via real-time live AI sessions.
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

              {/* Endpoint E: Bookings */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400 font-mono text-xs font-bold">POST / GET</span>
                  <code className="text-white font-mono text-sm">/api/bookings</code>
                </div>
                <h3 className="text-lg font-bold text-white">Appointments & Service Scheduling</h3>
                <p className="text-sm text-zinc-400">
                  Queries availability calendars for spas, clinics, salons, and consultants. Confirms booking reservations with deposit processing.
                </p>
              </div>

              {/* Endpoint F: Health & Uptime */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-zinc-500/20 text-zinc-300 font-mono text-xs font-bold">GET</span>
                  <code className="text-white font-mono text-sm">/api/health</code>
                </div>
                <h3 className="text-lg font-bold text-white">Platform Health & Status</h3>
                <p className="text-sm text-zinc-400">
                  Real-time operational health telemetry for load balancers, orchestrators, and automated agents.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Extended Hardware & Operational Capabilities */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">3. Extended Hardware & Operational Capabilities</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO bridges web software directly to physical point-of-sale hardware and multi-branch franchise operations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1: ESC/POS Printing */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero-Daemon ESC/POS Printing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Direct raw binary ticket printing over <strong>WebUSB</strong>, <strong>WebSerial (RS232)</strong>, and <strong>WebBluetooth</strong>. Sends cash drawer kick pulses (<code className="text-emerald-400 font-mono">ESC p</code>) and hardware paper cuts without background daemons.
                </p>
              </div>

              {/* Feature 2: Staff Intercom */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Real-Time Staff Intercom</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Low-latency push-to-talk voice radio, kitchen-to-server ready chimes, table assistance calls, and live floor dispatch coordination over WebSockets.
                </p>
              </div>

              {/* Feature 3: Multi-Branch Replication */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">1-Second Catalog Duplication</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Franchise and supermarket fleet expansion with instant sub-department cloning (<code className="text-emerald-400 font-mono">duplicatePageAction</code>), shared inventory, and localized pricing tiers.
                </p>
              </div>

              {/* Feature 4: Customer IOU Tab */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Customer IOU Tab Financing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In-house Buy Now Pay Later tab ledger, customer credit limits, automated SMS/email debt reminders, and merchant risk controls.
                </p>
              </div>

              {/* Feature 5: Payment Roulette */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Payment Roulette Bill Splitter</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gamified dining checkout randomizer and public web tool at <a href="/tools/who-pays-the-bill" className="text-emerald-400 underline">/tools/who-pays-the-bill</a> to settle table tabs interactively.
                </p>
              </div>

              {/* Feature 6: Multi-Gateway Settlement */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Multi-Gateway Settlement</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Unified payments supporting Cards, Bank Transfers, USSD, Apple/Google Pay, and crypto (USDC, USDT, SOL) via Paystack, Bachs, and x402.
                </p>
              </div>

            </div>
          </div>

          {/* Section 4: Webhook Infrastructure */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Webhook className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">4. Webhook Infrastructure</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO handles real-time payment gateway settlement callbacks from Paystack and Bachs at <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">/api/paystack/webhook</code>. Every webhook payload is verified using HMAC SHA512 signatures via the <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 border border-white/10">x-paystack-signature</code> header.
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

          {/* Section 5: Standards, Protocols & Agent Payment Discovery */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Network className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">5. Supported Machine Standards & Discovery Protocols</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO is engineered for total autonomous agent interoperability, implementing 14 cutting-edge open web and AI agent discovery specifications:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">RFC 8288 Link Headers</span>
                <p className="text-zinc-400 font-sans text-xs">Emits HTTP Link response headers advertising api-catalog, service-doc, service-desc, oauth, and skills.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">RFC 9727 API Catalog</span>
                <p className="text-zinc-400 font-sans text-xs">Advertised via <code>/.well-known/api-catalog</code> with <code>application/linkset+json</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">OIDC & RFC 8414 OAuth Discovery</span>
                <p className="text-zinc-400 font-sans text-xs">Advertised via <code>/.well-known/openid-configuration</code> and <code>/.well-known/oauth-authorization-server</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">RFC 9728 Protected Resource</span>
                <p className="text-zinc-400 font-sans text-xs">Published at <code>/.well-known/oauth-protected-resource</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">Auth.md Agent Registration</span>
                <p className="text-zinc-400 font-sans text-xs">Instructions served at <code>/auth.md</code> for programmatic credential onboarding.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">Agent Skills Index (RFC v0.2.0)</span>
                <p className="text-zinc-400 font-sans text-xs">Published at <code>/.well-known/agent-skills/index.json</code> with SHA-256 digests.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">WebMCP Browser Agent API</span>
                <p className="text-zinc-400 font-sans text-xs">Standard W3C in-browser tools registered via <code>document.modelContext.registerTool()</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">ARD Manifest (ai-catalog.json)</span>
                <p className="text-zinc-400 font-sans text-xs">Available at <code>/.well-known/ai-catalog.json</code> with URNs and embedding queries.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">x402 & MPP Payment Protocol</span>
                <p className="text-zinc-400 font-sans text-xs">HTTP 402 agent settlement at <code>/.well-known/x402.json</code> and <code>/.well-known/mpp.json</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">UCP & ACP Commerce Protocols</span>
                <p className="text-zinc-400 font-sans text-xs">Universal Commerce Profile at <code>/.well-known/ucp</code> and ACP at <code>/.well-known/acp.json</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">DNS-AID Service Discovery</span>
                <p className="text-zinc-400 font-sans text-xs">Configured via SVCB/HTTPS records at <code>_index._agents.ourmenuos.online</code> and <code>/.well-known/dns-aid.json</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">Content Signals</span>
                <p className="text-zinc-400 font-sans text-xs">Declared in <code>/robots.txt</code> (<code>Content-Signal: ai-train=no, search=yes, ai-input=yes</code>).</p>
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
