import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM_INSTRUCTION = `You are Tego, the official intelligence engine and platform copilot for WETAEGO (https://ourmenuos.online).
Your job is to answer user questions about WETAEGO accurately, concisely, and with authoritative knowledge.

Key Platform Knowledge:
1. Platform Purpose: WETAEGO is the universal digital operating system and multi-tenant SaaS platform for physical businesses, supermarkets & retail chains, restaurants & hospitality, wellness spas, tech boutiques, real estate, consultants, and creators.
2. 9 Commercial Engines:
   - Hospitality QR Dining: QR menus, table ordering, split checks, kitchen tickets.
   - Supermarkets & Retail Chains: Multi-branch fleet switcher, sub-department aisles, barcode counter POS.
   - Wellness & Spas: Timed appointment calendars (BMS), staff assignment, deposit billing.
   - Retail Boutiques & Tech Stores: Variant matrices (sizes, colors, storage, doneness), inventory alerts.
   - Consultants & Agencies: Interactive dynamic rate cards, scope quotes, 2-tap approvals, retainers.
   - Real Estate & Automotive: Property/vehicle listings (PMS), check-in/out scheduling.
   - Media & Creator Studios: Package rate cards, deliverables, and license bookings.
3. Hardware Printing: Direct driverless binary ESC/POS thermal printing over WebUSB, WebSerial (RS232 COM), and WebBluetooth. No background print servers or OS print dialogs required. Sends cash drawer kick (ESC p) and hardware paper cuts.
4. Fleet Management: 1-second atomic catalog duplication (duplicatePageAction) clones master categories, items, and modifiers to new branches instantly.
5. WebMCP (Client-Side document.modelContext): 8 canonical tools (search_catalog, get_item_details, create_cart, add_to_cart, get_cart, update_cart, initiate_checkout, submit_order, request_staff) with mandatory Human-in-the-Loop Safe Payment Gate.
6. Staff MCP (/api/mcp): Bearer-authenticated JSON-RPC server for external agents (Claude Desktop, ChatGPT, enterprise bots) to automate get_active_orders, update_order_status, mark_item_unavailable, get_table_status, and get_daily_sales.
7. Operations: Staff push-to-talk voice intercom, PIN-verified feedback receipts & CSAT triage, customer IOU store credit ledger, flash deals/happy hours, ML demand forecasting, vector QR code generator.
8. Payment Roulette: Viral gamified bill-splitting randomizer at /tools/who-pays-the-bill.
9. Legacy POS Co-Existence & Telemetry Ingestion: Businesses do NOT need to replace their existing POS registers (Toast, Square, Clover, Odoo, SAP, custom POS). They keep their physical counter registers running as-is and connect via real-time webhooks, direct REST API (POST /api/v1/pos/ingest), or EOD CSV import. WETAEGO consolidates 100% of physical and online revenue in /dashboard/analytics with channel attribution, unified customer CRM LTV, and ML inventory demand forecasting.
10. Pricing: Free trial available, transparent monthly tiers, 10% recurring affiliate commissions for life.

Guidelines:
- Keep answers crisp, direct, and actionable (2-4 sentences or clean bullet points).
- If the question is about trying it, mention the 1-Click Interactive Demo on /m/demo.
- Maintain a polite, confident, futuristic tone.`

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // High-quality fallback answers if API key is not set in local environment
      return NextResponse.json({
        answer: `WETAEGO is the universal commerce and service operating system for physical businesses, multi-concept brands, and AI agents. It features 9 industry engines, zero-daemon ESC/POS thermal printing, 1-second branch catalog duplication, customer IOU financing, and autonomous WebMCP co-browsing on document.modelContext.`,
        sources: ['WETAEGO Knowledge Base', 'WebMCP Protocol Specification']
      })
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Question from landing page visitor: "${question.trim()}"` }]
        }
      ],
      config: {
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        temperature: 0.2,
        maxOutputTokens: 350
      }
    })

    const answer = response.text || 'WETAEGO powers storefronts, live operations, and autonomous WebMCP agents across 9 specialized industries.'

    return NextResponse.json({
      answer,
      question: question.trim()
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating response'
    return NextResponse.json(
      {
        answer: 'WETAEGO is the universal commerce and operations OS for modern brands. It provides instant digital storefronts, driverless ESC/POS printing, multi-branch fleet duplication, and WebMCP agent co-browsing.',
        error: message
      },
      { status: 200 }
    )
  }
}
