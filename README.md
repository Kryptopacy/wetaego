# OurMenu OS

![OurMenu OS Logo](./public/apple-touch-icon.png)

> **The Universal Digital Operating Layer for Modern Businesses**

---

OurMenu OS is a comprehensive, enterprise-grade **Business Operating System** engineered to power the customer-facing digital presence, real-time ordering, design customization, and deep backend workflows of physical and service businesses across 9 major industry templates.

Designed for high-traffic environments—such as restaurant chains, bustling lounges, hotel resorts, boutiques, wellness spas, clinics, real estate agencies, and creative studios—OurMenu OS delivers instant digital storefronts reachable via direct links (e.g. `ourmenuos.online/m/your-business`), custom QR codes, or custom domains.

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
- **Real-Time Gemini Live (`gemini-3.1-flash-live-preview`)**:
  - Ultra-low latency bidirectional voice dialogue (16kHz PCM audio mic in, 24kHz PCM audio playback) with instant barge-in interruption.
  - **Tego Vision**: Continuous 1 FPS camera video ingestion allowing merchants to point their camera at physical menus, handwritten receipts, stockroom inventory, or kitchen dishes.
  - Secure server-minted ephemeral tokens (`/api/ai/live-token`).

### 3. Frontline Business-Adaptive AI Assistant
- **Dynamic Personas**: Automatically adapts identity to `"Tego • {businessName}"` (or custom merchant name) with vertical-specific roles (Dining Assistant, Wellness Specialist, Property Guide, Scope & Quote Specialist).
- **Autonomous Public Tools**: Executes `addToCart`, `searchByDietaryAllergen`, `callStaffToTable`, `bookAppointmentSlot`, `submitCustomQuoteLead`.
- **Zero-Hallucination Guardrails**: Strictly bounded to verified live database records. If an inquiry is unlisted, Tego escalates to a human staff member.
- **Dashboard Human Handoff**: Alerts staff via real-time WebSocket push on `dashboard/orders` with full customer context and a 1-click **"✓ Mark Resolved"** workflow.

### 4. Unified Wallet & Split-Tender Checkout
- **Atomic Two-Phase Commits**: Guarantees ledger balance consistency with automated rollback on third-party payment failures.
- **Multi-Gateway Settlement**: Supports Paystack & Bachs (Local/International Cards, Bank Transfers, USSD, Crypto USDC/USDT/SOL, and IOU Customer Credit).

### 5. Progressive Web App (PWA) & Offline Sync
- **Service Worker Background Sync**: Powered by `@ducanh2912/next-pwa`. Orders, feedback, and service requests queue in IndexedDB (`offline-queue-store.ts`) when offline and sync seamlessly upon reconnection.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Server Actions, `proxy.ts` edge proxy)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime WebSockets)
- **AI Infrastructure:** `@google/genai` (Gemini Live Audio/Vision) + `@ai-sdk/google` (Vercel AI SDK)
- **Caching & Rate Limiting:** Upstash Redis (Edge rate-limiting & WAF)
- **State Management:** Zustand + `idb-keyval` IndexedDB persistence
- **Styling & UI:** Tailwind CSS v4 + Framer Motion
- **Observability:** Sentry (Client, Server, Edge)

---

## 💻 Running the Application

### Live Platform
Experience the platform instantly:
**[https://ourmenuos.online](https://ourmenuos.online)**

### Running Locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to access the local environment.

### Technical Documentation
- Full Specification: `https://ourmenuos.online/llms-full.txt`
- Concise LLM Index: `https://ourmenuos.online/llms.txt`
- Architecture Docs: `docs/architecture/`
- Feature Specs: `docs/features/`
