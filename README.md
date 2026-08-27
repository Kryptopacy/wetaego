# WETAEGO

![WETAEGO Logo](./public/apple-touch-icon.png)

> **The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them.**

---

WETAEGO is a universal, enterprise-grade **Commerce & Services Operating System** engineered to power customer-facing digital presence, real-time transactions, appointment bookings, rate cards, inventory catalogs, custom quotes, driverless hardware printing, and autonomous AI agent interoperability for any commercial business model—from independent solopreneurs to multi-location franchises and diverse enterprise conglomerates.

Designed for high-traffic environments—such as restaurant chains, bustling lounges, hotel resorts, boutique retailers, wellness spas, healthcare clinics, automotive & gadget repair centers, real estate agencies, creative studios, and professional service firms—WETAEGO delivers instant digital storefronts reachable via direct links (e.g. `ourmenuos.online/m/your-business`), custom QR codes, NFC tags, or custom domains.

---

## 🏗️ Architecture & Core Engines

### 1. Universal Design Tokens & 9 Multi-Templates
- **Token Engine (`design_tokens` JSONB)**: Fully abstracts visual aesthetics into semantic tokens:
  - **Layout Modes**: `bento_grid`, `masonry`, `list`
  - **Surface Styles**: `flat`, `glassmorphism`, `neumorphism`
  - **Corner Radii**: `none`, `sm`, `md`, `lg`, `xl`, `full`
  - **Typography**: `modern`, `elegant`, `playful`, `industrial`
- **Global vs Per-Page Scopes**: Global location styles with per-page overrides and a 1-click **"Revert to Global Settings"** fail-safe.
- **Live Visual Builder**: Split-screen desktop and draggable mobile bottom-sheet visual editor with real-time zero-refresh `postMessage` synchronization.

### 2. Tego Multimodal Live API (Voice & Vision)
- **Real-Time Multimodal Voice & Vision Streaming**:
  - Ultra-low latency bidirectional voice dialogue (16kHz PCM audio mic in, 24kHz PCM audio playback) with instant barge-in interruption.
  - **Tego Vision**: Continuous 1 FPS camera video ingestion allowing merchants to point their camera at physical menus, handwritten receipts, stockroom inventory, or kitchen dishes.
  - Secure server-minted ephemeral tokens (`/api/ai/live-token`).

### 3. Frontline Business-Adaptive AI Assistant
- **Dynamic Personas**: Automatically adapts identity to `"Tego • {businessName}"` with vertical-specific roles (Dining Assistant, Wellness Specialist, Property Guide, Scope & Quote Specialist).
- **Autonomous Public Tools**: Executes `addToCart`, `searchByDietaryAllergen`, `callStaffToTable`, `bookAppointmentSlot`, `submitCustomQuoteLead`.
- **Zero-Hallucination Guardrails**: Strictly bounded to verified live database records. If an inquiry is unlisted, Tego escalates to a human staff member.
- **Dashboard Human Handoff**: Alerts staff via real-time WebSocket push on `dashboard/orders` with full customer context.

### 4. Zero-Daemon Raw ESC/POS Thermal Receipt Printing
- **Direct Binary Driverless Printing**: Emits raw ESC/POS binary command streams directly across **WebUSB**, **WebSerial (RS232 COM)**, and **WebBluetooth**.
- **Hardware Integration**: Sends automated cash drawer kick pulses (`ESC p 0 25 250`) and hardware paper cuts (`GS V 66 0`) without background desktop spoolers or print popups.

### 5. Multi-Branch Fleets, Staff Intercom & BNPL Financing
- **1-Second Catalog Duplication**: Replicates entire multi-department supermarket catalogs across franchise locations in under a second (`duplicatePageAction`).
- **Real-Time Staff Intercom**: Push-to-talk voice radio, kitchen-to-server ready chimes, and floor assistance paging.
- **Customer IOU Tab BNPL Ledger**: In-house credit financing, customer credit limits, automated debt collection reminders, and merchant risk controls.
- **Viral Payment Roulette Game**: Built-in gamified bill splitting randomizer and interactive web tool at `/tools/who-pays-the-bill`.

