/**
 * WebMCP Tool Registry & Browser Polyfill Engine
 * Ensures document.modelContext, navigator.modelContext, and window.modelContext
 * are always available across Chrome 149+, ChatGPT Desktop, AI agent crawlers, and dev environments.
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
 * Initializes document.modelContext and navigator.modelContext polyfills safely in browser environments.
 */
export function ensureWebMCPContext(): ModelContext {
  if (typeof document === 'undefined' && typeof window === 'undefined') {
    return globalWebMCPRegistry
  }

  const ctx = globalWebMCPRegistry

  try {
    const existing = (document as any)?.modelContext
    if (existing && typeof existing.registerTool === 'function' && existing !== ctx) {
      const originalRegister = existing.registerTool.bind(existing)
      existing.registerTool = (tool: any) => {
        const schema = tool.resultSchema || tool.outputSchema || tool.responseSchema
        const enriched = {
          ...tool,
          outputSchema: tool.outputSchema || schema,
          resultSchema: tool.resultSchema || schema,
          responseSchema: tool.responseSchema || schema,
        }
        ctx.registerTool(enriched)
        try {
          return originalRegister(enriched)
        } catch {
          return {
            name: enriched.name,
            description: enriched.description,
            inputSchema: enriched.inputSchema,
            outputSchema: enriched.outputSchema,
            resultSchema: enriched.resultSchema,
            unregister: () => ctx.unregisterTool(enriched.name),
          }
        }
      }
      if (!existing.provideContext) {
        existing.provideContext = (options: any) => ctx.provideContext(options)
      }
      if (!existing.getTools) {
        existing.getTools = () => ctx.getTools()
      }
      if (!('tools' in existing)) {
        Object.defineProperty(existing, 'tools', {
          get: () => ctx.getTools(),
          configurable: true,
          enumerable: true,
        })
      }
      if (!('registeredTools' in existing)) {
        Object.defineProperty(existing, 'registeredTools', {
          get: () => ctx.registeredTools,
          configurable: true,
          enumerable: true,
        })
      }
      if (typeof navigator !== 'undefined' && !(navigator as any).modelContext) {
        try {
          Object.defineProperty(navigator, 'modelContext', {
            value: existing,
            writable: true,
            configurable: true,
            enumerable: true,
          })
        } catch {
          ;(navigator as any).modelContext = existing
        }
      }
      return existing
    }

    Object.defineProperty(document, 'modelContext', {
      value: ctx,
      writable: true,
      configurable: true,
      enumerable: true,
    })
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
    if (typeof navigator !== 'undefined') {
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
  } catch {
    if (typeof document !== 'undefined') {
      ;(document as any).modelContext = ctx
    }
    if (typeof window !== 'undefined') {
      ;(window as any).modelContext = ctx
    }
    if (typeof navigator !== 'undefined') {
      ;(navigator as any).modelContext = ctx
    }
  }

  return ctx
}
