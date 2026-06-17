# OurMenu OS 📱🏨

OurMenu OS is a comprehensive, real-time hospitality operating system. Designed for restaurants, lounges, hookah bars, hotels, and event spaces, it goes far beyond just a digital menu. It provides a real-time availability catalog, frictionless ordering, dynamic table mapping, and a full Service Request & Fulfillment network.

## 🚀 Core Capabilities

1. **Availability-First Catalog:** Managers can toggle stock (e.g., "Sold Out", "Low Stock") directly from their phones, updating the customer-facing menu instantly in under 10 seconds.
2. **Frictionless Checkout & Tips:** Customers order and pay (with custom tipping) securely via Paystack directly from their phones. No app download or account required.
3. **Conversational AI Waiter:** An embedded, brand-aware AI assistant capable of answering menu questions, making contextual recommendations, managing the cart, and calling staff—all within a jailbreak-proof session.
4. **Service Requests:** Customers can tap to request service (e.g., "Need Shisha Coal", "Clean Table", "Call Manager") which pings the dashboard immediately.
5. **Live Fulfillment Dashboard (KDS):** A real-time display for the Service Team to manage active orders and pending table requests seamlessly.

## 🛠️ Technical Architecture

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Realtime, RLS)
- **State Management:** Zustand (Client Persistence)
- **Styling:** Tailwind CSS + Framer Motion
- **Payments:** Paystack (Webhooks, Idempotency, Custom Tips)
- **Notifications:** Termii (WhatsApp/SMS async queues)
- **Analytics:** PostHog

## 📱 Operational Flow

### 1. Catalog & Organization Management
The Owner logs into the OurMenu OS dashboard to set up their Organization and Locations. They build out Categories and Items, upload rich media, and customize their brand colors.

### 2. Dynamic QR Provisioning (Scan-to-Assign)
Instead of printing hardcoded table numbers, venues print batches of **Generic QR Codes**.
1. **Provision:** A Host or Staff Member places a generic QR sticker on a table/cabana. They scan it with their phone, and the system asks "Which location/table is this?". They input "VIP Cabana 4". The database binds that physical QR code to that location.
2. **Reassign:** If tables are merged for a large event, the Staff Member rescans the code and updates the assignment in seconds. No re-printing required.

### 3. The Customer Experience
1. The guest arrives and scans the QR code at their table or cabana.
2. They are routed to the Edge-cached public interface (`/m/[slug]`).
3. The session securely locks to "VIP Cabana 4" based on the QR ID.
4. The guest can browse the live catalog, chat with the intelligent **AI Waiter** for personalized recommendations, send a Service Request, or add items to their persistent Cart and pay securely via Paystack.

### 4. The Live Fulfillment Dashboard
1. The Paystack Webhook hits the Next.js API, verifies the signature, ensures idempotency, and marks the Order as `paid`.
2. **Supabase Realtime** broadcasts the event directly to the venue's Dashboard.
3. The Service Team's screen flashes with the new order or Service Request for "VIP Cabana 4" instantly.
4. Background tasks trigger WhatsApp notifications via Termii to the Manager's phone for high-priority alerts.

## 👥 Multi-Tenant Architecture & Roles

OurMenu OS supports full multi-tenancy:
- **Organizations:** The top-level billing/business entity (e.g., "The Hospitality Group").
- **Locations:** Distinct physical venues (e.g., "Downtown Lounge"). Each gets a unique slug (`ourmenuos.online/m/downtown`) and its own currency/theme.
- **Roles & Permissions:** Strict Row Level Security (RLS) combined with layout-level checks protects business data:
  - **Owner**: Full control. Can manage business settings, bank/payout configurations, subscriptions, and team invites/members.
  - **Manager**: Full administrative control over menus, catalog, orders, and QR generation. Can view the team roster but cannot invite or remove members.
  - **Editor**: Access is limited to Menu Manager (adding items, updating prices/availability) and Live Fulfillment. Cannot view settings, billing, or team management.
  - **Viewer (Service/Host Staff)**: Restricted to the Live Fulfillment Dashboard (Orders/Service Requests) and table QR provisioning. Cannot modify the catalog, settings, billing, or team list.

### ✉️ Team Invite & Verification System
To add members, the Owner generates a single-use secure invite link from the **Team Management** dashboard:
1. An invite is generated with a secure token: `ourmenuos.online/invite?token=xyz`.
2. When the invitee visits the page, they are prompted to sign in or register under the invited email address.
3. Once authenticated, the system matches the emails and allows them to accept, automatically adding them to `organization_members` with their assigned role and deleting the token.
4. Emails are fetched securely via the `organization_member_details` security-definer PostgreSQL view, allowing owners to view rosters without breaking standard Supabase schema boundaries.

## 💳 SaaS Subscription Billing

To monetize the platform, OurMenu OS integrates a full subscription lifecycle:
1. **30-Day Free Trial:** New organizations get 30 days of free access.
2. **Subscription Enforcer:** Once the trial expires, a layout-level banner blocks access to dashboard functions and public guest ordering is automatically suspended.
3. **Paystack Integration:** Owners can initiate a monthly billing checkout ($39/mo).
4. **USD/NGN Exchange Rate:** To ensure local Nigerian businesses pay the exact NGN equivalent of $39/mo, checkouts dynamically fetch and cache live exchange rates from Open Exchange Rates APIs.
5. **Webhook Lifecycle:** `/api/webhooks/billing` listens for Paystack subscription creation and status changes, keeping Supabase synced in real time.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

Visit `http://localhost:3000` (or `https://ourmenuos.online` in production) to access the application.

## 🔒 Security Highlights
- **Underpayment Fraud Prevention:** Webhooks strictly compare the amount paid against the database `total_amount_minor` before marking an order as paid.
- **Idempotency:** Webhook events are logged to prevent double-processing.
- **Strict RLS:** Supabase Row Level Security ensures cross-tenant data leakage is impossible at the database level.

