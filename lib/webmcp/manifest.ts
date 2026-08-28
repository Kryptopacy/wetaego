export function getMCPManifest() {
  return {
    $schema: "https://modelcontextprotocol.io/schema/mcp-server-manifest.json",
    name: "WETAEGO Commerce & Operations MCP Suite",
    version: "1.0.0",
    description: "Universal WebMCP & Server MCP interface for digital storefronts, multi-concept commerce, and multi-branch enterprise operations.",
    documentationUrl: "https://ourmenuos.online/WEBMCP.md",
    endpoints: {
      clientWebMCP: "document.modelContext (Registered on all live /m/[slug] storefronts)",
      serverStaffMCP: "https://ourmenuos.online/api/mcp (Bearer Authenticated for staff/enterprise agents)"
    },
    permissionModel: {
      customerSuite: {
        scope: "session",
        discovery: "public",
        paymentGate: "mandatory_human_authorization"
      },
      staffSuite: {
        scope: "merchant_staff",
        authentication: "Bearer API Key / Staff Session",
        roles: ["owner", "manager", "staff"]
      }
    },
    tools: [
      // ── Customer WebMCP Suite (Client-Side document.modelContext) ──────────
      {
        name: "search_catalog",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Search the current venue catalog for products, dishes, services, and available variants. Results are limited to items currently visible and orderable.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Natural-language search query." },
            category: { type: "string", description: "Category name filter." },
            dietary: {
              type: "array",
              items: { type: "string", enum: ["vegan", "vegetarian", "halal", "keto", "gluten_free", "dairy_free", "nut_free"] },
              description: "Dietary tag filter."
            },
            maxPrice: { type: "number", minimum: 0, description: "Maximum price in major currency units." },
            inStockOnly: { type: "boolean", default: true, description: "Filter only available items." }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_item_details",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Return authoritative details for a catalog item, including price, availability, modifiers, dietary tags and applicable options.",
        inputSchema: {
          type: "object",
          required: ["itemId"],
          properties: {
            itemId: { type: "string", description: "The unique item ID." }
          },
          additionalProperties: false
        }
      },
      {
        name: "create_cart",
        scope: "customer",
        permission: "session-scoped",
        confirmation: "none",
        description: "Create or retrieve the current shopping cart for the active venue and customer session.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: "add_to_cart",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Add an available catalog item to the active cart using only valid modifier selections.",
        inputSchema: {
          type: "object",
          required: ["itemId", "quantity"],
          properties: {
            itemId: { type: "string", description: "The unique ID of the item." },
            quantity: { type: "integer", minimum: 1, maximum: 50, description: "Quantity to add." },
            modifiers: {
              type: "array",
              items: {
                type: "object",
                required: ["modifierId"],
                properties: {
                  modifierId: { type: "string" },
                  optionIds: { type: "array", items: { type: "string" } }
                },
                additionalProperties: false
              },
              description: "Selected modifier and option IDs."
            },
            notes: { type: "string", maxLength: 500, description: "Customer instructions." }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_cart",
        scope: "customer",
        permission: "session/read",
        confirmation: "none",
        description: "Return the current cart, validated prices, modifiers, taxes, fees and current authoritative total.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: "update_cart",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Modify an existing cart line or remove it from the current cart. Quantity 0 removes the item.",
        inputSchema: {
          type: "object",
          required: ["lineId"],
          properties: {
            lineId: { type: "string", description: "The line item cartKey." },
            quantity: { type: "integer", minimum: 0, maximum: 50, description: "New quantity (0 = remove)." },
            notes: { type: "string", maxLength: 500, description: "Updated notes." }
          },
          additionalProperties: false
        }
      },
      {
        name: "initiate_checkout",
        scope: "customer",
        permission: "checkout/prepare",
        confirmation: "required_before_authorization",
        description: "Validate the current cart and prepare a checkout session. This does not authorize payment or submit the order.",
        inputSchema: {
          type: "object",
          required: ["fulfillment"],
          properties: {
            fulfillment: { type: "string", enum: ["dine_in", "pickup", "delivery"] },
            tableIdentifier: { type: "string", description: "Table, room, or seat identifier." },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" }
              },
              additionalProperties: false
            },
            notes: { type: "string", maxLength: 1000 }
          },
          additionalProperties: false
        }
      },
      {
        name: "submit_order",
        scope: "customer",
        permission: "high-impact-transaction",
        confirmation: "mandatory_human_authorization",
        description: "Submit the previously reviewed checkout as a customer order after explicit human authorization.",
        inputSchema: {
          type: "object",
          required: ["checkoutId", "authorization"],
          properties: {
            checkoutId: { type: "string", description: "The checkoutId returned from initiate_checkout." },
            authorization: {
              type: "object",
              required: ["confirmed"],
              properties: {
                confirmed: { type: "boolean", description: "Explicit customer confirmation flag." },
                confirmationId: { type: "string", description: "Confirmation tracking token." }
              },
              additionalProperties: false
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "request_staff",
        scope: "customer",
        permission: "session/assistance",
        confirmation: "none",
        description: "Send an immediate service or waiter call notification to venue staff.",
        inputSchema: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Reason for assistance." }
          },
          additionalProperties: false
        }
      },

      // ── Staff & Operations MCP Suite (Server-Side Bearer Authenticated) ──
      {
        name: "get_active_orders",
        scope: "staff",
        permission: "staff/orders-read",
        description: "Retrieve all active orders across a venue or franchise branch with real-time status and line items.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string", description: "Target location UUID." },
            status: { type: "string", enum: ["pending", "paid", "preparing", "out_for_delivery", "completed"] }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_order",
        scope: "staff",
        permission: "staff/orders-read",
        description: "Retrieve complete authoritative details for a specific customer order.",
        inputSchema: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", description: "The unique order ID." }
          },
          additionalProperties: false
        }
      },
      {
        name: "update_order_status",
        scope: "staff",
        permission: "staff/orders-write",
        confirmation: "required_for_cancellation",
        description: "Change the operational status of an existing order.",
        inputSchema: {
          type: "object",
          required: ["orderId", "status"],
          properties: {
            orderId: { type: "string", description: "Target order ID." },
            status: { type: "string", enum: ["pending", "paid", "preparing", "completed", "cancelled", "out_for_delivery", "refunded", "voided"] },
            reason: { type: "string", description: "Required if status is cancelled." }
          },
          additionalProperties: false
        }
      },
      {
        name: "mark_item_unavailable",
        scope: "staff",
        permission: "staff/catalog-write",
        description: "Instantly toggle an item to sold out or unavailable across all storefronts and KDS screens.",
        inputSchema: {
          type: "object",
          required: ["itemId", "isAvailable"],
          properties: {
            itemId: { type: "string", description: "Target catalog item ID." },
            isAvailable: { type: "boolean", description: "False = 86'd / sold out; True = back in stock." },
            reason: { type: "string", description: "Reason for 86ing the item." }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_table_status",
        scope: "staff",
        permission: "staff/floor-read",
        description: "Inspect live occupancy, active tabs, and unfulfilled service requests for venue tables.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string", description: "Target location UUID." }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_daily_sales",
        scope: "staff",
        permission: "staff/analytics-read",
        description: "Retrieve aggregated gross revenue, order volume, average ticket size, and top selling items for a location.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string", description: "Target location UUID (omit for organization-wide aggregate)." },
            date: { type: "string", description: "ISO Date string (YYYY-MM-DD), defaults to today." }
          },
          additionalProperties: false
        }
      },
      {
        name: "duplicate_catalog_to_branch",
        scope: "staff",
        permission: "staff/fleet-admin",
        confirmation: "mandatory",
        description: "Replicate a complete master catalog to a new franchise branch in under 1 second.",
        inputSchema: {
          type: "object",
          required: ["sourceLocationId", "targetLocationId"],
          properties: {
            sourceLocationId: { type: "string", description: "Source location UUID." },
            targetLocationId: { type: "string", description: "Target location UUID." }
          },
          additionalProperties: false
        }
      }
    ]
  }
}
