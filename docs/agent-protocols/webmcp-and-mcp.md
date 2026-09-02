# Model Context Protocol (MCP) & WebMCP In-Browser Integration

WETAEGO supports both server-to-server MCP connections and client-side in-browser WebMCP tool execution at the platform infrastructure layer.

---

## 1. Model Context Protocol Server (`/.well-known/mcp.json` & `/api/mcp`)

Autonomous AI agents and LLM orchestration frameworks connect directly to WETAEGO as an MCP server.

### Available Server Tools

| Tool Name | Description | Parameters |
|---|---|---|
| `wetaego_query_catalog` | Search products, services, appointments, or dishes with attribute, specification, and stock filters. | `locationId` (string), `query` (string), `category` (string), `tags` (array) |
| `wetaego_create_order` | Submit customer order with location ID, seat/table identifier, and customized variant selections. | `locationId` (string), `tableIdentifier` (string), `items` (array) |
| `wetaego_check_availability` | Query appointment calendar slots for services, hospitality suites, or dining reservations. | `locationId` (string), `date` (string), `serviceId` (string) |
| `wetaego_request_staff` | Page floor staff or trigger table/room assistance alerts. | `locationId` (string), `tableIdentifier` (string), `reason` (string) |

---

## 2. Universal WebMCP In-Browser Client Integration (`document.modelContext`)

WETAEGO implements the **W3C WebMCP standard** across both the global root platform (`components/WebMcpProvider.tsx`) and all storefronts (`components/webmcp/webmcp-provider.tsx`). 

### Layer A: Global Platform Discovery (`/`)
When an AI agent visits the platform, it registers:
- `wetaego_find_venue` — Real-time search across all registered businesses, multi-concept pages, locations, and industries via `/api/businesses/search`.

### Layer B: Contextual Storefront Tools (`/m/[slug]`)
When an AI browsing agent (such as **ChatGPT Desktop In-App Browser** or **Google Chrome 149+ with `#enable-webmcp-testing`**) navigates to any WETAEGO tenant URL, the page automatically synthesizes and registers context-aware tools:

```javascript
document.modelContext.registerTool({
  name: "search_catalog",
  description: "Search the active offerings, products, bookings, or services for this business.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword" },
      category: { type: "string", description: "Filter by department/category" },
      maxPrice: { type: "number", description: "Maximum price budget" },
      dietary: { type: "array", items: { type: "string" }, description: "Dietary tag filters" },
      inStockOnly: { type: "boolean", default: true, description: "Filter available items only" }
    }
  },
  execute: async (input) => { /* Live client search */ }
});
```

### Full In-Browser Tool Suite:
1. `search_catalog` — Universal multi-industry catalog, product, service, stay, and booking search with multi-category filters (sizes, condition, dietary, capacity, duration).
2. `get_item_details` — Authoritative item inspection with variants, modifiers, specifications, sizing, warranties, and attributes across all commerce verticals.
3. `create_cart` — Initialize or fetch session-scoped cart state.
4. `add_to_cart` — Dispatches items, bookings, or services with custom modifier selections into the active Zustand/IndexedDB cart and triggers real-time visual UI feedback (ambient HUD beacon, Sonner toasts, badge animations).
5. `get_cart` (alias `view_cart`) — Real-time cart audit with itemized line totals, discounts, and validated pricing.
6. `update_cart` (alias `update_cart_quantity`) — Atomic quantity adjustments or item removal.
7. `recommend_pairings` — Contextual AI up-sell recommendations (sides, accessories, add-ons, complementary treatments) based on current cart contents.
8. `initiate_checkout` — Pre-fills order/booking details and returns a **15-minute price lock guarantee (`expiresAt`)** while presenting the **Human-in-the-Loop Safe Payment Gate**.
9. `submit_order` — Mandatory human authorization gate requiring explicit customer confirmation (`confirmed: true`) before charging or finalizing the order or booking.
10. `request_staff` (alias `call_staff_or_service`) — Immediate in-venue service dispatch for active table, seat, suite, or room identifiers.

---

## 3. Enterprise Staff MCP Server (`/api/mcp`) & 1-Click Exporter

For external enterprise AI agents (Claude Desktop, Cursor, windsurf, or nightly audit bots), WETAEGO exposes a Bearer-authenticated JSON-RPC 2.0 endpoint at `POST /api/mcp`.

Merchants and developers can click **"Export MCP Config"** inside the WebMCP Tester to copy ready-to-paste configurations for **Claude Desktop** (`claude_desktop_config.json`), **Cursor** (`.cursor/mcp.json`), **OpenAI Custom Actions**, and **cURL**.
