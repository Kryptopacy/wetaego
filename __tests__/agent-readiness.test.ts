import { describe, it, expect } from 'vitest'
import { getMarkdownForPath, MARKDOWN_404, MARKDOWN_HOME, MARKDOWN_DOCS, MARKDOWN_ABOUT, MARKDOWN_CONTACT } from '@/lib/markdown-content'
import fs from 'fs'
import path from 'path'

describe('Agent Readiness (Ora & Is Agentic Compliance)', () => {
  describe('Markdown Content Negotiation (acceptmarkdown.com)', () => {
    it('serves markdown for the homepage with 200 OK', () => {
      const result = getMarkdownForPath('/')
      expect(result.status).toBe(200)
      expect(result.content).toContain('OurMenu OS')
      expect(result.content).toContain('Core Platform Capabilities')
    })

    it('serves markdown for trust anchor pages (/about, /contact, /privacy)', () => {
      const about = getMarkdownForPath('/about')
      expect(about.status).toBe(200)
      expect(about.content).toContain('About OurMenu OS')

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
      expect(openapi.info.title).toContain('OurMenu OS')
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
      expect(llmsText).toContain('When to Use OurMenu OS')
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
})
