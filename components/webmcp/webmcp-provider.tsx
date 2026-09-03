'use client'

import { useEffect, useMemo, useState } from 'react'
import { ensureWebMCPContext, globalWebMCPRegistry } from '@/lib/webmcp/registry'
import { createStorefrontWebMCPTools, MenuItemData, StorefrontContext } from '@/lib/webmcp/tools'
import { WebMCPTester } from './webmcp-tester'

interface WebMCPProviderProps {
  locationId: string
  locationName: string
  slug: string
  currency?: string
  businessTypePreset?: string | null
  templateType?: string
  menuItems: MenuItemData[]
  categories?: string[]
  tableIdentifier?: string
  taxes?: { id?: string; name: string; percentage: number; is_active: boolean }[]
  taxRate?: number
  showTester?: boolean
}

interface AgentActionState {
  tool: string
  timestamp: number
  locationName?: string
}

export function WebMCPProvider({
  locationId,
  locationName,
  slug,
  currency = 'USD',
  businessTypePreset,
  templateType,
  menuItems,
  categories,
  tableIdentifier,
  taxes,
  taxRate,
  showTester = false
}: WebMCPProviderProps) {
  const [activeAction, setActiveAction] = useState<AgentActionState | null>(null)

  // Ensure document.modelContext exists immediately on client mount
  useEffect(() => {
    ensureWebMCPContext()
  }, [])

  // Listen to live WebMCP co-browsing events
  useEffect(() => {
    let timer: NodeJS.Timeout
    const handleWebMcpAction = (e: Event) => {
      const customEvent = e as CustomEvent<AgentActionState>
      if (customEvent.detail?.tool) {
        setActiveAction(customEvent.detail)
        clearTimeout(timer)
        timer = setTimeout(() => {
          setActiveAction(null)
        }, 3200)
      }
    }

    window.addEventListener('webmcp:action', handleWebMcpAction)
    return () => {
      window.removeEventListener('webmcp:action', handleWebMcpAction)
      clearTimeout(timer)
    }
  }, [])

  const context: StorefrontContext = useMemo(
    () => ({
      locationId,
      locationName,
      slug,
      currency,
      businessTypePreset,
      templateType,
      menuItems,
      categories,
      tableIdentifier,
      taxes,
      taxRate
    }),
    [locationId, locationName, slug, currency, businessTypePreset, templateType, menuItems, categories, tableIdentifier, taxes, taxRate]
  )

  useEffect(() => {
    const cleanups: (() => void)[] = []

    try {
      const contextApi = ensureWebMCPContext()
      const tools = createStorefrontWebMCPTools(context)

      if (typeof contextApi.provideContext === 'function') {
        try {
          contextApi.provideContext({ tools })
        } catch (e) {
          // ignore provideContext warning
        }
      }

      // Register all tools onto document.modelContext / navigator.modelContext
      tools.forEach(tool => {
        try {
          const reg = contextApi.registerTool(tool)
          if (reg && typeof reg.unregister === 'function') {
            cleanups.push(reg.unregister)
          } else {
            cleanups.push(() => contextApi.unregisterTool && contextApi.unregisterTool(tool.name))
          }
        } catch {
          // ignore registration errors
        }
      })
    } catch {
      // ignore context setup errors
    }

    return () => {
      cleanups.forEach(fn => {
        try {
          fn()
        } catch {
          // ignore cleanup errors
        }
      })
    }
  }, [context])

  return (
    <>
      {/* Premium Ambient Co-Browsing Indicator HUD */}
      {activeAction && (
        <aside
          aria-live="polite"
          aria-label="AI Co-browsing Activity"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-emerald-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-xs text-zinc-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Agent Co-Browse</span>
            <span className="text-zinc-600 font-light">•</span>
            <code className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/25">
              {activeAction.tool}
            </code>
          </div>
        </aside>
      )}

      {showTester && <WebMCPTester locationName={locationName} />}
    </>
  )
}
