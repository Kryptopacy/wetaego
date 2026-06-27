<div align="center">
  <img src="./apps/web/public/apple-touch-icon.png" width="120" height="120" alt="OurMenu OS Logo" />
  <h1>OurMenu OS</h1>
  <p><strong>The Universal Digital Operating Layer for Modern Businesses</strong></p>
</div>

---

OurMenu OS is a comprehensive, enterprise-grade SaaS platform engineered to power the customer-facing digital presence of dynamic businesses. Originally architected for the hospitality industry, it has evolved into a highly scalable, multi-tenant operating layer serving retail boutiques, service professionals, spas, consultants, and real estate agencies.

By deploying dynamic, template-driven digital environments reachable via custom QR codes, NFC tags, or direct links, businesses completely bypass the friction of native app downloads. OurMenu OS delivers real-time catalogs, interactive service bookings, intelligent digital rate cards, and a seamless omnichannel checkout experience—instantly, right in the browser.

---

## 🎯 Product Thesis

**Do not build another static site generator. Do not build another PDF QR menu.** 
Build the live, intelligent, and deeply integrated operating layer for what customers can see, buy, request, book, and trust *right now*.

---

## 🏗️ World-Class Architecture & Enterprise Security

OurMenu OS is engineered for massive scale, zero downtime, and bank-grade security. It passes the strictest enterprise audits out-of-the-box:

- **Impenetrable API Boundaries (Zod):** Every single Server Action and API route is rigorously validated via strict `zod` schema typing. It is mathematically impossible for malformed payloads to reach the database layer.
- **Absolute IDOR Protection:** Deep relational authorization matrices ensure that hardware provisioning (QR mapping), location configurations, and page builder tools are cryptographically isolated. A malicious actor cannot modify or access data belonging to another tenant or location.
- **Flawless React SSR Hydration:** Utilizing advanced Zustand `skipHydration: true` middleware synchronized perfectly with React lifecycle hooks, the platform guarantees zero UI flashing, layout shifts, or Server-Side Rendering (SSR) mismatches between the Edge server and the client browser.
- **XSS & HTML-Injection Hardened:** All user-generated content passing through email notifications, push payloads, and template rendering is aggressively escaped, sanitized, and type-checked.
- **N+1 Query Elimination & Infinite Scale:** Core notification and dispatcher systems utilize highly parallelized `Promise.all` fetching strategies. Meanwhile, data-heavy dashboards (like CRM and Order History) employ strict **cursor-based pagination**, bypassing Vercel/Serverless timeout constraints and guaranteeing instant execution whether an organization has 5 records or 5,000,000.
- **GDPR-Compliant Marketing Queues:** Enforced opt-in filtering for customer marketing communications, paired with background queues for bulk email dispatches to eliminate 504 timeouts at scale.
- **Storage Protection (Denial of Wallet Defense):** Cloud storage buckets are natively locked to strict file sizes (e.g. 5MB) and MIME-type whitelists (WebP, PNG, JPEG) to prevent malicious bulk uploads and SDK exploitation.
- **WCAG 2.1 Accessibility Compliance:** The platform delivers premium mobile UI flows with fluid focus trapping, strict ARIA attribute integrations (`aria-expanded`, `aria-controls`, `role="dialog"`), and seamless screen-reader support.

---

## 🏬 Multi-Business Universal Templates

OurMenu OS is fundamentally decoupled from the concept of a "restaurant." It is a true multi-business platform, dynamically rendering the correct UI based on the active **Template Builder**:

1. **Hospitality (The Core):** Live restaurant menus, bar bottle service, dynamic cafe sell-out tracking, and food trucks.
2. **Retail & Boutiques (Catalog Template):** Tech gadget shops, fashion boutiques, pharmacies, and local stores requiring a highly visual storefront, inventory management, and instant checkout.
3. **Services (Booking Template):** Salons, spas, therapists, and tutors who need to showcase services, handle complex appointment slots, and collect upfront deposits.
4. **Consultants & Agencies (Rate Card & Quote Templates):** Freelancers, marketing agencies, and consultants deploying polished, interactive digital rate cards for standardized B2B pricing, alongside dynamic Quote Generator templates.
5. **Real Estate & Automotive (Listings Template):** Property rentals, car dealerships, and equipment rentals requiring image-heavy, location-based galleries.
6. **Portal Mode:** A dynamic macro-landing page that seamlessly routes customers to multiple specialized sub-pages (e.g., A massive Hotel routing guests to a Restaurant menu, a Spa booking page, and a Room Service catalog from a single QR scan).

---

## 🚀 Core Features & Engines

