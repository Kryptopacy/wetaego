import { describe, it, expect } from 'vitest'
import { AGENT_LINK_HEADERS } from '@/proxy'
import fs from 'fs'
import path from 'path'

describe('14 Agent Discovery & Protocol Standards Compliance', () => {
  describe('1. Link Response Headers (RFC 8288 & RFC 9727)', () => {
    it('contains all required agent relation types in AGENT_LINK_HEADERS', () => {
      expect(AGENT_LINK_HEADERS).toContain('rel="api-catalog"')
      expect(AGENT_LINK_HEADERS).toContain('rel="service-doc"')
      expect(AGENT_LINK_HEADERS).toContain('rel="service-desc"')
      expect(AGENT_LINK_HEADERS).toContain('rel="describedby"')
      expect(AGENT_LINK_HEADERS).toContain('rel="oauth-authorization-server"')
      expect(AGENT_LINK_HEADERS).toContain('rel="oauth-protected-resource"')
      expect(AGENT_LINK_HEADERS).toContain('rel="ai-catalog"')
      expect(AGENT_LINK_HEADERS).toContain('rel="agent-skills"')
      expect(AGENT_LINK_HEADERS).toContain('rel="mcp"')
      expect(AGENT_LINK_HEADERS).toContain('rel="ucp"')
      expect(AGENT_LINK_HEADERS).toContain('rel="acp"')
      expect(AGENT_LINK_HEADERS).toContain('rel="author-doc"')
    })
  })

  describe('2. API Catalog (RFC 9727 & RFC 9264)', () => {
    it('serves valid application/linkset+json structure', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'api-catalog')
      expect(fs.existsSync(filePath)).toBe(true)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(Array.isArray(data.linkset)).toBe(true)
      expect(data.linkset[0].anchor).toBe('https://ourmenuos.online/api')
      expect(data.linkset[0]['service-desc']).toBeDefined()
      expect(data.linkset[0]['service-doc']).toBeDefined()
      expect(data.linkset[0]['status']).toBeDefined()
    })
  })

  describe('3. OAuth & OpenID Connect Discovery Metadata (RFC 8414 & OIDC)', () => {
    it('has valid openid-configuration with agent_auth registration block', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'openid-configuration')
      expect(fs.existsSync(filePath)).toBe(true)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(data.issuer).toBe('https://ourmenuos.online')
      expect(data.authorization_endpoint).toBeDefined()
      expect(data.token_endpoint).toBeDefined()
      expect(data.jwks_uri).toBeDefined()
      expect(data.agent_auth).toBeDefined()
      expect(data.agent_auth.register_uri).toBe('https://ourmenuos.online/auth.md')
    })

    it('has valid oauth-authorization-server metadata', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'oauth-authorization-server')
      expect(fs.existsSync(filePath)).toBe(true)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(data.issuer).toBe('https://ourmenuos.online')
      expect(data.agent_auth).toBeDefined()
    })
  })

  describe('4. OAuth Protected Resource Metadata (RFC 9728)', () => {
    it('has valid oauth-protected-resource metadata', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'oauth-protected-resource')
      expect(fs.existsSync(filePath)).toBe(true)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(data.resource).toBe('https://ourmenuos.online/api')
      expect(data.authorization_servers).toContain('https://ourmenuos.online')
      expect(data.scopes_supported.length).toBeGreaterThan(0)
    })
  })

  describe('5. Auth.md Metadata for Agent Registration', () => {
    it('has auth.md document with registration and authentication instructions', () => {
      const filePath = path.join(process.cwd(), 'public', 'auth.md')
      expect(fs.existsSync(filePath)).toBe(true)
      const text = fs.readFileSync(filePath, 'utf8')
      expect(text).toContain('Agent Authentication Guide')
      expect(text).toContain('register-agent')
      expect(text).toContain('scopes')
    })
  })

  describe('6. Agent Skills Discovery Index (RFC v0.2.0)', () => {
    it('has agent-skills index.json with schema v0.2.0 and verified sha256 hashes', () => {
      const indexPath = path.join(process.cwd(), 'public', '.well-known', 'agent-skills', 'index.json')
      expect(fs.existsSync(indexPath)).toBe(true)
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      expect(index.$schema).toContain('agentskills.io')
      expect(index.version).toBe('0.2.0')
      expect(index.skills.length).toBeGreaterThanOrEqual(4)

      for (const skill of index.skills) {
        expect(skill.name).toBeDefined()
        expect(skill.sha256).toMatch(/^[a-f0-9]{64}$/)
      }
    })
  })

  describe('7. ARD Manifest (Agentic Resource Discovery)', () => {
    it('has ai-catalog.json with URN identifiers and representative queries', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'ai-catalog.json')
      expect(fs.existsSync(filePath)).toBe(true)
      const catalog = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(catalog.specVersion).toBe('1.0')
      expect(catalog.host.domain).toBe('ourmenuos.online')
      expect(catalog.entries.length).toBeGreaterThanOrEqual(4)

      for (const entry of catalog.entries) {
        expect(entry.identifier).toMatch(/^urn:air:ourmenuos\.online:/)
        expect(entry.id).toMatch(/^urn:air:ourmenuos\.online:/)
        expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe('8. x402 Protocol for Agent Payments', () => {
    it('has x402.json discovery configuration with facilitator, wallet, and networks', () => {
      const filePath = path.join(process.cwd(), 'public', '.well-known', 'x402.json')
      expect(fs.existsSync(filePath)).toBe(true)
      const x402 = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      expect(x402.version).toBe('1.0')
      expect(x402.x402).toBeDefined()
      expect(x402.x402.facilitator).toBe('https://ourmenuos.online/api/x402')
      expect(x402.x402.wallet).toBeDefined()
      expect(x402.facilitator).toBe('https://ourmenuos.online/api/x402')
      expect(x402.supported_networks).toContain('base')
      expect(x402.supported_tokens).toContain('USDC')
    })
  })

  describe('9. Machine Payment Protocol (MPP)', () => {
    it('has mpp.json discovery manifest and x-payment-info in openapi.json', () => {
      const mppPath = path.join(process.cwd(), 'public', '.well-known', 'mpp.json')
      expect(fs.existsSync(mppPath)).toBe(true)
      const mpp = JSON.parse(fs.readFileSync(mppPath, 'utf8'))
      expect(mpp.supported_methods).toContain('crypto')

      const openapiPath = path.join(process.cwd(), 'public', 'openapi.json')
      const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'))
      expect(openapi.paths['/ai/live-token'].post['x-payment-info']).toBeDefined()
      expect(openapi.paths['/orders'].post['x-payment-info']).toBeDefined()
    })
  })

  describe('10. Universal Commerce Protocol (UCP)', () => {
    it('has ucp profile manifest with required ucp field, services and capabilities', () => {
      const ucpPath = path.join(process.cwd(), 'public', '.well-known', 'ucp')
      expect(fs.existsSync(ucpPath)).toBe(true)
      const ucp = JSON.parse(fs.readFileSync(ucpPath, 'utf8'))
      expect(ucp.ucp).toBeDefined()
      expect(ucp.ucp.version).toBe('1.0.0')
      expect(ucp.protocol).toBe('ucp')
      expect(ucp.services).toContain('checkout')
      expect(ucp.capabilities).toContain('table_ordering')
    })
  })

  describe('11. Agentic Commerce Protocol (ACP)', () => {
    it('has acp.json discovery document with services and transports', () => {
      const acpPath = path.join(process.cwd(), 'public', '.well-known', 'acp.json')
      expect(fs.existsSync(acpPath)).toBe(true)
      const acp = JSON.parse(fs.readFileSync(acpPath, 'utf8'))
      expect(acp.protocol.name).toBe('acp')
      expect(acp.capabilities.services).toContain('order_checkout')
      expect(acp.transports).toContain('mcp')
    })
  })

  describe('12. DNS for AI Discovery (DNS-AID)', () => {
    it('has dns-aid.json discovery configuration', () => {
      const dnsPath = path.join(process.cwd(), 'public', '.well-known', 'dns-aid.json')
      expect(fs.existsSync(dnsPath)).toBe(true)
      const dns = JSON.parse(fs.readFileSync(dnsPath, 'utf8'))
      expect(dns.protocol).toBe('dns-aid')
      expect(dns.zone).toBe('ourmenuos.online')
      expect(dns.records.length).toBeGreaterThan(0)
    })
  })

  describe('13. Content Signals in robots.txt', () => {
    it('contains Content-Signal directive in public/robots.txt', () => {
      const robotsPath = path.join(process.cwd(), 'public', 'robots.txt')
      expect(fs.existsSync(robotsPath)).toBe(true)
      const robots = fs.readFileSync(robotsPath, 'utf8')
      expect(robots).toContain('Content-Signal:')
      expect(robots).toContain('ai-train=no')
      expect(robots).toContain('search=yes')
    })
  })
})
