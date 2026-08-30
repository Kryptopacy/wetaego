# WebMCP & Model Context Protocol (MCP) Specification — WETAEGO

> **OpenAI WebMCP Challenge Official Entry**  
> *"The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them."*

---

## 🌟 Architecture Overview

**WETAEGO** brings the **Web Model Context Protocol (WebMCP)** to digital commerce and operations at the platform infrastructure layer.

WETAEGO implements a dual-layer MCP architecture:

```
                                    ┌────────────────────────────────────────┐
                                    │               AI Agents                │
                                    └───────────────────┬────────────────────┘
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
            【 Client-Side WebMCP 】                                      【 Server-Side Staff MCP 】
            document.modelContext                                         https://ourmenuos.online/api/mcp
        (For In-Browser Browsing Agents)                              (For External Enterprise Automation Bots)
                         │                                                             │
                         ▼                                                             ▼
           • Public /m/[slug] Storefronts                                • Multi-Branch Fleet Management
           • Session-Scoped Cart Binding                                 • Live Order Dispatch & Fulfillment Board
           • Real-time Zustand/IndexedDB Sync                            • Automated Sales Auditing
           • Mandatory Human Authorization Gate                          • 86ing / Inventory Status
```

---

## 🛡️ Permission & Security Architecture

WETAEGO enforces strict least-privilege security boundaries:

| Layer | Protocol Surface | Authentication | Scope & Trust Boundary |
| :--- | :--- | :--- | :--- |
| **Customer WebMCP** | `document.modelContext` | Browser Session (Anonymous / Customer) | **Zero-Trust**: Session-scoped cart state. Prices, taxes, and availability are server-validated. **Mandatory human confirmation gate** before any order submission. |
| **Staff MCP** | `/api/mcp` | Bearer Token / Staff Session | **Role-Based (RBAC)**: Scoped to merchant or enterprise franchise organization. Provides access to order fulfillment, inventory 86ing, and sales analytics across any business model. |

---

## 🛍️ 1. Customer WebMCP Suite (`document.modelContext`)

When any browsing agent (e.g. **ChatGPT Desktop In-App Browser** or **Google Chrome 149+ with `#enable-webmcp-testing`**) navigates to any WETAEGO storefront (e.g. `https://ourmenuos.online/m/demo`), the page dynamically registers the following 8 canonical tools on `document.modelContext`:

### 1. `search_catalog`
* **Permission**: Public / Read-Only
* **Description**: Search the active offerings, products, dishes, bookings, or services for the venue. Filter by natural query, category, dietary flags, and price.
* **Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Natural-language search query." },
    "category": { "type": "string", "description": "Category name filter." },
    "dietary": {
      "type": "array",
      "items": { "type": "string", "enum": ["vegan", "vegetarian", "halal", "keto", "gluten_free", "dairy_free", "nut_free"] }
    },
    "maxPrice": { "type": "number", "minimum": 0 },
    "inStockOnly": { "type": "boolean", "default": true }
  },
  "additionalProperties": false
}
```

---

### 2. `get_item_details`
* **Permission**: Public / Read-Only
* **Description**: Return authoritative details for a catalog item, including price, availability, modifiers, dietary tags, and applicable options.
* **Input Schema**:
```json
{
  "type": "object",
  "required": ["itemId"],
  "properties": {
    "itemId": { "type": "string" }
  },
  "additionalProperties": false
}
```

---

### 3. `create_cart`
* **Permission**: Session-Scoped
* **Description**: Create or retrieve the current shopping cart for the active venue and customer session.
* **Input Schema**:
```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

---

### 4. `add_to_cart`
* **Permission**: Session / Cart Write
* **Description**: Add an available catalog item to the active cart using only valid modifier selections.
* **Input Schema**:
```json
{
  "type": "object",
  "required": ["itemId", "quantity"],
  "properties": {
    "itemId": { "type": "string" },
    "quantity": { "type": "integer", "minimum": 1, "maximum": 50 },
    "modifiers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["modifierId"],
        "properties": {
          "modifierId": { "type": "string" },
          "optionIds": { "type": "array", "items": { "type": "string" } }
        },
        "additionalProperties": false
      }
    },
    "notes": { "type": "string", "maxLength": 500 }
  },
  "additionalProperties": false
}
```

---

