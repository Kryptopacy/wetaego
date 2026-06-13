# OurMenu OS

OurMenu OS is a SaaS product for hospitality businesses that need live, customer-facing menus and availability pages reachable from a custom QR code.

The wedge is simple: restaurants, lounges, cafes, bars, food trucks, and similar businesses should be able to update prices, specials, and stock status in seconds without reprinting menus or forcing customers to ask staff what is available.

## Product Thesis

Do not build another QR menu generator. Build the live operating layer for what customers can see, buy, ask about, and trust right now.

## Initial Focus

- Lounges and bars with changing drinks, bottle service, happy hour, and event menus.
- Cafes, bakeries, and food trucks with frequent sell-outs.
- Restaurants with specials, seasonal items, or price changes.
- Hospitality venues that need branded pages without app downloads.

## Pricing & Feature Tiers

OurMenu OS offers three tiered subscription plans, driven by a unified credit system that seamlessly up-sells usage into Pro and Enterprise plans.

### 🟢 Starter Plan (₦0 / 30-day trial)
*Perfect for testing the system at a single venue.*
- **Credits:** 0 Monthly Credits (Pay-as-you-go required for premium tools and extra pages)
- **Locations:** 1 active location
- **QR Codes:** Up to 2 active QR codes/tables
- **AI Waiter:** Guest-facing conversational AI chat assistant
- **Edge Translator:** Real-time menu translation for 40+ languages

### 🔵 Pro Plan (₦49,000 / month)
*For serious operators who want every edge.*
- **Credits:** 50 Monthly Credits (Refreshes every month)
- **Locations:** 1 active location
- **QR Codes:** Unlimited QR codes/tables
- **Features included from Starter:** AI Waiter, Edge Translator
- **Premium AI Tools:** AI Copywriter (Menu Descriptions) & AI Image Studio (Venue Covers)
- **KDS & Operations:** Smart Request Triaging (Instant urgency classification)
- **Analytics:** Demand Forecasting Engine (Predicting stock & sales)
- **Custom Pages:** 1 Page included (Additional pages cost 10 Credits each)
- **Team:** Role-based team management (Owners, Managers, Viewers)
- **Support:** Priority WhatsApp support

### 🟣 Enterprise Plan (Custom Pricing)
*For hotel chains and multi-location brands.*
- **Credits:** 200 Monthly Credits
- **Locations:** Multi-location dashboard (Manage multiple venues under one org)
- **Features included from Pro:** All premium AI tools, unlimited QR codes, KDS, forecasting, custom pages, team management
- **AI Customization:** Dedicated AI model fine-tuning (Tailored specifically to the brand's exact tone)
- **Integrations:** Direct API access for PMS (Property Management System) integration
- **Support:** Dedicated account manager & custom onboarding SLA

## Repo Layout

- `docs/PRODUCT_PLAN.md`: working product plan, viability audit, roadmap, and assumptions.
- `docs/PRODUCTION_READINESS.md`: production architecture, env contract, and launch checklist.
- `docs/DECISIONS.md`: decision log for product and technical calls.
- `apps/web/`: future customer-facing SaaS dashboard and public menu app.
- `packages/core/`: shared domain models and business logic.
- `supabase/migrations/`: production database schema migrations.

## Current Status

We have completed **Phase 5: Operations & Scaling** and just concluded a massive **Phase 5.5 Security & Architecture Audit**. OurMenu OS is now a highly secure, production-ready, multi-tenant SaaS application.

### 🌟 Recently Completed Upgrades (Phase 6 & Security Audit)
- **Staff Operations & Order Claiming:** Atomic RPC-backed order claiming to prevent kitchen race conditions, live Dynamic Island-style progress tracking for customers, and real-time active order synchronization via Supabase subscriptions.
- **Performance Tracking & Tipping:** Post-service customer feedback loop with 1-5 star ratings for individual staff and integrated secondary Paystack tipping flows, ensuring "flawless service is earned, not expected."
- **Comprehensive Security Remediation:** Eliminated all Supabase Advisor warnings. Upgraded database architecture with `SECURITY DEFINER` RPC functions for atomic operations (like token-based invite acceptance), closed unauthenticated data leaks, and added strict referential integrity checks via RLS.
- **Unified Credit System:** Consolidated feature pricing under a single, robust credits architecture for AI tools, translation, and custom pages.
- **Dynamic QR Provisioning:** Multi-table scan-to-assign workflows, QR code color themes, table locking, and live reassignments.
- **SaaS Subscription Billing:** Monthly Paystack Pro subscriptions with live USD/NGN exchange rate updates, webhook lifecycle sync, and subscription layout enforcers.
- **Team Management:** Invite links (`/invite?token=xyz`), role validation (Owner, Manager, Editor, Viewer), and secure database views for roster emails.

### 🚀 Upcoming: Phase 7 (Analytics & Growth)
We are beginning to scope out the next major iteration of OurMenu OS:
- **Deep Analytics Dashboard:** Visualizing staff performance, popular items, peak ordering times, and tip distribution logic.
- **AI-Powered Upselling:** Integrating Gemini intelligence directly into the cart flow to recommend complementary items before checkout.

### 🚀 Running the Application

To run the Next.js web application locally in development mode:

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.
To run the static production preview server:

```powershell
node scripts/serve.mjs
```

Then open [http://localhost:4173](http://localhost:4173).

