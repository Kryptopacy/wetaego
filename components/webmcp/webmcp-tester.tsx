'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Play, Sparkles, X, ChevronRight, Code, Terminal, CheckCircle2, ShoppingBag, Cpu } from 'lucide-react'
import { globalWebMCPRegistry } from '@/lib/webmcp/registry'
import { WebMCPTool } from '@/lib/webmcp/types'
import { McpConfigModal } from './mcp-config-modal'

export function WebMCPTester({ locationName = 'Storefront' }: { locationName?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [tools, setTools] = useState<WebMCPTool[]>([])
  const [selectedToolName, setSelectedToolName] = useState<string>('')
  const [inputJson, setInputJson] = useState<string>('{}')
  const [outputJson, setOutputJson] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'tester' | 'specs'>('tester')

  useEffect(() => {
    const updateTools = () => {
      const all = globalWebMCPRegistry.getTools()
      setTools(all)
      if (all.length > 0 && !selectedToolName) {
        setSelectedToolName(all[0].name)
        setInputJson(getDefaultInputForTool(all[0]))
      }
    }

    updateTools()
    const unsubscribe = globalWebMCPRegistry.subscribe(updateTools)
    return () => unsubscribe()
  }, [selectedToolName])

  const handleSelectTool = (tool: WebMCPTool) => {
    setSelectedToolName(tool.name)
    setInputJson(getDefaultInputForTool(tool))
    setOutputJson(null)
  }

  const handleRun = async () => {
    if (!selectedToolName) return
    setIsRunning(true)
    try {
      let parsed = {}
      if (inputJson.trim()) {
        parsed = JSON.parse(inputJson)
      }
      const res = await globalWebMCPRegistry.executeTool(selectedToolName, parsed)
      setOutputJson(res)
    } catch (err: any) {
      setOutputJson({ error: err.message || 'Execution error' })
    } finally {
      setIsRunning(false)
    }
  }

  const handleQuickScenario = async (scenario: string) => {
    setIsRunning(true)
    try {
      if (scenario === 'search_dishes') {
        const tool = tools.find(t => t.name === 'search_catalog')
        if (tool) {
          handleSelectTool(tool)
          const input = { query: '', maxPrice: 50, inStockOnly: true }
          setInputJson(JSON.stringify(input, null, 2))
          const res = await globalWebMCPRegistry.executeTool('search_catalog', input)
          setOutputJson(res)
        }
      } else if (scenario === 'order_first_item') {
        const searchRes = await globalWebMCPRegistry.executeTool('search_catalog', {})
        const firstItem = searchRes?.items?.[0]
        if (firstItem) {
          const tool = tools.find(t => t.name === 'add_to_cart')
          if (tool) {
            handleSelectTool(tool)
            const input = { itemId: firstItem.itemId || firstItem.id, quantity: 1 }
            setInputJson(JSON.stringify(input, null, 2))
            const res = await globalWebMCPRegistry.executeTool('add_to_cart', input)
            setOutputJson(res)
          }
        } else {
          setOutputJson({ message: 'No items found in active catalog to add.' })
        }
      } else if (scenario === 'view_cart') {
        const tool = tools.find(t => t.name === 'get_cart' || t.name === 'view_cart')
        if (tool) {
          handleSelectTool(tool)
          setInputJson('{}')
          const res = await globalWebMCPRegistry.executeTool(tool.name, {})
          setOutputJson(res)
        }
      } else if (scenario === 'checkout') {
        const tool = tools.find(t => t.name === 'initiate_checkout')
        if (tool) {
          handleSelectTool(tool)
          const input = {
            fulfillment: 'dine_in',
            tableIdentifier: 'Table 4',
            customer: { name: 'Alex Smith', email: 'alex@example.com' },
            notes: 'Please include extra cutlery'
          }
          setInputJson(JSON.stringify(input, null, 2))
          const res = await globalWebMCPRegistry.executeTool('initiate_checkout', input)
          setOutputJson(res)
        }
      } else if (scenario === 'call_staff') {
        const tool = tools.find(t => t.name === 'request_staff' || t.name === 'call_staff_or_service')
        if (tool) {
          handleSelectTool(tool)
          const input = { reason: 'Guest requested water refill & table napkin' }
          setInputJson(JSON.stringify(input, null, 2))
          const res = await globalWebMCPRegistry.executeTool(tool.name, input)
          setOutputJson(res)
        }
      } else if (scenario === 'pairings') {
        const tool = tools.find(t => t.name === 'recommend_pairings')
        if (tool) {
          handleSelectTool(tool)
          const input = { maxRecommendations: 3 }
          setInputJson(JSON.stringify(input, null, 2))
          const res = await globalWebMCPRegistry.executeTool('recommend_pairings', input)
          setOutputJson(res)
        }
      } else if (scenario === 'apply_coupon') {
        const tool = tools.find(t => t.name === 'apply_coupon' || t.name === 'wetaego_apply_coupon')
        if (tool) {
          handleSelectTool(tool)
          const input = { couponCode: 'SAVE10' }
          setInputJson(JSON.stringify(input, null, 2))
          const res = await globalWebMCPRegistry.executeTool(tool.name, input)
          setOutputJson(res)
        }
      }
    } catch (e: any) {
      setOutputJson({ error: e.message || 'Execution failed' })
    } finally {
      setIsRunning(false)
    }
  }

  const selectedTool = tools.find(t => t.name === selectedToolName)

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-600/95 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/50 backdrop-blur-md border border-emerald-400/40 transition-all cursor-pointer"
        >
          <Bot className="w-4 h-4 text-emerald-200 animate-pulse" />
          <span>WebMCP Agent Tester ({tools.length})</span>
          <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30">
            Chrome 149 & AI Ready
          </span>
        </motion.button>
      </div>

      {/* Interactive Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      WebMCP Agent Playground
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-800/50">
                        document.modelContext
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">Interactive live tool testing on {locationName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition"
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export MCP Config</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Scenarios Bar */}
              <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/70 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                <span className="text-zinc-400 shrink-0 flex items-center gap-1 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1-Click Tests:
                </span>
                <button
                  onClick={() => handleQuickScenario('search_dishes')}
                  className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shrink-0 transition"
                >
                  🔍 Search Items
                </button>
                <button
                  onClick={() => handleQuickScenario('order_first_item')}
                  className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 shrink-0 transition flex items-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3" /> Auto Add to Cart
                </button>
                <button
                  onClick={() => handleQuickScenario('view_cart')}
                  className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shrink-0 transition"
                >
                  🛒 View Cart
                </button>
                <button
                  onClick={() => handleQuickScenario('checkout')}
                  className="px-2.5 py-1 rounded-md bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/50 shrink-0 transition"
                >
                  💳 Test Checkout Gate
                </button>
                <button
                  onClick={() => handleQuickScenario('call_staff')}
                  className="px-2.5 py-1 rounded-md bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/50 shrink-0 transition"
                >
                  🛎️ Call Staff
                </button>
                <button
                  onClick={() => handleQuickScenario('pairings')}
                  className="px-2.5 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/50 shrink-0 transition"
                >
                  ✨ Pairings
                </button>
                <button
                  onClick={() => handleQuickScenario('apply_coupon')}
                  className="px-2.5 py-1 rounded-md bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 shrink-0 transition"
                >
                  🎟️ Apply Coupon
                </button>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* Tool Selector */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Select Registered Tool:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tools.map(t => (
                      <button
                        key={t.name}
                        onClick={() => handleSelectTool(t)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition ${
                          selectedToolName === t.name
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 font-medium'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="font-mono text-[11px] truncate">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTool && (
                  <div className="space-y-3">
                    <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
                      <div className="text-zinc-400">{selectedTool.description}</div>
                    </div>

                    {/* Inputs & Outputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                            <Code className="w-3 h-3" /> Input Parameters (JSON)
                          </span>
                        </div>
                        <textarea
                          rows={6}
                          value={inputJson}
                          onChange={e => setInputJson(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> Execution Result (JSON)
                          </span>
                        </div>
                        <div className="w-full h-[142px] bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 overflow-y-auto">
                          {outputJson ? (
                            <pre className="text-[11px] whitespace-pre-wrap">
                              {JSON.stringify(outputJson, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-zinc-600 text-xs italic">
                              Click "Execute Tool" to simulate an agent invocation...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  document.modelContext.executeTool("{selectedToolName}", ...)
                </span>
                <button
                  disabled={isRunning || !selectedToolName}
                  onClick={handleRun}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing...' : 'Execute Tool'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <McpConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  )
}

function getDefaultInputForTool(tool: WebMCPTool): string {
  if (tool.name === 'search_catalog') {
    return JSON.stringify({ query: '', maxPrice: 50, inStockOnly: true }, null, 2)
  }
  if (tool.name === 'get_item_details') {
    return JSON.stringify({ itemId: 'item_sample_id' }, null, 2)
  }
  if (tool.name === 'create_cart' || tool.name === 'get_cart' || tool.name === 'view_cart') {
    return '{}'
  }
  if (tool.name === 'add_to_cart') {
    return JSON.stringify({ itemId: 'item_sample_id', quantity: 1, notes: 'Special instructions' }, null, 2)
  }
  if (tool.name === 'update_cart') {
    return JSON.stringify({ lineId: 'cart_item_sample_id', quantity: 2 }, null, 2)
  }
  if (tool.name === 'update_cart_quantity') {
    return JSON.stringify({ cartKey: 'cart_item_key', delta: 1 }, null, 2)
  }
  if (tool.name === 'initiate_checkout') {
    return JSON.stringify(
      {
        fulfillment: 'dine_in',
        tableIdentifier: 'Table 4',
        customer: { name: 'Alex Smith', email: 'alex@example.com', phone: '+1234567890' },
        notes: 'Extra napkins and quick service please'
      },
      null,
      2
    )
  }
  if (tool.name === 'submit_order') {
    return JSON.stringify(
      {
        checkoutId: 'chk_sample_123456',
        authorization: { confirmed: true, confirmationId: 'auth_usr_9981' }
      },
      null,
      2
    )
  }
  if (tool.name === 'recommend_pairings') {
    return JSON.stringify({ maxRecommendations: 3 }, null, 2)
  }
  if (tool.name === 'apply_coupon' || tool.name === 'wetaego_apply_coupon') {
    return JSON.stringify({ couponCode: 'SAVE10' }, null, 2)
  }
  if (tool.name === 'request_staff' || tool.name === 'call_staff_or_service') {
    return JSON.stringify({ reason: 'Guest requested bill and water refill' }, null, 2)
  }
  if (tool.name === 'open_business_page' || tool.name === 'wetaego_open_business_page') {
    return JSON.stringify({ conceptSlug: 'restaurant' }, null, 2)
  }
  return '{}'
}
