import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  specVersion: "1.0",
  host: {
    domain: "ourmenuos.online",
    name: "WETAEGO",
    description: "The Commerce & Service Operating System for Modern Brands, their Human Customers, and the AI Agents who serve them."
  },
  entries: [
    {
      identifier: "urn:air:ourmenuos.online:mcp:storefront-server",
      id: "urn:air:ourmenuos.online:mcp:storefront-server",
      displayName: "WETAEGO MCP Server",
      description: "Model Context Protocol tools for querying restaurant menus, supermarket catalogs, booking appointments, and placing orders.",
      type: "application/json",
      url: "https://ourmenuos.online/.well-known/mcp.json",
      representativeQueries: [
        "Search dishes on WETAEGO",
        "Place a restaurant table order",
        "Book a spa or salon appointment slot",
        "Check ingredient and allergen info"
      ]
    },
    {
      identifier: "urn:air:ourmenuos.online:openapi:core-api",
      id: "urn:air:ourmenuos.online:openapi:core-api",
      displayName: "WETAEGO OpenAPI Specification",
      description: "Formal OpenAPI 3.1.0 specification for public storefront, OCR parser, and live Gemini AI token APIs.",
      type: "application/openapi+json",
      url: "https://ourmenuos.online/openapi.json",
      representativeQueries: [
        "WETAEGO API endpoints",
        "How to authenticate with WETAEGO REST API",
        "Parse menu images with AI OCR API"
      ]
    },
    {
      identifier: "urn:air:ourmenuos.online:skills:catalog-ordering",
      id: "urn:air:ourmenuos.online:skills:catalog-ordering",
      displayName: "WETAEGO Agent Skills Index",
      description: "Agent skills discovery manifest detailing catalog search, order dispatch, appointment booking, and ESC/POS thermal printing.",
      type: "application/json",
      url: "https://ourmenuos.online/.well-known/agent-skills/index.json",
      representativeQueries: [
        "WETAEGO agent skills",
        "How to use raw thermal printing over WebUSB",
        "Dynamic rate cards and B2B proposals"
      ]
    },
    {
      identifier: "urn:air:ourmenuos.online:a2a:tego-concierge",
      id: "urn:air:ourmenuos.online:a2a:tego-concierge",
      displayName: "Tego Multimodal Concierge (Agent-to-Agent)",
      description: "Frontline AI concierge supporting streaming conversational dialogue and live staff handoff.",
      type: "application/json",
      url: "https://ourmenuos.online/api/chat",
      representativeQueries: [
        "Chat with venue AI assistant",
        "Ask venue opening hours and delivery fees",
        "Page floor staff to table"
      ]
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
