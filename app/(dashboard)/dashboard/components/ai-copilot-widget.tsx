'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, UIMessage, Chat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { X, Send, Sparkles, AlertCircle, Radio, PhoneOff, Camera, RefreshCw, ChevronRight, Eye, EyeOff, Mic, ShieldAlert } from 'lucide-react'
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

  const { isSupported: _isSpeechSupported, isListening: _isListening, startListening: _startListening, stopListening, speak, cancelSpeech } = useSpeech({
    onTranscriptComplete: (text) => {
      if (conversationMode) {
        sendMessage({ text })
      } else {
        setInput(prev => prev ? `${prev} ${text}` : text)
      }
    },
    onSpeechEnd: () => {
      if (conversationMode && isOpen && mode === 'text') {
        _startListening()
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

  const startLiveVoice = () => {
    setConversationMode(false)
    stopListening()
    cancelSpeech()
    setMode('live')
    startLiveSession(organizationId)
  }

  const startLiveVisionAndVoice = async () => {
    setConversationMode(false)
    stopListening()
    cancelSpeech()
    setMode('live')
    await startLiveSession(organizationId)
    await startCamera()
  }

  const toggleLiveMode = () => {
    if (mode === 'live') {
      stopLiveSession()
      setMode('text')
    } else {
      startLiveVoice()
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
        className={`fixed bottom-20 md:bottom-24 right-4 sm:right-6 z-90 h-12 px-5 rounded-full border border-emerald-500/40 hover:border-emerald-400/80 group flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(16,185,129,0.22)] ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Image src="/hero_emerald_gemstone.png" alt="Tego AI" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/70" />
        <span className="relative z-10 font-black tracking-tight text-sm bg-linear-to-r from-white via-emerald-50 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-none flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          Tego AI
        </span>
      </motion.button>

      {/* ── Main Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-24 right-3 sm:right-6 z-90 w-[calc(100vw-1.5rem)] sm:w-[410px] max-h-[85vh] h-[560px] rounded-3xl flex flex-col overflow-hidden border border-emerald-500/30 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl"
            style={{
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 36px 0 rgba(16, 185, 129, 0.12)'
            }}
          >
            {/* Top iridescent border accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/60 to-transparent" />

            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/5"
              style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, transparent 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg shrink-0">
                  <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-90" />
                  <div className="absolute inset-0 bg-emerald-500/10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-white tracking-tight">Tego</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Admin Co‑Pilot</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' && isLiveConnected ? 'bg-emerald-400 animate-pulse' : mode === 'live' && isLiveConnecting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500/80'}`} />
                    <span className="text-[10px] text-zinc-400">
                      {mode === 'live' ? (isLiveConnecting ? 'Connecting stream…' : isLiveConnected ? (isCameraActive ? 'Voice & Vision Live' : 'Live Voice Active') : 'Live Standby') : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleLiveMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    mode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title="Toggle Gemini Live Voice & Vision"
                >
                  <Radio className={`w-3 h-3 ${mode === 'live' && isLiveConnected ? 'animate-pulse text-emerald-400' : ''}`} />
                  {mode === 'live' ? 'Live Session' : 'Start Live'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Live Voice & Vision View ── */}
            {mode === 'live' ? (
              <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.08) 0%, transparent 70%)' }}>
                <div className="flex flex-col items-center justify-center my-auto space-y-4 text-center w-full">
                  {isCameraActive ? (
                    /* ── AR Viewfinder Camera Screen ── */
                    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl bg-black aspect-video max-h-52">
                      <video ref={videoElementRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      
                      {/* Viewfinder Reticles */}
                      <div className="absolute inset-3 pointer-events-none border border-emerald-500/20 rounded-lg flex flex-col justify-between p-2">
                        <div className="flex justify-between text-emerald-400 font-mono text-[9px] opacity-70">
                          <span>⌜ SCANNING</span>
                          <span>⌝</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-mono text-[9px] opacity-70">
                          <span>⌞</span>
                          <span>1 FPS ⌟</span>
                        </div>
                      </div>

                      {/* Vision Active Pill */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-emerald-300 font-bold tracking-wider uppercase">Tego Eyes Active</span>
                      </div>

                      {/* Quick Flip Button Overlay */}
                      <button
                        type="button"
                        onClick={switchCamera}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                        title="Flip Front / Rear Lens"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* ── Gemstone Orb with Radiant Ripple ── */
                    <div className="relative flex items-center justify-center py-2">
                      <motion.div
                        animate={{
                          scale: isLiveSpeaking ? [1, 1.35, 1] : isLiveConnected ? [1, 1.15, 1] : [1, 1.05, 1],
                          opacity: isLiveSpeaking ? [0.4, 0.75, 0.4] : isLiveConnected ? [0.2, 0.45, 0.2] : [0.1, 0.2, 0.1],
                        }}
                        transition={{ duration: isLiveSpeaking ? 1.4 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute w-36 h-36 rounded-full bg-emerald-500/25 blur-2xl pointer-events-none"
                      />
                      <motion.div
                        animate={{
                          scale: isLiveSpeaking ? [1, 1.06, 1] : [1, 1.02, 1],
                        }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className={`relative w-22 h-22 rounded-3xl overflow-hidden border-2 flex items-center justify-center shadow-2xl transition-all ${
                          isLiveSpeaking
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                            : isLiveConnected
                              ? 'border-emerald-500/40 bg-zinc-900 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                              : 'border-zinc-800 bg-zinc-900/60'
                        }`}
                      >
                        <Image src="/hero_emerald_gemstone.png" alt="Tego Live" fill className="object-cover opacity-85" />
                        <div className="absolute inset-0 bg-emerald-950/20" />
                        <div className="relative z-10">
                          {isLiveSpeaking ? (
                            <Sparkles className="w-8 h-8 text-emerald-300 animate-pulse drop-shadow-lg" />
                          ) : (
                            <Radio className={`w-8 h-8 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">
                      {isLiveSpeaking ? 'Tego is speaking…' : isLiveConnected ? (isCameraActive ? 'Watching & listening… Speak naturally' : 'Listening… Ask anything') : isLiveConnecting ? 'Connecting live stream…' : 'Tap to start'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 max-w-64 mx-auto leading-relaxed">
                      {isLiveConnected ? (isCameraActive ? 'Hold up a menu, dish, screen, or invoice.' : 'Speak freely. Tap "Share Eyes" to show your camera.') : 'Bidirectional real-time Gemini multimodal session.'}
                    </p>
                  </div>

                  {liveTranscripts.length > 0 && (
                    <div className="w-full max-h-24 overflow-y-auto bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-3 text-left space-y-1.5 custom-scrollbar">
                      {liveTranscripts.slice(-4).map((t) => (
                        <div key={t.id} className={`text-[11px] leading-relaxed ${t.role === 'user' ? 'text-zinc-400' : 'text-emerald-400 font-semibold'}`}>
                          <span className="opacity-50 uppercase tracking-widest text-[9px] font-bold">{t.role === 'user' ? 'You ' : 'Tego '}</span>
                          {t.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {liveError && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {liveError}
                    </div>
                  )}
                </div>

                {/* Live Controls Bar */}
                <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/5 mt-1">
                  <button
                    type="button"
                    onClick={() => isCameraActive ? stopCamera() : startCamera()}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isCameraActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {isCameraActive ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    {isCameraActive ? 'Hide Eyes' : 'Share Eyes (Camera)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { stopLiveSession(); setMode('text') }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Session
                  </button>
                </div>
              </div>
            ) : (
              /* ── Text Chat View ── */
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="flex flex-col h-full">
                      {/* Ambient Gemstone Hero Empty State */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 pb-2">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.14, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500/25 blur-xl -translate-x-2 -translate-y-2"
                          />
                          <div className="relative w-16 h-16 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_28px_rgba(16,185,129,0.2)] mx-auto">
                            <Image src="/hero_emerald_gemstone.png" alt="Tego" fill className="object-cover opacity-85" />
                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/20">
                              <Sparkles className="w-6 h-6 text-emerald-300 drop-shadow-md" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">What can I help with?</p>
                          <p className="text-[11px] text-zinc-400 mt-1 max-w-56 mx-auto leading-relaxed">
                            Orders, forecasts, inventory, storefront — chat or tap Live Voice & Eyes.
                          </p>
                        </div>
                      </div>

                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap gap-2 justify-center pb-1">
                        {SUGGESTION_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => { sendMessage({ text: chip }); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-white transition-all group cursor-pointer"
                          >
                            {chip}
                            <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-400" />
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
                              ? 'bg-emerald-600 text-white rounded-tr-sm shadow-[0_4px_16px_rgba(16,185,129,0.25)] font-medium'
                              : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/80 rounded-tl-sm'
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
                      <div className="flex items-center gap-1.5 text-red-400 text-[11px] bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Failed to send. Try again.
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ── Bottom Input & Live Voice / Vision Actions ── */}
                <div className="shrink-0 px-3 py-3 border-t border-white/5 space-y-2"
                  style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
                >
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    {/* Live Camera Eyes Button */}
                    <button
                      type="button"
                      onClick={startLiveVisionAndVoice}
                      title="Activate Tego's Eyes (Live Camera & Multimodal Vision)"
                      className="h-10 px-2.5 sm:px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm group"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline text-[11px] font-bold">Eyes</span>
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus-within:border-emerald-500/50 rounded-2xl px-3 py-2 transition-colors">
                      <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask Tego anything…"
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Live Voice Gemstone Orb Trigger */}
                    <motion.button
                      type="button"
                      onClick={startLiveVoice}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      title="Start Gemini Live Voice Session"
                      className="relative w-10 h-10 rounded-2xl overflow-hidden border border-emerald-500/40 hover:border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer group"
                    >
                      <Image src="/hero_emerald_gemstone.png" alt="Live Voice" fill className="object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-emerald-950/20" />
                      <motion.span
                        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-emerald-400/20 rounded-2xl pointer-events-none"
                      />
                      <Sparkles className="relative z-10 w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </motion.button>
                  </form>

                  <p className="text-center text-[9px] text-zinc-600 tracking-wide">
                    Tap <Eye className="w-2.5 h-2.5 inline text-emerald-400 mb-0.5" /> for Eyes or the <Sparkles className="w-2.5 h-2.5 inline text-emerald-400 mb-0.5" /> Gem for Live Voice.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
