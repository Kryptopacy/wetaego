'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart'
import { callStaffFromAi } from './actions'
import { getBusinessMode, resolvePersona } from '@/lib/templates/ai-personas'
import { Bell, Sparkles, X, Mic, Send, ShoppingBag } from 'lucide-react'

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
              addItem({
                id: item.id,
                cartKey: item.id,
                name: item.name,
                price_minor: item.price_minor,
                pageId: ''
              })
            }
            toast.success(`Added ${quantity || 1}x ${item.name} to cart`)
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

        // Hospitality table service
        if (toolCall.toolName === 'callStaffToTable') {
          const { requestType, note } = (toolCall as unknown as { args: { requestType: 'waiter' | 'bill' | 'cleanup' | 'water' | 'manager_escalation', note?: string } }).args
          const res = await callStaffFromAi({
            orgId: organizationId,
            locationId,
            tableIdentifier: tableIdentifier || 'QR Scan',
            requestType: requestType === 'water' ? 'waiter' : requestType,
            note: note || `Requested ${requestType}`
          })
          if (res?.data?.success) {
            toast.success(`Staff notified for ${requestType} (Table: ${tableIdentifier || 'QR Scan'})`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully paged staff for ${requestType}. A team member is on the way.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Failed to page staff: ${res.serverError || 'Unknown error'}` })
          return
        }

        // Front desk / Sales / Callback / Handoff tools
        if (['messageFrontDesk', 'requestSalesAssociate', 'requestConsultantCallback', 'submitCustomQuoteLead', 'requestStaffHandoff'].includes(toolCall.toolName)) {
          const args = (toolCall as unknown as { args: Record<string, string> }).args
          const noteText = args.customerMessage || args.customerNote || args.inquiry || args.projectScope || args.reason || 'Customer requested human assistance.'
          const res = await callStaffFromAi({
            orgId: organizationId,
            locationId,
            tableIdentifier: tableIdentifier || 'Online Storefront',
            requestType: 'manager_escalation',
            note: noteText
          })
          if (res?.data?.success) {
            toast.success('Inquiry received. Our team has been notified!')
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
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleChipClick = (chipText: string) => {
    const cleanPrompt = chipText.replace(/^[^\w\s]+/, '').trim()
    sendMessage({ role: 'user', content: cleanPrompt } as never)
  }

  const handleQuickCallStaff = async () => {
    toast.loading('Notifying staff...', { id: 'call-staff-quick' })
    const res = await callStaffFromAi({
      orgId: organizationId,
      locationId,
      tableIdentifier: tableIdentifier || 'QR Scan',
      requestType: 'waiter',
      note: '1-Tap Staff Summon from AI Header'
    })
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
    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    const initialInput = input
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: { results: Iterable<unknown> }) => {
      const transcript = Array.from(event.results)
        .map((result: unknown) => (result as { [key: number]: unknown })[0])
        .map((result: unknown) => (result as { transcript: string }).transcript)
        .join('')
      setInput(initialInput ? initialInput + ' ' + transcript : transcript)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  useEffect(() => {
    if (error && error.message.includes('429')) {
      queueMicrotask(() => {
        setLimitReached(true)
        toast.error('AI assistant session limit reached (Max 30 messages).')
      })
    }
  }, [error])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isTableService = billingMode === 'table_service' || mode === 'catalog_table_service'

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        className="relative z-40 h-13 px-4 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer border border-white/20 group backdrop-blur-md overflow-hidden"
        style={{
          backgroundColor: themeColor || '#0f7b55',
          boxShadow: `0 8px 30px ${(themeColor || '#0f7b55') + '60'}`,
        }}
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
        <span className="text-white font-bold text-sm tracking-wide">
          {persona.baseName}
        </span>
      </motion.button>

      {/* Slide-in Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end p-2 sm:p-4 pointer-events-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
            />

            {/* Chat Container */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-md h-[80vh] sm:h-145 bg-zinc-950/95 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: themeColor || '#10b981' }}
                  />
                  <div className="truncate">
                    <h3 className="font-bold text-white text-sm leading-tight truncate">{persona.defaultName}</h3>
                    <span className="text-[11px] text-zinc-400 block truncate">{persona.subtitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isTableService && (
                    <button
                      onClick={handleQuickCallStaff}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Page Floor Staff to your table"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Call Staff
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-black/30">
                {messages.length === 0 && (
                  <div className="text-center py-6 px-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white border border-white/10 shadow-lg"
                      style={{ backgroundColor: (themeColor || '#10b981') + '30' }}
                    >
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Welcome to {businessName || 'our venue'}!
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-70 mx-auto leading-relaxed">
                      {persona.greeting}
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const m = msg as unknown as { id: string; role: string; content: string }
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div 
                          className="text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-sm shadow-md"
                          style={{ backgroundColor: themeColor || '#10b981' }}
                        >
                          {m.content}
                        </div>
                      </div>
                    )
                  }

                  if (m.content) {
                    return (
                      <div key={m.id} className="flex justify-start">
                        <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[85%] text-sm shadow-sm whitespace-pre-line leading-relaxed">
                          {m.content}
                        </div>
                      </div>
                    )
                  }

                  return null
                })}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start items-center gap-1.5 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Contextual Quick Action Suggestion Chips */}
              {persona.suggestionChips?.length > 0 && !limitReached && (
                <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {persona.suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      disabled={isLoading}
                      className="whitespace-nowrap px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[11px] font-medium transition-colors shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Form Input Area */}
              <div className="p-3.5 border-t border-zinc-850 bg-zinc-950 shrink-0">
                {limitReached ? (
                  <div className="text-center text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl font-medium">
                    Session limit reached. Please speak with staff directly.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder={isLoading ? 'Thinking...' : persona.inputPlaceholder}
                      disabled={isLoading || limitReached}
                      className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none disabled:opacity-50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isLoading || limitReached}
                      className={`p-2.5 rounded-xl transition-all shrink-0 disabled:opacity-50 flex items-center justify-center border ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
                          : 'bg-zinc-850 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800'
                      }`}
                      title="Dictate message"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || limitReached}
                      className="px-3.5 py-2.5 rounded-xl text-white font-medium text-sm transition-all shrink-0 disabled:opacity-50 flex items-center justify-center shadow-md"
                      style={{ backgroundColor: themeColor || '#10b981' }}
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
