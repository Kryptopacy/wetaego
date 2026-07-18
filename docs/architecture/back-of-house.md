# Back-of-House Operations Engine

OurMenuOS extends far beyond the customer-facing frontend into deep backend workflows designed for enterprise administrators and platform owners.

## 1. Master Cron Orchestrator
We bypass Vercel Hobby tier limitations by orchestrating multiple background jobs within unified daily execution slots. The orchestrator triggers:
- **Abandoned Carts:** Identifies stranded checkout sessions and triggers re-engagement logic.
- **IOU Reminders:** Intelligently identifies customers whose Store Credit balance exceeds organization thresholds and automatically dispatches rich HTML emails with direct payment links, enforcing minimum repayment percentages.
- **Automated Daily Reports:** Nightly cron jobs aggregate key business metrics (sales, velocity, feedback) and email summarized briefings directly to location owners.

## 2. Developer Console & Metrics Export
Platform owners have access to a centralized Superadmin Developer Console:
- **Global Configuration:** Instantly modify SaaS subscription pricing, platform fee percentages, and default trial periods dynamically without running SQL queries.
- **Customizable AI Credit Economics:** Dynamically adjust the exact credit cost (e.g., 1 credit, 3 credits) for individual AI actions across the platform, including Demand Forecasting, Auto-Fill, and Image Generation.
- **Global Manual Fallback Overrides:** Instantly enforce a global bypass of the payment provider (Paystack) during regional downtimes, forcing all checkouts to use manual bank transfers.
- **Tenant Directory & Exports:** A bird's-eye view of all registered businesses with instant CSV generation for metrics (e.g., Hackathon data, investor reports).

## 3. Demo Mode Bypass
A dedicated `?demo=1` architectural flow allowing prospective users, investors, or hackathon judges to experience the full dashboard, analytics, and CRM mock data without creating an account. It intercepts authentication middleware and mounts read-only synthetic state.

## 4. Quotes Engine
A dedicated CRM pipeline for consultants, freelancers, and agencies to track, manage, and respond to custom B2B rate inquiries instantly.
