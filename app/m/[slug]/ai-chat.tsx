'use client'




import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cart'
import { callStaffFromAi } from './actions'
import { getBusinessMode, resolvePersona } from '@/lib/templates/ai-personas'

interface MenuItem {
  id: string
  name: string
  price_minor: number
}

interface AIChatProps {
  locationId: string
  organizationId: string
  aiName: string
  themeColor: string
  tableIdentifier: string
  menuItems: MenuItem[]
  templateType?: string
  billingMode?: string | null
  businessTypePreset?: string | null
}

export function AIChat({
  locationId,
  organizationId,
  aiName,
  themeColor,
  tableIdentifier,
  menuItems,
  templateType = 'catalog',
  billingMode = 'table_service',
  businessTypePreset,
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [isListening, setIsListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const mode = getBusinessMode(templateType, billingMode || 'table_service', businessTypePreset || 'restaurant')
  const persona = resolvePersona(mode, aiName)


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
        businessTypePreset
      }
    }),
    async onToolCall({ toolCall }) {
      try {
        if (toolCall.toolName === 'addToCart') {
          const { itemId, quantity } = (toolCall as unknown as { args: { itemId: string; quantity: number } }).args
          const item = menuItems.find((i) => i.id === itemId)
          if (item) {
            for (let i = 0; i < quantity; i++) {
              addItem({
                id: item.id,
                cartKey: item.id,
                name: item.name,
                price_minor: item.price_minor,
                pageId: ''
              })
            }
            toast.success(`Added ${quantity}x ${item.name} to cart`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully added ${quantity}x ${item.name} to cart.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Item not found in menu.' })
          return
        }

        if (toolCall.toolName === 'removeFromCart') {
          const { itemId } = (toolCall as unknown as { args: { itemId: string } }).args
          const item = menuItems.find((i) => i.id === itemId)
          if (item) {
            removeItem(itemId)  // itemId == cartKey for non-variant items
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

        if (toolCall.toolName === 'callStaff') {
          const { requestType, note } = (toolCall as unknown as { args: { requestType: 'waiter' | 'bill' | 'cleanup' | 'manager_escalation', note?: string } }).args
          const res = await callStaffFromAi({
            orgId: organizationId,
            locationId,
            tableIdentifier: tableIdentifier || 'QR Scan',
            requestType,
            note
          })
          if (res?.data?.success) {
            toast.success(`Called staff for ${requestType}`)
            addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Successfully requested ${requestType} service.` })
            return
          }
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: `Failed to request service: ${res.serverError || 'Unknown error'}` })
          return
        }

        if (toolCall.toolName === 'checkout') {
          window.dispatchEvent(new CustomEvent('open-checkout-modal'))
          setIsOpen(false) // close AI chat to reveal payment modal
          addToolResult({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: 'Successfully opened payment checkout modal.' })
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

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      return
    }

    // @ts-expect-error - SpeechRecognition is not standard in lib.dom.d.ts
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

    recognition.onerror = (event: { error: unknown }) => {
      console.error('Speech recognition error', event.error)
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
        toast.error('AI session limit reached (Max 20 messages).')
      })
    }
  }, [error])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ scale: [1, 1.05, 1], boxShadow: ["0 8px 30px rgba(0,0,0,0.2)", "0 8px 30px rgba(0,0,0,0.5)", "0 8px 30px rgba(0,0,0,0.2)"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        className="relative z-40 h-14 w-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer border border-black/5 dark:border-white/10 group"
        style={{
          backgroundColor: themeColor || '#0f7b55',
          boxShadow: `0 8px 30px ${(themeColor || '#0f7b55') + '50'}`,
        }}
      >
        <span className="absolute right-[115%] whitespace-nowrap bg-zinc-800 dark:bg-zinc-100 text-white dark:text-black font-semibold text-[13px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          AI Assistant
        </span>
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>

      {/* Slide-in Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end p-4 pointer-events-none">
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md h-[75vh] sm:h-[550px] bg-zinc-950/95 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: themeColor || '#0066cc' }}
                  />
                  <div>
                    <h3 className="font-bold text-white leading-none">{persona.defaultName}</h3>
                    <span className="text-[10px] text-zinc-500 mt-1 block">{persona.subtitle}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-white/80"
                      style={{ backgroundColor: (themeColor || '#0066cc') + '20' }}
                    >
                      💡
                    </div>
                    <p className="text-sm font-semibold text-zinc-300">Welcome to {locationId ? 'our page' : 'our menu'}!</p>
                    <p className="text-xs text-zinc-500 mt-2 max-w-[250px] mx-auto leading-relaxed">
                      {persona.greeting}
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const m = msg as unknown as { id: string; role: string; content: string };
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-sm shadow-md">
                          {m.content}
                        </div>
                      </div>
                    )
                  }

                  // Render AI assistant messages (filter out tool calls/results display if raw)
                  if (m.content) {
                    return (
                      <div key={m.id} className="flex justify-start">
                        <div className="bg-zinc-900 border border-zinc-850 text-zinc-100 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[85%] text-sm shadow-sm whitespace-pre-line">
                          {m.content}
                        </div>
                      </div>
                    )
                  }

                  return null
                })}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start items-center gap-1.5 py-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce delay-150" />
                    <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce delay-300" />
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Form Input Area */}
              <div className="p-4 border-t border-zinc-850 bg-zinc-950 shrink-0">
                {limitReached ? (
                  <div className="text-center text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl font-medium">
                    AI assistant session limit reached.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder={isLoading ? 'Thinking...' : persona.inputPlaceholder}
                      disabled={isLoading || limitReached}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-700 disabled:opacity-50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isLoading || limitReached}
                      className={`px-3 py-2.5 rounded-xl transition-all shrink-0 disabled:opacity-50 flex items-center justify-center border ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                      }`}
                      title="Dictate message"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || limitReached}
                      className="px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all shrink-0 disabled:opacity-50 flex items-center justify-center"
                      style={{ backgroundColor: themeColor || '#0066cc' }}
                    >
                      Send
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
