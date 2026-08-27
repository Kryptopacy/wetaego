# WebMCP Specification & Integration Guide — OurMenuOS

> **OpenAI WebMCP Challenge Entry**  
> *"The Shopify of the Agentic Web: Enabling every business to expose autonomous, self-describing, transactional WebMCP storefronts."*

---

## 🌟 Overview

**OurMenuOS** brings the **Web Model Context Protocol (WebMCP)** to digital storefronts at the platform level. Rather than manually creating custom MCP endpoints for individual merchants, OurMenuOS automatically synthesizes and registers reactive WebMCP tools onto `document.modelContext` for every merchant storefront, digital menu, catalog, or service booking page hosted on the platform.

When an AI browsing agent (such as the **ChatGPT Desktop in-app browser** or **Google Chrome 149+ with `#enable-webmcp-testing`**) navigates to any OurMenuOS storefront, the page immediately presents a standardized, full-lifecycle commerce and interaction tool suite.

---

## 📜 Prior Work vs. Hackathon Extension (Aug 25 – Sep 3, 2026)

In strict compliance with the **OpenAI WebMCP Challenge Official Rules for Pre-Existing Projects**, this section distinguishes the pre-existing base application from the WebMCP extension developed during the hackathon period:

### Pre-Existing Architecture (Prior to August 25, 2026)
* Core Next.js multi-template CMS and database schema for merchant portals.
* Basic cart store and payment gateway integrations.

### New WebMCP Extensions Built During the Submission Window (Aug 25 – Sep 3, 2026)
1. **WebMCP Universal Registry & Spec Adapter** (`lib/webmcp/types.ts`, `lib/webmcp/registry.ts`):
   * Created native binding to W3C `document.modelContext.registerTool` and `window.modelContext`.
   * Built universal polyfill allowing testing across Chrome 149+, ChatGPT in-app browser, and standard browsers.
2. **Context-Aware Dynamic Tool Factory** (`lib/webmcp/tools.ts`):
   * Built full 8-tool commerce and service suite (`search_catalog`, `get_item_details`, `add_to_cart`, `view_cart`, `update_cart_quantity`, `clear_cart`, `call_staff_or_service`, `initiate_checkout`).
   * Dynamic schema generation extracting nested modifier trees (sizes, doneness, spice, memory, finishes) and dietary tags.
3. **Platform Storefront Injector** (`components/webmcp/webmcp-provider.tsx`):
   * Injected globally across public storefront routes (`/m/[slug]` and `/m/[slug]/p/[pageSlug]`).
   * Bridges external agent tool executions directly to Zustand/IndexedDB client state with live Sonner toast alerts.
4. **Interactive In-Browser WebMCP Playground** (`components/webmcp/webmcp-tester.tsx`):
   * Floating simulation drawer allowing judges and developers to run 1-click test scenarios and inspect JSON schemas and live UI syncing directly in the browser.
5. **Automated Verification Suite** (`lib/webmcp/__tests__/webmcp.test.ts`):
   * 8/8 comprehensive Vitest integration tests validating end-to-end tool execution and state mutations.
6. **Production Catalog Enrichment** (`app/login/actions.ts`):
   * Enriched multi-industry demo storefronts with rich modifier trees, dietary tags, and high-res photography.

---

## 🛠️ Registered WebMCP Tools

Each storefront registers the following tools via `document.modelContext.registerTool()`:

### 1. `search_catalog`
* **Description**: Search offerings, products, bookings, dishes, or services with support for keyword query, category/department, max price budget, and custom attribute tags.
* **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search keyword (e.g. 'pasta', 'haircut', 'penthouse', 'titanium', 'massage')" },
      "category": { "type": "string", "description": "Filter by category or department name" },
      "max_price": { "type": "number", "description": "Maximum price in major currency units" },
      "tags": { "type": "array", "items": { "type": "string" }, "description": "Attribute tags (e.g. ['vegan'], ['512gb'], ['waterfront'], ['organic'], ['oem'])" }
    }
  }
  ```

### 2. `get_item_details`
* **Description**: Inspect item description, ingredients, allergen warnings, and customizable variant options (e.g. sizes, spice levels, add-ons).
* **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "itemId": { "type": "string", "description": "Unique item ID" }
    },
    "required": ["itemId"]
  }
  ```

### 3. `add_to_cart`
* **Description**: Adds an item with chosen variants/modifiers and quantity directly to the customer's live cart.
* **Reactive Feedback**: Dispatches to the storefront's persistent IndexedDB/Zustand store, animates the cart badge, and fires a visual Sonner toast alert on screen.
* **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "itemId": { "type": "string", "description": "Unique item ID" },
      "quantity": { "type": "integer", "description": "Quantity to add (default 1)" },
      "variantSelections": { "type": "object", "description": "Map of variant option selections" }
    },
    "required": ["itemId"]
  }
  ```

### 4. `view_cart`
* **Description**: Inspects current cart items, line totals, subtotal, discount percentages, and final calculated total.

### 5. `update_cart_quantity`
* **Description**: Adjusts item quantities (+/-) or removes items from the cart.

### 6. `clear_cart`
* **Description**: Clears all items and resets discounts in the active cart.

### 7. `call_staff_or_service`
* **Description**: Sends a waiter/staff assistance alert for the customer's active seat, table, or room.

### 8. `initiate_checkout`
* **Description**: Pre-fills order details and presents the checkout review modal for human confirmation and payment authorization.

---

## 🧪 How to Test

### Method 1: Google Chrome 149+ (Native WebMCP)
1. Open Google Chrome (v149 or later).
2. Navigate to `chrome://flags/#enable-webmcp-testing`.
3. Enable the flag and restart Chrome.
4. Visit any live OurMenuOS storefront (e.g. `https://ourmenuos.online/m/[slug]`).
5. Open Chrome DevTools (`F12`), switch to the **Application** or **Console** tab:
   ```javascript
   // Inspect registered tools
   console.log(document.modelContext.getTools());

   // Search for vegan items under $20
   await document.modelContext.executeTool('search_catalog', { dietary: ['vegan'], max_price: 20 });

   // Add item to cart and watch the web page UI react live!
   await document.modelContext.executeTool('add_to_cart', { itemId: 'item_id_here', quantity: 1 });
   ```

### Method 2: ChatGPT Desktop App (In-App Browser)
1. Open the ChatGPT Desktop app.
2. In chat, browse to your live deployed OurMenuOS storefront URL.
3. Prompt ChatGPT:
   > *"Look at this menu, find me a gluten-free main course under \$25, and add it to my cart."*
4. ChatGPT will invoke the WebMCP tools directly in the browser session.

### Method 3: In-Browser Interactive Playground
* Every OurMenuOS storefront includes a floating **"WebMCP Tools"** badge in the lower-left corner.
* Click to open the **WebMCP Agent Playground** to execute 1-click test scenarios, inspect JSON schemas, and observe real-time visual UI synchronizations.
