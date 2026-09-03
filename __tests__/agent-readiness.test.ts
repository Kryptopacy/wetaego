import { describe, it, expect } from 'vitest'
import { getMarkdownForPath, MARKDOWN_404, MARKDOWN_HOME, MARKDOWN_DOCS, MARKDOWN_ABOUT, MARKDOWN_CONTACT } from '@/lib/markdown-content'
import fs from 'fs'
import path from 'path'

describe('Agent Readiness (Ora & Is Agentic Compliance)', () => {
  describe('Markdown Content Negotiation (acceptmarkdown.com)', () => {
    it('serves markdown for the homepage with 200 OK', () => {
      const result = getMarkdownForPath('/')
      expect(result.status).toBe(200)
      expect(result.content).toContain('WETAEGO')
      expect(result.content).toContain('Core Platform Capabilities')
    })

    it('serves markdown for trust anchor pages (/about, /contact, /privacy)', () => {
      const about = getMarkdownForPath('/about')
      expect(about.status).toBe(200)
      expect(about.content).toContain('About WETAEGO')

      const contact = getMarkdownForPath('/contact')
      expect(contact.status).toBe(200)
      expect(contact.content).toContain('Contact & Support')

      const privacy = getMarkdownForPath('/privacy')
      expect(privacy.status).toBe(200)
      expect(privacy.content).toContain('Privacy Policy')
    })

    it('serves developer documentation markdown at /docs and /developers', () => {
      const docs = getMarkdownForPath('/docs')
      expect(docs.status).toBe(200)
      expect(docs.content).toContain('Developer Documentation')

      const dev = getMarkdownForPath('/developers')
      expect(dev.status).toBe(200)
      expect(dev.content).toContain('Developer Documentation')
    })

    it('returns real 404 status with agent recovery body for nonexistent paths', () => {
      const missing = getMarkdownForPath('/non-existent-page-for-agent-recovery-test')
      expect(missing.status).toBe(404)
      expect(missing.content).toContain('404')
      expect(missing.content).toContain('Where to Look Next')
      expect(missing.content).toContain('https://ourmenuos.online/sitemap.xml')
      expect(missing.content).toContain('https://ourmenuos.online/llms.txt')
      expect(missing.content).toContain('https://ourmenuos.online/docs')
    })
  })

  describe('Developer Resource Discoverability & Agent Instruction Files', () => {
    it('has valid OpenAPI 3.1.0 specification file in public directory', () => {
      const openapiPath = path.join(process.cwd(), 'public', 'openapi.json')
      expect(fs.existsSync(openapiPath)).toBe(true)
      const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'))
      expect(openapi.openapi).toBe('3.1.0')
      expect(openapi.info.title).toContain('WETAEGO')
      expect(openapi.paths['/chat']).toBeDefined()
      expect(openapi.paths['/ai/parse-menu']).toBeDefined()
      expect(openapi.paths['/orders']).toBeDefined()
    })

    it('has valid MCP server discovery manifest in .well-known/mcp.json', () => {
      const mcpPath = path.join(process.cwd(), 'public', '.well-known', 'mcp.json')
      expect(fs.existsSync(mcpPath)).toBe(true)
      const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
      expect(mcp.name).toBe('ourmenuos-mcp')
      expect(mcp.tools.length).toBeGreaterThan(0)
    })

    it('has agent instructions and when-to-use guidance in llms.txt, llms-full.txt, and agent-instructions.md', () => {
      const llmsPath = path.join(process.cwd(), 'public', 'llms.txt')
      const llmsFull = path.join(process.cwd(), 'public', 'llms-full.txt')
      const agentInst = path.join(process.cwd(), 'public', 'agent-instructions.md')
      const agentJson = path.join(process.cwd(), 'public', '.well-known', 'agent.json')

      expect(fs.existsSync(llmsPath)).toBe(true)
      expect(fs.existsSync(llmsFull)).toBe(true)
      expect(fs.existsSync(agentInst)).toBe(true)
      expect(fs.existsSync(agentJson)).toBe(true)

      const llmsText = fs.readFileSync(llmsPath, 'utf8')
      expect(llmsText).toContain('When to Use WETAEGO')
      expect(llmsText).toContain('https://ourmenuos.online/docs')
      expect(llmsText).toContain('https://ourmenuos.online/about')
      expect(llmsText).toContain('https://ourmenuos.online/contact')
    })
  })

  describe('Trust Anchor Pages & Character Counts', () => {
    it('has rich content in /about, /contact, and /privacy pages (>500 characters)', () => {
      const aboutPath = path.join(process.cwd(), 'app', 'about', 'page.tsx')
      const contactPath = path.join(process.cwd(), 'app', 'contact', 'page.tsx')
      const privacyPath = path.join(process.cwd(), 'app', 'privacy', 'page.tsx')

      expect(fs.existsSync(aboutPath)).toBe(true)
      expect(fs.existsSync(contactPath)).toBe(true)
      expect(fs.existsSync(privacyPath)).toBe(true)

      const aboutContent = fs.readFileSync(aboutPath, 'utf8')
      const contactContent = fs.readFileSync(contactPath, 'utf8')
      const privacyContent = fs.readFileSync(privacyPath, 'utf8')

      expect(aboutContent.length).toBeGreaterThan(1500)
      expect(contactContent.length).toBeGreaterThan(1000)
      expect(privacyContent.length).toBeGreaterThan(1000)
    })
  })

  describe('WebMCP Browser API & Tool Registry', () => {
    it('initializes document.modelContext, navigator.modelContext, and window.modelContext with all 13 tools and resultSchemas', async () => {
      const { ensureWebMCPContext } = await import('@/lib/webmcp/registry')
      const { WEBMCP_TOOLS } = await import('@/components/WebMcpProvider')

      const ctx = ensureWebMCPContext()
      expect(ctx).toBeDefined()
      if (typeof ctx.provideContext === 'function') {
        ctx.provideContext({ tools: WEBMCP_TOOLS })
      }
      WEBMCP_TOOLS.forEach(tool => ctx.registerTool(tool))

      const tools = ctx.getTools ? ctx.getTools() : []
      expect(tools.length).toBeGreaterThanOrEqual(13)

      const toolNames = tools.map(t => t.name)
      expect(toolNames).toContain('find_venue')
      expect(toolNames).toContain('search_catalog')
      expect(toolNames).toContain('get_item_details')
      expect(toolNames).toContain('create_cart')
      expect(toolNames).toContain('add_to_cart')
      expect(toolNames).toContain('get_cart')
      expect(toolNames).toContain('update_cart')
      expect(toolNames).toContain('apply_coupon')
      expect(toolNames).toContain('recommend_pairings')
      expect(toolNames).toContain('open_business_page')
      expect(toolNames).toContain('initiate_checkout')
      expect(toolNames).toContain('submit_order')
      expect(toolNames).toContain('request_staff')

      // Multi-protocol transparent lookup
      expect((ctx as any).findTool?.('wetaego_search_catalog') || (ctx as any).registeredTools?.get('wetaego_search_catalog')).toBeDefined()
      expect((ctx as any).findTool?.('wetaego_submit_order') || (ctx as any).registeredTools?.get('wetaego_submit_order')).toBeDefined()

      for (const t of tools) {
        expect(t.name).toBeDefined()
        expect(t.description).toBeDefined()
        expect(t.inputSchema).toBeDefined()
        expect(t.outputSchema).toBeDefined()
        expect(t.resultSchema).toBeDefined()
        expect(typeof t.execute).toBe('function')
      }
    })

    it('validates apply_coupon applies discount and recalculates cart & checkout totals', async () => {
      const { WEBMCP_TOOLS } = await import('@/components/WebMcpProvider')

      const createCartTool = WEBMCP_TOOLS.find(t => t.name === 'create_cart')!
      const addToCartTool = WEBMCP_TOOLS.find(t => t.name === 'add_to_cart')!
      const applyCouponTool = WEBMCP_TOOLS.find(t => t.name === 'apply_coupon')!
      const getCartTool = WEBMCP_TOOLS.find(t => t.name === 'get_cart')!
      const checkoutTool = WEBMCP_TOOLS.find(t => t.name === 'initiate_checkout')!

      expect(applyCouponTool).toBeDefined()

      // Reset cart and add item
      await createCartTool.execute!()
      await addToCartTool.execute!({ itemId: 'item_tartine_1', quantity: 2 })

      // Apply coupon
      const couponResult = await applyCouponTool.execute!({ couponCode: 'WELCOME20' })
      expect(couponResult.status).toBe('ok')
      expect(couponResult.success).toBe(true)
      expect(couponResult.couponCode).toBe('WELCOME20')
      expect(couponResult.discountPercentage).toBe(20)
      expect(couponResult.discountAmount).toBeGreaterThan(0)
      expect(couponResult.total).toBe(couponResult.subtotal - couponResult.discountAmount)

      // Verify get_cart reflects coupon and updated total
      const cartResult = await getCartTool.execute!()
      expect(cartResult.appliedCoupon).toBe('WELCOME20')
      expect(cartResult.discountPercentage).toBe(20)
      expect(cartResult.discountAmount).toBe(couponResult.discountAmount)
      expect(cartResult.total).toBe(couponResult.total)

      // Verify initiate_checkout retains locked discount
      const checkoutResult = await checkoutTool.execute!({ fulfillment: 'dine_in' })
      expect(checkoutResult.status).toBe('ok')
      expect(checkoutResult.appliedCoupon).toBe('WELCOME20')
      expect(checkoutResult.discountAmount).toBe(couponResult.discountAmount)
      expect(checkoutResult.total).toBe(couponResult.total)
    })

    it('enforces strict currency, phone, and concept-slug schemas', async () => {
      const { WEBMCP_TOOLS } = await import('@/components/WebMcpProvider')

      const searchTool = WEBMCP_TOOLS.find(t => t.name === 'search_catalog')!
      const openPageTool = WEBMCP_TOOLS.find(t => t.name === 'open_business_page')!
      const checkoutTool = WEBMCP_TOOLS.find(t => t.name === 'initiate_checkout')!

      // Currency constraint check
      const currencyProp = searchTool.inputSchema.properties.currency
      expect(currencyProp.pattern).toBe('^[A-Z]{3}$')
      expect(currencyProp.minLength).toBe(3)
      expect(currencyProp.maxLength).toBe(3)
      expect(currencyProp.enum).toContain('USD')
      expect(currencyProp.enum).toContain('NGN')

      // Concept-slug constraint check
      const conceptSlugProp = openPageTool.inputSchema.properties.conceptSlug
      expect(conceptSlugProp.pattern).toBe('^[a-z0-9]+(?:-[a-z0-9]+)*$')
      expect(conceptSlugProp.minLength).toBe(2)
      expect(conceptSlugProp.enum).toContain('restaurant')

      // Phone constraint check
      const phoneProp = (checkoutTool.inputSchema.properties.customer as any).properties.phone
      expect(phoneProp.format).toBe('tel')
      expect(phoneProp.minLength).toBe(7)
      expect(phoneProp.maxLength).toBe(20)
      expect(phoneProp.pattern).toBeDefined()
    })
  })
})
