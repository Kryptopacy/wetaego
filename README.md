# OurMenu OS

OurMenu OS is a comprehensive SaaS platform designed to power the customer-facing digital presence of dynamic businesses. Originally built for hospitality, it has now expanded into a robust operating layer for retail, service professionals, boutiques, and consultants. 

By leveraging dynamic, template-driven pages reachable via custom QR codes or direct links, businesses can bypass app downloads to offer real-time catalogs, interactive bookings, digital rate cards, and seamless checkout experiences.

## Product Thesis

Do not build another static site generator or PDF QR menu. Build the live operating layer for what customers can see, buy, ask about, book, and trust right now.

## Expanded Scope & Business Types

OurMenu OS now supports a broad spectrum of industries beyond traditional hospitality through its flexible **Template Builders**:

- **Hospitality (The Core):** Live restaurant menus, bar bottle service, cafe sell-out tracking, food trucks.
- **Retail & Boutiques (Catalog Template):** Tech gadget shops, fashion boutiques, pharmacies, and local stores that need a quick, visual storefront with inventory and checkout.
- **Services (Booking Template):** Salons, spas, therapists, and tutors who need to showcase services, handle appointment slots, and collect deposits.
- **Consultants & Agencies (Rate Card Template):** Freelancers, marketing agencies, and consultants who need a polished digital rate card to share with clients for standardized pricing.
- **Real Estate & Automotive (Listings Template):** Property rentals, car dealerships, and equipment rentals requiring image-heavy, location-based galleries.

## Core Features & Elements

### 1. Template Builders & Dynamic Pages
Businesses are no longer limited to a single menu. The system supports multiple secondary pages (e.g., a restaurant can have a main menu, a catering rate card, and a VIP booking page) managed from a central dashboard.
- **Catalog Builder:** Title, categories, rich descriptions, and prices.
- **Booking Builder:** Service details, durations, maximum guests.
- **Rate Card Builder:** Tiered services and fixed pricing.

### 2. Omnichannel Payments & Manual Fallbacks
A resilient checkout engine powers the entire ecosystem:
- **Paystack Integration:** Seamlessly handles split payments, service charges, and automated reconciliation via Webhooks.
- **Global Manual Fallback:** If API keys are pending or the payment provider experiences downtime, the system automatically degrades to a "Manual Bank Transfer" workflow. Customers see localized bank details and instructions without blocking conversions.
- **Edge Functions:** Serverless edge functions reliably manage the payment webhook reconciliation, ensuring idempotency and instant order syncing.

### 3. Progressive Web App (PWA) & Native Notifications
OurMenu OS feels like a native app.
- **Service Workers:** Caching assets for offline resilience and near-instant load times.
- **Push Notifications:** Deeply integrated Web Push API ensures businesses receive instant, native push alerts (with sounds) on their devices the second a new order, booking, or quote inquiry is placed.

### 4. Branch Switcher & Multi-Location Management
Seamlessly scale operations across multiple venues from a single organization:
- **Dynamic Branch Switcher:** A unified dashboard layout allowing owners to instantly switch active branch contexts.
- **Scoped Data Views:** Live Operations (Orders), Menu Manager, QR Generator, and Team Performance dashboards automatically filter down to the active location securely via cookies.

### 5. Post-Service Feedback & Team Performance
Close the loop on customer satisfaction natively:
- **Table Tent Integration:** Printable QR codes automatically include a secondary code for guests to rate their meal directly from the table.
- **PIN-Protected Reviews:** Automated email receipts include a 4-digit PIN ensuring only verified customers can rate staff and business performance.
- **Team Performance Dashboard:** Gamified staff leaderboard tracking average service ratings, recent feedback, and total tips collected.

### 6. AI-Powered Operations
- **AI Waiter/Assistant:** A customizable, conversational agent that guides customers through the catalog or menu.
- **AI Generation:** Assisting businesses in writing high-converting item descriptions and generating professional cover images.
- **Edge Translator:** Real-time localization for international customers.

## Pricing & Feature Tiers

OurMenu OS offers three tiered subscription plans, driven by a unified credit system that seamlessly up-sells usage into Pro and Enterprise plans.

### 🟢 Lite Plan (₦19,999 / month)
*Perfect for testing the system at a single venue.*
- **Credits:** 0 Monthly Credits (Pay-as-you-go required for premium tools and extra pages)
- **Locations:** 1 active location
- **QR Codes:** Up to 2 active QR codes/tables
- **AI Waiter:** Guest-facing conversational AI chat assistant
- **Edge Translator:** Real-time menu translation for 40+ languages

### 🔵 Pro Plan (₦49,999 / month)
*For serious operators who want every edge.*
- **Credits:** 50 Monthly Credits (Refreshes every month)
- **Locations:** 1 active location
- **QR Codes:** Unlimited QR codes/tables
- **Features included from Lite:** AI Waiter, Edge Translator
- **Premium AI Tools:** AI Copywriter (Menu Descriptions) & AI Image Studio (Venue Covers)
- **KDS & Operations:** Smart Request Triaging (Instant urgency classification)
- **Custom Pages:** 1 Page included (Additional pages cost 10 Credits each)
- **Team:** Role-based team management (Owners, Managers, Viewers)

### 🟣 Enterprise Plan (Custom Pricing)
*For massive chains and multi-location brands.*
- **Credits:** 200 Monthly Credits
- **Locations:** Multi-location dashboard (Manage multiple venues under one org)
- **Features included from Pro:** All premium AI tools, unlimited QR codes, custom pages
- **Integrations:** Direct API access for PMS (Property Management System) integration

## 🤝 Affiliate & Referral System

OurMenu OS features a built-in Affiliate system designed for B2B growth:
- **Affiliate Dashboard:** Affiliates register and receive a unique referral code.
- **Organization Linking:** New organizations that register via referral links are permanently tied to their affiliate.
- **Automated Commissions:** Webhooks calculate a percentage commission (default 10%) on every subscription renewal and log it in `affiliate_earnings`.

## Repo Layout

- `docs/PRODUCT_PLAN.md`: working product plan, viability audit, roadmap, and assumptions.
- `apps/web/`: customer-facing SaaS dashboard and public progressive web app (PWA).
- `packages/core/`: shared domain models and business logic.
- `supabase/migrations/`: production database schema migrations.
- `supabase/functions/`: edge functions (webhooks, push notifications, reconciliations).

## Running the Application

### 1. Web Application (Next.js)

To run the web app locally in development mode:

```bash
cd apps/web
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) (or https://ourmenuos.online in production) to access the dashboard.

### 2. Supabase Edge Functions

To test Webhooks or Push Notifications locally, you need the Supabase CLI installed.

```bash
# Start the local supabase instance (if not already running)
supabase start

# Serve the edge functions locally
supabase functions serve
```
Make sure you have your `.env.local` populated with the appropriate Supabase anon keys, service roles, and VAPID keys for the web push system.
