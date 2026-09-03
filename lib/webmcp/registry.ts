/**
 * WebMCP Tool Registry & Browser Polyfill Engine
 * Ensures document.modelContext, navigator.modelContext, and window.modelContext
 * are always available across Chrome 149+, ChatGPT Desktop, AI agent crawlers, and dev environments.
 */

import type { WebMCPTool, ModelContext, WebMCPRegisteredTool, ProvideContextOptions } from './types'

class WebMCPRegistry implements ModelContext {
  private _toolsMap: Map<string, WebMCPTool> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Resolves a tool regardless of whether it was called with 'wetaego_' prefix,
   * without 'wetaego_' prefix, or with differing casing/whitespace.
   */
  findTool(name: string): WebMCPTool | undefined {
    const clean = String(name || '').trim()
    if (!clean) return undefined

    // 1. Exact match in internal map
    if (this._toolsMap.has(clean)) return this._toolsMap.get(clean)

    // 2. Prefix stripped match (wetaego_search_catalog -> search_catalog)
    if (clean.startsWith('wetaego_')) {
      const stripped = clean.replace(/^wetaego_/, '')
      if (this._toolsMap.has(stripped)) return this._toolsMap.get(stripped)
    }

    // 3. Prefix added match (search_catalog -> wetaego_search_catalog)
    const prepended = `wetaego_${clean}`
    if (this._toolsMap.has(prepended)) return this._toolsMap.get(prepended)

    // 4. Semantic aliases (e.g. call_staff_or_service -> request_staff, search_products -> search_catalog)
    const aliasMap: Record<string, string> = {
      search_products: 'search_catalog',
      wetaego_search_products: 'search_catalog',
      view_cart: 'get_cart',
      wetaego_view_cart: 'get_cart',
      update_cart_quantity: 'update_cart',
      wetaego_update_cart_quantity: 'update_cart',
      update_cart_item: 'update_cart',
      wetaego_update_cart_item: 'update_cart',
      remove_from_cart: 'update_cart',
      wetaego_remove_from_cart: 'update_cart',
      call_staff_or_service: 'request_staff',
      wetaego_call_staff_or_service: 'request_staff',
      call_staff: 'request_staff',
      wetaego_call_staff: 'request_staff',
    }
    const aliased = aliasMap[clean.toLowerCase()] || aliasMap[clean.toLowerCase().replace(/^wetaego_/, '')]
    if (aliased && aliased !== clean) {
      const tool = this.findTool(aliased)
      if (tool) return tool
    }

    // 5. Case-insensitive and trimmed lookup
    const lowerClean = clean.toLowerCase()
    const lowerStripped = lowerClean.replace(/^wetaego_/, '')
    for (const [key, val] of this._toolsMap.entries()) {
      const lowerKey = key.toLowerCase()
      if (lowerKey === lowerClean) return val
      if (lowerKey.replace(/^wetaego_/, '') === lowerStripped) return val
    }

    return undefined
  }

  get registeredTools(): Map<string, WebMCPTool> {
    const self = this
    return new Proxy(this._toolsMap, {
      get(map, prop, receiver) {
        if (prop === 'get') {
          return (key: string) => self.findTool(key)
        }
        if (prop === 'has') {
          return (key: string) => Boolean(self.findTool(key))
        }
        if (prop === 'size') {
          return self.getTools().length
        }
        const val = Reflect.get(map, prop, receiver)
        return typeof val === 'function' ? val.bind(map) : val
      }
    })
  }

  get tools(): WebMCPTool[] {
    return this.getTools()
  }

