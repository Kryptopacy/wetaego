# Model Context Protocol (MCP) & WebMCP In-Browser Integration

OurMenu OS supports both server-to-server MCP connections and client-side in-browser WebMCP tool execution.

---

## 1. Model Context Protocol Server (`/.well-known/mcp.json`)

Autonomous LLMs can connect directly to OurMenu OS as an MCP server.

### Available Server Tools

| Tool Name | Description | Parameters |
|---|---|---|
| `ourmenu_query_catalog` | Search products and dishes with dietary and stock filters. | `locationId` (string), `query` (string), `dietary` (string) |
| `ourmenu_create_order` | Submit guest order with table ID and item selections. | `locationId` (string), `tableIdentifier` (string), `items` (array) |
| `ourmenu_check_availability` | Query appointment calendar slots for personal care & health services. | `locationId` (string), `date` (string), `serviceId` (string) |
| `ourmenu_request_staff` | Page floor staff or trigger table assistance chimes. | `locationId` (string), `tableIdentifier` (string), `reason` (string) |

---

## 2. WebMCP In-Browser Client Integration

OurMenu OS integrates the **WebMCP standard** (`navigator.modelContext.provideContext`) in `components/WebMcpProvider.tsx`. When an AI agent browses the storefront in a WebMCP-capable browser (like Google Chrome built-in AI), it gains instant execution hooks:

```ts
navigator.modelContext.provideContext({
  tools: [
    {
      name: 'ourmenu_search_catalog',
      description: 'Search products, menu items, or dishes on OurMenu OS with dietary filtering.',
      inputSchema: { ... },
      execute: async ({ query, dietary }) => { ... }
    },
    {
      name: 'ourmenu_find_venue',
      description: 'Find physical store or restaurant by slug or location.',
      inputSchema: { ... },
      execute: async ({ slug }) => { ... }
    },
    {
      name: 'ourmenu_payment_roulette',
      description: 'Launch or get status of interactive Payment Roulette bill splitting game.',
      inputSchema: { ... },
      execute: async ({ players }) => { ... }
    }
  ]
})
```
