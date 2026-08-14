'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, MessageSquare, CheckCircle2, Clock, Volume2, VolumeX,
  Send, Plus, Shield, ChefHat, Sparkles, Hash, Search, ShoppingBag,
  Hotel, Scissors, Stethoscope, Store, Building2, UserCheck, Bot
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAudioAlert } from '@/lib/hooks/use-audio'

export interface CustomerRequest {
  id: string
  location_id: string
  table_identifier: string
  request_type: string
  custom_message?: string | null
  status: 'pending' | 'acknowledged' | 'resolved'
  priority?: string | null
  urgency_score?: number | null
  created_at: string
  updated_at?: string
  ai_summary?: string | null
  complaint_details?: string | null
}

export interface Channel {
  id: string
  name: string | null
  type: string
  organization_id: string
}

export interface StaffMessage {
  id: string
  channel_id: string
  user_id: string
  content_text?: string | null
  media_url?: string | null
  audio_url?: string | null
  created_at: string
  sender_name?: string
  sender_role?: string
}

export interface StaffMember {
  userId: string
  role: string
  department: string
  name: string
  email: string
}

interface IntercomHubProps {
  userId: string
  userRole: string
  userDepartment: string
  organizationId: string
  businessType: string
  aiName: string
  activeLocation: { id: string; name: string; slug: string } | null
  locations: { id: string; name: string; slug: string }[]
  initialCustomerRequests: CustomerRequest[]
  initialChannels: Channel[]
  suggestedChannels?: string[]
  staffList: StaffMember[]
}

