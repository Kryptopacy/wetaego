'use client'

import { useState, useMemo, useTransition } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  images?: string[]
  item_data?: Record<string, string>
}

interface ListingRendererProps {
  location: {
    name: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
    whatsapp_number?: string
    phone_number?: string
    currency?: string
  }
  page: {
    id: string
    title: string
    content?: string
    slug?: string
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
}

export function ListingRenderer({ location, page, items, locationSlug }: ListingRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'

  // Dynamic Filters
  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {}
    items.forEach(item => {
      if (item.item_data) {
        Object.entries(item.item_data).forEach(([key, value]) => {
          if (!options[key]) options[key] = new Set()
          options[key].add(value)
        })
      }
    })
    return Object.fromEntries(
      Object.entries(options).map(([k, v]) => [k, Array.from(v).sort()])
    )
  }, [items])

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true // no filter selected for this key
        return item.item_data?.[key] === value
      })
    })
  }, [items, activeFilters])

  const available = filteredItems.filter(i => i.availability_status === 'available')
  const unavailable = filteredItems.filter(i => i.availability_status !== 'available')

  // Lead Capture Modal State
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PageItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
  })

  function handleEnquire(item: PageItem) {
    setSelectedItem(item)
    setShowLeadForm(true)
  }

  function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem || !form.customer_name || !form.customer_phone) return

    startTransition(async () => {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: page.id,
          item_id: selectedItem.id,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email,
          message: `Enquiry about: ${selectedItem.title}`,
        }),
      })

      if (res.ok) {
        setShowLeadForm(false)
        const waLink = `https://wa.me/${(location.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=Hi, I'm ${form.customer_name}. I'm interested in: ${selectedItem.title}`
        window.open(waLink, '_blank')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: (page as any).background_color || undefined }}>
      {/* Hero */}
      <div className="relative w-full h-[35vh] min-h-[240px] max-h-[380px] overflow-hidden">
        {location.cover_image_url ? (
          <Image src={location.cover_image_url} alt={location.name} fill className="object-cover" priority quality={90} sizes="100vw" placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGYiLz48L3N2Zz4=" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          {location.organizations?.logo_url && (
            <div className="relative h-10 w-24 mb-3 drop-shadow-lg">
              <Image src={location.organizations.logo_url} alt="" fill className="object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
          {page.content && <p className="text-white/60 text-sm mt-1 max-w-lg">{page.content}</p>}
          <InfoStrip location={location} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <BackButton className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </BackButton>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6 text-xs text-zinc-500 font-medium">
          <span>{filteredItems.length} properties</span>
          <span>·</span>
          <span className="text-emerald-400">{available.length} available</span>
          {unavailable.length > 0 && <><span>·</span><span>{unavailable.length} unavailable</span></>}
        </div>

        {/* Dynamic Filters */}
        {Object.keys(filterOptions).length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
            {Object.entries(filterOptions).map(([filterKey, options]) => (
              <div key={filterKey} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">{filterKey.replace('_', ' ')}</label>
                <select
                  className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500 min-w-[120px]"
                  value={activeFilters[filterKey] || ''}
                  onChange={e => setActiveFilters(prev => ({ ...prev, [filterKey]: e.target.value }))}
                >
                  <option value="">Any {filterKey.replace('_', ' ')}</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Lead Capture Modal */}
        <AnimatePresence>
        {showLeadForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowLeadForm(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setShowLeadForm(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">✕</button>
              <h2 className="text-xl font-bold text-white mb-1">Enquire about</h2>
              <p className="text-sm text-zinc-400 mb-6">{selectedItem?.title}</p>
              
              <form onSubmit={submitLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Name *</label>
                  <input
                    value={form.customer_name}
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    required
                    placeholder="Full name"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    value={form.customer_phone}
                    onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                    required
                    type="tel"
                    placeholder="Phone number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email (Optional)</label>
                  <input
                    value={form.customer_email}
                    onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || !form.customer_name || !form.customer_phone}
                  className="w-full mt-6 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
                >
                  {isPending ? 'Sending...' : 'Continue to WhatsApp'}
                  {!isPending && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div 
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredItems.map(item => {
            const isAvail = item.availability_status === 'available'
            return (
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={isAvail ? { y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
                key={item.id} 
                className={`rounded-2xl border overflow-hidden transition-all ${isAvail ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'}`}
              >
                <Link href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`} className="block">
                  {item.images?.[0] && (
                    <div className="h-44 relative overflow-hidden bg-zinc-900 border-b border-zinc-800/50">
                      <Image src={item.images[0]} alt={item.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform hover:scale-105 duration-500" />
                      {!isAvail && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full">
                            {item.availability_status === 'sold_out' ? 'Taken' : 'Unavailable'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {!item.images?.[0] && !isAvail && (
                    <div className="px-4 pt-4 -mb-2">
                       <span className="text-xs font-bold text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded">
                         {item.availability_status === 'sold_out' ? 'Taken' : 'Unavailable'}
                       </span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`} className="hover:text-zinc-300 transition-colors">
                      <h3 className="font-bold text-white text-sm leading-tight">{item.title}</h3>
                    </Link>
                    {(item.price_display || item.price_minor) && (
                      <div className="text-right shrink-0">
                        <div className="font-bold text-white text-sm">
                          {item.price_display || (item.price_minor ? formatCurrency(item.price_minor, location.currency || 'NGN') : '')}
                        </div>
                        {!item.price_display && item.price_minor && <div className="text-xs text-zinc-500">/month</div>}
                      </div>
                    )}
                  </div>
                  {item.subtitle && <p className="text-xs text-zinc-500 mb-2">{item.subtitle}</p>}
                  {item.description && <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{item.description}</p>}

                  {/* Spec pills */}
                  {item.item_data && Object.keys(item.item_data).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(item.item_data).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  )}

                  {isAvail && (
                    <button
                      onClick={() => handleEnquire(item)}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}88)` }}
                    >
                      Enquire →
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">No listings found matching your criteria.</div>
        )}

        <div className="mt-12 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>
    </div>
  )
}
