# OurMenu OS — Architecture & Documentation Structure

```text
.
├── README.md
├── AGENTS.md
├── proxy.ts                         # Edge middleware (WAF, Markdown negotiation, RFC 8288 Link headers)
├── docs/
│   ├── agent-protocols/             # 14 Agent Interoperability & Discovery Standards
│   │   ├── overview.md
│   │   ├── api-catalog-and-discovery.md
│   │   ├── auth-and-security.md
│   │   ├── webmcp-and-mcp.md
│   │   ├── agent-payments.md
│   │   └── skills-and-ard.md
│   ├── architecture/                # System & Backend Architecture
│   │   ├── ai-orchestration.md
│   │   ├── back-of-house.md
│   │   ├── data-layer.md
│   │   ├── fleet-and-rbac.md
│   │   ├── integrations.md
│   │   └── security-and-scale.md
│   ├── features/                    # Dedicated Feature Deep Dives
│   │   ├── checkout-and-payments.md
│   │   ├── crm-and-gamification.md
│   │   ├── design-system-and-templates.md
│   │   ├── inventory-and-bom.md
│   │   ├── pos.md
│   │   ├── pwa-and-seo.md
│   │   ├── self-service-and-ux.md
│   │   ├── team-and-intercom.md
│   │   └── tego-ai-and-live-multimodal.md
│   ├── pricing/                     # Pricing & Commercial Models
│   │   └── enterprise-pricing-guide.md
│   └── use-cases/                   # 9 Industry Vertical Solution Specs
│       ├── consultants-and-agencies.md
│       ├── hospitality.md
│       ├── portal-mode.md
│       ├── real-estate.md
│       ├── retail-and-b2b.md
│       ├── services.md
│       └── supermarkets-and-retail-chains.md
├── app/                             # Next.js App Router (Storefronts, Admin, APIs, .well-known routes)
├── components/                      # UI Components, WebMcpProvider, Layouts
├── lib/                             # Core stores, markdown content repository, printer drivers
└── public/                          # Static assets, manifests (.well-known), llms.txt, auth.md, openapi.json
```
