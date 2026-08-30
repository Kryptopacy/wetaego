/**
 * WebMCP Tool Registry & Browser Polyfill Engine
 * Ensures document.modelContext is always available across Chrome 149+, ChatGPT Desktop, and dev environments.
 */

import type { WebMCPTool, ModelContext, WebMCPRegisteredTool } from './types'

class WebMCPRegistry implements ModelContext {
  private tools: Map<string, WebMCPTool> = new Map()
  private listeners: Set<() => void> = new Set()

  get registeredTools(): Map<string, WebMCPTool> {
    return this.tools
  }

  registerTool<TInput = any, TOutput = any>(tool: WebMCPTool<TInput, TOutput>): WebMCPRegisteredTool {
    // Enrich the tool with resultSchema at store time so getTools() also exposes it
    const enriched: WebMCPTool<TInput, TOutput> = {
      ...tool,
      resultSchema: tool.resultSchema || tool.outputSchema,
    }
    this.tools.set(tool.name, enriched)
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
      page: enriched.page,
      unregister: () => this.unregisterTool(tool.name)
    }
  }

  unregisterTool(name: string): void {
    if (this.tools.has(name)) {
      this.tools.delete(name)
      this.notifyListeners()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebMCP] Unregistered tool: ${name}`)
      }
    }
  }

  getTools(): WebMCPTool[] {
    return Array.from(this.tools.values())
  }

  async executeTool(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`[WebMCP] Tool '${name}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`)
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
 * Initializes document.modelContext polyfill safely in browser environments.
 */
export function ensureWebMCPContext(): ModelContext {
  if (typeof document === 'undefined') {
    return globalWebMCPRegistry
  }

  // If browser natively supports document.modelContext, wrap it to allow dual access
  if (document.modelContext && typeof document.modelContext.registerTool === 'function') {
    const nativeContext = document.modelContext
    return {
      registerTool: (tool) => {
        globalWebMCPRegistry.registerTool(tool)
        return nativeContext.registerTool(tool)
      },
      unregisterTool: (name) => {
        globalWebMCPRegistry.unregisterTool(name)
        if (nativeContext.unregisterTool) {
          nativeContext.unregisterTool(name)
        }
      },
      getTools: () => {
        return globalWebMCPRegistry.getTools()
      },
      executeTool: (name, input) => {
        if (nativeContext.executeTool) {
          return nativeContext.executeTool(name, input)
        }
        return globalWebMCPRegistry.executeTool(name, input)
      },
      get registeredTools() {
        return globalWebMCPRegistry.registeredTools
      }
    }
  }

  // Polyfill on document and window
  try {
    Object.defineProperty(document, 'modelContext', {
      value: globalWebMCPRegistry,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'modelContext', {
      value: globalWebMCPRegistry,
      writable: true,
      configurable: true,
    })
  } catch {
    ;(document as any).modelContext = globalWebMCPRegistry
    ;(window as any).modelContext = globalWebMCPRegistry
  }

  return globalWebMCPRegistry
}
