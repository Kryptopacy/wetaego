'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, UIMessage, Chat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { X, Send, Sparkles, AlertCircle, Mic, MicOff, Radio, PhoneOff, Camera, CameraOff, RefreshCw, ChevronRight } from 'lucide-react'
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveTranscripts])

  const handleClose = () => {
    setIsOpen(false)
    setConversationMode(false)
    stopListening()
    cancelSpeech()
    if (isLiveConnected || isLiveConnecting) stopLiveSession()
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

  // Suggestion chips for the empty state
  const SUGGESTION_CHIPS = [
    'Summarize today\'s orders',
    'What\'s selling most?',
    'Update my menu prices',
    'Run a sales forecast',
  ]

  return (
    <>
      {/* ── Floating Trigger ── */}
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
        onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
        onClick={() => { if (!isDragging) setIsOpen(prev => !prev) }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isOpen ? 'Close Tego AI' : 'Open Tego AI'}
        className={`fixed bottom-20 md:bottom-24 right-6 z-90 h-11 px-5 rounded-full border border-emerald-500/40 hover:border-emerald-400/80 group flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-950/90 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(16,185,129,0.18)] ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Image src="/hero_emerald_gemstone.png" alt="Tego AI" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/70" />
        <span className="relative z-10 font-black tracking-tight text-sm bg-linear-to-r from-white via-emerald-50 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-none">
          Tego AI
        </span>
      </motion.button>

      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-100 w-full sm:w-95 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-3rem)] h-135 max-h-[80vh] flex flex-col rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #0d0d0d 0%, #0a0a0a 100%)' }}
          >
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/5"
              style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.04) 0%, transparent 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/25 shadow-lg shrink-0">
                  <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-90" />
                  <div className="absolute inset-0 bg-emerald-500/10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-white tracking-tight">Tego</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Admin Co‑Pilot</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' && isLiveConnected ? 'bg-emerald-400 animate-pulse' : mode === 'live' && isLiveConnecting ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[10px] text-zinc-500">
                      {mode === 'live' ? (isLiveConnecting ? 'Connecting…' : isLiveConnected ? 'Live active' : 'Live ready') : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleLiveMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    mode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                  title="Toggle Gemini Live Voice"
                >
                  <Radio className={`w-3 h-3 ${mode === 'live' && isLiveConnected ? 'animate-spin' : ''}`} />
                  {mode === 'live' ? 'Live On' : 'Live Voice'}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Live Voice View ── */}
            {mode === 'live' ? (
              <div className="flex-1 flex flex-col justify-between p-5 overflow-y-auto" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.06) 0%, transparent 70%)' }}>
                <div className="flex flex-col items-center justify-center my-auto space-y-5 text-center w-full">
                  {isCameraActive ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl bg-black aspect-video">
                      <video ref={videoElementRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">Tego Vision</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-400">
                        1 FPS · {cameraFacingMode === 'user' ? 'Front' : 'Back'}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center py-4">
                      {/* Ambient rings */}
                      <motion.div
                        animate={{ scale: isLiveSpeaking ? [1, 1.4, 1.1, 1.35, 1] : isLiveConnected ? [1, 1.1, 1] : 1, opacity: isLiveSpeaking ? [0.3, 0.6, 0.3] : 0.2 }}
                        transition={{ duration: isLiveSpeaking ? 1.0 : 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-40 h-40 rounded-full border border-emerald-500/20 blur-md"
                      />
                      <motion.div
                        animate={{ scale: isLiveSpeaking ? [1, 1.2, 1] : 1, opacity: isLiveSpeaking ? [0.5, 0.9, 0.5] : 0.3 }}
                        transition={{ duration: isLiveSpeaking ? 0.8 : 2, repeat: Infinity }}
                        className="absolute w-28 h-28 rounded-full bg-emerald-500/10 blur-lg"
                      />
                      {/* Core orb */}
                      <motion.div
                        animate={{ scale: isLiveSpeaking ? [1, 1.12, 1] : 1 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center border transition-all ${
                          isLiveSpeaking
                            ? 'border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_32px_rgba(16,185,129,0.4)]'
                            : isLiveConnected
                              ? 'border-zinc-700 bg-zinc-900/80'
                              : 'border-zinc-800/60 bg-zinc-900/40'
                        }`}
                      >
                        <Radio className={`w-8 h-8 ${isLiveSpeaking ? 'text-emerald-300 animate-pulse' : isLiveConnected ? 'text-zinc-300' : 'text-zinc-600'}`} />
                      </motion.div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isLiveSpeaking ? 'Tego is responding…' : isLiveConnected ? (isCameraActive ? 'Watching & listening…' : 'Listening…') : isLiveConnecting ? 'Establishing stream…' : 'Tap to start'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-55 mx-auto leading-relaxed">
                      {isLiveConnected ? (isCameraActive ? 'Point your camera at a menu, dish, or invoice.' : 'Speak naturally. Tap "Show Tego" to share your camera.') : 'Ultra-low latency voice & vision.'}
                    </p>
                  </div>

                  {liveTranscripts.length > 0 && (
                    <div className="w-full max-h-28 overflow-y-auto bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 text-left space-y-1.5 custom-scrollbar">
                      {liveTranscripts.slice(-4).map((t) => (
                        <div key={t.id} className={`text-[11px] leading-relaxed ${t.role === 'user' ? 'text-zinc-400' : 'text-emerald-400 font-medium'}`}>
                          <span className="opacity-50 uppercase tracking-widest text-[9px] font-bold">{t.role === 'user' ? 'You ' : 'Tego '}</span>
                          {t.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {liveError && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/8 px-3 py-2 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {liveError}
                    </div>
                  )}
                </div>

                {/* Live controls */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/4 mt-2">
                  <button
                    onClick={() => isCameraActive ? stopCamera() : startCamera()}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      isCameraActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                    {isCameraActive ? 'Vision On' : 'Show Tego'}
                  </button>

                  {isCameraActive && (
                    <button
                      onClick={switchCamera}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Switch camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => { stopLiveSession(); setMode('text') }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold transition-colors"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    End Call
                  </button>
                </div>
              </div>
            ) : (
              /* ── Text Chat View ── */
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="flex flex-col h-full">
                      {/* Ambient empty state */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 pb-2">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.28, 0.15] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-500/20 blur-xl translate-x-0"
                          />
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.15)] mx-auto">
                            <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-70" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-emerald-300/80 drop-shadow-md" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">What can I help with?</p>
                          <p className="text-[11px] text-zinc-600 mt-1 max-w-50 mx-auto leading-relaxed">
                            Orders, forecasts, inventory, storefront — just ask.
                          </p>
                        </div>
                      </div>
                      {/* Suggestion chips */}
                      <div className="flex flex-wrap gap-2 justify-center pb-1">
                        {SUGGESTION_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => { sendMessage({ text: chip }); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-zinc-200 transition-all group"
                          >
                            {chip}
                            <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m: UIMessage) => {
                    const text = (m.parts as Record<string, unknown>[])?.filter(p => p.type === 'text').map(p => p.text as string).join('')
                    if (!text) return null
                    const isUser = m.role === 'user'
                    return (
                      <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="w-6 h-6 rounded-lg overflow-hidden border border-emerald-500/20 shrink-0 mr-2 mt-0.5 relative">
                            <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-80" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isUser
                              ? 'bg-emerald-600/90 text-white rounded-tr-sm shadow-[0_4px_16px_rgba(16,185,129,0.25)]'
                              : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/60 rounded-tl-sm'
                          }`}
                        >
                          {text}
                        </div>
                      </div>
                    )
                  })}

                  {isLoading && (
                    <div className="flex justify-start items-center gap-2">
                      <div className="w-6 h-6 rounded-lg overflow-hidden border border-emerald-500/20 shrink-0 relative">
                        <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-80" />
                      </div>
                      <div className="bg-zinc-900/80 border border-zinc-800/60 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                        {[0, 150, 300].map((delay) => (
                          <motion.span
                            key={delay}
                            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: delay / 1000 }}
                            className="w-1.5 h-1.5 bg-emerald-500/70 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-1.5 text-red-400 text-[11px] bg-red-500/8 px-3 py-2 rounded-xl border border-red-500/20">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Failed to send. Try again.
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ── Input ── */}
                <form onSubmit={handleSubmit} className="shrink-0 px-3 py-3 border-t border-white/4"
                  style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)' }}
                >
                  <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 focus-within:border-emerald-500/40 rounded-xl px-3 py-2 transition-colors">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask Tego…"
                      className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      {isSpeechSupported && !conversationMode && (
                        <button
                          type="button"
                          onClick={() => isListening ? stopListening() : startListening()}
                          disabled={isLoading}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isListening
                              ? 'text-red-400 bg-red-500/10'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-[9px] text-zinc-700 mt-2 tracking-wide">
                    Tego can make mistakes — verify important actions
                  </p>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
