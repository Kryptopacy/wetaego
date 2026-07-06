'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, UIMessage, Chat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, X, MessageSquare, Send, Sparkles, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeech } from '@/hooks/use-speech'
import Image from 'next/image'

export function AICopilotWidget({ organizationId }: { organizationId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [chatInstance] = useState(() => new Chat({
    transport: new DefaultChatTransport({
      api: '/api/ai/copilot',
      body: { organizationId }
    })
  }))

  const [conversationMode, setConversationMode] = useState(false)

  const { isSupported, isListening, isSpeaking, startListening, stopListening, speak, cancelSpeech } = useSpeech({
    onTranscriptComplete: (text) => {
      if (conversationMode) {
        sendMessage({ text })
      } else {
        setInput(prev => prev ? `${prev} ${text}` : text)
      }
    },
    onSpeechEnd: () => {
      if (conversationMode && isOpen) {
        startListening()
      }
    }
  })

  const { messages, sendMessage, status, error } = useChat({
    chat: chatInstance,
    onFinish: (message: any) => {
      if (conversationMode) {
        const text = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || ''
        if (text) speak(text)
      }
    }
  })

  const [input, setInput] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Stop everything when closing the modal
  const handleClose = () => {
    setIsOpen(false)
    setConversationMode(false)
    stopListening()
    cancelSpeech()
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            drag
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 md:bottom-24 right-6 z-[90] h-12 px-4 rounded-full shadow-2xl border border-white/20 group flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-900"
          >
            <Image src="/hero_emerald_gemstone.png" alt="Unem AI Copilot" fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 bg-teal-900/30 mix-blend-overlay transition-colors" />
            <div className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
              <span className="text-white font-semibold text-sm">Unem AI</span>
            </div>
            
            {/* Notification Dot (Simulated) */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-teal-900 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-[100] w-full sm:w-[380px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg border border-emerald-500/30 shadow-lg overflow-hidden flex items-center justify-center">
                  <Image src="/hero_emerald_gemstone.png" alt="AI" fill className="object-cover opacity-80" />
                  <div className="absolute inset-0 bg-emerald-500/20 mix-blend-overlay" />
                  <Sparkles className="relative z-10 w-5 h-5 text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Unem - Admin Co-Pilot</h3>
                  <p className="text-[11px] text-zinc-400">Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSupported && (
                  <button
                    onClick={() => {
                      const newMode = !conversationMode;
                      setConversationMode(newMode);
                      if (newMode) {
                        startListening();
                      } else {
                        stopListening();
                        cancelSpeech();
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border ${
                      conversationMode 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                    title="Conversation Mode"
                  >
                    {conversationMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    Voice Mode
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <Bot className="w-12 h-12 text-zinc-500" />
                  <p className="text-sm text-zinc-400">
                    I can help you manage inventory, run forecasts, or handle customer tasks. What do you need?
                  </p>
                </div>
              )}
              
              {messages.map((m: UIMessage) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none'
                    }`}
                  >
                    {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')}
                  </div>
                </div>
              ))}
              
              {error && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                    <AlertCircle className="w-4 h-4" />
                    Failed to send message.
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me to do something..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl pl-4 pr-20 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {isSupported && !conversationMode && (
                    <button
                      type="button"
                      onClick={() => isListening ? stopListening() : startListening()}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                      disabled={isLoading}
                      title="Dictate message"
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-zinc-500">
                AI can make mistakes. Verify important actions.
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
