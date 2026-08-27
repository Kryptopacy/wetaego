# Model Context Protocol (MCP) & WebMCP In-Browser Integration

OurMenu OS supports both server-to-server MCP connections and client-side in-browser WebMCP tool execution at the platform infrastructure layer.

---

## 1. Model Context Protocol Server (`/.well-known/mcp.json`)

Autonomous AI agents and LLM orchestration frameworks connect directly to OurMenu OS as an MCP server.

### Available Server Tools

| Tool Name | Description | Parameters |
|---|---|---|
| `ourmenu_query_catalog` | Search products, services, appointments, or dishes with attribute, specification, and stock filters. | `locationId` (string), `query` (string), `category` (string), `tags` (array) |
| `ourmenu_create_order` | Submit customer order with location ID, seat/table identifier, and customized variant selections. | `locationId` (string), `tableIdentifier` (string), `items` (array) |
| `ourmenu_check_availability` | Query appointment calendar slots for services, hospitality suites, or dining reservations. | `locationId` (string), `date` (string), `serviceId` (string) |
| `ourmenu_request_staff` | Page floor staff or trigger table/room assistance alerts. | `locationId` (string), `tableIdentifier` (string), `reason` (string) |

---

## 2. Universal WebMCP In-Browser Client Integration (`document.modelContext`)

OurMenu OS implements the **W3C WebMCP standard** via `components/webmcp/webmcp-provider.tsx` across all storefronts. 

When an AI browsing agent (such as **ChatGPT Desktop In-App Browser** or **Google Chrome 149+ with `#enable-webmcp-testing`**) navigates to any OurMenuOS tenant URL, the page automatically synthesizes and registers 8 context-aware tools:

```javascript
document.modelContext.registerTool({
  name: "search_catalog",
  description: "Search the active offerings, products, bookings, or services for this business.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword" },
      category: { type: "string", description: "Filter by department/category" },
      max_price: { type: "number", description: "Maximum price budget" },
      tags: { type: "array", items: { type: "string" }, description: "Attribute tags (e.g. ['vegan'], ['512gb'], ['waterfront'])" }
    }
  },
  execute: async (input) => { /* Live client search */ }
});
```

### Full In-Browser Tool Suite:
1. `search_catalog` — Universal attribute, specification, budget, and department search.
2. `get_item_details` — Deep item inspection with ingredient, specification, and modifier trees.
3. `add_to_cart` — Dispatches item with custom variant selections into the active Zustand/IndexedDB cart and triggers real-time visual UI feedback (Sonner toasts, badge animations).
4. `view_cart` — Real-time cart audit with itemized line totals, promo discounts, and bill splitting.
5. `update_cart_quantity` — Atomic quantity increments or item removal.
6. `clear_cart` — Empties cart state.
7. `call_staff_or_service` — Real-time staff assistance ping for active table, seat, or room identifiers.
8. `initiate_checkout` — Pre-fills order details and presents the **Human-in-the-Loop Safe Payment Gate** for customer confirmation.
