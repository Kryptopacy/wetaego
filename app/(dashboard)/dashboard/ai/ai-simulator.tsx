'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AiSimulator({
  locationId,
  aiName,
  basePersonality,
}: {
  locationId: string
  aiName: string
  basePersonality: string
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm ${aiName}. Ask me anything about our menu, venue policies, hours, or recommendations to test my responses.`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(textToSend?: string) {
    const text = textToSend || input
    if (!text.trim() || isLoading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          locationId,
          templateType: 'catalog',
          billingMode: 'table_service',
          businessTypePreset: 'restaurant'
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to get response')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // The AI SDK stream protocol can contain chunks or plain text
          accumulated += chunk.replace(/0:"/g, '').replace(/"\n/g, '').replace(/\\n/g, '\n')
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: accumulated }
            return updated
          })
        }
      }
    } catch (err: unknown) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `[Simulation Error]: ${(err as Error).message || 'Could not connect to AI advisor.'}` }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const promptStarters = [
    'What do you recommend for dinner?',
    'What is your Wi-Fi password?',
    'Do you have vegetarian or gluten-free options?',
    'What are your operating hours and dress code?'
  ]

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              Interactive AI Sandbox Simulator
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">
                Live Test
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Test how {aiName} answers customer inquiries using your brand knowledge.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages([
            {
              role: 'assistant',
              content: `Hello! I'm ${aiName}. Ask me anything about our menu, venue policies, hours, or recommendations to test my responses.`
            }
          ])}
          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Reset Simulator"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-md shadow-blue-500/10'
                  : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 rounded-tl-xs'
              }`}
            >
              {msg.content || (isLoading && idx === messages.length - 1 ? (
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  Thinking...
                </span>
              ) : '')}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Starter Pills */}
      <div className="flex flex-wrap gap-1.5 pt-2 pb-3 border-t border-zinc-800/60 shrink-0">
        {promptStarters.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => handleSend(starter)}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors disabled:opacity-50"
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="flex items-center gap-2 pt-2 border-t border-zinc-800 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${aiName} to test...`}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-white outline-none focus:border-blue-500 text-xs"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-blue-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
