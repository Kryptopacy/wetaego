'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Mic, Paperclip, Loader2 } from 'lucide-react'
import { VoiceRecorder } from './voice-recorder'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

function GramophoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Box base */}
      <path d="M5 16h14v6H5z" />
      <path d="M5 16l2-3h10l2 3" />
      {/* Horn neck */}
      <path d="M13 13V8s0-2 2-2h1" />
      {/* Horn bell */}
      <path d="M16 6s0-4-3-4-7 3-7 7c0 2 2 3 2 3l5-4" />
      {/* Crank */}
      <path d="M20 18h2v2" />
    </svg>
  )
}

interface IntercomChannel {
  id: string
  name: string
  channel_type: string
}

interface IntercomMessage {
  id: string
  channel_id: string
  user_id: string
  content_text: string | null
  media_url: string | null
  audio_url: string | null
  created_at: string
  sender_profile?: {
    full_name: string | null
  }
}

export function IntercomWidget({ userId, organizationId }: { userId: string, organizationId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [channels, setChannels] = useState<IntercomChannel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<IntercomMessage[]>([])
  
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  // Fetch Channels — managers see all org channels via RLS bypass
  useEffect(() => {
    if (!isOpen || !userId || !organizationId) return

    const loadChannels = async () => {
      // Check if current user is owner/manager
      const { data: memberRow } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      const isManager = memberRow?.role === 'owner' || memberRow?.role === 'manager'

      if (isManager) {
        // Managers see ALL channels in their org (RLS allows this)
        const { data: allChannels } = await supabase
          .from('intercom_channels')
          .select('id, name, type')
          .eq('organization_id', organizationId)
          .order('type', { ascending: true })

        if (allChannels) {
          const mapped: IntercomChannel[] = allChannels.map(c => ({
            id: c.id,
            name: c.name || 'Direct',
            channel_type: c.type,
          }))
          setChannels(mapped)
          if (mapped.length > 0 && !activeChannelId) setActiveChannelId(mapped[0].id)
        }
      } else {
        // Regular staff: only channels they are members of
        const { data: memberData } = await supabase
          .from('intercom_channel_members')
          .select('channel_id, intercom_channels(id, name, type)')
          .eq('user_id', userId)

        if (memberData) {
          const userChannels: IntercomChannel[] = memberData
            .filter(m => m.intercom_channels)
            .map(m => {
              const ch = m.intercom_channels as { id: string; name: string | null; type: string }
              return { id: ch.id, name: ch.name || 'Channel', channel_type: ch.type }
            })
          setChannels(userChannels)
          if (userChannels.length > 0 && !activeChannelId) setActiveChannelId(userChannels[0].id)
        }
      }
    }
    loadChannels()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, organizationId])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  // Fetch Messages & Subscribe
  useEffect(() => {
    if (!activeChannelId) return

    const loadMessages = async () => {
      const { data: msgs } = await supabase
        .from('intercom_messages')
        .select(`
          id, channel_id, user_id, content_text, media_url, audio_url, created_at
        `)
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (msgs) {
        const userIds = Array.from(new Set(msgs.map(m => m.user_id)))
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds)
        
        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name }
          return acc
        }, {} as Record<string, { full_name: string | null }>)

        const formatted = msgs.map(m => ({
          ...m,
          sender_profile: profileMap[m.user_id] || { full_name: 'Unknown' }
        }))
        setMessages(formatted as IntercomMessage[])
        scrollToBottom()
      }
    }
    loadMessages()

    const channel = supabase
      .channel(`intercom:${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intercom_messages',
          filter: `channel_id=eq.${activeChannelId}`
        },
        async (payload) => {
          // Fetch sender profile for the new message
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single()

          const newMsg = {
            ...payload.new,
            sender_profile: profile
          } as IntercomMessage

          setMessages(prev => [...prev, newMsg])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannelId, scrollToBottom])


  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeChannelId) return

    const msg = inputText
    setInputText('')

    await supabase.from('intercom_messages').insert({
      channel_id: activeChannelId,
      user_id: userId,
      content_text: msg
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeChannelId) return

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${organizationId}/${activeChannelId}/${Date.now()}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('intercom_media')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('intercom_media')
        .getPublicUrl(fileName)

      await supabase.from('intercom_messages').insert({
        channel_id: activeChannelId,
        user_id: userId,
        media_url: publicUrl
      })
    } catch (err) {
      console.error('Failed to upload image', err)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleVoiceUpload = async (audioBlob: Blob) => {
    setIsRecording(false)
    if (!activeChannelId) return
    setIsUploading(true)
    try {
      const fileName = `${organizationId}/${activeChannelId}/${Date.now()}.webm`
      
      const { error: uploadError } = await supabase.storage
        .from('intercom_media')
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('intercom_media')
        .getPublicUrl(fileName)

      await supabase.from('intercom_messages').insert({
        channel_id: activeChannelId,
        user_id: userId,
        audio_url: publicUrl
      })
    } catch (err) {
      console.error('Failed to upload voice note', err)
      alert('Failed to upload voice note')
    } finally {
      setIsUploading(false)
    }
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
            className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 h-12 px-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-grab active:cursor-grabbing flex items-center gap-2"
          >
            <GramophoneIcon className="w-5 h-5 pointer-events-none" />
            <span className="font-semibold text-sm pointer-events-none">Staff Intercom</span>
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
            className="fixed bottom-20 md:bottom-6 left-2 md:left-6 z-50 w-full sm:w-[380px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-800 flex justify-between items-center border-b border-zinc-700 cursor-grab active:cursor-grabbing">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  Staff Intercom
                </h3>
                <p className="text-xs text-zinc-400">Internal communication</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-zinc-700 text-zinc-400">
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Channels row */}
            {channels.length > 0 && (
            <div className="flex overflow-x-auto p-2 bg-zinc-800/50 border-b border-zinc-800 no-scrollbar gap-2">
          {channels.map(c => {
            const icon = c.channel_type === 'department' ? '🏢' : c.channel_type === 'direct' ? '💬' : '🌐'
            return (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeChannelId === c.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            No messages yet.
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === userId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-zinc-500">
                    {msg.sender_profile?.full_name || 'Staff'} • {format(new Date(msg.created_at), 'h:mm a')}
                  </span>
                </div>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content_text && <p className="text-sm break-words">{msg.content_text}</p>}
                  {!msg.audio_url && msg.media_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.media_url} alt="Shared image" className="rounded-lg max-h-48 object-cover mt-1" />
                  )}
                  {msg.audio_url && (
                    <audio src={msg.audio_url} controls className="w-full max-w-[200px] h-8 mt-1" />
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-zinc-800 border-t border-zinc-700">
        {isRecording ? (
          <VoiceRecorder 
            onRecordingComplete={handleVoiceUpload}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            
            {inputText.trim() ? (
              <button
                type="submit"
                disabled={isUploading}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                disabled={isUploading}
                className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </form>
        )}
      </div>
    </motion.div>
    )}
    </AnimatePresence>
    </>
  )
}
