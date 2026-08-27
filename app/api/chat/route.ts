import { google } from '@ai-sdk/google'
import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'
import { getAiModels } from '@/lib/utils/settings'
import { checkRateLimit } from '@/lib/upstash'

export const maxDuration = 30

const chatSchema = z.object({
  messages: z.array(z.any()),
  locationId: z.string().uuid('Invalid location ID'),
  templateType: z.string().optional().default('catalog'),
  billingMode: z.string().optional().default('table_service'),
  businessTypePreset: z.string().optional().nullable(),
  tableIdentifier: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = chatSchema.safeParse(body)
    
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.format() }), { status: 400 })
    }

    const { messages, locationId, templateType, billingMode, businessTypePreset, tableIdentifier } = parsed.data

    const { getBusinessMode, resolvePersona } = await import('@/lib/templates/ai-personas')
    const mode = getBusinessMode(templateType, billingMode, businessTypePreset)

    // 1. Strict IP-Based Rate Limiting using Upstash
    const { success } = await checkRateLimit('public_ai_chat')
    if (!success) {
      return new Response('Too many requests from this IP. Please try again later.', { status: 429 })
    }

    // 2. Session-based rate limit (Max 30 messages per session)
    const cookieStore = await cookies()
    const countCookie = cookieStore.get('ai_chat_count')
    const count = countCookie ? parseInt(countCookie.value, 10) : 0

    if (count >= 30) {
      return new Response(
        'You have reached the maximum message limit for this session. A staff member is happy to assist you directly.',
        { status: 429 }
      )
    }

    // Increment session counter
    cookieStore.set('ai_chat_count', (count + 1).toString(), { maxAge: 60 * 60 * 4 }) // 4 hours

    const supabase = await createClient()

    // 3. Fetch location AI configuration
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, organization_id, name, ai_enabled, ai_name, ai_instructions, brand_knowledge, currency_code, ai_base_personality, ai_escalation_contact, ai_faqs, ai_manager_protection_mode, operating_hours, phone_number, whatsapp_number, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note')
      .eq('id', locationId)
      .limit(1)
      .maybeSingle()

    if (locError || !location) {
      return new Response('Location not found', { status: 404 })
    }
    
    const locationCurrency = location.currency_code || 'NGN'

    if (!location.ai_enabled) {
      return new Response('AI Assistant is disabled for this location', { status: 400 })
    }

    // 4. Fetch custom published pages (Knowledge Graph)
    const { data: customPages } = await supabase
      .from('location_pages')
      .select('id, title, content')
      .eq('location_id', locationId)
      .eq('is_published', true)

    let pagesText = ''
    if (customPages && customPages.length > 0) {
      pagesText = '\n\n[ADDITIONAL VENUE INFORMATION (POLICIES, EVENTS, ABOUT)]\n' + 
        customPages.map(p => `--- ${p.title} ---\n${p.content}`).join('\n\n')
    }

    // 5. Fetch live menu catalog
    const { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('location_id', locationId)
      .limit(1)
      .maybeSingle()

    let catalogText = 'No items are currently listed.'
    let itemsJson = '[]'
    const allItemsList: { id: string, name: string, price: number, description?: string, availability_status?: string, category?: string, dietary_tags?: string[], allergen_tags?: string[] }[] = []

    if (menu) {
      const { data: categories } = await supabase
        .from('menu_categories')
        .select('name, menu_items(*)')
        .eq('menu_id', menu.id)
        .order('sort_order')

      if (categories && categories.length > 0) {
        categories.forEach(cat => {
          (cat.menu_items || [])
            .filter((item: { availability_status?: string | null }) => item.availability_status !== 'hidden')
            .forEach((item: { id: string, name: string, price_minor: number, description: string | null, availability_status: string | null, dietary_tags?: string[] | null, allergen_tags?: string[] | null }) => {
              allItemsList.push({
                id: item.id,
                name: item.name,
                price: item.price_minor / 100,
                description: item.description || undefined,
                availability_status: item.availability_status || 'available',
                category: cat.name,
                dietary_tags: item.dietary_tags || [],
                allergen_tags: item.allergen_tags || []
              })
            })
        })
      }
    }

    // Also fetch page_items for custom templates
    if (customPages && customPages.length > 0) {
      const pageIds = customPages.map(p => p.id)
      const { data: pageItems } = await supabase
        .from('page_items')
        .select('id, title, price_minor, description, availability_status')
        .in('page_id', pageIds)
        .eq('is_published', true)

      if (pageItems && pageItems.length > 0) {
        pageItems.forEach(pi => {
          if (!allItemsList.some(i => i.id === pi.id)) {
            allItemsList.push({
              id: pi.id,
              name: pi.title,
              price: (pi.price_minor || 0) / 100,
              description: pi.description || undefined,
              availability_status: pi.availability_status || 'available',
              category: 'Page Items'
            })
          }
        })
      }
    }

    if (allItemsList.length > 0) {
      const grouped: Record<string, typeof allItemsList> = {}
      allItemsList.forEach(item => {
        const cat = item.category || 'Items'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(item)
      })

      catalogText = Object.entries(grouped).map(([catName, items]) => {
        const lines = items.map(i => `- [ID: ${i.id}] ${i.name}: ${formatCurrency(Math.round(i.price * 100), locationCurrency)} | Status: ${i.availability_status} | Desc: ${i.description || 'N/A'}${i.dietary_tags?.length ? ` | Dietary: ${i.dietary_tags.join(', ')}` : ''}${i.allergen_tags?.length ? ` | Allergens: ${i.allergen_tags.join(', ')}` : ''}`)
        return `### ${catName}\n${lines.join('\n')}`
      }).join('\n\n')

      itemsJson = JSON.stringify(allItemsList.map(i => ({ id: i.id, name: i.name, price: i.price, dietary: i.dietary_tags, allergens: i.allergen_tags })))
    }

    const persona = resolvePersona(mode, location.ai_name, location.name)

    let basePersonalityInstruction = 'Use a professional, polite, and welcoming tone.'
    switch (location.ai_base_personality) {
      case 'casual': basePersonalityInstruction = 'Use a casual, friendly, and approachable tone.'; break;
      case 'upscale': basePersonalityInstruction = 'Use refined, elegant language. Be highly attentive and formal.'; break;
      case 'witty': basePersonalityInstruction = 'Use a witty, playful, and charming tone without being unprofessional.'; break;
    }

    const escalationInstruction = location.ai_escalation_contact 
      ? `\n[ESCALATION CONTACT]\nDirect human contact: ${location.ai_escalation_contact}.` 
      : ''

    const faqs = location.ai_faqs as { question: string, answer: string }[]
    const faqInstruction = (faqs && Array.isArray(faqs) && faqs.length > 0) 
      ? `\n[VERIFIED BUSINESS FAQS]\n${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
      : ''
      
    const managerProtectionInstruction = location.ai_manager_protection_mode
      ? `\n[MANAGER PROTECTION MODE]\nYou are in Manager Protection Mode. Do NOT escalate unless necessary. Apologize graciously, log the issue using the staff request tool, and assure the customer their feedback has been recorded.`
      : ''

    const venueRules = `
[VENUE & OPERATING DETAILS]
- Venue Name: ${location.name}
- Operating Hours: ${location.operating_hours || 'Standard business hours'}
- Phone / Contact: ${location.phone_number || location.whatsapp_number || 'Available on request'}
${location.delivery_enabled ? `- Delivery: Enabled (Fee: ${formatCurrency(location.delivery_fee_minor || 0, locationCurrency)}, Minimum: ${formatCurrency(location.delivery_minimum_order_minor || 0, locationCurrency)})${location.delivery_note ? ` Note: ${location.delivery_note}` : ''}` : '- Delivery: Dine-in / Pick-up only'}`

    // 6. Construct the strict, zero-hallucination system prompt
    const systemPrompt = `You are ${persona.baseName}, acting as the official ${persona.subtitle} for ${location.name}.
Your mission is to guide guests, answer questions accurately, and execute service actions.

[ABSOLUTE ZERO-HALLUCINATION RULE - STRICT COMPLIANCE REQUIRED]
1. You must ONLY answer using facts explicitly documented in [VERIFIED BUSINESS FAQS], [LIVE CATALOG & OFFERINGS], [VENUE & OPERATING DETAILS], and [BRAND KNOWLEDGE GRAPH].
2. NEVER guess, assume, or fabricate prices, specifications, ingredients, availability, unlisted discounts, or policies.
3. If a customer asks a question not documented in your knowledge base (e.g., unlisted specs, custom rates, special exceptions), you MUST politely state that you do not have that exact information on record, and IMMEDIATELY trigger the appropriate staff escalation tool (${persona.tools.find(t => t.includes('callStaff') || t.includes('request') || t.includes('message')) || 'requestStaffHandoff'}) to notify a team member.
4. If a customer expresses frustration or asks to speak with a human/manager, trigger the staff request tool immediately with the customer's note.
5. NEVER generate code, poems, general essays, or engage in topics unrelated to ${location.name}. Say: "I am only able to assist with inquiries regarding ${location.name}."

[TOOL EXECUTION GUIDELINES]
- For catalog items, products, dishes, or services: when a customer confirms they want an offering, invoke 'addToCart' with the item ID and quantity.
- For attribute, specification, or dietary searches: invoke 'searchByDietaryAllergen' or recommend matching available offerings.
- For in-venue assistance (waiter, front desk, room service, check): invoke 'callStaffToTable' or 'messageFrontDesk'.
- For appointments & reservations: provide service details and invoke scheduling tools.
- For custom quotes & project estimates: capture client requirements and invoke 'submitCustomQuoteLead'.

[VENUE SPECIFIC INSTRUCTIONS]
${basePersonalityInstruction}
${location.ai_instructions || 'Be polite, concise, and helpful.'}
${venueRules}
${faqInstruction}
${escalationInstruction}
${managerProtectionInstruction}

[BRAND KNOWLEDGE GRAPH]
${location.brand_knowledge || 'No additional brand notes.'}
${pagesText}

[LIVE CATALOG & OFFERINGS]
${catalogText}`

    // Define comprehensive tool definitions
    const allTools = {
      addToCart: tool({
        description: 'Adds an item to the customer\'s order cart.',
        inputSchema: z.object({
          itemId: z.string().describe('The database ID of the item to add.'),
          quantity: z.number().default(1).describe('The quantity to add.'),
          notes: z.string().optional().describe('Special preparation or customization instructions.'),
        }),
      }),
      removeFromCart: tool({
        description: 'Removes an item from the customer\'s order cart.',
        inputSchema: z.object({
          itemId: z.string().describe('The database ID of the item to remove.'),
        }),
      }),
      clearCart: tool({
        description: 'Clears all items in the customer\'s cart.',
        inputSchema: z.object({}),
      }),
      checkout: tool({
        description: 'Opens the payment checkout sheet for the customer to finalize their order or booking.',
        inputSchema: z.object({}),
      }),
      searchByDietaryAllergen: tool({
        description: 'Searches the catalog for items matching dietary preferences or excluding allergens.',
        inputSchema: z.object({
          dietaryPreference: z.enum(['vegan', 'vegetarian', 'halal', 'gluten_free', 'dairy_free', 'keto', 'nut_free', 'any']).optional(),
          excludeAllergens: z.array(z.string()).optional().describe('Allergens to exclude (e.g. peanuts, shellfish, gluten)'),
        }),
      }),
      callStaffToTable: tool({
        description: 'Pages a floor staff member or manager to the customer\'s table for dining/hospitality venues.',
        inputSchema: z.object({
          requestType: z.enum(['waiter', 'bill', 'cleanup', 'water', 'manager_escalation']).describe('The service category needed.'),
          note: z.string().optional().describe('Context or specific request details from the customer.'),
        }),
      }),
      messageFrontDesk: tool({
        description: 'Sends a priority notification to the front desk or receptionist for salon, spa, clinic, or hotel guests.',
        inputSchema: z.object({
          subject: z.string().describe('Short summary of inquiry (e.g. "Appointment Rescheduling", "Custom Package Inquiry")'),
          customerMessage: z.string().describe('The customer\'s inquiry details.'),
        }),
      }),
      getProductSpecs: tool({
        description: 'Retrieves verified specifications, materials, sizing, and shipping info for a product.',
        inputSchema: z.object({
          itemId: z.string().describe('The product ID.'),
        }),
      }),
      checkStock: tool({
        description: 'Checks live stock status for an item.',
        inputSchema: z.object({
          itemId: z.string().describe('The item ID.'),
        }),
      }),
      requestSalesAssociate: tool({
        description: 'Alerts a sales associate to assist a customer with a retail inquiry.',
        inputSchema: z.object({
          inquiry: z.string().describe('What the customer needs assistance with.'),
        }),
      }),
      getPropertySpecs: tool({
        description: 'Retrieves property listing details such as square footage, bedrooms, parking, and amenities.',
        inputSchema: z.object({
          propertyId: z.string().describe('The property listing ID.'),
        }),
      }),
      checkViewingAvailability: tool({
        description: 'Checks available viewing windows for a property listing.',
        inputSchema: z.object({
          propertyId: z.string().describe('The property listing ID.'),
        }),
      }),
      submitBrokerInquiry: tool({
        description: 'Submits a qualified buyer/renter inquiry to the listing broker.',
        inputSchema: z.object({
          propertyId: z.string().optional(),
          clientName: z.string().describe('Client name.'),
          clientContact: z.string().describe('Phone or email.'),
          message: z.string().describe('Specific inquiry or viewing request.'),
        }),
      }),
      getPackageDetails: tool({
        description: 'Retrieves detailed tier breakdown and scope deliverables for quote and rate card templates.',
        inputSchema: z.object({
          tierName: z.string().describe('Name of the service tier or package.'),
        }),
      }),
      calculateEstimate: tool({
        description: 'Calculates an estimated project budget based on selected scope components.',
        inputSchema: z.object({
          selectedServices: z.array(z.string()).describe('List of service names or item IDs.'),
        }),
      }),
      submitCustomQuoteLead: tool({
        description: 'Captures and submits a custom project lead to the business dashboard.',
        inputSchema: z.object({
          clientName: z.string().describe('Name of prospective client.'),
          clientContact: z.string().describe('Phone number or email address.'),
          projectScope: z.string().describe('Description of the client\'s project goals and scope.'),
          estimatedBudget: z.string().optional().describe('Estimated budget range if provided.'),
        }),
      }),
      requestConsultantCallback: tool({
        description: 'Schedules a callback or consultation with a business specialist.',
        inputSchema: z.object({
          clientName: z.string(),
          clientContact: z.string(),
          preferredTime: z.string().optional(),
          topic: z.string(),
        }),
      }),
      checkAvailability: tool({
        description: 'Checks scheduling calendar availability for booking and appointment services.',
        inputSchema: z.object({
          serviceId: z.string().optional(),
          preferredDate: z.string().optional(),
        }),
      }),
      getServiceDetails: tool({
        description: 'Retrieves treatment/procedure duration, inclusions, and preparation guidelines.',
        inputSchema: z.object({
          serviceId: z.string().describe('The service ID.'),
        }),
      }),
      bookAppointmentSlot: tool({
        description: 'Initiates a booking reservation for a selected service slot.',
        inputSchema: z.object({
          serviceId: z.string(),
          slotTime: z.string(),
          clientName: z.string().optional(),
        }),
      }),
      requestStaffHandoff: tool({
        description: 'Universal human escalation tool. Alert staff when customer questions are unlisted or require human assistance.',
        inputSchema: z.object({
          reason: z.string().describe('Why human assistance is required.'),
          customerNote: z.string().describe('Summary of the customer\'s question or request.'),
        }),
      }),
    }

    // Only inject tools active for the business persona
    const activeTools = Object.fromEntries(
      Object.entries(allTools).filter(([name]) => persona.tools.includes(name as never))
    )

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.customer_ai_model || aiModels.text_generation || 'gemini-3-flash-preview'

    // 7. Initialize streaming text session with tools
    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages,
      stopWhen: stepCountIs(5),
      tools: activeTools,
    })

    return (result as unknown as { toDataStreamResponse: () => Response }).toDataStreamResponse()
  } catch (err: unknown) {
    console.error('Public Chat API Error:', err)
    return new Response(
      'I apologize, but my connection is temporarily unavailable. Please speak directly with our team on site.', 
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    )
  }
}
