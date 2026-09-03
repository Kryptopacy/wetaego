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
        page: "/",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Find other businesses: Search and discover distinct external merchant venues or branch locations across the WETAEGO network by business name, city query, industry category, or venue slug. Requires at least one search filter. (Do NOT use to switch tabs inside the current storefront; use open_business_page instead.)",
        inputSchema: {
          type: "object",
          anyOf: [
            { required: ["query"] },
            { required: ["name"] },
            { required: ["industry"] },
            { required: ["slug"] }
          ],
          properties: {
            query: { type: "string", description: "Natural-language search query." },
            name: { type: "string", description: "Specific business or brand name." },
            industry: {
              type: "string",
              enum: ["dining", "hospitality", "wellness", "retail", "services", "creator"],
              description: "Non-overlapping industry vertical filter: 'dining', 'hospitality', 'wellness', 'retail', 'services', 'creator'."
            },
            slug: {
              type: "string",
              minLength: 2,
              maxLength: 64,
              pattern: "^[A-Za-z0-9_/-]+$",
              description: "Direct URL slug of the venue (e.g. 'demo', 'emerald-cafe', 'ocean-ember', 'lotus-spa').",
              examples: ["demo", "emerald-cafe", "ocean-ember", "lotus-spa"]
            },
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
            slug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
            venueUrl: { type: "string" },
            directoryUrl: { type: "string" },
            venues: {
              type: "array",
              items: {
                type: "object",
                required: ["slug", "name", "venueUrl"],
                properties: {
                  slug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
                  name: { type: "string" },
                  industry: { type: "string" },
                  currency: {
                    type: "string",
                    minLength: 3,
                    maxLength: 3,
                    pattern: "^[A-Za-z]{3}$",
                    description: "3-letter ISO 4217 currency code",
                    examples: ["USD", "NGN"]
                  },
                  venueUrl: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            message: { type: "string" },
            _hint: { type: "string" }
          }
        },
        resultSchema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            totalFound: { type: "integer" },
            slug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
            venueUrl: { type: "string" },
            directoryUrl: { type: "string" },
            venues: {
              type: "array",
              items: {
                type: "object",
                required: ["slug", "name", "venueUrl"],
                properties: {
                  slug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
                  name: { type: "string" },
                  industry: { type: "string" },
                  currency: {
                    type: "string",
                    minLength: 3,
                    maxLength: 3,
                    pattern: "^[A-Za-z]{3}$",
                    description: "3-letter ISO 4217 currency code",
                    examples: ["USD", "NGN"]
                  },
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
        page: "/",
        scope: "customer",
        permission: "public/read-only",
        confirmation: "none",
        description: "Search catalog items, products, dishes, and services with category and price filters. Returns item details, prices, and availability.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Natural-language search query." },
            category: { type: "string", description: "Category name filter." },
            venueSlug: {
              type: "string",
              minLength: 2,
              maxLength: 64,
              pattern: "^[A-Za-z0-9_/-]+$",
              description: "Optional venue slug to scope search to a single merchant.",
              examples: ["demo", "emerald-cafe", "ocean-ember", "lotus-spa"]
            },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              enum: ["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "JPY", "KES", "GHS", "ZAR"],
              description: "3-letter ISO 4217 target currency code.",
              examples: ["USD", "NGN", "EUR", "GBP"]
            },
            dietary: {
              type: "array",
              items: { type: "string", enum: ["vegan", "vegetarian", "halal", "kosher", "gluten_free", "dairy_free", "nut_free", "keto"] },
              description: "Dietary tag filter for food and dining venues."
            },
            maxPrice: { type: "number", minimum: 0, description: "Maximum price in major currency units." },
            inStockOnly: { type: "boolean", default: true, description: "Filter only available items." },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20, description: "Page size limit." },
            offset: { type: "integer", minimum: 0, default: 0, description: "Offset for pagination." }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["venue", "currency", "totalFound", "items"],
          properties: {
            venue: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            totalFound: { type: "integer" },
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
                  attributes: {
                    type: "object",
                    properties: {
                      sizes: { type: "array", items: { type: "string" } },
                      colors: { type: "array", items: { type: "string" } },
                      condition: { type: "string", enum: ["new", "refurbished", "pre_owned"] },
                      brand: { type: "string" }
                    }
                  },
                  isAvailable: { type: "boolean" },
                  hasModifiers: { type: "boolean" },
                  conceptSlug: {
                    type: "string",
                    minLength: 2,
                    maxLength: 64,
                    pattern: "^[A-Za-z0-9_/-]+$",
                    description: "Concept or department slug"
                  }
                }
              }
            }
          }
        },
        resultSchema: {
          type: "object",
          required: ["venue", "currency", "totalFound", "items"],
          properties: {
            venue: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            totalFound: { type: "integer" },
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
                  attributes: {
                    type: "object",
                    properties: {
                      sizes: { type: "array", items: { type: "string" } },
                      colors: { type: "array", items: { type: "string" } },
                      condition: { type: "string", enum: ["new", "refurbished", "pre_owned"] },
                      brand: { type: "string" }
                    }
                  },
                  isAvailable: { type: "boolean" },
                  hasModifiers: { type: "boolean" },
                  conceptSlug: {
                    type: "string",
                    minLength: 2,
                    maxLength: 64,
                    pattern: "^[A-Za-z0-9_/-]+$",
                    description: "Concept or department slug"
                  }
                }
              }
            }
          }
        }
      },
      {
        name: "wetaego_get_item_details",
        page: "/m/{slug}",
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
          required: ["itemId", "name", "price", "priceFormatted", "isAvailable"],
          properties: {
            itemId: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            priceFormatted: { type: "string" },
            description: { type: "string" },
            dietaryTags: { type: "array", items: { type: "string" } },
            modifiers: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "options"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  required: { type: "boolean" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "priceDelta"],
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        priceDelta: { type: "number" },
                        priceDeltaFormatted: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            variants: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "price", "isAvailable"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  price: { type: "number" },
                  priceFormatted: { type: "string" },
                  isAvailable: { type: "boolean" }
                }
              }
            },
            isAvailable: { type: "boolean" },
            error: { type: "string" }
          }
        },
        resultSchema: {
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
            modifiers: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "options"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  required: { type: "boolean" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "priceDelta"],
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        priceDelta: { type: "number" },
                        priceDeltaFormatted: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            variants: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "price", "isAvailable"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  price: { type: "number" },
                  priceFormatted: { type: "string" },
                  isAvailable: { type: "boolean" }
                }
              }
            },
            isAvailable: { type: "boolean" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_create_cart",
        page: "/m/{slug}",
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
        },
        resultSchema: {
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
        page: "/m/{slug}",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Add an available catalog item to the active cart using only valid modifier selections.",
        inputSchema: {
          type: "object",
          required: ["itemId", "quantity"],
          properties: {
            cartId: { type: "string", description: "Optional unique cart session ID. If omitted, uses the active session cart." },
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
        },
        resultSchema: {
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
        page: "/m/{slug}",
        scope: "customer",
        permission: "session/read",
        confirmation: "none",
        description: "Return the current cart, line items, validated prices, modifiers, taxes, fees and current authoritative total.",
        inputSchema: {
          type: "object",
          properties: {
            cartId: { type: "string", description: "Optional unique cart session ID to retrieve. If omitted, returns active session cart." }
          },
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
                  modifiers: {
                    type: "array",
                    description: "Applied modifier and option selections for this line item",
                    items: {
                      type: "object",
                      required: ["name", "value"],
                      properties: {
                        modifierId: { type: "string" },
                        name: { type: "string" },
                        value: { type: "string" },
                        priceDelta: { type: "number" }
                      }
                    }
                  }
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
        },
        resultSchema: {
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
        page: "/m/{slug}",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Modify an existing cart line or remove it from the current cart session. Quantity 0 removes the item.",
        inputSchema: {
          type: "object",
          required: ["lineId"],
          properties: {
            cartId: { type: "string", description: "Optional unique cart session ID. If omitted, updates active session cart." },
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
        },
        resultSchema: {
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
        name: "wetaego_apply_coupon",
        page: "/m/{slug}",
        scope: "customer",
        permission: "session/cart-write",
        confirmation: "none",
        description: "Apply a promotional coupon code or discount voucher to the active shopping cart session. Validates the code, recalculates discounts, and updates the cart subtotal and final total.",
        inputSchema: {
          type: "object",
          required: ["couponCode"],
          properties: {
            couponCode: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[A-Za-z0-9_-]+$",
              description: "The promotional discount or coupon code to apply (e.g. SAVE10, WELCOME20, PACY50, VIP15, SUMMER20).",
              examples: ["SAVE10", "WELCOME20", "PACY50", "VIP15", "SUMMER20"]
            },
            cartId: {
              type: "string",
              description: "Optional cart session identifier. If omitted, applies to the active session cart."
            }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "success", "couponCode", "discountAmount", "discountPercentage", "discountFormatted", "subtotal", "subtotalFormatted", "total", "totalFormatted", "currency"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            couponCode: { type: "string", minLength: 3, maxLength: 30, pattern: "^[A-Za-z0-9_-]+$" },
            discountAmount: { type: "number", minimum: 0 },
            discountPercentage: { type: "number", minimum: 0, maximum: 100 },
            discountFormatted: { type: "string" },
            subtotal: { type: "number", minimum: 0 },
            subtotalFormatted: { type: "string" },
            total: { type: "number", minimum: 0 },
            totalFormatted: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            message: { type: "string" },
            _hint: { type: "string" }
          }
        },
        resultSchema: {
          type: "object",
          required: ["status", "success", "couponCode", "discountAmount", "discountPercentage", "discountFormatted", "subtotal", "subtotalFormatted", "total", "totalFormatted", "currency"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            couponCode: { type: "string", minLength: 3, maxLength: 30, pattern: "^[A-Za-z0-9_-]+$" },
            discountAmount: { type: "number", minimum: 0 },
            discountPercentage: { type: "number", minimum: 0, maximum: 100 },
            discountFormatted: { type: "string" },
            subtotal: { type: "number", minimum: 0 },
            subtotalFormatted: { type: "string" },
            total: { type: "number", minimum: 0 },
            totalFormatted: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            message: { type: "string" },
            _hint: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_recommend_pairings",
        page: "/m/{slug}",
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
        },
        resultSchema: {
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
        page: "/m/{slug}",
        scope: "customer",
        permission: "public/navigation",
        confirmation: "none",
        description: "Switch department within active storefront: Switch the active view to an internal department or category catalog tab (such as 'dining', 'wellness', 'boutique', 'stays', 'repairs', 'media', 'menu') inside the current venue. (Do NOT use to find external businesses; use find_venue instead.)",
        inputSchema: {
          type: "object",
          required: ["conceptSlug"],
          properties: {
            conceptSlug: {
              type: "string",
              minLength: 2,
              maxLength: 64,
              pattern: "^[A-Za-z0-9_/-]+$",
              description: "The URL slug or name of the concept to navigate to (e.g. 'dining', 'wellness', 'boutique', 'stays', 'repairs', 'media', 'menu').",
              examples: ["restaurant", "dining", "wellness", "spa", "boutique", "apparel", "stays", "hotel", "repairs", "media"]
            },
            venueSlug: {
              type: "string",
              minLength: 2,
              maxLength: 64,
              pattern: "^[A-Za-z0-9_/-]+$",
              description: "Optional venue slug.",
              examples: ["demo", "emerald-cafe", "ocean-ember", "lotus-spa"]
            }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          required: ["status", "conceptSlug", "destinationUrl"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            conceptSlug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
            destinationUrl: { type: "string" },
            message: { type: "string" }
          }
        },
        resultSchema: {
          type: "object",
          required: ["status", "conceptSlug", "destinationUrl"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            conceptSlug: { type: "string", minLength: 2, maxLength: 64, pattern: "^[A-Za-z0-9_/-]+$" },
            destinationUrl: { type: "string" },
            message: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_initiate_checkout",
        page: "/m/{slug}/checkout",
        scope: "customer",
        permission: "checkout/prepare",
        confirmation: "required_before_authorization",
        description: "Validate the current cart and prepare a checkout session with price lock. Does not authorize payment or submit the order.",
        inputSchema: {
          type: "object",
          required: ["fulfillment"],
          properties: {
            cartId: { type: "string", description: "Optional cart session ID to prepare checkout for. If omitted, uses the active session cart." },
            fulfillment: { type: "string", enum: ["dine_in", "pickup", "delivery"] },
            tableIdentifier: { type: "string", maxLength: 50, description: "Table, room, or seat identifier." },
            couponCode: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[A-Za-z0-9_-]+$",
              description: "Optional promotional coupon or discount voucher code to apply before price locking.",
              examples: ["SAVE10", "WELCOME20", "PACY50"]
            },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                phone: {
                  type: "string",
                  format: "tel",
                  pattern: "^\\+?[0-9A-Za-z\\s\\-().]{3,30}$",
                  minLength: 7,
                  maxLength: 20,
                  description: "Customer contact phone number in standard international E.164 format.",
                  examples: ["+12025550123", "+2348012345678"]
                }
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
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            subtotal: { type: "number" },
            appliedCoupon: { type: "string", nullable: true },
            discountAmount: { type: "number", minimum: 0 },
            discountPercentage: { type: "number", minimum: 0, maximum: 100 },
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
        },
        resultSchema: {
          type: "object",
          required: ["checkoutId", "fulfillment", "currency", "total", "totalFormatted", "requiresPaymentAuthorization"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            checkoutId: { type: "string" },
            fulfillment: { type: "string" },
            venue: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            subtotal: { type: "number" },
            appliedCoupon: { type: "string", nullable: true },
            discountAmount: { type: "number", minimum: 0 },
            discountPercentage: { type: "number", minimum: 0, maximum: 100 },
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
        page: "/m/{slug}/checkout",
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
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            appliedCoupon: { type: "string", nullable: true },
            discountAmount: { type: "number", minimum: 0 },
            total: { type: "number" },
            totalFormatted: { type: "string" },
            message: { type: "string" },
            error: { type: "string" }
          }
        },
        resultSchema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            success: { type: "boolean" },
            orderId: { type: "string" },
            checkoutId: { type: "string" },
            venue: { type: "string" },
            currency: {
              type: "string",
              minLength: 3,
              maxLength: 3,
              pattern: "^[A-Za-z]{3}$",
              description: "3-letter ISO 4217 currency code",
              examples: ["USD", "NGN"]
            },
            appliedCoupon: { type: "string", nullable: true },
            discountAmount: { type: "number", minimum: 0 },
            total: { type: "number" },
            totalFormatted: { type: "string" },
            message: { type: "string" },
            error: { type: "string" }
          }
        }
      },
      {
        name: "wetaego_request_staff",
        page: "/m/{slug}",
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
        },
        resultSchema: {
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
