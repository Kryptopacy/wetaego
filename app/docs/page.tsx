import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  Code, Terminal, Bot, Key, Webhook, FileText, CheckCircle2, Download, Cpu, 
  Printer, Radio, CreditCard, Sparkles, Network, ShieldCheck, Zap,
  MonitorSmartphone, ClipboardList, BookOpen, Truck, Package, Users, 
  BarChart3, Megaphone, QrCode, Clock, MessagesSquare, RefreshCw
} from 'lucide-react'
import { LandingNavbar } from '@/components/LandingNavbar'

export const metadata: Metadata = {
  title: 'Developer Documentation & Extended Capabilities | WETAEGO',
  description: 'Comprehensive developer portal, REST API references, Webhooks, Model Context Protocol (MCP), WebMCP, Operations Suite, RFC 9727 API Catalog, x402/MPP agent payments, and hardware printing SDK.',
  alternates: {
    canonical: 'https://ourmenuos.online/docs',
  },
}

export default function DocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "WETAEGO Developer Documentation & Extended Capabilities",
    "description": "Comprehensive developer reference for WETAEGO APIs, webhooks, MCP tools, WebMCP, Operations Suite, x402 payments, and hardware printing.",
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
            <Terminal className="w-3.5 h-3.5" /> Developer Portal & Architecture Reference
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            WETAEGO Operating System Architecture & API Reference
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            The unified digital infrastructure for physical storefronts, multi-concept enterprises, and autonomous AI agents. Integrate REST endpoints, connect hardware peripherals, or automate multi-branch fleets via WebMCP and Staff MCP.
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
            <Link
              href="/WEBMCP.md"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> WebMCP Spec
            </Link>
            <a
              href="/.well-known/api-catalog"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs md:text-sm transition-all inline-flex items-center gap-2"
            >
              <Network className="w-4 h-4" /> RFC 9727 Catalog
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

          {/* Section 2: Full-Spectrum Operations & Management Suite */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">2. Full-Spectrum Operations & Business Management Suite</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Every merchant account on WETAEGO is equipped with a complete, integrated operations suite powering daily frontline workflows and executive management:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Module 1: KDS */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Universal Order Inbox & Fulfillment Board</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time order fulfillment with status progression (<code className="text-emerald-400 font-mono">pending → paid → preparing → ready → out_for_delivery → completed</code>) across all business types—from retail packaging to digital services and kitchen tickets—with audio alerts and thermal printing.
                </p>
              </div>

              {/* Module 2: POS */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <MonitorSmartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Point of Sale (POS)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  High-speed counter POS with barcode scanning, custom item add, split bill payments, manual discounts, and automatic ESC/POS cash drawer kick pulses.
                </p>
              </div>

              {/* Module 3: BMS Bookings */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Booking Management (BMS)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Interactive calendar for salons, spas, and clinics with time-slot intervals, staff assignment, appointment duration, and upfront deposit capture.
                </p>
              </div>

              {/* Module 4: PMS Stays */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Property Management (PMS)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Listing manager for serviced apartments and lofts with check-in/out calendars, guest verification, and reservation status tracking.
                </p>
              </div>

              {/* Module 5: Delivery Hub */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Delivery Dispatch Hub</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Multi-zone delivery dispatch, courier tracking, distance calculations, and flat or dynamic delivery fee rules.
                </p>
              </div>

              {/* Module 6: Inventory BOM */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Inventory & Bill of Materials (BOM)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Raw ingredient decrement tracking per dish or service sold, low-stock threshold alerts, and supplier reorder sheets.
                </p>
              </div>

              {/* Module 7: CRM & IOU Tab */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">CRM, Loyalty & IOU Credit</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatic customer shadow profiles at checkout, guest LTV tracking, VIP tiers, and customer IOU store credit financing ledger with automated SMS/email debt reminders.
                </p>
              </div>

              {/* Module 8: PIN Feedback Loop */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">PIN CSAT & Staff Leaderboard</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cryptographic PIN receipts for verified customer reviews, private grievance triage before negative reviews hit Google, and gamified staff performance & tip rankings.
                </p>
              </div>

              {/* Module 9: Marketing & Flash Deals */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Marketing & Growth Hub</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  SMS and Email broadcast campaigns, recurring happy hour flash deals, limited-quantity chef drop pricing, and smart cart cross-sell recommendations.
                </p>
              </div>

              {/* Module 10: Staff Intercom */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Staff Push-to-Talk Intercom</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Zero-latency push-to-talk voice radio, kitchen-to-server ready alerts, table assistance calls, and live floor team coordination over WebSockets.
                </p>
              </div>

              {/* Module 11: Deep Analytics */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Analytics & ML Demand Forecast</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Revenue velocity, category contribution, hourly peak volume, table turnover, payment breakdown, and ML demand prediction for staffing and prep.
                </p>
              </div>

              {/* Module 12: QR Studio */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Vector QR & Signage Studio</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Branded QR code generator with embedded logos, room/table/desk routing, per-card PNG download, and print layouts.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: WebMCP & Staff MCP Dual-Layer Standard */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">3. Model Context Protocol (WebMCP & Staff MCP Server)</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO implements a dual-layer Model Context Protocol architecture separating in-browser customer co-browsing from server-side enterprise fleet management:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/60 rounded-2xl p-6 border border-white/10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  Client-Side WebMCP (document.modelContext)
                </div>
                <h4 className="text-base font-bold text-white">Customer Storefront Suite</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Auto-registered on all live storefronts with live client state synchronization:
                </p>
                <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                  <li>• search_catalog (query, category, dietary, maxPrice)</li>
                  <li>• get_item_details (itemId)</li>
                  <li>• create_cart ()</li>
                  <li>• add_to_cart (itemId, quantity, modifiers, notes)</li>
                  <li>• get_cart ()</li>
                  <li>• update_cart (lineId, quantity, notes)</li>
                  <li>• initiate_checkout (fulfillment, customer)</li>
                  <li>• submit_order (checkoutId, authorization: confirmed)</li>
                  <li>• request_staff (reason)</li>
                </ul>
              </div>

              <div className="bg-black/60 rounded-2xl p-6 border border-white/10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold">
                  Server-Side Staff MCP (/api/mcp)
                </div>
                <h4 className="text-base font-bold text-white">Staff & Enterprise Fleet Operations</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bearer-authenticated RFC JSON-RPC 2.0 server for Claude Desktop, ChatGPT, and enterprise bots:
                </p>
                <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                  <li>• get_active_orders (locationId, status)</li>
                  <li>• get_order (orderId)</li>
                  <li>• update_order_status (orderId, status)</li>
                  <li>• mark_item_unavailable (itemId, isAvailable)</li>
                  <li>• get_table_status (locationId)</li>
                  <li>• get_daily_sales (locationId, date)</li>
                  <li>• duplicate_catalog_to_branch (source, target)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Extended Hardware Capabilities */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">4. Zero-Daemon ESC/POS Hardware Printing SDK</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO prints binary ESC/POS thermal tickets directly over <strong>WebUSB</strong>, <strong>WebSerial (RS232 COM)</strong>, and <strong>WebBluetooth</strong> without print servers or background software. Sends cash drawer kick pulses (<code className="text-emerald-400 font-mono">ESC p</code>) and hardware paper cuts.
            </p>
          </div>

          {/* Section 5: Standards, Protocols & Agent Payment Discovery */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Network className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">5. Supported Machine Standards & Discovery Protocols</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO is engineered for total autonomous agent interoperability, implementing 14 open web and AI agent discovery specifications:
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
                <span className="text-emerald-400 font-bold">Model Context Protocol (MCP)</span>
                <p className="text-zinc-400 font-sans text-xs">Published at <code>/.well-known/mcp.json</code> and <code>/api/mcp</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">WebMCP Browser Agent API</span>
                <p className="text-zinc-400 font-sans text-xs">Standard W3C in-browser tools registered via <code>document.modelContext.registerTool()</code>.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold">x402 & MPP Payment Protocol</span>
                <p className="text-zinc-400 font-sans text-xs">HTTP 402 agent settlement at <code>/.well-known/x402.json</code> and <code>/.well-known/mpp.json</code>.</p>
              </div>
            </div>
          </div>

          {/* Section 6: Universal POS Telemetry & Legacy Ingestion Gateway */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">6. Universal POS Telemetry & Legacy Ingestion Gateway</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              WETAEGO features a co-existence architecture. Businesses running existing legacy POS terminals (Toast, Square, Clover, Odoo, SAP, custom registers) do not need to replace their physical checkout hardware. You can stream in-store counter transactions into WETAEGO via our Telemetry Ingestion API or Webhooks to consolidate 100% of revenue, customer LTV, and ML demand forecasts in one unified dashboard.
            </p>

            <div className="space-y-4">
              <div className="bg-black/80 rounded-2xl p-5 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>POST /api/v1/pos/ingest</span>
                  <span className="text-zinc-500 font-normal">Bearer Auth</span>
                </div>
                <pre className="text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{`{
  "locationId": "loc_pacy_supermarket_01",
  "externalOrderId": "POS-98421",
  "source": "clover",
  "channel": "in_store_counter",
  "terminalId": "Lane_04_Register",
  "cashierName": "David A.",
  "currency": "USD",
  "totalMinor": 4250,
  "taxMinor": 350,
  "paymentMethod": "pos_card",
  "items": [
    { "name": "Organic Almond Milk", "sku": "ALM-01", "quantity": 2, "priceMinor": 1200 },
    { "name": "Sourdough Artisanal Loaf", "sku": "BAK-04", "quantity": 1, "priceMinor": 1850 }
  ],
  "customer": {
    "phone": "+1234567890",
    "name": "Sarah Jenkins"
  }
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-emerald-400 font-bold">1. Webhook Adapters</span>
                  <p className="text-zinc-400 font-sans text-xs">Connect Square, Clover, or Toast webhooks at <code>/api/webhooks/pos/:provider</code> to stream sales automatically.</p>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-emerald-400 font-bold">2. Direct REST API</span>
                  <p className="text-zinc-400 font-sans text-xs">Send transactions on checkout via <code>POST /api/v1/pos/ingest</code> with instant channel attribution.</p>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-emerald-400 font-bold">3. EOD Batch Sync</span>
                  <p className="text-zinc-400 font-sans text-xs">Upload daily Z-Report CSVs or automate reconciliation via Staff MCP (<code>sync_external_sales</code>).</p>
                </div>
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
