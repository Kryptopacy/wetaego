'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, UIMessage, Chat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, X, Send, Sparkles, AlertCircle, Mic, MicOff, Volume2, VolumeX, Radio, PhoneOff, Camera, CameraOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeech } from '@/hooks/use-speech'
import { useGeminiLive } from '@/hooks/use-gemini-live'
import Image from 'next/image'

export function AICopilotWidget({ organizationId }: { organizationId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'text' | 'live'>('text')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [chatInstance] = useState(() => new Chat({
    transport: new DefaultChatTransport({
      api: '/api/ai/copilot',
      body: { organizationId }
    })
  }))

  const [conversationMode, setConversationMode] = useState(false)

  // Standard Web Speech API fallback
  const { isSupported: isSpeechSupported, isListening, startListening, stopListening, speak, cancelSpeech } = useSpeech({
    onTranscriptComplete: (text) => {
      if (conversationMode) {
        sendMessage({ text })
      } else {
        setInput(prev => prev ? `${prev} ${text}` : text)
      }
    },
    onSpeechEnd: () => {
      if (conversationMode && isOpen && mode === 'text') {
        startListening()
      }
    }
  })

  // Gemini Multimodal Live API (Voice & Vision)
  const {
    isConnected: isLiveConnected,
    isConnecting: isLiveConnecting,
    isSpeaking: isLiveSpeaking,
    isCameraActive,
    cameraFacingMode,
    videoElementRef,
    error: liveError,
    transcripts: liveTranscripts,
    startLiveSession,
    stopLiveSession,
    startCamera,
    stopCamera,
    switchCamera
  } = useGeminiLive()

  const { messages, sendMessage, status, error } = useChat({
    chat: chatInstance,
    onFinish: (message: Record<string, unknown>) => {
      if (conversationMode && mode === 'text') {
        const text = (message.parts as Record<string, unknown>[])?.filter(p => p.type === 'text').map(p => p.text as string).join('') || ''
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
  }, [messages, liveTranscripts])

  // Stop everything when closing the modal
  const handleClose = () => {
    setIsOpen(false)
    setConversationMode(false)
    stopListening()
    cancelSpeech()
    if (isLiveConnected || isLiveConnecting) {
      stopLiveSession()
    }
    setMode('text')
  }

  const toggleLiveMode = () => {
    if (mode === 'live') {
      stopLiveSession()
      setMode('text')
    } else {
      setConversationMode(false)
      stopListening()
      cancelSpeech()
      setMode('live')
      startLiveSession(organizationId)
    }
  }

  const [isDragging, setIsDragging] = useState(false)
  const dragOriginRef = useRef({ x: 0, y: 0 })

  return (
    <>
      <motion.button
        drag
        dragMomentum={false}
        onDragStart={(_, info) => {
          dragOriginRef.current = { x: info.point.x, y: info.point.y }
          setIsDragging(false)
        }}
        onDrag={(_, info) => {
          const dist = Math.hypot(info.point.x - dragOriginRef.current.x, info.point.y - dragOriginRef.current.y)
          if (dist > 5) setIsDragging(true)
        }}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 150)
        }}
        onClick={() => {
          if (!isDragging) setIsOpen(prev => !prev)
        }}
        className={`fixed bottom-20 md:bottom-24 right-6 z-90 h-12 px-4 rounded-full shadow-2xl border border-white/20 group flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-900 transition-opacity ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Image src="/hero_emerald_gemstone.png" alt="Tego AI Copilot" fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 bg-teal-900/30 mix-blend-overlay transition-colors" />
        <div className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
          <span className="text-white font-semibold text-sm">Tego AI</span>
        </div>
        
        {/* Notification Dot (Simulated) */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-teal-900 animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-100 w-full sm:w-95 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-3rem)] h-150 max-h-[80vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
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
                  <h3 className="font-semibold text-white text-sm">Tego - Admin Co-Pilot</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${mode === 'live' && isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    <span className="text-[11px] text-zinc-400">
                      {mode === 'live' ? (isLiveConnecting ? 'Connecting Live...' : isLiveConnected ? 'Gemini Live Active' : 'Live Voice Ready') : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Gemini Live Mode Button */}
                <button
                  onClick={toggleLiveMode}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold border ${
                    mode === 'live'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                      : 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700'
                  }`}
                  title="Toggle Gemini Live Ultra-Low-Latency Voice"
                >
                  <Radio className={`w-3.5 h-3.5 ${mode === 'live' ? 'animate-spin' : ''}`} />
                  {mode === 'live' ? 'Live On' : 'Live Voice'}
                </button>

                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LIVE VOICE & VISION MODE VIEW */}
            {mode === 'live' ? (
              <div className="flex-1 flex flex-col justify-between p-4 bg-radial from-emerald-950/30 via-zinc-950 to-zinc-950 overflow-y-auto">
                <div className="flex flex-col items-center justify-center my-auto space-y-4 text-center w-full">
                  {/* Camera Viewfinder or Visualizer Orb */}
                  {isCameraActive ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl bg-black aspect-video flex items-center justify-center">
                      <video
                        ref={videoElementRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Tego Vision Active</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-400">
                        1 FPS Stream • {cameraFacingMode === 'user' ? 'Front' : 'Back'} Camera
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center py-2">
                      <motion.div
                        animate={{
                          scale: isLiveSpeaking ? [1, 1.25, 1.05, 1.2, 1] : isLiveConnected ? [1, 1.08, 1] : 1,
                          opacity: isLiveSpeaking ? [0.6, 0.9, 0.6] : 0.4
                        }}
                        transition={{ duration: isLiveSpeaking ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-32 h-32 rounded-full bg-emerald-500/20 blur-xl"
                      />
                      <motion.div
                        animate={{
                          scale: isLiveSpeaking ? [1, 1.15, 1] : 1
                        }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isLiveSpeaking 
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/40 text-emerald-300' 
                            : isLiveConnected 
                              ? 'border-zinc-700 bg-zinc-900/80 text-white' 
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-600'
                        }`}
                      >
                        <Radio className={`w-10 h-10 ${isLiveSpeaking ? 'animate-pulse' : ''}`} />
                      </motion.div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-base font-bold text-white mb-0.5">
                      {isLiveSpeaking 
                        ? 'Tego is Speaking...' 
                        : isLiveConnected 
                          ? (isCameraActive ? 'Tego is Watching & Listening...' : 'Listening to you...') 
                          : isLiveConnecting 
                            ? 'Establishing Live Stream...' 
                            : 'Tap to Start'}
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      {isLiveConnected 
                        ? (isCameraActive ? 'Show menus, dishes, stock, or invoices to Tego.' : 'Speak naturally or tap "Show Tego" to turn on camera.') 
                        : isLiveConnecting 
                          ? 'Minting session token with Gemini 3.1 Flash Live...' 
                          : 'Ultra-low latency audio & vision streaming.'}
                    </p>
                  </div>

                  {/* Live Transcript Snippet */}
                  {liveTranscripts.length > 0 && (
                    <div className="w-full max-h-28 overflow-y-auto bg-black/50 border border-zinc-800/80 rounded-xl p-3 text-left space-y-1.5 custom-scrollbar">
                      {liveTranscripts.slice(-3).map((t) => (
                        <div key={t.id} className={`text-xs ${t.role === 'user' ? 'text-zinc-400' : 'text-emerald-400 font-medium'}`}>
                          <span className="font-bold opacity-60 uppercase tracking-wider">{t.role === 'user' ? 'You: ' : 'Tego: '}</span>
                          {t.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {liveError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {liveError}
                    </div>
                  )}
                </div>

                {/* Bottom Live Controls */}
                <div className="flex items-center justify-center gap-2 pt-3 border-t border-zinc-900 mt-2">
                  <button
                    onClick={() => isCameraActive ? stopCamera() : startCamera()}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      isCameraActive 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30' 
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={isCameraActive ? "Turn off camera" : "Show Tego something (Turn on camera)"}
                  >
                    {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                    {isCameraActive ? 'Vision On' : 'Show Tego'}
                  </button>

                  {isCameraActive && (
                    <button
                      onClick={switchCamera}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Switch front/back camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      stopLiveSession()
                      setMode('text')
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-medium text-xs transition-colors"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD TEXT & CHAT VIEW */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                      <Bot className="w-12 h-12 text-zinc-500" />
                      <p className="text-sm text-zinc-400">
                        I can help you manage inventory, run forecasts, or update your storefront appearance. What do you need?
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
                        {(m.parts as Record<string, unknown>[])?.filter(p => p.type === 'text').map(p => p.text as string).join('')}
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
                      placeholder="Ask Tego to do something..."
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl pl-4 pr-20 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {isSpeechSupported && !conversationMode && (
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
                    Tego AI can make mistakes. Verify important actions.
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