### 5. `get_cart`
* **Permission**: Session / Read
* **Description**: Return the current cart, validated prices, modifiers, taxes, fees, and authoritative server-calculated total.
* **Input Schema**:
```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

---

### 6. `update_cart`
* **Permission**: Session / Cart Write
* **Description**: Modify an existing cart line or remove it from the current cart. Quantity `0` removes the line.
* **Input Schema**:
```json
{
  "type": "object",
  "required": ["lineId"],
  "properties": {
    "lineId": { "type": "string" },
    "quantity": { "type": "integer", "minimum": 0, "maximum": 50 },
    "notes": { "type": "string", "maxLength": 500 }
  },
  "additionalProperties": false
}
```

---

### 7. `initiate_checkout`
* **Permission**: Checkout / Prepare (Non-Destructive)
* **Description**: Validate the current cart and prepare a checkout session. Calculates tax, fees, and grand total. **Does not authorize payment or submit the order.**
* **Input Schema**:
```json
{
  "type": "object",
  "required": ["fulfillment"],
  "properties": {
    "fulfillment": { "type": "string", "enum": ["dine_in", "pickup", "delivery"] },
    "tableIdentifier": { "type": "string" },
    "customer": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" }
      },
      "additionalProperties": false
    },
    "notes": { "type": "string", "maxLength": 1000 }
  },
  "additionalProperties": false
}
```

---

### 8. `submit_order` (MANDATORY Human Authorization Gate)
* **Permission**: High-Impact Transaction
* **Confirmation**: **MANDATORY HUMAN AUTHORIZATION**
* **Description**: Submit the reviewed checkout as a customer order after explicit human authorization.
* **Input Schema**:
```json
{
  "type": "object",
  "required": ["checkoutId", "authorization"],
  "properties": {
    "checkoutId": { "type": "string" },
    "authorization": {
      "type": "object",
      "required": ["confirmed"],
      "properties": {
        "confirmed": { "type": "boolean" },
        "confirmationId": { "type": "string" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

---

### 9. `recommend_pairings`
* **Permission**: Public / Read-Only
* **Description**: Suggest complementary catalog items, sides, drinks, or accessories based on the current cart or a specific item ID.
* **Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "itemId": { "type": "string", "description": "Optional focal item ID." },
    "maxRecommendations": { "type": "integer", "minimum": 1, "maximum": 10, "default": 3 }
  },
  "additionalProperties": false
}
```

---

### 10. `request_staff`
* **Permission**: Session Assistance
* **Description**: Send an immediate service or waiter call notification to venue staff.
* **Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "reason": { "type": "string" }
  },
  "additionalProperties": false
}
```

---

## 👔 2. Staff & Enterprise MCP Suite (`/api/mcp`)

While customer WebMCP runs in the browser, **Staff MCP** allows external AI agents (e.g. Claude Desktop, ChatGPT Enterprise Workspaces, Cursor, custom Python bots) to securely automate operations, inventory, and reporting across multi-branch enterprise locations.

### Endpoint
```
POST https://ourmenuos.online/api/mcp
Headers:
  Authorization: Bearer <MERCHANT_API_KEY>
  Content-Type: application/json
```

### Available Staff Tools

#### `get_active_orders`
* **Description**: Retrieve live incoming orders across a venue or franchise branch with real-time status and line items.
* **Input Schema**: `{ "locationId": "string", "status": "string" }`

#### `update_order_status`
* **Description**: Change operational order status (`accepted`, `preparing`, `ready`, `served`, `completed`, `cancelled`).
* **Input Schema**: `{ "orderId": "string", "status": "string", "reason": "string" }`

#### `mark_item_unavailable`
* **Description**: 86 / mark an item sold out across all storefronts and KDS screens in real-time.
* **Input Schema**: `{ "itemId": "string", "isAvailable": false, "reason": "string" }`

#### `get_daily_sales`
* **Description**: Aggregate daily gross revenue, order volume, and average ticket size for a single branch or across the entire enterprise organization.
* **Input Schema**: `{ "locationId": "string", "date": "YYYY-MM-DD" }`

#### `duplicate_catalog_to_branch`
* **Description**: Replicate a complete master catalog to a new franchise branch in under 1 second.
* **Input Schema**: `{ "sourceLocationId": "string", "targetLocationId": "string" }`

---

## 🏢 Enterprise Multi-Branch Automation Example

### Scenario: Nightly Sales Audit & Automated Stock Adjustment
An enterprise runs 15 restaurant branches across Lagos and London. Every night at 11:30 PM, their central Claude/OpenAI agent connects to WETAEGO's Staff MCP server:

```typescript
// 1. External Agent connects to OurMenuOS Staff MCP
const res = await fetch("https://ourmenuos.online/api/mcp", {
  method: "POST",
  headers: {
    "Authorization": "Bearer key_sec_live_928f8d...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "get_daily_sales",
    arguments: { date: "2026-08-27" }
  })
});

const data = await res.json();
// Returns: { date: "2026-08-27", orderCount: 342, grossRevenue: 4850000, currency: "NGN" }
```

---

## 🔗 Discovery Manifests
* **MCP Discovery Manifest**: `https://ourmenuos.online/.well-known/mcp.json`
* **Live Demo Storefront (WebMCP Ready)**: `https://ourmenuos.online/m/demo`
* **OpenAPI 3.1.0 Specification**: `https://ourmenuos.online/openapi.json`
* **Agent Technical Context**: `https://ourmenuos.online/llms.txt`
