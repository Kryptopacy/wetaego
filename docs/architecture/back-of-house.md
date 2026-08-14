# Back-of-House Operations Engine

OurMenu OS extends far beyond the customer-facing frontend into deep backend workflows designed for enterprise administrators and platform owners.

---

## 1. Back-of-House Architecture & Cron Pipeline

```mermaid
flowchart TD
    CronTrigger(["Scheduled Master Cron (Edge Trigger)"]) --> Orchestrator["Master Cron Orchestrator (/api/cron)"]
    
    Orchestrator --> Job1["Abandoned Cart Recovery Engine"]
    Orchestrator --> Job2["IOU Debt Repayment & Reminders"]
    Orchestrator --> Job3["Daily Metric Aggregations & Owner Digest"]
    Orchestrator --> Job4["Staff Shift Auto-Clockout Enforcement"]

    Job1 --> EmailOut1["Transactional Email (Resend)"]
    Job2 --> EmailOut2["Rich HTML IOU Payment Link"]
    Job3 --> EmailOut3["Daily Executive Briefing to Owners"]
    
    subgraph DevConsole ["Superadmin Developer Console"]
        Config["SaaS Pricing & Fee Control"]
        Credits["AI Credit Pricing Matrix"]
        ManualBypass["Global Payment Fallback Override"]
        TenantExport["Tenant CSV & Metrics Export"]
    end

    style CronTrigger fill:#0284c7,stroke:#38bdf8,color:#fff
    style Orchestrator fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style DevConsole fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style Job3 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
```

---

## 2. Master Cron Orchestrator

We bypass serverless limits by orchestrating background jobs within unified, rate-limited execution slots:

- **Abandoned Carts:** Identifies stranded checkout sessions and triggers re-engagement reminders.
- **IOU Reminders:** Intelligently identifies customers whose Store Credit balance exceeds organization thresholds and automatically dispatches rich HTML emails with direct payment links, enforcing minimum repayment percentages.
- **Automated Daily Reports:** Nightly cron jobs aggregate key business metrics (sales, velocity, feedback) and email summarized briefings directly to location owners.
- **Shift Enforcement:** Auto-closes overdue shifts if staff forgot to clock out at the end of the day.

---

## 3. Developer Console & Platform Controls

Platform owners have access to a centralized Superadmin Developer Console:

- **Global Configuration:** Instantly modify SaaS subscription pricing, platform fee percentages, and default trial periods dynamically without running SQL migrations.
- **Customizable AI Credit Economics:** Dynamically adjust the exact credit cost (e.g., 1 credit, 3 credits) for individual AI actions across the platform, including Tego Live, Demand Forecasting, Auto-Fill, and Image Studio.
- **Global Manual Fallback Overrides:** Instantly enforce a global bypass of the payment provider during regional downtimes, forcing all checkouts to use manual bank transfers.
- **Tenant Directory & Exports:** A bird's-eye view of all registered businesses with instant CSV generation for metrics.

---

## 4. Demo Mode Bypass

A dedicated `?demo=1` architectural flow allowing prospective users and investors to experience the full dashboard, analytics, and CRM mock data without creating an account. It intercepts authentication proxy logic and mounts read-only synthetic state.

---

## 5. Quotes Engine

A dedicated CRM pipeline for consultants, freelancers, and agencies to track, manage, and respond to custom B2B rate inquiries instantly.