export function IntercomHub({
  userId,
  userRole,
  userDepartment,
  organizationId,
  businessType,
  aiName,
  activeLocation,
  locations,
  initialCustomerRequests,
  initialChannels,
  suggestedChannels = [],
  staffList
}: IntercomHubProps) {
  const supabase = createClient()
  const { playChime } = useAudioAlert()

  const [activeTab, setActiveTab] = useState<'customer' | 'staff'>('customer')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // ── Customer Intercom State ──
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>(initialCustomerRequests)
  const [customerFilter, setCustomerFilter] = useState<'all' | 'pending' | 'acknowledged'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Staff Intercom State ──
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannels[0]?.id || '')
  const [messages, setMessages] = useState<StaffMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // ── Realtime: Customer Service Requests ──
  useEffect(() => {
    if (!activeLocation?.id) return

    const channelName = `customer-intercom-${activeLocation.id}-${Math.random().toString(36).slice(2, 7)}`
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `location_id=eq.${activeLocation.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as CustomerRequest
            setCustomerRequests(prev => [newReq, ...prev])
            if (soundEnabled) playChime()
            toast.info(`🔔 ${newReq.table_identifier || 'Guest'}: ${newReq.request_type || 'Assistance Needed'}`)
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CustomerRequest
            setCustomerRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
          } else if (payload.eventType === 'DELETE') {
            setCustomerRequests(prev => prev.filter(r => r.id === payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [activeLocation?.id, supabase, soundEnabled, playChime])

  // ── Realtime: Staff Messages for Active Channel ──
  useEffect(() => {
    if (!activeChannelId) return

    // Fetch initial messages for active channel
    const fetchChannelMessages = async () => {
      const { data } = await supabase
        .from('intercom_messages')
        .select('*')
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        const mapped = data.map(m => {
          const sender = staffList.find(s => s.userId === m.user_id)
          return {
            ...m,
            sender_name: sender?.name || (m.user_id === userId ? 'You' : 'Staff Member'),
            sender_role: sender?.role || 'staff'
          }
        })
        setMessages(mapped)
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    fetchChannelMessages()

    const channelSubName = `staff-messages-${activeChannelId}-${Math.random().toString(36).slice(2, 7)}`
    const sub = supabase
      .channel(channelSubName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'intercom_messages', filter: `channel_id=eq.${activeChannelId}` },
        (payload) => {
          const newMsg = payload.new as StaffMessage
          const sender = staffList.find(s => s.userId === newMsg.user_id)
          const fullMsg: StaffMessage = {
            ...newMsg,
            sender_name: sender?.name || (newMsg.user_id === userId ? 'You' : 'Staff Member'),
            sender_role: sender?.role || 'staff'
          }
          setMessages(prev => [...prev, fullMsg])
          if (soundEnabled && newMsg.user_id !== userId) playChime()
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [activeChannelId, supabase, soundEnabled, playChime, staffList, userId])

  // ── Customer Action Handlers ──
  const updateCustomerStatus = async (id: string, newStatus: 'pending' | 'acknowledged' | 'resolved') => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setCustomerRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      toast.success(`Request marked as ${newStatus}`)
    }
  }

  // ── Staff Message Send Handler ──
  const sendStaffMessage = async (textToSend?: string) => {
    const content = textToSend || messageInput
    if (!content.trim() || !activeChannelId) return

    setMessageInput('')
    const { error } = await supabase.from('intercom_messages').insert({
      channel_id: activeChannelId,
      user_id: userId,
      content_text: content.trim()
    })

    if (error) {
      toast.error('Failed to send message')
    }
  }

  // ── Create Custom Channel Handler ──
  const createChannel = async () => {
    if (!newChannelName.trim()) return
    const cleanName = newChannelName.toLowerCase().replace(/[^a-z0-9-]/g, '')
    
    const { data: newCh, error } = await supabase
      .from('intercom_channels')
      .insert({
        organization_id: organizationId,
        type: 'custom',
        name: cleanName
      })
      .select('id, name, type, organization_id')
      .single()

    if (error || !newCh) {
      toast.error('Failed to create channel')
    } else {
      await supabase.from('intercom_channel_members').insert({
        channel_id: newCh.id,
        user_id: userId
      })
      setChannels(prev => [...prev, newCh])
      setActiveChannelId(newCh.id)
      setIsCreatingChannel(false)
      setNewChannelName('')
      toast.success(`Channel #${cleanName} created!`)
    }
  }

  const createQuickChannel = async (name: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
    const existing = channels.find(c => c.name?.toLowerCase() === cleanName)
    if (existing) {
      setActiveChannelId(existing.id)
      return
    }

    const { data: newCh, error } = await supabase
      .from('intercom_channels')
      .insert({
        organization_id: organizationId,
        type: 'custom',
        name: cleanName
      })
      .select('id, name, type, organization_id')
      .single()

    if (error || !newCh) {
      toast.error(`Failed to create #${cleanName}`)
    } else {
      await supabase.from('intercom_channel_members').insert({
        channel_id: newCh.id,
        user_id: userId
      })
      setChannels(prev => [...prev, newCh])
      setActiveChannelId(newCh.id)
      toast.success(`Channel #${cleanName} added!`)
    }
  }

  // Filtered customer requests
  const filteredCustomerRequests = customerRequests.filter(r => {
    if (customerFilter === 'pending' && r.status !== 'pending') return false
    if (customerFilter === 'acknowledged' && r.status !== 'acknowledged') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTable = r.table_identifier?.toLowerCase().includes(q)
      const matchMsg = r.custom_message?.toLowerCase().includes(q) || r.request_type?.toLowerCase().includes(q)
      return matchTable || matchMsg
    }
    return true
  })

  const pendingCount = customerRequests.filter(r => r.status === 'pending').length

  // Tailored canned responses based on industry type
  const getCannedReplies = () => {
    if (['supermarket', 'grocery', 'retail'].includes(businessType)) {
      return [
        'Checking item in stock',
        'Staff dispatched to aisle',
        'Assisting at checkout register',
        'Price verified',
        'Need backup at cashier'
      ]
    }
    if (['salon', 'spa', 'barbershop', 'wellness'].includes(businessType)) {
      return [
        'Stylist ready for consultation',
        'Appointment verified',
        'Assisting at reception',
        'Please have a seat',
        'Treatment room ready'
      ]
    }
    if (['hotel', 'shortlet', 'hospitality'].includes(businessType)) {
      return [
        'Front desk acknowledged',
        'Housekeeping dispatched',
        'Room service on its way',
        'Keycard / Access resolved',
        'Concierge assisting'
      ]
    }
    if (['clinic', 'pharmacy', 'healthcare'].includes(businessType)) {
      return [
        'Triage nurse notified',
        'Prescription being verified',
        'Doctor is reviewing your file',
        'Reception acknowledged'
      ]
    }
    return [
      'Assisting you immediately',
      'Request acknowledged',
      'Dispatched staff member',
      'On my way',
      'Order ready for pickup'
    ]
  }

  const quickCannedReplies = getCannedReplies()

  const getBusinessIcon = () => {
    if (['supermarket', 'grocery', 'retail'].includes(businessType)) return <ShoppingBag className="w-5 h-5 text-emerald-400" />
    if (['salon', 'spa', 'barbershop'].includes(businessType)) return <Scissors className="w-5 h-5 text-pink-400" />
    if (['hotel', 'hospitality', 'shortlet'].includes(businessType)) return <Hotel className="w-5 h-5 text-amber-400" />
    if (['clinic', 'pharmacy', 'healthcare'].includes(businessType)) return <Stethoscope className="w-5 h-5 text-cyan-400" />
    if (['restaurant', 'cafe', 'bar', 'bakery'].includes(businessType)) return <ChefHat className="w-5 h-5 text-orange-400" />
    return <Building2 className="w-5 h-5 text-emerald-400" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-800/80 border border-zinc-700/60 rounded-xl">
            {getBusinessIcon()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              Intercom Hub
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {businessType}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-light mt-0.5 flex items-center gap-1.5">
              <span>{activeLocation ? activeLocation.name : 'Global'}</span>
              <span>•</span>
              <span className="text-emerald-400/90 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> {aiName} 1st-responder active
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              toast.info(soundEnabled ? 'Chime muted' : 'Chime enabled')
            }}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
            }`}
            title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Master Switcher */}
          <div className="inline-flex p-1 bg-black/60 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'customer'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Customer Intercom
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'staff'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Hash className="w-4 h-4" />
              Staff Intercom
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab 1: Customer Intercom ── */}
      {activeTab === 'customer' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCustomerFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  customerFilter === 'all'
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All Inquiries ({customerRequests.length})
              </button>
              <button
                onClick={() => setCustomerFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  customerFilter === 'pending'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Pending ({customerRequests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setCustomerFilter('acknowledged')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  customerFilter === 'acknowledged'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Acknowledged ({customerRequests.filter(r => r.status === 'acknowledged').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search guest, station, table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customer Request Cards Feed */}
          {filteredCustomerRequests.length === 0 ? (
            <div className="py-16 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">All Clear! No Active Guest Inquiries</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 font-light">
                {aiName} is handling initial customer queries. Any human assistance requests or escalations will flash here immediately.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomerRequests.map((req) => {
                const isPendingReq = req.status === 'pending'
                const isAck = req.status === 'acknowledged'

                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      isPendingReq
                        ? 'bg-rose-950/15 border-rose-500/40 shadow-lg shadow-rose-950/20'
                        : isAck
                        ? 'bg-amber-950/15 border-amber-500/40 shadow-md'
                        : 'bg-zinc-900/40 border-zinc-800'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white bg-black/60 border border-zinc-800 px-2.5 py-1 rounded-xl">
                            {req.table_identifier ? req.table_identifier.toUpperCase() : 'GUEST INQUIRY'}
                          </span>
                          {req.priority === 'urgent' && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isPendingReq
                            ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse'
                            : isAck
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Request Content */}
                      <div className="space-y-1.5 mb-4">
                        <h4 className="text-sm font-bold text-white capitalize">
                          {req.request_type?.replace(/_/g, ' ') || 'Assistance Request'}
                        </h4>
                        {req.custom_message && (
                          <p className="text-xs text-zinc-300 font-light bg-black/30 p-2.5 rounded-xl border border-zinc-800/80">
                            &ldquo;{req.custom_message}&rdquo;
                          </p>
                        )}
                        {req.ai_summary && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{aiName}: {req.ai_summary}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Timestamps & Actions */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{req.urgency_score ? `Urgency: ${req.urgency_score}` : ''}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPendingReq && (
                          <button
                            onClick={() => updateCustomerStatus(req.id, 'acknowledged')}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}

                        <button
                          onClick={() => updateCustomerStatus(req.id, 'resolved')}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                            isPendingReq
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                          }`}
                        >
                          ✓ Resolve
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Staff Intercom ── */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-160 bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden">
          {/* Channels & Direct Staff Sidebar */}
          <div className="lg:col-span-4 border-r border-zinc-800/80 p-4 flex flex-col justify-between bg-zinc-900/40">
            <div className="space-y-6 overflow-y-auto custom-scrollbar">
              {/* Department & Group Channels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Channels</span>
                  <button
                    onClick={() => setIsCreatingChannel(!isCreatingChannel)}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isCreatingChannel && (
                  <div className="p-2 mb-2 bg-black/60 border border-zinc-800 rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. inventory-team"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setIsCreatingChannel(false)}
                        className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createChannel}
                        className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500 text-black rounded-lg"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {channels.map((c) => {
                    const isSelected = activeChannelId === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveChannelId(c.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 opacity-60" />
                          <span>{c.name}</span>
                        </div>
                        {c.name === 'management' && <Shield className="w-3 h-3 text-purple-400" />}
                      </button>
                    )
                  })}
                </div>

                {suggestedChannels.filter(s => !channels.some(c => c.name?.toLowerCase() === s.toLowerCase())).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 font-bold block mb-1.5 uppercase tracking-wider">
                      Quick Add Departments
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {suggestedChannels
                        .filter(s => !channels.some(c => c.name?.toLowerCase() === s.toLowerCase()))
                        .map((sug) => (
                          <button
                            key={sug}
                            onClick={() => createQuickChannel(sug)}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 border border-zinc-700/50 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> #{sug}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Team Members List */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">Team Members ({staffList.length})</span>
                <div className="space-y-1.5">
                  {staffList.map((staff) => (
                    <div key={staff.userId} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/20 border border-zinc-800/40 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-zinc-200 truncate font-medium">{staff.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">{staff.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Your Role: <strong className="text-zinc-300 capitalize">{userRole}</strong></span>
              <span>Dept: <strong className="text-zinc-300">{userDepartment}</strong></span>
            </div>
          </div>

          {/* Chat Feed Window */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full bg-zinc-950/40 p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  #{channels.find(c => c.id === activeChannelId)?.name || 'channel'}
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">Live Team Stream</span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No messages yet in this channel. Send a quick update below!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.user_id === userId
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-zinc-400">{m.sender_name}</span>
                        {m.sender_role && (
                          <span className="text-[9px] font-mono text-zinc-500 uppercase px-1 rounded bg-zinc-800">
                            {m.sender_role}
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-600 font-mono">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs max-w-md ${
                        isMine 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-md' 
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                      }`}>
                        {m.content_text}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Canned Suggestions */}
            <div className="py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
              {quickCannedReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendStaffMessage(reply)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[11px] font-medium whitespace-nowrap transition-colors"
                >
                  + {reply}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendStaffMessage()
              }}
              className="flex items-center gap-2 pt-2 border-t border-zinc-800/80"
            >
              <input
                type="text"
                placeholder={`Message #${channels.find(c => c.id === activeChannelId)?.name || 'channel'}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
