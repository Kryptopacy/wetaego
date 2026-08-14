'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart'
import { callStaffFromAi } from './actions'
import { getBusinessMode, resolvePersona } from '@/lib/templates/ai-personas'
import { Bell, Sparkles, X, Mic, Send } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price_minor: number
}

interface AIChatProps {
  locationId: string
  organizationId: string
  aiName: string
  businessName?: string
  themeColor: string
  tableIdentifier: string
  menuItems: MenuItem[]
  templateType?: string
  billingMode?: string | null
  businessTypePreset?: string | null
  customQuickActions?: string[]
}

export function AIChat({
  locationId,
  organizationId,
  aiName,
  businessName,
  themeColor,
  tableIdentifier,
  menuItems,
  templateType = 'catalog',
  billingMode = 'table_service',
  businessTypePreset,
  customQuickActions,
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const mode = getBusinessMode(templateType, billingMode || 'table_service', businessTypePreset || 'restaurant')
  const persona = resolvePersona(mode, aiName, businessName, customQuickActions)

  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)

  const [input, setInput] = useState('')
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const { messages, sendMessage, status, error, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        locationId,
        templateType,
        billingMode,
        businessTypePreset,
        tableIdentifier: tableIdentifier || 'QR Scan'
      }
    }),
    async onToolCall({ toolCall }) {
      try {
        if (toolCall.toolName === 'addToCart') {
          const { itemId, quantity } = (toolCall as unknown as { args: { itemId: string; quantity: number } }).args
          const item = menuItems.find((i) => i.id === itemId)
          if (item) {
            for (let i = 0; i < (quantity || 1); i++) {
              addItem({ id: item.id, cartKey: item.id, name: item.name, price_minor: item.price_minor, pageId: '' })
            }
            toast.success(`Added ${quantity || 1}× ${item.name} to cart`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully added ${quantity || 1}x ${item.name} to cart.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Item not found in menu.' })
          return
        }

        if (toolCall.toolName === 'removeFromCart') {
          const { itemId } = (toolCall as unknown as { args: { itemId: string } }).args
          const item = menuItems.find((i) => i.id === itemId)
          if (item) {
            removeItem(itemId)
            toast.success(`Removed ${item.name} from cart`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully removed ${item.name} from cart.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Item not found in cart.' })
          return
        }

        if (toolCall.toolName === 'clearCart') {
          clearCart()
          toast.success('Cleared cart')
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Successfully cleared cart.' })
          return
        }

        if (toolCall.toolName === 'checkout') {
          window.dispatchEvent(new CustomEvent('open-checkout-modal'))
          setIsOpen(false)
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Opened checkout payment modal.' })
          return
        }

        if (toolCall.toolName === 'callStaffToTable') {
          const { requestType, note } = (toolCall as unknown as { args: { requestType: 'waiter' | 'bill' | 'cleanup' | 'water' | 'manager_escalation', note?: string } }).args
          const res = await callStaffFromAi({
            orgId: organizationId, locationId,
            tableIdentifier: tableIdentifier || 'QR Scan',
            requestType: requestType === 'water' ? 'waiter' : requestType,
            note: note || `Requested ${requestType}`
          })
          if (res?.data?.success) {
            toast.success(`Staff notified · Table ${tableIdentifier || 'QR Scan'}`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully paged staff for ${requestType}. Someone is on the way.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Failed to page staff: ${res.serverError || 'Unknown error'}` })
          return
        }

        if (['messageFrontDesk', 'requestSalesAssociate', 'requestConsultantCallback', 'submitCustomQuoteLead', 'requestStaffHandoff'].includes(toolCall.toolName)) {
          const args = (toolCall as unknown as { args: Record<string, string> }).args
          const noteText = args.customerMessage || args.customerNote || args.inquiry || args.projectScope || args.reason || 'Customer requested human assistance.'
          const res = await callStaffFromAi({ orgId: organizationId, locationId, tableIdentifier: tableIdentifier || 'Online Storefront', requestType: 'manager_escalation', note: noteText })
          if (res?.data?.success) {
            toast.success('Our team has been notified!')
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Successfully notified our team. Someone will assist you shortly.' })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Failed to notify team: ${res?.serverError || 'Network error'}` })
          return
        }
      } catch (err: unknown) {
        addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, state: 'output-error', errorText: (err as Error).message })
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ role: 'user', content: input } as never)
    setInput('')
    if (isListening && recognitionRef.current) recognitionRef.current.stop()
  }

  const handleChipClick = (chipText: string) => {
    sendMessage({ role: 'user', content: chipText.replace(/^[^\w\s]+/, '').trim() } as never)
  }

  const handleQuickCallStaff = async () => {
    toast.loading('Notifying staff…', { id: 'call-staff-quick' })
    const res = await callStaffFromAi({ orgId: organizationId, locationId, tableIdentifier: tableIdentifier || 'QR Scan', requestType: 'waiter', note: '1-Tap Staff Summon from AI' })
    if (res?.data?.success) {
      toast.success(`Staff paged to ${tableIdentifier || 'your table'}! 🔔`, { id: 'call-staff-quick' })
    } else {
      toast.error('Failed to notify staff. Please try again.', { id: 'call-staff-quick' })
    }
  }

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      return
    }
    // @ts-expect-error - SpeechRecognition is non-standard
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice not supported in this browser.'); return }
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    const initialInput = input
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: { results: Iterable<unknown> }) => {
      const transcript = Array.from(event.results)
        .map((r: unknown) => (r as { [key: number]: unknown })[0])
        .map((r: unknown) => (r as { transcript: string }).transcript)
        .join('')
      setInput(initialInput ? initialInput + ' ' + transcript : transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  useEffect(() => {
    if (error && error.message.includes('429')) {
      queueMicrotask(() => {
        setLimitReached(true)
        toast.error('Session limit reached (30 messages).')
      })
    }
  }, [error])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isTableService = billingMode === 'table_service' || mode === 'catalog_table_service'
  const tc = themeColor || '#10b981'
  const tcAlpha = (a: number) => `${tc}${Math.round(a * 255).toString(16).padStart(2, '0')}`

  return (
    <>
      {/* ── Floating Trigger ── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        className="relative z-40 h-12 px-5 rounded-full flex items-center gap-2 cursor-pointer overflow-hidden border border-white/20 backdrop-blur-md group"
        style={{
          backgroundColor: tc,
          boxShadow: `0 6px 28px ${tcAlpha(0.45)}, 0 2px 8px ${tcAlpha(0.3)}`,
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
        />
        <Sparkles className="w-4 h-4 text-white/90 shrink-0" />
        <span className="text-white font-bold text-sm tracking-wide relative z-10">{persona.baseName}</span>
      </motion.button>

      {/* ── Slide-in Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end p-2 sm:p-4 pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Chat container */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md h-[82vh] sm:h-150 rounded-t-3xl sm:rounded-3xl relative z-10 flex flex-col pointer-events-auto overflow-hidden border border-white/7"
              style={{
                background: 'linear-gradient(170deg, #111111 0%, #0a0a0a 100%)',
                boxShadow: `0 -12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 -4px 30px ${tcAlpha(0.12)}`,
              }}
            >
              {/* Top accent line in theme color */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${tc}60, transparent)` }} />

              {/* ── Header ── */}
              <div className="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5"
                style={{ background: `linear-gradient(180deg, ${tcAlpha(0.05)} 0%, transparent 100%)` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Live status dot */}
                  <div className="relative shrink-0">
                    <motion.span
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: tc }}
                    />
                    <span className="relative w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: tc }} />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-white text-sm leading-tight truncate">{persona.defaultName}</h3>
                    <span className="text-[10px] text-zinc-500 block truncate">{persona.subtitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isTableService && (
                    <button
                      onClick={handleQuickCallStaff}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all"
                      style={{ backgroundColor: `${tc}15`, borderColor: `${tc}30`, color: tc }}
                      title="Call staff to your table"
                    >
                      <Bell className="w-3 h-3" />
                      Call staff
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                    {/* AI avatar with ambient glow */}
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.25, 0.12] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full blur-xl"
                        style={{ backgroundColor: tc, width: 64, height: 64, margin: 'auto', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center border mx-auto shadow-lg"
                        style={{ backgroundColor: `${tc}20`, borderColor: `${tc}30` }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: tc }} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Welcome to {businessName || 'our venue'}!</h4>
                      <p className="text-[11px] text-zinc-500 mt-1.5 max-w-50 mx-auto leading-relaxed">
                        {persona.greeting}
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const m = msg as unknown as { id: string; role: string; content: string }
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div
                          className="text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[82%] text-[13px] leading-relaxed shadow-md"
                          style={{ backgroundColor: tc, boxShadow: `0 4px 16px ${tcAlpha(0.3)}` }}
                        >
                          {m.content}
                        </div>
                      </div>
                    )
                  }
                  if (m.content) {
                    return (
                      <div key={m.id} className="flex justify-start items-end gap-2">
                        {/* AI avatar mini */}
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 mb-0.5"
                          style={{ backgroundColor: `${tc}15`, borderColor: `${tc}25` }}
                        >
                          <Sparkles className="w-3 h-3" style={{ color: tc }} />
                        </div>
                        <div className="bg-zinc-900/80 border border-zinc-800/60 text-zinc-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[82%] text-[13px] leading-relaxed whitespace-pre-line">
                          {m.content}
                        </div>
                      </div>
                    )
                  }
                  return null
                })}

                {/* Thinking indicator */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start items-end gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 mb-0.5"
                      style={{ backgroundColor: `${tc}15`, borderColor: `${tc}25` }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: tc }} />
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800/60 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay }}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tc }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* ── Suggestion Chips ── */}
              {persona.suggestionChips?.length > 0 && !limitReached && messages.length === 0 && (
                <div className="px-4 pb-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {persona.suggestionChips.slice(0, 4).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      disabled={isLoading}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all shrink-0 disabled:opacity-40"
                      style={{ backgroundColor: `${tc}10`, borderColor: `${tc}25`, color: tc }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              <div className="px-3.5 py-3 shrink-0 border-t border-white/4"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)' }}
              >
                {limitReached ? (
                  <div className="text-center text-[11px] text-red-400/80 bg-red-950/20 border border-red-900/30 p-3 rounded-2xl font-medium">
                    Session limit reached — speak with staff directly.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-3 py-2 focus-within:border-zinc-700 transition-colors"
                    style={{ ['--tw-ring-color' as string]: tc }}
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder={isLoading ? 'Thinking…' : persona.inputPlaceholder}
                      disabled={isLoading || limitReached}
                      className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isLoading || limitReached}
                      className={`p-1.5 rounded-xl transition-all shrink-0 disabled:opacity-40 ${
                        isListening
                          ? 'text-red-400 bg-red-500/10 animate-pulse'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                      }`}
                      title="Dictate message"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || limitReached}
                      className="p-1.5 rounded-xl text-white transition-all shrink-0 disabled:opacity-30 shadow-sm"
                      style={{ backgroundColor: tc }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