  registerTool<TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>, handler?: (input?: any) => Promise<TOutput> | TOutput): WebMCPRegisteredTool {
    const schema = tool.resultSchema || tool.outputSchema || (tool as any).responseSchema || (tool as any).returns || (tool as any).output
    const execFn = handler || tool.execute

    // Canonical deduplication: ensure only one version (prefixed or unprefixed) exists in _toolsMap
    const canonical = tool.name.replace(/^wetaego_/, '')
    if (tool.name.startsWith('wetaego_')) {
      this._toolsMap.delete(canonical)
    } else {
      this._toolsMap.delete(`wetaego_${canonical}`)
    }

    // Enrich the tool with all standard schema variants across Chrome W3C, OpenAI WebMCP, and RFC MCP
    const enriched: WebMCPTool<TInput, TOutput> = {
      ...tool,
      outputSchema: tool.outputSchema || schema,
      resultSchema: tool.resultSchema || schema,
      responseSchema: (tool as any).responseSchema || tool.resultSchema || schema,
      returns: (tool as any).returns || tool.resultSchema || schema,
      returnSchema: (tool as any).returnSchema || tool.resultSchema || schema,
      output: (tool as any).output || tool.resultSchema || schema,
      result: (tool as any).result || tool.resultSchema || schema,
      execute: (execFn || tool.execute) as any,
    }
    this._toolsMap.set(tool.name, enriched)
    this.notifyListeners()

    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebMCP] Registered tool: ${tool.name}`, enriched)
    }

    return {
      name: enriched.name,
      description: enriched.description,
      inputSchema: enriched.inputSchema,
      outputSchema: enriched.outputSchema,
      resultSchema: enriched.resultSchema,
      responseSchema: enriched.responseSchema,
      returns: (enriched as any).returns,
      page: enriched.page,
      unregister: () => this.unregisterTool(tool.name)
    }
  }

  provideContext(options: ProvideContextOptions | WebMCPTool[]): { unregister: () => void } {
    const toolList: WebMCPTool[] = Array.isArray(options)
      ? options
      : (options && Array.isArray(options.tools) ? options.tools : [])

    const registeredNames: string[] = []
    toolList.forEach(tool => {
      this.registerTool(tool, tool.execute)
      registeredNames.push(tool.name)
    })

    if (!Array.isArray(options) && options?.signal) {
      options.signal.addEventListener('abort', () => {
        registeredNames.forEach(name => this.unregisterTool(name))
      })
    }

    return {
      unregister: () => {
        registeredNames.forEach(name => this.unregisterTool(name))
      }
    }
  }

  unregisterTool(name: string): void {
    const existing = this.findTool(name)
    if (existing) {
      this._toolsMap.delete(existing.name)
      const canonical = existing.name.replace(/^wetaego_/, '')
      this._toolsMap.delete(canonical)
      this._toolsMap.delete(`wetaego_${canonical}`)
      this.notifyListeners()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebMCP] Unregistered tool: ${name}`)
      }
    }
  }

  /**
   * Returns a strictly deduplicated array of unique canonical tools.
   * Eliminates dual-registered duplicates so scanners always see the clean 13-tool set.
   */
  getTools(): WebMCPTool[] {
    const seen = new Set<string>()
    const unique: WebMCPTool[] = []
    for (const tool of this._toolsMap.values()) {
      const canonical = tool.name.replace(/^wetaego_/, '')
      if (!seen.has(canonical)) {
        seen.add(canonical)
        unique.push(tool)
      }
    }
    return unique
  }

  /**
   * Coerces and normalizes agent input based on the tool's JSON Schema.
   * Eliminates formatting fragility (numbers passed as strings, boolean strings,
   * spaced coupon codes, whitespace trimming) architecturally across all tools.
   */
  private coerceInput(schema: any, input: any): any {
    if (!input || typeof input !== 'object') return input
    const properties = schema?.properties || {}
    const coerced: Record<string, any> = Array.isArray(input) ? [...input] : { ...input }

    for (const [key, propSchema] of Object.entries(properties) as [string, any][]) {
      if (coerced[key] === undefined) {
        const kebab = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
        const snake = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)
        if (coerced[kebab] !== undefined) coerced[key] = coerced[kebab]
        else if (coerced[snake] !== undefined) coerced[key] = coerced[snake]
      }

      if (coerced[key] === undefined || coerced[key] === null) continue

      const val = coerced[key]
      const expectedType = propSchema?.type

      if (expectedType === 'integer') {
        const num = Math.floor(Number(val))
        if (!isNaN(num)) {
          let clamped = num
          if (typeof propSchema.minimum === 'number') clamped = Math.max(propSchema.minimum, clamped)
          if (typeof propSchema.maximum === 'number') clamped = Math.min(propSchema.maximum, clamped)
          coerced[key] = clamped
        }
      } else if (expectedType === 'number') {
        const num = Number(val)
        if (!isNaN(num)) {
          let clamped = num
          if (typeof propSchema.minimum === 'number') clamped = Math.max(propSchema.minimum, clamped)
          if (typeof propSchema.maximum === 'number') clamped = Math.min(propSchema.maximum, clamped)
          coerced[key] = clamped
        }
      } else if (expectedType === 'boolean') {
        if (typeof val === 'string') {
          coerced[key] = val.toLowerCase() === 'true' || val === '1'
        }
      } else if (expectedType === 'string') {
        if (typeof val === 'string') {
          let str = val.trim()
          if (key === 'couponCode' || key === 'coupon' || key === 'code') {
            str = str.replace(/\s+/g, '').toUpperCase()
          }
          coerced[key] = str
        }
      }
    }

    return coerced
  }

  async executeTool(name: string, input: any): Promise<any> {
    const tool = this.findTool(name)
    if (!tool) {
      throw new Error(`[WebMCP] Tool '${name}' not found. Available tools: ${this.getTools().map(t => t.name).join(', ')}`)
    }
    const normalizedInput = this.coerceInput(tool.inputSchema, input)
    return await tool.execute(normalizedInput)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.error('[WebMCP] Error in registry listener', err)
      }
    })
  }
}

