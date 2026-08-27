import { createClient } from '@/lib/supabase/server'
import { getAiModels, getCreditCosts, getInfrastructureFlags } from '@/lib/utils/settings'
import { chargeCredits } from '@/lib/payments/credits'
import { google } from '@ai-sdk/google'
import { streamText, UIMessage, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/upstash'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_copilot')
    if (!rlSuccess) {
      return new Response('Too many requests', { status: 429 })
    }

    const infraFlags = await getInfrastructureFlags() as Record<string, boolean>
    if (infraFlags.ai_enabled === false) {
      return new Response('AI services are currently undergoing maintenance.', { status: 503 })
    }

    const { messages, organizationId } = await req.json() as { messages: UIMessage[], organizationId: string }
    
    if (!organizationId) {
      return new Response('Missing organization ID', { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = !!member
    let userRole = member?.role || 'viewer'
    
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', userData.user.id).limit(1).maybeSingle()
      isAuthorized = !!org
      if (org) userRole = 'owner'
    }

    if (!isAuthorized) {
      return new Response('Unauthorized', { status: 403 })
    }

    // Charge credit for AI interaction (1 credit per message sent)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      const creditCosts = await getCreditCosts() as Record<string, number>
      const cost = creditCosts.copilot || 1
      const charge = await chargeCredits(organizationId, cost, 'Admin AI Co-Pilot', userData.user.id)
      
      if (!charge.success) {
        return new Response(charge.error, { status: 402 })
      }
    }

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.business_ai_model || aiModels.text_generation || 'gemini-3-flash-preview'

    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, business_type')
      .eq('id', organizationId)
      .single()

    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const dynamicContext = `You are Tego, the autonomous Admin AI Co-Pilot for OurMenu OS, the universal commerce, booking, and service operating system for modern businesses and autonomous AI agents.
      You are an expert business assistant built directly into the merchant dashboard, capable of real-time Voice, Camera Vision streaming, and administrative execution across any commercial sector (retail, hospitality, health & wellness, automotive, professional services, creative media, repairs, and enterprise fleets). 
      Your goal is to help merchants operate their business efficiently, tweak their storefront design, check incoming orders, configure AI agents, and answer any technical questions about OurMenu OS.

      LIVE MERCHANT CONTEXT:
      - Organization Name: ${orgData?.name || 'Unknown'}
      - Business Type: ${orgData?.business_type || 'Unknown'}
      - Total Locations: ${locationCount || 0}
      - Your Permission Level: ${userRole}

      Core OurMenu OS Capabilities & Architecture:
      1. Universal Design Tokens & Multi-Template Engines:
         - Templates: 'catalog' (retail, supermarkets, restaurants), 'booking' (spas, salons, clinics, hotels), 'rate_card' (freelancers, creators, agencies), 'quote' (B2B quotes, repair diagnostics), 'listing' (real estate, vehicles), 'portfolio', 'item_card', 'portal', and 'builder'.
         - Design Tokens: 'layout_mode' ('bento_grid', 'masonry', 'list'), 'surface_style' ('flat', 'glassmorphism', 'neumorphism'), 'corner_radius' ('none', 'sm', 'md', 'lg', 'xl', 'full'), 'typography' ('modern', 'elegant', 'playful', 'industrial'), 'density' ('airy', 'standard', 'cozy'), and 'color_theme' ('true_dark', 'dim', 'light', 'tinted').
         - Scopes: Can be applied globally to a location or overridden per specific page ('pageId') with a 1-click 'Revert to Global Settings' fail-safe.
      2. Tego Multimodal Live Voice & Vision:
         - Real-time bidirectional voice dialogue (16kHz audio in / 24kHz audio out with barge-in interruption) and 1 FPS camera video ingestion via Gemini Live ('gemini-3.1-flash-live-preview').
         - Merchants can show you physical products, packaging, handwritten price lists, receipts, inventory stock, or menus via camera.
      3. Frontline Public Assistant & Human Handoff:
         - The storefront assistant dynamically adapts its role to the merchant's business preset (e.g. 'Dining Assistant', 'Wellness & Booking Specialist', 'Technical Service Advisor', 'Product Guide').
         - Operates with strict zero-hallucination guardrails (only answers from verified offerings, FAQs, and brand knowledge).
         - Executes public tools ('addToCart', 'searchByDietaryAllergen', 'callStaffToTable', 'checkAvailability', 'submitCustomQuoteLead').
         - When customer requests human help or asks unlisted questions, it generates a ticket in 'service_requests', alerting staff on the Orders dashboard for 1-click resolution.
      4. WebMCP Browser Agent Protocol:
         - Public storefronts dynamically register in-browser tools on 'document.modelContext' for autonomous co-browsing and goal-oriented purchasing.
      5. Add-On Modules:
         - Lucky Wheel Gamification (contextual checkout discounts).
         - Surprise Me Randomizer (recommendation roulette for guests).
         - In-house Delivery minimums and fee calculations.
         - Deposit & Partial Billing.
         - IOU Buy Now Pay Later customer credit ledger.
      6. QR Codes & Decoupled Routing:
         - Dynamic routing of physical QR codes to locations or specific pages without reprinting.
      7. Multi-Branch Chains & Enterprise Fleet Management:
         - 'locations' represents physical branches across cities/neighborhoods (e.g. Downtown Branch, Lekki Mega Store).
         - 'location_pages' represents sub-departments within a single location (e.g. Main Aisles, Specialty Department, In-Store Service Desk).
         - The Top-Left Unified Switcher toggles 'Global View' (fleet-wide revenue, tickets, inventory) or individual branch/department views.
         - Merchants create physical branches in Settings -> Locations tab ('/dashboard/settings?tab=locations').
         - 1-Click Franchise Duplication: In Storefront Pages ('/dashboard/pages'), clicking 'Duplicate Page' clones an entire master catalog (collections, items, taxonomy mappings) to a new branch in < 1 second.
         - Granular Franchise RBAC: In Settings -> Team ('/dashboard/settings?tab=team'), branch managers can be invited and cryptographically scoped to their specific branch ('page_id' or 'location_id').
      
      System Guidelines:
      - You can guide merchants through setting up branches, duplicating catalogs, or configuring sub-departments step-by-step.
      - You can update design tokens directly using the 'update_brand_appearance' tool.
      - Use the 'get_business_structure' tool to inspect the merchant's active locations and pages.
      - Use 'get_recent_orders' to review incoming sales.
      - If unsure of deep architectural features (Webhooks, CRM, Delivery, POS, Multi-Branch Fleet), use the 'query_os_documentation' tool.
      - Keep spoken and chat responses concise, clear, and actionable.`

    const result = streamText({
      model: google(modelName),
      messages: await convertToModelMessages(messages),
      system: dynamicContext,
      tools: {
        get_business_structure: tool({
          description: 'Fetch the locations and pages (menus, booking pages) belonging to this organization.',
          parameters: z.object({}),
          // @ts-expect-error - TS inference struggles with Vercel AI SDK tool execute signatures
          execute: async (): Promise<Record<string, unknown>[]> => {
            const { data: locations } = await supabase
              .from('locations')
              .select('id, name, slug, location_pages(id, title, template_type, is_published)')
              .eq('organization_id', organizationId)
            return locations || []
          }
        }),
        query_os_documentation: tool({
          description: 'Query the OurMenu OS technical documentation to answer questions about deep platform features like Webhooks, CRM, Delivery, POS, Affiliates, etc.',
          parameters: z.object({
            query: z.string().describe('The topic to search for (e.g., "how do webhooks work", "crm integration")')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ query }: { query: string }): Promise<Record<string, unknown>> => {
            try {
              const origin = new URL(req.url).origin
              const res = await fetch(`${origin}/llms-full.txt`)
              if (!res.ok) {
                // fallback to basic llms.txt if full is missing
                const fallback = await fetch(`${origin}/llms.txt`)
                if (fallback.ok) return { success: true, documentation: await fallback.text() }
                return { error: 'Documentation unavailable.' }
              }
              const docs = await res.text()
              return { success: true, documentation: docs, note: 'Synthesize the answer based on this documentation.' }
            } catch (e) {
              return { error: 'Failed to fetch documentation.' }
            }
          }
        }),
        update_brand_appearance: tool({
          description: 'Update the design tokens (theme, layout, colors, font) for a specific location. Use this when the merchant wants to change how their storefront looks.',
          parameters: z.object({
            locationId: z.string().uuid(),
            pageId: z.string().uuid().optional().describe('Optional ID of a specific page. If provided, updates aesthetic only for this page.'),
            tokens: z.object({
              theme_color: z.string().optional(),
              layout_mode: z.enum(['bento_grid', 'masonry', 'list']).optional(),
              corner_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional(),
              surface_style: z.enum(['flat', 'glassmorphism', 'neumorphism']).optional(),
              typography: z.enum(['modern', 'elegant', 'playful', 'industrial']).optional(),
              animation_style: z.enum(['energetic', 'elegant', 'instant']).optional(),
              density: z.enum(['airy', 'standard', 'cozy']).optional(),
              color_theme: z.enum(['true_dark', 'dim', 'light', 'tinted']).optional(),
            }).describe('The design tokens to update. Only include the fields the merchant specifically requested to change.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, pageId, tokens }: { locationId: string; pageId?: string; tokens: Record<string, string> }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can update appearance.' }
            }
            
            if (pageId) {
              const { data: page } = await supabase.from('location_pages').select('design_tokens, location_id').eq('id', pageId).single()
              if (!page || page.location_id !== locationId) return { error: 'Page not found or does not belong to this location.' }
              
              const existingTokens = (typeof page.design_tokens === 'object' && page.design_tokens !== null ? page.design_tokens : {}) as Record<string, string>
              const newTokens = { ...existingTokens }
              
              if (tokens.layout_mode) newTokens.layout_mode = tokens.layout_mode
              if (tokens.corner_radius) newTokens.corner_radius = tokens.corner_radius
              if (tokens.surface_style) newTokens.surface_style = tokens.surface_style
              if (tokens.typography) newTokens.typography = tokens.typography
              if (tokens.animation_style) newTokens.animation_style = tokens.animation_style
              if (tokens.density) newTokens.density = tokens.density
              if (tokens.color_theme) newTokens.color_theme = tokens.color_theme

              const { error } = await supabase
                .from('location_pages')
                .update({ design_tokens: newTokens } as never)
                .eq('id', pageId)

              if (error) return { error: error.message }
              return { success: true, updatedTokens: newTokens, message: `Page aesthetic updated successfully!` }
            } else {
              const { data: loc } = await supabase.from('locations').select('design_tokens').eq('id', locationId).single()
              if (!loc) return { error: 'Location not found.' }
              
              const existingTokens = (typeof loc.design_tokens === 'object' && loc.design_tokens !== null ? loc.design_tokens : {}) as Record<string, string>
              
              const newTokens = { ...existingTokens }
              if (tokens.layout_mode) newTokens.layout_mode = tokens.layout_mode
              if (tokens.corner_radius) newTokens.corner_radius = tokens.corner_radius
              if (tokens.surface_style) newTokens.surface_style = tokens.surface_style
              if (tokens.typography) newTokens.typography = tokens.typography
              if (tokens.animation_style) newTokens.animation_style = tokens.animation_style
              if (tokens.density) newTokens.density = tokens.density
              if (tokens.color_theme) newTokens.color_theme = tokens.color_theme

              const updates: Record<string, unknown> = {
                design_tokens: newTokens,
                updated_at: new Date().toISOString()
              }
              if (tokens.theme_color) updates.theme_color = tokens.theme_color

              const { error } = await supabase
                .from('locations')
                .update(updates as never)
                .eq('id', locationId)
                
              if (error) return { error: error.message }
              return { success: true, updatedTokens: newTokens, message: 'Global storefront appearance updated successfully!' }
            }
          }
        }),
        get_recent_orders: tool({
          description: 'Fetch recent orders for a specific location. Use this to help merchants check new incoming orders or order status.',
          parameters: z.object({
            locationId: z.string().uuid(),
            limit: z.number().default(5).describe('Number of orders to fetch')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, limit }: { locationId: string; limit: number }): Promise<Record<string, unknown>[]> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return [{ error: 'Unauthorized: Cannot view orders.' }]
            }
            const { data: orders } = await supabase
              .from('orders')
              .select('id, status, total_amount_minor, customer_name, created_at')
              .eq('location_id', locationId)
              .order('created_at', { ascending: false })
              .limit(limit)
            return orders || []
          }
        }),
        update_order_status: tool({
          description: 'Update the status of an order (e.g. from pending to completed or cancelled).',
          parameters: z.object({
            orderId: z.string().uuid(),
            status: z.enum(['pending', 'processing', 'ready', 'completed', 'cancelled'])
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ orderId, status }: { orderId: string; status: string }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Cannot update order status.' }
            }
            const { error } = await supabase
              .from('orders')
              .update({ status, updated_at: new Date().toISOString() } as never)
              .eq('id', orderId)
            
            if (error) return { error: error.message }
            return { success: true, orderId, status }
          }
        }),
        get_low_stock_alerts: tool({
          description: 'Get a list of inventory items that are running low (current quantity is at or below the reorder threshold).',
          parameters: z.object({
            locationId: z.string().uuid('The ID of the location to check inventory for.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId }: { locationId: string }): Promise<Record<string, unknown>[]> => {
            // Fetch all non-archived for the location and filter here
            const { data: allItems } = await supabase
              .from('inventory_items')
              .select('id, name, current_quantity, unit, reorder_threshold')
              .eq('location_id', locationId)
              .eq('is_archived', false)

            if (!allItems) return []
            return allItems.filter(item => item.reorder_threshold !== null && item.current_quantity <= item.reorder_threshold)
          }
        }),
        update_inventory_stock: tool({
          description: 'Update the current quantity (stock level) of an inventory item.',
          parameters: z.object({
            itemId: z.string().uuid(),
            newQuantity: z.number()
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ itemId, newQuantity }: { itemId: string; newQuantity: number }): Promise<Record<string, unknown>> => {
            const { error } = await supabase
              .from('inventory_items')
              .update({ current_quantity: newQuantity, updated_at: new Date().toISOString() })
              .eq('id', itemId)
            
            if (error) throw new Error(error.message)
            return { success: true, itemId, newQuantity }
          }
        }),
        generate_sales_summary: tool({
          description: 'Get a summary of sales revenue and order volume for a specific location over a timeframe.',
          parameters: z.object({
            locationId: z.string().uuid(),
            timeframe: z.enum(['today', 'this_week', 'this_month'])
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, timeframe }: { locationId: string; timeframe: 'today' | 'this_week' | 'this_month' }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can view sales summaries.' }
            }
            
            const now = new Date()
            const startDate = new Date()
            if (timeframe === 'today') {
              startDate.setHours(0, 0, 0, 0)
            } else if (timeframe === 'this_week') {
              startDate.setDate(now.getDate() - now.getDay())
              startDate.setHours(0, 0, 0, 0)
            } else if (timeframe === 'this_month') {
              startDate.setDate(1)
              startDate.setHours(0, 0, 0, 0)
            }

            const { data: orders } = await supabase
              .from('orders')
              .select('total_amount_minor, status')
              .eq('location_id', locationId)
              .gte('created_at', startDate.toISOString())
              
            if (!orders) return { revenueMinor: 0, orderCount: 0, timeframe }
            
            const completed = orders.filter(o => o.status !== 'cancelled')
            const revenueMinor = completed.reduce((sum, o) => sum + (o.total_amount_minor || 0), 0)
            
            return {
              timeframe,
              revenueMinor,
              orderCount: completed.length
            }
          }
        }),
        create_menu_category: tool({
          description: 'Create a new menu category for a specific location.',
          parameters: z.object({
            locationId: z.string().uuid(),
            menuId: z.string().uuid(),
            categoryName: z.string()
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, menuId, categoryName }: { locationId: string; menuId: string; categoryName: string }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can create categories.' }
            }
            
            const { data, error } = await supabase
              .from('menu_categories')
              .insert({
                organization_id: organizationId,
                location_id: locationId,
                menu_id: menuId,
                name: categoryName
              } as never)
              .select('id')
              .single()
              
            if (error) throw new Error(error.message)
            return { success: true, categoryId: data.id, name: categoryName }
          }
        }),
        add_menu_item: tool({
          description: 'Add a new item to a menu category.',
          parameters: z.object({
            locationId: z.string().uuid(),
            categoryId: z.string().uuid(),
            name: z.string(),
            description: z.string().optional(),
            priceMinor: z.number().describe('The price in minor units (e.g., kobo, cents). 1000 NGN = 100000 minor units.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, categoryId, name, description, priceMinor }: { locationId: string; categoryId: string; name: string; description?: string; priceMinor: number }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can add menu items.' }
            }
            
            // Generate a slug
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
            
            const { data, error } = await supabase
              .from('menu_items')
              .insert({
                organization_id: organizationId,
                location_id: locationId,
                category_id: categoryId,
                name: name,
                slug: slug,
                description: description || null,
                price_minor: priceMinor,
                is_available: true
              } as never)
              .select('id')
              .single()
              
            if (error) throw new Error(error.message)
            return { success: true, itemId: data.id, name }
          }
        }),
        create_location_page: tool({
          description: 'Create a new location page (e.g. a menu, booking page, or catalog) for a location.',
          parameters: z.object({
            locationId: z.string().uuid(),
            title: z.string().describe('The title of the new page, e.g. "Main Menu", "Spa Bookings"'),
            templateType: z.enum(['catalog', 'booking', 'rate_card', 'quote', 'listing', 'info', 'custom']),
            businessTypePreset: z.string().optional().describe('The preset to use, e.g. "restaurant", "spa_wellness". Helps set default aesthetics.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ locationId, title, templateType, businessTypePreset }: { locationId: string; title: string; templateType: string; businessTypePreset?: string }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can create pages.' }
            }
            
            // Generate a slug
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
            
            const { data, error } = await supabase
              .from('location_pages')
              .insert({
                location_id: locationId,
                title: title,
                slug: slug,
                template_type: templateType,
                business_type_preset: businessTypePreset || null,
                is_published: true,
                billing_enabled: templateType !== 'info' && templateType !== 'custom'
              } as never)
              .select('id')
              .single()
              
            if (error) throw new Error(error.message)
            return { success: true, pageId: data.id, title, slug, url: `/dashboard/pages/${data.id}/edit` }
          }
        }),
        create_fleet_location: tool({
          description: 'Create a new physical branch location for this organization (e.g. "Supermarket - Ikeja", "Downtown Branch"). Use this when the merchant asks to open/add a new branch.',
          parameters: z.object({
            name: z.string().describe('The display name of the branch, e.g. "Supermarket - Ikeja Mall"'),
            slug: z.string().optional().describe('The URL slug for the branch (must be lowercase alphanumeric + hyphens). If omitted, generated from name.'),
            address: z.string().optional().describe('The physical address of the branch.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ name, slug, address }: { name: string; slug?: string; address?: string }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can launch new physical locations.' }
            }

            const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + '-' + Date.now().toString().slice(-4)

            const { data, error } = await supabase
              .from('locations')
              .insert({
                organization_id: organizationId,
                name,
                slug: cleanSlug,
                address: address || null
              } as never)
              .select('id, name, slug')
              .single()

            if (error) throw new Error(error.message)
            return { success: true, locationId: data.id, name: data.name, slug: data.slug, message: `New branch "${data.name}" launched successfully!` }
          }
        }),
        duplicate_page_catalog: tool({
          description: 'Duplicate an entire product catalog or page (including all categories, items, and prices) to another location or branch. Use this when the merchant asks to clone or copy inventory to a new branch.',
          parameters: z.object({
            sourcePageId: z.string().uuid().describe('ID of the source page/catalog to clone.'),
            newTitle: z.string().describe('Title for the cloned page, e.g. "Grocery Catalog (Ikeja)"'),
            targetLocationId: z.string().uuid().optional().describe('Target location ID if cloning to a different physical branch. If omitted, clones to the same location.')
          }),
          // @ts-expect-error - TS inference struggles
          execute: async ({ sourcePageId, newTitle, targetLocationId }: { sourcePageId: string; newTitle: string; targetLocationId?: string }): Promise<Record<string, unknown>> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can duplicate catalogs.' }
            }

            // 1. Fetch source page
            const { data: sourcePage, error: pageErr } = await supabase
              .from('location_pages')
              .select('*')
              .eq('id', sourcePageId)
              .single()
              
            if (pageErr || !sourcePage) return { error: 'Source page not found.' }

            const cleanSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)

            // 2. Insert new page
            const newPageData = {
              ...sourcePage,
              id: undefined,
              created_at: undefined,
              location_id: targetLocationId || sourcePage.location_id,
              title: newTitle,
              slug: cleanSlug,
              is_primary: false,
              is_published: true
            }

            const { data: newPage, error: newPageErr } = await supabase
              .from('location_pages')
              .insert(newPageData as never)
              .select('id')
              .single()

            if (newPageErr || !newPage) return { error: newPageErr?.message || 'Failed to duplicate page' }
            const newPageId = newPage.id

            // 3. Duplicate collections
            const { data: collections } = await supabase
              .from('page_collections')
              .select('*')
              .eq('page_id', sourcePageId)

            const collectionMap = new Map<string, string>()
            if (collections && collections.length > 0) {
              for (const col of collections) {
                const { id: oldColId, created_at, updated_at, ...colData } = col
                const { data: newCol } = await supabase
                  .from('page_collections')
                  .insert({ ...colData, page_id: newPageId } as never)
                  .select('id')
                  .single()

                if (newCol) collectionMap.set(oldColId, newCol.id)
              }
            }

            // 4. Duplicate items
            const { data: items } = await supabase
              .from('page_items')
              .select('*')
              .eq('page_id', sourcePageId)

            const itemMap = new Map<string, string>()
            if (items && items.length > 0) {
              for (const item of items) {
                const { id: oldItemId, created_at, ...itemData } = item
                const { data: newItem } = await supabase
                  .from('page_items')
                  .insert({ ...itemData, page_id: newPageId } as never)
                  .select('id')
                  .single()

                if (newItem) itemMap.set(oldItemId, newItem.id)
              }
            }

            // 5. Re-map junction table
            if (collectionMap.size > 0 && itemMap.size > 0) {
              const oldCollectionIds = Array.from(collectionMap.keys())
              const { data: mappings } = await supabase
                .from('page_item_collections')
                .select('*')
                .in('collection_id', oldCollectionIds)

              if (mappings && mappings.length > 0) {
                const newMappings = mappings
                  .filter(m => itemMap.has(m.item_id) && collectionMap.has(m.collection_id))
                  .map(m => ({
                    item_id: itemMap.get(m.item_id)!,
                    collection_id: collectionMap.get(m.collection_id)!
                  }))

                if (newMappings.length > 0) {
                  await supabase.from('page_item_collections').insert(newMappings as never)
                }
              }
            }

            return { 
              success: true, 
              newPageId, 
              title: newTitle, 
              itemsCloned: items?.length || 0,
              collectionsCloned: collections?.length || 0,
              message: `Catalog "${newTitle}" duplicated successfully with ${items?.length || 0} items!` 
            }
          }
        }),
      }
    })

    // Fallback to toTextStreamResponse or toDataStreamResponse depending on ai sdk version
    const anyResult = result as any
    return anyResult.toDataStreamResponse ? anyResult.toDataStreamResponse() : anyResult.toTextStreamResponse()
    
  } catch (error) {
    console.error('Co-Pilot Error:', error)
    return new Response('Failed to process chat', { status: 500 })
  }
}
