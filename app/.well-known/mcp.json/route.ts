import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "name": "ourmenuos-mcp",
  "version": "1.0.0",
  "description": "Model Context Protocol (MCP) server manifest for WETAEGO — Digital Storefronts & Physical Operations Layer",
  "homepage": "https://ourmenuos.online/docs",
  "tools": [
    {
      "name": "wetaego_find_venue",
      "description": "Discover and search merchant venues, multi-concept enterprises, and branches across the WETAEGO commerce network by industry vertical, keyword query, or slug identifier.",
      "parameters": {
        "type": "object",
        "properties": {
          "industry": { "type": "string", "description": "Industry vertical (e.g. dining, wellness, retail, tech, lodging, services, creative)" },
          "query": { "type": "string", "description": "Keyword search query for business name, description, or offering" },
          "name": { "type": "string", "description": "Exact or partial business display name" },
          "slug": {
            "type": "string",
            "minLength": 2,
            "maxLength": 64,
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            "description": "Direct venue slug",
            "examples": ["demo", "emerald-cafe", "ocean-ember", "lotus-spa"]
          },
          "limit": { "type": "integer", "minimum": 1, "maximum": 25, "default": 10 }
        }
      },
      "outputSchema": {
        "type": "object",
        "required": ["status", "totalFound", "venues"],
        "properties": {
          "status": { "type": "string" },
          "totalFound": { "type": "integer" },
          "venues": { "type": "array" }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["status", "totalFound", "venues"],
        "properties": {
          "status": { "type": "string" },
          "totalFound": { "type": "integer" },
          "venues": { "type": "array" }
        }
      }
    },
    {
      "name": "wetaego_search_catalog",
      "description": "Universal multi-industry catalog, product, service, and booking search with multi-category filters (sizes, condition, dietary, capacity, duration, and budget).",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Keyword search query" },
          "category": { "type": "string", "description": "Category name filter" },
          "venueSlug": {
            "type": "string",
            "minLength": 2,
            "maxLength": 64,
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            "description": "Optional venue slug to scope search to a single merchant",
            "examples": ["demo", "emerald-cafe", "ocean-ember", "lotus-spa"]
          },
          "currency": {
            "type": "string",
            "minLength": 3,
            "maxLength": 3,
            "pattern": "^[A-Z]{3}$",
            "enum": ["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "JPY", "KES", "GHS", "ZAR"],
            "description": "3-letter ISO 4217 target currency code",
            "examples": ["USD", "NGN", "EUR", "GBP"]
          },
          "dietary": { "type": "array", "items": { "type": "string" }, "description": "Dietary tags" },
          "maxPrice": { "type": "number", "minimum": 0, "description": "Maximum budget in currency units" },
          "inStockOnly": { "type": "boolean", "default": true, "description": "Filter in-stock items only" },
          "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
        }
      },
      "outputSchema": {
        "type": "object",
        "required": ["venue", "currency", "totalFound", "items"],
        "properties": {
          "venue": { "type": "string" },
          "currency": {
            "type": "string",
            "minLength": 3,
            "maxLength": 3,
            "pattern": "^[A-Z]{3}$",
            "description": "Authoritative 3-letter ISO 4217 currency code",
            "examples": ["USD", "NGN"]
          },
          "totalFound": { "type": "integer" },
          "items": { "type": "array" }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["venue", "currency", "totalFound", "items"],
        "properties": {
          "venue": { "type": "string" },
          "currency": {
            "type": "string",
            "minLength": 3,
            "maxLength": 3,
            "pattern": "^[A-Z]{3}$",
            "description": "Authoritative 3-letter ISO 4217 currency code",
            "examples": ["USD", "NGN"]
          },
          "totalFound": { "type": "integer" },
          "items": { "type": "array" }
        }
      }
    },
    {
      "name": "wetaego_apply_coupon",
      "description": "Apply a promotional coupon code or discount voucher to recalculate cart discounts and final total.",
      "parameters": {
        "type": "object",
        "required": ["couponCode"],
        "properties": {
          "couponCode": {
            "type": "string",
            "minLength": 3,
            "maxLength": 30,
            "pattern": "^[A-Za-z0-9_-]+$",
            "description": "Promotional coupon code (e.g. SAVE10, WELCOME20, PACY50)",
            "examples": ["SAVE10", "WELCOME20", "PACY50"]
          }
        }
      },
      "outputSchema": {
        "type": "object",
        "required": ["status", "success", "couponCode", "discountAmount", "discountPercentage", "total", "currency"],
        "properties": {
          "status": { "type": "string", "enum": ["ok", "error"] },
          "success": { "type": "boolean" },
          "couponCode": { "type": "string" },
          "discountAmount": { "type": "number", "minimum": 0 },
          "discountPercentage": { "type": "number", "minimum": 0, "maximum": 100 },
          "total": { "type": "number", "minimum": 0 },
          "currency": { "type": "string", "minLength": 3, "maxLength": 3, "pattern": "^[A-Z]{3}$" }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["status", "success", "couponCode", "discountAmount", "discountPercentage", "total", "currency"],
        "properties": {
          "status": { "type": "string", "enum": ["ok", "error"] },
          "success": { "type": "boolean" },
          "couponCode": { "type": "string" },
          "discountAmount": { "type": "number", "minimum": 0 },
          "discountPercentage": { "type": "number", "minimum": 0, "maximum": 100 },
          "total": { "type": "number", "minimum": 0 },
          "currency": { "type": "string", "minLength": 3, "maxLength": 3, "pattern": "^[A-Z]{3}$" }
        }
      }
    },
    {
      "name": "wetaego_query_catalog",
      "description": "Search dishes, menu items, products, and services at a WETAEGO venue with category, dietary, price, and stock filters.",
      "parameters": {
        "type": "object",
        "properties": {
          "locationId": { "type": "string", "description": "Venue location UUID" },
          "query": { "type": "string", "description": "Search keywords" },
          "category": { "type": "string", "description": "Category name filter" },
          "dietary": { "type": "string", "enum": ["vegan", "vegetarian", "halal", "kosher", "gluten_free", "dairy_free", "nut_free", "keto"], "description": "Dietary filter for dining" },
          "maxPrice": { "type": "number", "minimum": 0, "description": "Maximum price in currency units" },
          "inStockOnly": { "type": "boolean", "default": true, "description": "Return only available items" },
          "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
        },
        "required": ["locationId"]
      },
      "outputSchema": {
        "type": "object",
        "required": ["items", "totalFound"],
        "properties": {
          "totalFound": { "type": "integer" },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["itemId", "name", "price", "isAvailable"],
              "properties": {
                "itemId": { "type": "string" },
                "name": { "type": "string" },
                "category": { "type": "string" },
                "price": { "type": "number" },
                "priceFormatted": { "type": "string" },
                "description": { "type": "string" },
                "dietaryTags": { "type": "array", "items": { "type": "string" } },
                "attributes": {
                  "type": "object",
                  "properties": {
                    "sizes": { "type": "array", "items": { "type": "string" } },
                    "colors": { "type": "array", "items": { "type": "string" } },
                    "condition": { "type": "string", "enum": ["new", "refurbished", "pre_owned"] },
                    "brand": { "type": "string" },
                    "durationMinutes": { "type": "integer" },
                    "guestCapacity": { "type": "integer" },
                    "roomType": { "type": "string" },
                    "amenities": { "type": "array", "items": { "type": "string" } }
                  }
                },
                "isAvailable": { "type": "boolean" }
              }
            }
          }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["items", "totalFound"],
        "properties": {
          "totalFound": { "type": "integer" },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["itemId", "name", "price", "isAvailable"],
              "properties": {
                "itemId": { "type": "string" },
                "name": { "type": "string" },
                "category": { "type": "string" },
                "price": { "type": "number" },
                "priceFormatted": { "type": "string" },
                "description": { "type": "string" },
                "dietaryTags": { "type": "array", "items": { "type": "string" } },
                "attributes": {
                  "type": "object",
                  "properties": {
                    "sizes": { "type": "array", "items": { "type": "string" } },
                    "colors": { "type": "array", "items": { "type": "string" } },
                    "condition": { "type": "string", "enum": ["new", "refurbished", "pre_owned"] },
                    "brand": { "type": "string" },
                    "durationMinutes": { "type": "integer" },
                    "guestCapacity": { "type": "integer" },
                    "roomType": { "type": "string" },
                    "amenities": { "type": "array", "items": { "type": "string" } }
                  }
                },
                "isAvailable": { "type": "boolean" }
              }
            }
          }
        }
      }
    },
    {
      "name": "wetaego_create_order",
      "description": "Submit a validated customer order with line items, modifier selections, and table number.",
      "parameters": {
        "type": "object",
        "properties": {
          "locationId": { "type": "string", "description": "Venue location UUID" },
          "tableIdentifier": { "type": "string", "description": "Table or room number" },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "itemId": { "type": "string" },
                "quantity": { "type": "integer" },
                "notes": { "type": "string" }
              },
              "required": ["itemId", "quantity"]
            }
          }
        },
        "required": ["locationId", "items"]
      },
      "outputSchema": {
        "type": "object",
        "required": ["orderId", "status", "total"],
        "properties": {
          "orderId": { "type": "string" },
          "status": { "type": "string" },
          "total": { "type": "number" },
          "totalFormatted": { "type": "string" }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["orderId", "status", "total"],
        "properties": {
          "orderId": { "type": "string" },
          "status": { "type": "string" },
          "total": { "type": "number" },
          "totalFormatted": { "type": "string" }
        }
      }
    },
    {
      "name": "wetaego_check_availability",
      "description": "Query available appointment booking slots for salon, spa, wellness, or consulting services.",
      "parameters": {
        "type": "object",
        "properties": {
          "locationId": { "type": "string" },
          "date": { "type": "string", "format": "date", "description": "YYYY-MM-DD date" },
          "serviceId": { "type": "string" }
        },
        "required": ["locationId", "date"]
      },
      "outputSchema": {
        "type": "object",
        "required": ["availableSlots"],
        "properties": {
          "date": { "type": "string" },
          "availableSlots": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["availableSlots"],
        "properties": {
          "date": { "type": "string" },
          "availableSlots": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    {
      "name": "wetaego_request_staff",
      "description": "Trigger floor staff call chime (water_refill, bill_check, table_cleanup, waiter_assistance, order_inquiry, manager_escalation) at a WETAEGO venue.",
      "parameters": {
        "type": "object",
        "properties": {
          "locationId": { "type": "string" },
          "tableIdentifier": { "type": "string" },
          "reason": { "type": "string", "enum": ["water_refill", "bill_check", "table_cleanup", "waiter_assistance", "order_inquiry", "manager_escalation"] }
        },
        "required": ["locationId", "tableIdentifier", "reason"]
      },
      "outputSchema": {
        "type": "object",
        "required": ["success", "message"],
        "properties": {
          "success": { "type": "boolean" },
          "message": { "type": "string" }
        }
      },
      "resultSchema": {
        "type": "object",
        "required": ["success", "message"],
        "properties": {
          "success": { "type": "boolean" },
          "message": { "type": "string" }
        }
      }
    }
  ]
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
}

export async function GET() {
  return NextResponse.json(METADATA, { status: 200, headers: HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}
