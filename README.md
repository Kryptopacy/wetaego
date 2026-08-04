# OurMenu OS

![OurMenu OS Logo](./public/apple-touch-icon.png)

> **The Universal Digital Operating Layer for Modern Businesses**

---

OurMenu OS is a comprehensive, enterprise-grade **Business Operating System** engineered to power the customer-facing digital presence and deep backend workflows of dynamic businesses. Designed for massive scale, it serves high-traffic environments like sprawling hotel chains, bustling super-clubs and lounges, multi-location restaurants, and high-volume supermarkets, while remaining perfectly adaptable for independent boutiques, spas, food trucks, and consultants.

By deploying dynamic, template-driven digital environments reachable instantly via a dedicated platform link (e.g., `ourmenuos.online/m/your-business`), custom QR codes, or upgraded custom domains, businesses completely bypass the friction of native app downloads. OurMenu OS delivers real-time catalogs, interactive service bookings, AI-driven operations, and a seamless omnichannel checkout experience—instantly, right in the browser.

---

## 🏗️ Architecture & Core Engines

OurMenu OS operates on a modern, deeply relational architecture combining Next.js 16, Supabase (PostgreSQL), and AI-driven automation. Below are the core operational engines powering the platform.

### 1. Loyalty & Rewards Engine (Phase 2 Upgrade)

A scalable, rules-based loyalty system designed to drive customer retention:

- **Dynamic Rule Presets:** Allows businesses to assign multipliers to loyalty points based on preset logic (e.g., "Triple Points on Upsell Items" or "Double Points on Weekends").
- **Real-Time Evaluation:** Calculates points atomically within the webhook payment processor.
- **Redemption & Wallet Escrow:** Points are converted to monetary value seamlessly at checkout, integrated deeply into the pre-paid wallet architecture.

### 2. Intelligent Upsell Engine (Phase 2 Upgrade)

An AI-powered sales assistant embedded directly in the checkout flow:

- **Configurable Modes (Auto vs. Curated):** Businesses can allow the AI to automatically analyze the full catalog or explicitly tag specific items (e.g., high-margin products) for upsell eligibility.
- **Context-Aware Recommendations:** Evaluates the guest's current cart and the business's `template_type` (e.g., restaurant vs. boutique) to generate exactly one highly complementary suggestion.
- **Graceful Fallbacks:** Uses robust circuit-breakers to fall back to static suggestions if the AI model is unavailable, ensuring zero disruption to the sales funnel.

### 3. Unified Wallet & Split-Tender Checkout

Built for high-trust commerce and multi-modal payments:

- **Atomic Rollbacks:** Implements an advanced two-phase commit strategy. If an external payment gateway (like Paystack) fails to initialize after an internal wallet deduction, the `wallet-service.ts` instantly rolls back the wallet balance, guaranteeing ledger accuracy.
- **Split Tenders:** Supports splitting bills across pre-paid wallet balances and credit/debit cards seamlessly in a single transaction.

### 4. Dynamic Portal Routing & Templating

- **Location Pages & Templates:** A business can spin up multiple "pages" (e.g., a restaurant menu, an event booking page, a retail catalog). If multiple pages exist, the platform dynamically renders a "Portal Nav" landing page.
- **Specialized Renderers:** Uses polymorphic rendering (e.g., `RestaurantRenderer`, `CatalogPageRenderer`, `BookingRenderer`) to adapt the UI specifically to the industry context while sharing the same underlying checkout infrastructure (`CartFAB`).

### 5. Progressive Web App (PWA) & Offline Sync

- **Service Worker Background Sync:** Powered by `@ducanh2912/next-pwa`, critical mutations (like submitting a booking, placing an order, or entering feedback) are queued in IndexedDB via `offline-queue-store.ts` if the user is offline, automatically re-syncing when connectivity is restored.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **State Management:** Zustand (with fully synchronized SSR hydration middleware)
- **Validation & Security:** Zod (Strict, impenetrable API boundaries)
- **AI Engine:** Google AI SDK (`@ai-sdk/google`) + Gemini 3.5 Flash
- **Caching & Rate Limiting:** Upstash Redis
- **Error Tracking & Observability:** Sentry (Configured across Client, Server, and Edge `proxy.ts`)
- **Styling & Animation:** Tailwind CSS v4 + Framer Motion
- **PWA Integration:** `@ducanh2912/next-pwa`

---

## 💻 Running the Application

### Live Demo

Experience the platform instantly:
**[https://ourmenuos.online](https://ourmenuos.online)**
*(Use the `?demo=1` parameter on specific routes to bypass login and explore the dashboard capabilities).*

### Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to access the local environment.

### Database Architecture & Migrations

The database schema heavily leverages PostgreSQL RPCs, triggers, and JSONB structures. Always use Supabase CLI to generate types after running migrations:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

> **Note on Edge Middleware:** This project utilizes an upgraded Next.js environment. Edge routing logic is located in `proxy.ts` at the project root, fully replacing traditional `middleware.ts` conventions.