### 1. The Omnichannel Checkout & Monetization Engine
A resilient, globally aware checkout engine powers the entire ecosystem:
- **Paystack Native Integration:** Seamlessly handles split payments, automated service charges, and real-time reconciliation via cryptographic Webhooks.
- **Automated SaaS Ledger (Platform Fees):** A transparent, built-in ledger system that extracts a configurable SaaS platform fee (e.g., 2%) on every transaction, driving pure MRR beyond monthly subscriptions.
- **Enterprise Tax & Compliance Engine:** Dynamically calculates localized taxes (e.g., VAT, State Taxes) and applies them accurately before reaching the payment gateway, providing transparent itemized receipts for strict global compliance.
- **Global Manual Fallback:** If API keys are pending or the payment provider experiences regional downtime, the system automatically degrades to a localized "Manual Bank Transfer" workflow, ensuring conversions are never blocked.
- **Omnichannel Logistics & Per-Page Routing:** Full, robust support for Dine-in (Table-specific QR mapping), Pickup, and Delivery (with interactive delivery zones, SMS phone verification, and dynamic fees). Fulfillment logic is highly granular, allowing **per-page configuration** (e.g., a "Room Service" page forces table delivery, while a "Lobby Cafe" page allows pickup).

### 2. Live Fulfillment Dashboard (formerly KDS)
Re-architected to serve any industry, the **Live Fulfillment Dashboard** is a real-time, WebSocket-powered operations center:
- **Universal Tracking:** Tracks incoming restaurant orders, spa booking requests, and retail pickup orders simultaneously.
- **Advanced Triaging & Deep Search:** Instantly filters active states (Pending, Preparing, Paid), calculates prep times, and supports deep-searching globally by Table ID, Order ID, and specific item names.
- **Fulfillment States:** Seamless drag-and-drop state transitions from "Received" to "In Progress" to "Fulfilled."

### 3. PWA & True Native App Experience
OurMenu OS feels indistinguishable from a native iOS/Android application:
- **Service Workers:** Caching assets for offline resilience and near-instant load times (via `next-pwa`).
- **Web Push Notifications:** Deeply integrated Web Push API ensures businesses receive instant, native alerts (with sounds) on their devices the second a new order or booking is placed.
- **Bulletproof International Messaging:** Integrated Termii API for automated fallback WhatsApp and SMS notifications, backed by aggressive Regex parsing to seamlessly handle global phone formats (e.g., `+1 (415)...` or `0803...`).
- **Premium Fluid Aesthetics:** Global integration of `framer-motion` guarantees 60fps spring-physics animations, staggered layout reveals, and frosted-glass micro-interactions.

### 4. Enterprise Fleet & Location Management
Seamlessly scale operations across multiple venues, cities, or countries from a single organization:
- **Dynamic Branch Switcher:** A unified dashboard allowing owners to instantly swap active branch contexts.
- **Decoupled Hardware Provisioning & Smart Routing:** Print thousands of generic "dummy" QR codes in bulk, deploy them globally, and securely re-map them remotely. QR codes can be dynamically routed to specific location pages (e.g. routing directly to a "Room Service" sub-page or "Spa Bookings") from the dashboard without ever reprinting physical assets.
- **Scoped Data Views:** Operations, Menu Managers, and Analytics dashboards automatically and securely filter down to the active location context via encrypted cookies.

### 5. AI-Powered Operations
- **Conversational AI Assistant:** A customizable, domain-aware conversational agent that guides customers through the catalog, menu, or services.
- **AI Copywriter & Image Studio:** Generative AI deeply integrated into the Page Builder, assisting businesses in writing high-converting item descriptions and generating stunning, professional cover images on the fly.
- **AI Demand Forecasting (`/api/ai/forecast`):** Analyzes 30-day sales velocity and utilizes Google Gemini to predict 7-day demand trajectories, issuing smart inventory alerts (Critical, Order Soon, Sufficient).
- **Smart Upselling Engine (`/api/upsell`):** Intelligent checkout add-on engine dynamically analyzes cart contents to suggest highly relevant cross-sells, maximizing Average Order Value (AOV).

### 6. CRM, Loyalty & Gamification
- **Customer Profiles & LTV:** Automatically builds rich CRM profiles at checkout, tracking Lifetime Value (LTV), order frequency, and marketing opt-ins.
- **Bespoke Loyalty Programs:** Organizations can launch custom point-based reward systems, configurable down to the fractional currency unit.
- **Payment Roulette:** A gamified "spin to win" bill-splitting module that transforms the friction of group payments into a highly engaging, viral experience.
- **PIN-Protected Post-Service Feedback:** Automated email receipts include a cryptographic 4-digit PIN ensuring only verified customers can rate staff performance, populating the gamified Team Performance Leaderboard and the centralized **Feedback Inbox** within the dashboard.

### 7. Live Inventory & Intelligent Cancellation Engine
- **Atomic Stock Management:** Items can optionally track finite units via robust, race-condition-free database RPCs, automatically switching to "Sold Out" when availability runs out.
- **Order Cancellation Lifecycle:** Businesses can safely reject/cancel orders, logging a strict cancellation reason for analytics while offering front-desk operations the choice to restock rejected inventory instantly or withhold it.
- **Optimistic UI Validation:** Fully responsive UI updates allow waitstaff and cashiers to modify stock limits dynamically from the dashboard, synchronizing globally without page refreshes.