### 6. Unified Wallet, Multi-Gateway & Agent-Native Payments
- **Atomic Two-Phase Commits**: Guarantees ledger balance consistency with automated rollback on third-party payment failures.
- **Multi-Gateway Settlement**: Supports Paystack & Bachs (Cards, Bank Transfers, USSD, Apple/Google Pay, and crypto USDC/USDT/SOL).
- **x402 & Machine Payment Protocol (MPP)**: Enables autonomous AI agents to settle orders and mint AI credits programmatically via HTTP 402 protocols.

---

## 🤖 14 Agent Discovery & Protocol Standards

WETAEGO leads the industry in autonomous AI agent readiness, implementing 14 open discovery and interoperability standards:

1. **RFC 8288 Link Headers**: Emits global HTTP `Link` response headers advertising API catalogs, docs, OpenAPI specs, OAuth servers, and agent skills.
2. **RFC 9727 API Catalog**: Published at `/.well-known/api-catalog` with `application/linkset+json`.
3. **OpenID Connect Discovery**: Configuration at `/.well-known/openid-configuration`.
4. **RFC 8414 OAuth Authorization Server**: Published at `/.well-known/oauth-authorization-server` with `agent_auth` block.
5. **RFC 9728 OAuth Protected Resource**: Metadata at `/.well-known/oauth-protected-resource`.
6. **WorkOS Auth.md**: Agent onboarding and credential instructions at `/auth.md`.
7. **Agent Skills Index (RFC v0.2.0)**: Published at `/.well-known/agent-skills/index.json` with SHA-256 digests.
8. **WebMCP Browser AI Agent API**: Standard W3C in-browser commerce tools registered via `document.modelContext.registerTool()` across all storefronts.
9. **Agentic Resource Discovery (ARD)**: Manifest at `/.well-known/ai-catalog.json` with URNs and embedding queries.
10. **Coinbase x402 Protocol**: HTTP 402 agent micropayment facilitator at `/.well-known/x402.json` and `/api/x402`.
11. **Machine Payment Protocol (MPP)**: Manifest at `/.well-known/mpp.json` and `x-payment-info` in `openapi.json`.
12. **Universal Commerce Protocol (UCP)**: Commerce profile at `/.well-known/ucp`.
13. **Agentic Commerce Protocol (ACP)**: Discovery manifest at `/.well-known/acp.json`.
14. **DNS for AI Discovery (DNS-AID)**: Documented SVCB/HTTPS service discovery at `/.well-known/dns-aid.json`.
15. **Content Signals**: Directives declared in `robots.txt` (`Content-Signal: ai-train=no, search=yes, ai-input=yes`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Server Actions, `proxy.ts` edge proxy)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime WebSockets)
- **AI Infrastructure:** Real-time Multimodal Live Audio/Vision + Vercel AI SDK
- **Caching & Rate Limiting:** Upstash Redis (Edge rate-limiting & WAF)
- **State Management:** Zustand + `idb-keyval` IndexedDB persistence
- **Styling & UI:** Tailwind CSS v4 + Framer Motion
- **Observability:** Sentry (Client, Server, Edge)

---

## 💻 Running the Application

### Live Platform
**[https://ourmenuos.online](https://ourmenuos.online)** *(Preview domain prior to public TLD rollout)*

### Running Locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to access the local environment.

### Technical & Agent Documentation
- **Developer Portal**: `https://ourmenuos.online/docs`
- **OpenAPI 3.1.0 Spec**: `https://ourmenuos.online/openapi.json`
- **Full Architecture Spec**: `https://ourmenuos.online/llms-full.txt`
- **Concise LLM Feed**: `https://ourmenuos.online/llms.txt`
- **Agent Instructions**: `https://ourmenuos.online/agent-instructions.md`
- **Auth.md Guide**: `https://ourmenuos.online/auth.md`
- **Model Context Protocol (MCP)**: `https://ourmenuos.online/.well-known/mcp.json`