export const globalWebMCPRegistry = new WebMCPRegistry()

const nativeRegistrations = new Map<string, any>()

/**
 * Initializes document.modelContext and navigator.modelContext polyfills safely in browser environments.
 */
export function ensureWebMCPContext(): ModelContext {
  if (typeof document === 'undefined' && typeof window === 'undefined') {
    return globalWebMCPRegistry
  }

  const ctx = globalWebMCPRegistry

  try {
    const existing =
      (typeof navigator !== 'undefined' && (navigator as any)?.modelContext) ||
      (typeof document !== 'undefined' && (document as any)?.modelContext) ||
      (typeof window !== 'undefined' && (window as any)?.modelContext)

    if (existing && typeof existing.registerTool === 'function' && existing !== ctx) {
      if (!(existing as any).__wetaego_wrapped) {
        try {
          const originalRegister = existing.registerTool.bind(existing)
          ;(existing as any).__wetaego_wrapped = true

          existing.registerTool = (tool: any, handler?: any) => {
            const schema = tool.resultSchema || tool.outputSchema || tool.responseSchema || tool.returns || tool.output
            const execFn = handler || tool.execute
            const enriched = {
              ...tool,
              outputSchema: tool.outputSchema || schema,
              resultSchema: tool.resultSchema || schema,
              responseSchema: tool.responseSchema || schema,
              returns: tool.returns || schema,
              returnSchema: tool.returnSchema || schema,
              output: tool.output || schema,
              result: tool.result || schema,
              execute: execFn,
            }
            ctx.registerTool(enriched, execFn)

            // If a native registration already exists for this tool name, clean it up first
            const prevReg = nativeRegistrations.get(enriched.name)
            if (prevReg && typeof prevReg.unregister === 'function') {
              try { prevReg.unregister() } catch { /* ignore unregister error */ }
              nativeRegistrations.delete(enriched.name)
            }

            const fallbackRegistration = {
              name: enriched.name,
              description: enriched.description,
              inputSchema: enriched.inputSchema,
              outputSchema: enriched.outputSchema,
              resultSchema: enriched.resultSchema,
              responseSchema: enriched.responseSchema,
              returns: enriched.returns,
              unregister: () => {
                ctx.unregisterTool(enriched.name)
                const current = nativeRegistrations.get(enriched.name)
                if (current && typeof current.unregister === 'function') {
                  try { current.unregister() } catch { /* ignore */ }
                  nativeRegistrations.delete(enriched.name)
                }
              },
            }

            try {
              let res: any
              try {
                res = originalRegister(enriched, execFn)
              } catch {
                res = originalRegister(enriched)
              }

              // Handle asynchronous return (W3C/Chrome Model Context API returns a Promise)
              if (res && typeof res.then === 'function') {
                return res
                  .then((reg: any) => {
                    if (reg) {
                      nativeRegistrations.set(enriched.name, reg)
                    }
                    return reg || fallbackRegistration
                  })
                  .catch((asyncErr: any) => {
                    // Gracefully suppress "InvalidStateError: Duplicate tool name" and collisions
                    if (process.env.NODE_ENV === 'development') {
                      console.warn(`[WebMCP Native] Handled tool registration collision for "${enriched.name}":`, asyncErr?.message || asyncErr)
                    }
                    return fallbackRegistration
                  })
              }

              if (res) {
                nativeRegistrations.set(enriched.name, res)
              }
              return res || fallbackRegistration
            } catch (err: any) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[WebMCP Native] Synchronous tool registration error caught for "${enriched.name}":`, err?.message || err)
              }
              return fallbackRegistration
            }
          }
        } catch {
          // Native property might be non-writable in some host runtimes; ignore
        }
      }

      try {
        if (!existing.provideContext) {
          existing.provideContext = (options: any) => ctx.provideContext(options)
        }
      } catch { /* ignore */ }

      try {
        if (!existing.getTools) {
          existing.getTools = () => ctx.getTools()
        }
      } catch { /* ignore */ }

      try {
        if (!existing.unregisterTool) {
          existing.unregisterTool = (name: string) => {
            ctx.unregisterTool(name)
            const active = nativeRegistrations.get(name)
            if (active && typeof active.unregister === 'function') {
              try { active.unregister() } catch { /* ignore */ }
              nativeRegistrations.delete(name)
            }
          }
        }
      } catch { /* ignore */ }

      try {
        if (!('tools' in existing)) {
          Object.defineProperty(existing, 'tools', {
            get: () => ctx.getTools(),
            configurable: true,
            enumerable: true,
          })
        }
      } catch { /* ignore */ }

      try {
        if (!('registeredTools' in existing)) {
          Object.defineProperty(existing, 'registeredTools', {
            get: () => ctx.registeredTools,
            configurable: true,
            enumerable: true,
          })
        }
      } catch { /* ignore */ }

      try {
        if (typeof document !== 'undefined' && (document as any).modelContext !== existing) {
          ;(document as any).modelContext = existing
        }
      } catch { /* ignore */ }

      try {
        if (typeof window !== 'undefined' && (window as any).modelContext !== existing) {
          ;(window as any).modelContext = existing
        }
      } catch { /* ignore */ }

      try {
        if (typeof navigator !== 'undefined' && (navigator as any).modelContext !== existing) {
          ;(navigator as any).modelContext = existing
        }
      } catch { /* ignore */ }

      return existing
    }

    try {
      if (typeof document !== 'undefined') {
        Object.defineProperty(document, 'modelContext', {
          value: ctx,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }
    } catch {
      try { if (typeof document !== 'undefined') (document as any).modelContext = ctx } catch {}
    }

    try {
      if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'modelContext', {
          value: ctx,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }
    } catch {
      try { if (typeof window !== 'undefined') (window as any).modelContext = ctx } catch {}
    }

    try {
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'modelContext', {
          value: ctx,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }
    } catch {
      try { if (typeof navigator !== 'undefined') (navigator as any).modelContext = ctx } catch {}
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WebMCP] ensureWebMCPContext error suppressed:', err)
    }
  }

  return ctx
}