### 8. Back-of-House Operations Engine
OurMenu OS is a true operating system, extending far beyond the customer-facing frontend into deep backend workflows:
- **Demo Mode Bypass:** A dedicated `?demo=1` architectural flow allowing prospective users to experience the full dashboard, analytics, and CRM mock data without creating an account.
- **Automated Daily Reports:** Nightly cron jobs that aggregate key business metrics (sales, velocity, feedback) and email summarized briefings directly to owners.
- **Quotes Engine:** A dedicated pipeline for consultants, freelancers, and agencies to track, manage, and respond to custom B2B rate inquiries instantly.
- **Properties & Shifts Management:** Dedicated infrastructure for scheduling staff shifts and managing complex real estate and lodging templates.
- **Developer Console & Metrics Export:** Deep administrative tooling allowing platform owners to export cross-organizational analytics (e.g., Hackathon metrics, platform-wide sales volume) instantly.

---

## 💳 Pricing & Feature Tiers

OurMenu OS monetizes via three tiered subscription plans, driven by a unified credit system that seamlessly up-sells usage into Pro and Enterprise tiers.

### 🟢 Lite Plan (₦14,999 / month)
*Perfect for testing the system at a single venue.*
- **Credits:** 10 Monthly Credits
- **Locations:** 1 active location
- **QR Codes:** Up to 2 active QR codes/tables
- **AI Assistant:** Customizable, domain-specific AI Assistant (guest-facing chat)
- **Edge Translator:** Real-time menu translation for 40+ languages

### 🔵 Pro Plan (₦49,999 / month)
*For serious operators who want every edge.*
- **Credits:** 50 Monthly Credits (Refreshes every month)
- **Locations:** 1 active location
- **QR Codes:** Unlimited QR codes/tables
- **Premium AI Tools:** AI Copywriter & AI Image Studio
- **Operations:** Live Fulfillment Dashboard & Smart Request Triaging
- **Forecasting:** AI-driven inventory and sales forecasting engine
- **Custom Pages:** 1 Page included (Additional pages cost 10 Credits each)

### 🟣 Enterprise Plan (Custom Pricing)
*For massive chains and multi-location brands.*
- **Credits:** 200 Monthly Credits
- **Locations:** Multi-location dashboard (Manage multiple venues under one org)
- **Features included:** All premium AI tools, unlimited hardware provisioning, custom portals.
- **Integrations:** Direct API access for PMS (Property Management System) integration.

---

## 🤝 Affiliate & Referral System (B2B Growth)
OurMenu OS features a built-in Affiliate system designed for aggressive B2B scaling:
- **Affiliate Dashboard:** Partners register to generate unique referral codes.
- **Hard-Linked Organizations:** New tenants that register via referral links are permanently cryptographically tied to their affiliate.
- **Automated Rev-Share:** Automated Webhooks calculate a percentage commission (default 10%) on every single subscription renewal and log it directly in `affiliate_earnings` for instant payout.

---

## 🛠️ Tech Stack & Repo Layout

- **Framework:** Next.js 16 (App Router, Server Actions, async `params`)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **State Management:** Zustand (with fully synchronized SSR hydration middleware)
- **Validation & Security:** Zod (Strict, impenetrable API boundaries)
- **AI Engine:** Google AI SDK (`@ai-sdk/google`) + Gemini 3.1 Flash
- **Caching & Rate Limiting:** Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- **Error Tracking & Observability:** Sentry (`@sentry/nextjs`)
- **End-to-End Testing:** Playwright (`@playwright/test`)
- **Styling & Animation:** Tailwind CSS v4 + Framer Motion
- **Payments & Comms:** Paystack (Webhooks), Termii (WhatsApp/SMS), Web Push API

### Repo Structure
- `docs/PRODUCT_PLAN.md`: working product plan, viability audit, roadmap, and assumptions.
- `apps/web/`: customer-facing SaaS dashboard and public progressive web app (PWA).
- `packages/core/`: shared domain models and business logic.
- `supabase/migrations/`: production database schema migrations.
- `supabase/functions/`: edge functions (webhooks, push notifications, reconciliations).

---

## 💻 Running the Application Locally

### 1. Web Application (Next.js)
```bash
cd apps/web
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) (or https://ourmenuos.online in production) to access the dashboard.

### 2. Supabase Edge Functions
To test Webhooks or Push Notifications locally, install the Supabase CLI:
```bash
# Start the local supabase instance
supabase start

# Serve the edge functions locally
supabase functions serve
```
*Note: Ensure your `.env.local` is populated with the appropriate Supabase anon keys, service roles, and VAPID keys for the web push system.*
