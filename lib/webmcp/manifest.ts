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
        name: "wetaego_find_venue",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Discover or find any WETAEGO-powered business, storefront, restaurant, salon, boutique, hotel, or service provider by keywords, industry vertical, or exact slug.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Natural-language search query." },
            name: { type: "string", description: "Specific business or brand name." },
            industry: {
              type: "string",
              enum: [
                "hospitality", "dining", "restaurant", "wellness", "spa", "salon",
                "retail", "boutique", "electronics", "gadgets", "hotel", "shortlet",
                "services", "creator", "repairs"
              ],
              description: "Industry vertical filter."
            },
            slug: { type: "string", description: "Direct URL slug of the venue." },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10, description: "Maximum number of venues to return." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            totalFound: { type: "integer" },
            slug: { type: "string" },
            venueUrl: { type: "string" },
            directoryUrl: { type: "string" },
            venues: {
              type: "array",
              items: {
                type: "object",
                required: ["slug", "name", "venueUrl"],
                properties: {
                  slug: { type: "string" },
                  name: { type: "string" },
                  industry: { type: "string" },
                  currency: { type: "string" },
                  venueUrl: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            message: { type: "string" },
            _hint: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_search_catalog",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Search products, dishes, menu items, or services on WETAEGO with dietary filtering and pagination controls. Returns live catalog results from the active venue storefront.",
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
            inStockOnly: { type: "boolean", default: true, description: "Filter only available items." },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Page size limit." },
            offset: { type: "integer", minimum: 0, default: 0, description: "Offset for pagination." },
            page: { type: "integer", minimum: 1, default: 1, description: "Page number." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["venue", "currency", "totalFound", "items"],
          properties: {
            venue: { type: "string" },
            currency: { type: "string" },
            totalFound: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["itemId", "name", "price", "priceFormatted", "isAvailable"],
                properties: {
                  itemId: { type: "string" },
                  name: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" },
                  priceFormatted: { type: "string" },
                  description: { type: "string" },
                  dietaryTags: { type: "array", items: { type: "string" } },
                  isAvailable: { type: "boolean" },
                  hasModifiers: { type: "boolean" }
                }
              }
            }
          }
        }
      },
      {
        name: "wetaego_get_item_details",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Return authoritative details for a catalog item, including price, availability, modifiers, dietary tags and applicable options.",
        inputSchema: {
          type: "object",
          required: ["itemId"],
          properties: {
            itemId: { type: "string", minLength: 1, description: "The unique item ID." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          properties: {
            itemId: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            priceFormatted: { type: "string" },
            description: { type: "string" },
            dietaryTags: { type: "array", items: { type: "string" } },
            modifiers: { type: "array" },
            variants: { type: "array" },
            isAvailable: { type: "boolean" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_create_cart",
        scope: "customer",
        permission: "session-scoped",
        confirmation: "none",
        description: "Initialize a new shopping cart session or retrieve the existing active cart for the customer session.",
        inputSchema: {
          type: "object",
          properties: {
            tableIdentifier: { type: "string", maxLength: 50, description: "Optional table number or room." },
            customerNote: { type: "string", maxLength: 300, description: "Optional initial note." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "cartId", "venue", "currency", "itemCount", "subtotal", "subtotalFormatted"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            cartId: { type: "string" },
            venue: { type: "string" },
            currency: { type: "string" },
            itemCount: { type: "integer" },
            subtotal: { type: "number" },
            subtotalFormatted: { type: "string" },
            tableIdentifier: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_add_to_cart",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Add an available catalog item to the active cart using only valid modifier selections.",
        inputSchema: {
          type: "object",
          required: ["itemId", "quantity"],
          properties: {
            itemId: { type: "string", minLength: 1, description: "The unique ID of the item." },
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
        },
        outputSchema: {
          type: "object",
          required: ["status", "success", "cartItemCount", "subtotal", "subtotalFormatted"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            message: { type: "string" },
            cartItemCount: { type: "integer" },
            subtotal: { type: "number" },
            subtotalFormatted: { type: "string" },
            lines: { type: "array" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_get_cart",
        scope: "customer",
        permission: "session/read",
        confirmation: "none",
        description: "Return the current cart, line items, validated prices, modifiers, taxes, fees and current authoritative total.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["venue", "currency", "itemCount", "lines", "subtotal", "subtotalFormatted", "total", "totalFormatted"],
          properties: {
            venue: { type: "string" },
            currency: { type: "string" },
            itemCount: { type: "integer" },
            lines: {
              type: "array",
              items: {
                type: "object",
                required: ["lineId", "itemId", "name", "quantity", "unitPrice", "unitPriceFormatted", "lineTotal", "lineTotalFormatted"],
                properties: {
                  lineId: { type: "string" },
                  itemId: { type: "string" },
                  name: { type: "string" },
                  quantity: { type: "integer" },
                  unitPrice: { type: "number" },
                  unitPriceFormatted: { type: "string" },
                  lineTotal: { type: "number" },
                  lineTotalFormatted: { type: "string" },
                  modifiers: { type: "object" }
                }
              }
            },
            subtotal: { type: "number" },
            subtotalFormatted: { type: "string" },
            discountAmount: { type: "number" },
            discountPercentage: { type: "number" },
            total: { type: "number" },
            totalFormatted: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_update_cart",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Modify an existing cart line or remove it from the current cart session. Quantity 0 removes the item.",
        inputSchema: {
          type: "object",
          required: ["lineId"],
          properties: {
            lineId: { type: "string", minLength: 1, description: "The line item cartKey." },
            quantity: { type: "integer", minimum: 0, maximum: 50, description: "New quantity (0 = remove)." },
            notes: { type: "string", maxLength: 500, description: "Updated notes." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "success", "remainingLines", "subtotalFormatted"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            remainingLines: { type: "integer" },
            totalItemCount: { type: "integer" },
            subtotal: { type: "number" },
            subtotalFormatted: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_recommend_pairings",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Suggest complementary catalog items, sides, drinks, or accessories based on the current cart or a focal item ID.",
        inputSchema: {
          type: "object",
          properties: {
            itemId: { type: "string", description: "Optional focal item ID to find pairings for." },
            maxRecommendations: { type: "integer", minimum: 1, maximum: 10, default: 3, description: "Maximum number of pairing recommendations." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["venue", "currency", "count", "recommendations"],
          properties: {
            venue: { type: "string" },
            currency: { type: "string" },
            count: { type: "integer" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                required: ["itemId", "name", "price", "priceFormatted"],
                properties: {
                  itemId: { type: "string" },
                  name: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" },
                  priceFormatted: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      },
      {
        name: "wetaego_open_business_page",
        scope: "customer",
        permission: "public/navigation",
        confirmation: "none",
        description: "Navigate or switch the active storefront viewport to a specific department or concept page (e.g. restaurant, spa, boutique, hotel).",
        inputSchema: {
          type: "object",
          required: ["conceptSlug"],
          properties: {
            conceptSlug: { type: "string", minLength: 1, description: "The URL slug of the concept to navigate to." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "conceptSlug", "destinationUrl"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            conceptSlug: { type: "string" },
            destinationUrl: { type: "string" },
            message: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_initiate_checkout",
        scope: "customer",
        permission: "checkout/prepare",
        confirmation: "required_before_authorization",
        description: "Validate the current cart and prepare a checkout session with price lock. Does not authorize payment or submit the order.",
        inputSchema: {
          type: "object",
          required: ["fulfillment"],
          properties: {
            fulfillment: { type: "string", enum: ["dine_in", "pickup", "delivery"] },
            tableIdentifier: { type: "string", maxLength: 50, description: "Table, room, or seat identifier." },
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
        },
        outputSchema: {
          type: "object",
          required: ["checkoutId", "fulfillment", "currency", "total", "totalFormatted", "requiresPaymentAuthorization"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            checkoutId: { type: "string" },
            fulfillment: { type: "string" },
            venue: { type: "string" },
            currency: { type: "string" },
            subtotal: { type: "number" },
            tax: { type: "number" },
            fees: { type: "number" },
            total: { type: "number" },
            totalFormatted: { type: "string" },
            itemCount: { type: "integer" },
            expiresAt: { type: "string" },
            priceLockValidMinutes: { type: "integer" },
            requiresPaymentAuthorization: { type: "boolean" },
            message: { type: "string" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_submit_order",
        scope: "customer",
        permission: "high-impact-transaction",
        confirmation: "mandatory_human_authorization",
        description: "Submit the previously reviewed checkout as a customer order after explicit human customer authorization.",
        inputSchema: {
          type: "object",
          required: ["checkoutId", "authorization"],
          properties: {
            checkoutId: { type: "string", minLength: 1, description: "The checkoutId returned from initiate_checkout." },
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
        },
        outputSchema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            orderId: { type: "string" },
            checkoutId: { type: "string" },
            venue: { type: "string" },
            currency: { type: "string" },
            total: { type: "number" },
            totalFormatted: { type: "string" },
            message: { type: "string" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_request_staff",
        scope: "customer",
        permission: "session/assistance",
        confirmation: "none",
        description: "Send an immediate service or waiter call notification to venue floor staff.",
        inputSchema: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: {
              type: "string",
              enum: ["water_refill", "bill_check", "table_cleanup", "waiter_assistance", "order_inquiry", "manager_escalation"],
              description: "Structured reason for assistance."
            },
            details: { type: "string", maxLength: 300, description: "Optional extra notes." },
            tableIdentifier: { type: "string", maxLength: 50, description: "Table or room identifier." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "success", "message", "reason"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            message: { type: "string" },
            reason: { type: "string" },
            tableIdentifier: { type: "string" }
          }
        }
      },

      // ── Staff & Operations MCP Suite (Server-Side Bearer Authenticated) ──
      {
        name: "wetaego_get_active_orders",
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
        },
        outputSchema: {
          type: "object",
          required: ["orders"],
          properties: {
            orders: {
              type: "array",
              items: {
                type: "object",
                required: ["orderId", "status", "totalMinor", "currency"],
                properties: {
                  orderId: { type: "string" },
                  status: { type: "string" },
                  fulfillment: { type: "string" },
                  tableIdentifier: { type: "string" },
                  totalMinor: { type: "integer" },
                  currency: { type: "string" },
                  createdAt: { type: "string" }
                }
              }
            }
          }
        }
      },
      {
        name: "wetaego_get_order",
        scope: "staff",
        permission: "staff/orders-read",
        description: "Retrieve complete authoritative details for a specific customer order.",
        inputSchema: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", minLength: 1, description: "The unique order ID." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["orderId", "status"],
          properties: {
            orderId: { type: "string" },
            status: { type: "string" },
            fulfillment: { type: "string" },
            items: { type: "array" },
            totalMinor: { type: "integer" },
            currency: { type: "string" },
            customer: { type: "object" }
          }
        }
      },
      {
        name: "wetaego_update_order_status",
        scope: "staff",
        permission: "staff/orders-write",
        confirmation: "required_for_cancellation",
        description: "Change the operational status of an existing order.",
        inputSchema: {
          type: "object",
          required: ["orderId", "status"],
          properties: {
            orderId: { type: "string", minLength: 1, description: "Target order ID." },
            status: { type: "string", enum: ["pending", "paid", "preparing", "completed", "cancelled", "out_for_delivery", "refunded", "voided"] },
            reason: { type: "string", maxLength: 300, description: "Required if status is cancelled." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["success", "orderId", "status"],
          properties: {
            success: { type: "boolean" },
            orderId: { type: "string" },
            status: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_mark_item_unavailable",
        scope: "staff",
        permission: "staff/catalog-write",
        description: "Instantly toggle an item to sold out or unavailable across all storefronts and KDS screens.",
        inputSchema: {
          type: "object",
          required: ["itemId", "isAvailable"],
          properties: {
            itemId: { type: "string", minLength: 1, description: "Target catalog item ID." },
            isAvailable: { type: "boolean", description: "False = 86'd / sold out; True = back in stock." },
            reason: { type: "string", maxLength: 300, description: "Reason for 86ing the item." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["success", "itemId", "isAvailable"],
          properties: {
            success: { type: "boolean" },
            itemId: { type: "string" },
            isAvailable: { type: "boolean" }
          }
        }
      },
      {
        name: "wetaego_get_table_status",
        scope: "staff",
        permission: "staff/floor-read",
        description: "Inspect live occupancy, active tabs, and unfulfilled service requests for venue tables.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string", description: "Target location UUID." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["tables"],
          properties: {
            tables: {
              type: "array",
              items: {
                type: "object",
                required: ["tableIdentifier", "status"],
                properties: {
                  tableIdentifier: { type: "string" },
                  status: { type: "string", enum: ["vacant", "occupied", "reserved", "service_requested"] },
                  activeTabTotalMinor: { type: "integer" }
                }
              }
            }
          }
        }
      },
      {
        name: "wetaego_get_daily_sales",
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
        },
        outputSchema: {
          type: "object",
          required: ["date", "grossRevenueMinor", "orderCount"],
          properties: {
            date: { type: "string" },
            grossRevenueMinor: { type: "integer" },
            orderCount: { type: "integer" },
            averageTicketMinor: { type: "integer" },
            currency: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_duplicate_catalog_to_branch",
        scope: "staff",
        permission: "staff/fleet-admin",
        confirmation: "mandatory",
        description: "Replicate a complete master catalog to a new franchise branch in under 1 second.",
        inputSchema: {
          type: "object",
          required: ["sourceLocationId", "targetLocationId"],
          properties: {
            sourceLocationId: { type: "string", minLength: 1, description: "Source location UUID." },
            targetLocationId: { type: "string", minLength: 1, description: "Target location UUID." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["success", "itemsCopied"],
          properties: {
            success: { type: "boolean" },
            itemsCopied: { type: "integer" }
          }
        }
      }
    ]
  }
}
