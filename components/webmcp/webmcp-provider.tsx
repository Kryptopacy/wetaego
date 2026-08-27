'use client'

import { useEffect, useMemo } from 'react'
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
  showTester?: boolean
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
  showTester = false
}: WebMCPProviderProps) {
  // Ensure document.modelContext exists immediately on client mount
  useEffect(() => {
    ensureWebMCPContext()
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
      tableIdentifier
    }),
    [locationId, locationName, slug, currency, businessTypePreset, templateType, menuItems, categories, tableIdentifier]
  )

  useEffect(() => {
    const contextApi = ensureWebMCPContext()
    const tools = createStorefrontWebMCPTools(context)

    // Register all tools onto document.modelContext
    const cleanups: (() => void)[] = []
    tools.forEach(tool => {
      const reg = contextApi.registerTool(tool)
      if (reg && typeof reg.unregister === 'function') {
        cleanups.push(reg.unregister)
      } else {
        cleanups.push(() => contextApi.unregisterTool && contextApi.unregisterTool(tool.name))
      }
    })

    return () => {
      cleanups.forEach(fn => {
        try {
          fn()
        } catch (e) {
          // ignore cleanup errors
        }
      })
    }
  }, [context])

  return (
    <>
      {showTester && <WebMCPTester locationName={locationName} />}
    </>
  )
}
