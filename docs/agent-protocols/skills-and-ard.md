# Agent Skills Index (RFC v0.2.0) & Agentic Resource Discovery (ARD)

This document details how agents inspect specialized skills and semantic capability embeddings on WETAEGO.

---

## 1. Agent Skills Index (`/.well-known/agent-skills/index.json`)

Complies with the **Agent Skills Discovery RFC v0.2.0** (`https://agentskills.io`):

```json
{
  "$schema": "https://agentskills.io/schema/v0.2.0/discovery.json",
  "version": "0.2.0",
  "skills": [
    {
      "name": "ourmenu-catalog",
      "type": "tool",
      "description": "Search, browse, and filter multi-industry catalogs across dining, retail fashion, electronics, serviced stays, wellness spas, gadget repairs, and media studios.",
      "url": "https://ourmenuos.online/.well-known/agent-skills/ourmenu-catalog/SKILL.md",
      "sha256": "c1312a14d37b8e38a32109ab17a7fdbb63c4a9bb4db27acd99140fba44ae79d4"
    },
    {
      "name": "ourmenu-ordering",
      "type": "tool",
      "description": "Submit and validate customer orders across table service, storefront retail checkout, delivery, and instant commerce.",
      "url": "https://ourmenuos.online/.well-known/agent-skills/ourmenu-ordering/SKILL.md",
      "sha256": "aa1bbf0d2630b8c681374880b4ef51d058f1c21d82cdf3828001b2c36cd402a0"
    },
    {
      "name": "ourmenu-booking",
      "type": "tool",
      "description": "Query availability calendars and schedule appointment bookings, hotel/stay reservations, and service slots with deposit processing.",
      "url": "https://ourmenuos.online/.well-known/agent-skills/ourmenu-booking/SKILL.md",
      "sha256": "11923144ba565d3462d4495feb2d51f8568e3e7b56da6cba3173ddf1980598d2"
    },
    {
      "name": "ourmenu-escpos-print",
      "type": "tool",
      "description": "Driverless direct binary ESC/POS thermal receipt printing over WebUSB, WebSerial, and WebBluetooth.",
      "url": "https://ourmenuos.online/.well-known/agent-skills/ourmenu-escpos-print/SKILL.md",
      "sha256": "c878a267d0422dd9fbbd6a5064a56c7b7924922edaddc53f9fdb2bd5fbbe4f27"
    }
  ]
}
```

---

## 2. Agentic Resource Discovery Manifest (`/.well-known/ai-catalog.json`)

Complies with the **ARD Spec** (`https://agenticresourcediscovery.org`):

```json
{
  "specVersion": "1.0",
  "host": {
    "domain": "ourmenuos.online",
    "name": "WETAEGO"
  },
  "entries": [
    {
      "identifier": "urn:air:ourmenuos.online:mcp:storefront-server",
      "id": "urn:air:ourmenuos.online:mcp:storefront-server",
      "displayName": "WETAEGO Multi-Concept Commerce MCP Server",
      "description": "Model Context Protocol tools for querying multi-concept catalogs (dining, boutique fashion, gadgets, serviced stays, spas, repairs, media rate cards), booking appointments, and placing orders.",
      "type": "application/json",
      "url": "https://ourmenuos.online/.well-known/mcp.json",
      "representativeQueries": [
        "Search catalog items, apparel, gadgets, and dishes across WETAEGO",
        "Book a wellness spa appointment, serviced loft, or hotel suite",
        "Request a device repair quote or creator media package",
        "Place an in-venue order or retail storefront checkout",
        "Check specifications, sizing, warranties, and dietary attributes"
      ]
    }
  ]
}
```
