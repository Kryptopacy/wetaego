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

  registerTool<TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>, handler?: (input: TInput) => Promise<TOutput> | TOutput): WebMCPRegisteredTool {
    const schema = tool.resultSchema || tool.outputSchema || (tool as any).responseSchema || (tool as any).returns || (tool as any).output
    const execFn = handler || tool.execute
    // Enrich the tool with resultSchema, outputSchema, responseSchema, returns, and aliases
    const enriched: WebMCPTool<TInput, TOutput> = {
      ...tool,
      outputSchema: tool.outputSchema || schema,
      resultSchema: tool.resultSchema || schema,
      responseSchema: (tool as any).responseSchema || tool.resultSchema || schema,
      returns: (tool as any).returns || tool.resultSchema || schema,
      returnSchema: (tool as any).returnSchema || tool.resultSchema || schema,
      output: (tool as any).output || tool.resultSchema || schema,
      result: (tool as any).result || tool.resultSchema || schema,
      execute: execFn,
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
    const existing =
      (typeof navigator !== 'undefined' && (navigator as any)?.modelContext) ||
      (typeof document !== 'undefined' && (document as any)?.modelContext) ||
      (typeof window !== 'undefined' && (window as any)?.modelContext)

    if (existing && typeof existing.registerTool === 'function' && existing !== ctx) {
      try {
        const originalRegister = existing.registerTool.bind(existing)
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
          try {
            return originalRegister(enriched, execFn)
          } catch {
            try {
              return originalRegister(enriched)
            } catch {
              return {
                name: enriched.name,
                description: enriched.description,
                inputSchema: enriched.inputSchema,
                outputSchema: enriched.outputSchema,
                resultSchema: enriched.resultSchema,
                responseSchema: enriched.responseSchema,
                returns: enriched.returns,
                unregister: () => ctx.unregisterTool(enriched.name),
              }
            }
          }
        }
      } catch {
        // Native property might be non-writable in some host runtimes; ignore
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
