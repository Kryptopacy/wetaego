/**
 * WebMCP Tool Registry & Browser Polyfill Engine
 * Ensures navigator.modelContext, document.modelContext, and window.modelContext
 * are always available across Chrome EPP, AI agent headless browsers, and dev environments.
 */

import type { WebMCPTool, ModelContext, WebMCPRegisteredTool, ProvideContextOptions } from './types'

class WebMCPRegistry implements ModelContext {
  private _toolsMap: Map<string, WebMCPTool> = new Map()
  private listeners: Set<() => void> = new Set()

  get registeredTools(): Map<string, WebMCPTool> {
    return this._toolsMap
  }

  get tools(): WebMCPTool[] {
    return this.getTools()
  }

  set tools(newTools: WebMCPTool[]) {
    if (Array.isArray(newTools)) {
      newTools.forEach(t => this.registerTool(t))
    }
  }

  registerTool<TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>): WebMCPRegisteredTool {
    const schema = tool.resultSchema || tool.outputSchema || (tool as any).responseSchema
    // Enrich the tool with resultSchema, outputSchema, and responseSchema
    const enriched: WebMCPTool<TInput, TOutput> = {
      ...tool,
      outputSchema: tool.outputSchema || schema,
      resultSchema: tool.resultSchema || schema,
      responseSchema: (tool as any).responseSchema || tool.resultSchema || schema,
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
      this.registerTool(tool)
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
    if (this._toolsMap.has(name)) {
      this._toolsMap.delete(name)
      this.notifyListeners()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebMCP] Unregistered tool: ${name}`)
      }
    }
  }

  getTools(): WebMCPTool[] {
    return Array.from(this._toolsMap.values())
  }

  async executeTool(name: string, input: any): Promise<any> {
    const tool = this._toolsMap.get(name)
    if (!tool) {
      throw new Error(`[WebMCP] Tool '${name}' not found. Available tools: ${Array.from(this._toolsMap.keys()).join(', ')}`)
    }
    return await tool.execute(input)
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

/**
 * Initializes navigator.modelContext and document.modelContext polyfill safely in browser environments.
 */
export function ensureWebMCPContext(): ModelContext {
  if (typeof window === 'undefined' && typeof document === 'undefined') {
    return globalWebMCPRegistry
  }

  const ctx = globalWebMCPRegistry

  try {
    // 1. Polyfill / bind on navigator
    if (typeof navigator !== 'undefined') {
      const existingNav = (navigator as any).modelContext
      if (existingNav && existingNav !== ctx) {
        if (typeof existingNav.registerTool === 'function') {
          const orig = existingNav.registerTool.bind(existingNav)
          existingNav.registerTool = (t: any) => {
            ctx.registerTool(t)
            try { return orig(t) } catch { return { unregister: () => ctx.unregisterTool(t.name) } }
          }
        }
        if (typeof existingNav.provideContext !== 'function') {
          existingNav.provideContext = (opt: any) => ctx.provideContext(opt)
        }
        if (typeof existingNav.getTools !== 'function') {
          existingNav.getTools = () => ctx.getTools()
        }
      } else {
        try {
          Object.defineProperty(navigator, 'modelContext', {
            value: ctx,
            writable: true,
            configurable: true,
            enumerable: true,
          })
        } catch {
          ;(navigator as any).modelContext = ctx
        }
      }
    }

    // 2. Polyfill / bind on document
    if (typeof document !== 'undefined') {
      const existingDoc = (document as any).modelContext
      if (existingDoc && existingDoc !== ctx) {
        if (typeof existingDoc.registerTool === 'function') {
          const orig = existingDoc.registerTool.bind(existingDoc)
          existingDoc.registerTool = (t: any) => {
            ctx.registerTool(t)
            try { return orig(t) } catch { return { unregister: () => ctx.unregisterTool(t.name) } }
          }
        }
        if (typeof existingDoc.provideContext !== 'function') {
          existingDoc.provideContext = (opt: any) => ctx.provideContext(opt)
        }
        if (typeof existingDoc.getTools !== 'function') {
          existingDoc.getTools = () => ctx.getTools()
        }
      } else {
        try {
          Object.defineProperty(document, 'modelContext', {
            value: ctx,
            writable: true,
            configurable: true,
            enumerable: true,
          })
        } catch {
          ;(document as any).modelContext = ctx
        }
      }
    }

    // 3. Polyfill / bind on window
    if (typeof window !== 'undefined') {
      try {
        Object.defineProperty(window, 'modelContext', {
          value: ctx,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      } catch {
        ;(window as any).modelContext = ctx
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WebMCP] Polyfill initialization warning:', err)
    }
  }

  return ctx
}
