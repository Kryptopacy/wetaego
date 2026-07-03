'use client'

import { useState, useTransition } from 'react'
import { BackButton } from '../../components/back-button'
import { InfoStrip } from '../../components/info-strip'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils/currency'
import { Plus, Minus, Check, ArrowRight, ArrowLeft } from 'lucide-react'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  payment_mode: string
  deposit_percentage?: number
  images?: string[]
  item_data?: Record<string, string>
}

interface QuoteRendererProps {
  location: {
    id: string
    name: string
    organization_id: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
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
}

export function QuoteRenderer({ location, page, items, locationSlug }: QuoteRendererProps) {
  const themeColor = location.theme_color || '#3b82f6'
  const availableItems = items.filter(i => i.availability_status === 'available')
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedItems, setSelectedItems] = useState<{item: PageItem, qty: number}[]>([])
  
  // Step 2: Project Details
  const [projectName, setProjectName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [brief, setBrief] = useState('')
  
  // Step 3: Contact Info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [isPending, startTransition] = useTransition()
  const [formSuccess, setFormSuccess] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')

  function handleToggleItem(item: PageItem) {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.item.id === item.id)
      if (exists) {
        return prev.filter(i => i.item.id !== item.id)
      }
      return [...prev, { item, qty: 1 }]
    })
  }

  function handleUpdateQty(itemId: string, delta: number) {
    setSelectedItems(prev => prev.map(i => {
      if (i.item.id === itemId) {
        const newQty = Math.max(1, i.qty + delta)
        return { ...i, qty: newQty }
      }
      return i
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedItems.length === 0 || !customerName || !customerPhone || !projectName) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('page_id', page.id)
      formData.append('organization_id', location.organization_id)
      formData.append('location_id', location.id)
      
      const payload = {
        lineItems: selectedItems.map(i => ({
          item_id: i.item.id,
          title: i.item.title,
          qty: i.qty,
        })),
        projectName,
        deadline,
        budgetRange,
        brief,
        customerName,
        customerEmail,
        customerPhone,
        companyName
      }
      
      formData.append('quote_data', JSON.stringify(payload))
      
      // We will create this action next
      const { submitQuoteRequest } = await import('@/app/m/[slug]/actions')
      const res = await submitQuoteRequest(formData)
      
      if (res?.data?.success && res?.data?.referenceNumber) {
        setReferenceNumber(res.data.referenceNumber)
        setFormSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  if (formSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-2">Quote Requested</h1>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Thank you for your request. We've received your project details and will prepare a formal quote for you shortly.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <p className="text-sm text-zinc-500 mb-1">Your Reference Number</p>
            <p className="text-2xl font-mono text-white tracking-widest">{referenceNumber}</p>
          </div>
          <div className="p-6">
            <BackButton className="inline-flex w-full justify-center px-6 py-4 rounded-xl font-bold text-white transition-colors" style={{ backgroundColor: themeColor }}>
              Return to Catalog
            </BackButton>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-32">
      {/* Hero */}
      <div className="relative w-full h-[35vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {location.cover_image_url ? (
          <>
            <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}40 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
          {location.organizations?.logo_url && (
            <Image src={location.organizations.logo_url} alt="Logo" width={100} height={48} className="h-12 w-auto object-contain mb-3 drop-shadow-lg" />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
          {page.content && (
            <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">{page.content}</p>
          )}
          <InfoStrip location={location} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s 
                    ? 'bg-white text-black' 
                    : step > s 
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <div className="text-xs font-medium mt-2 text-zinc-500">
                {s === 1 ? 'Services' : s === 2 ? 'Details' : 'Contact'}
              </div>
            </div>
          ))}
        </div>

        {/* STEP 1: Select Services */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Select Services</h2>
              <p className="text-zinc-400 text-sm">Choose the services you need a quote for.</p>
            </div>
            
            <div className="space-y-8">
              {Object.entries(
                availableItems.reduce((acc, item) => {
                  const cat = item.item_data?.category?.trim() || 'Services'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(item)
                  return acc
                }, {} as Record<string, PageItem[]>)
              ).map(([categoryName, categoryItems]) => (
                <div key={categoryName} className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{categoryName}</h3>
                  {categoryItems.map(item => {
                    const isSelected = selectedItems.find(i => i.item.id === item.id)
                    return (
                  <div 
                    key={item.id} 
                    onClick={() => !isSelected && handleToggleItem(item)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-white bg-zinc-900' 
                        : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-white text-lg truncate">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(item.item_data?.price_range || item.price_display || item.price_minor) && (
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800/50 text-xs font-medium text-zinc-300">
                              {item.item_data?.price_range || item.price_display || (item.price_minor ? formatCurrency(item.price_minor, location.currency || 'NGN') : '')}
                              {item.item_data?.unit ? ` ${item.item_data.unit}` : ''}
                            </div>
                          )}
                          {item.item_data?.turnaround && (
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800/50 text-xs font-medium text-zinc-400">
                              ⏱ {item.item_data.turnaround}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-end justify-between h-full">
                        {isSelected ? (
                          <div className="flex items-center gap-3 bg-zinc-950 rounded-xl p-1 border border-zinc-800" onClick={e => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={() => {
                                if (isSelected.qty === 1) handleToggleItem(item)
                                else handleUpdateQty(item.id, -1)
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-4 text-center font-bold text-sm">{isSelected.qty}</span>
                            <button 
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-zinc-700" />
                        )}
                      </div>
                    </div>
                    </div>
                  )
                })}
              </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Project Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setStep(1)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Project Details</h2>
                <p className="text-zinc-400 text-sm">Tell us about your requirements.</p>
              </div>
            </div>

            <div className="space-y-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Project Name / Title <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Office Renovation, New Website"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Target Deadline</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Budget Range (Optional)</label>
                  <select 
                    value={budgetRange}
                    onChange={e => setBudgetRange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
                  >
                    <option value="">Select range...</option>
                    <option value="under_500k">Under ₦500,000</option>
                    <option value="500k_1m">₦500k - ₦1M</option>
                    <option value="1m_5m">₦1M - ₦5M</option>
                    <option value="5m_plus">₦5M+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Project Brief & Notes</label>
                <textarea 
                  rows={4}
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Describe your requirements in detail. We'll ask for any files or documents if needed after reviewing."
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Contact Info */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setStep(2)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Your Details</h2>
                <p className="text-zinc-400 text-sm">Where should we send the quote?</p>
              </div>
            </div>

            <form id="quoteForm" onSubmit={handleSubmit} className="space-y-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address <span className="text-red-400">*</span></label>
                  <input 
                    type="email" 
                    required
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number <span className="text-red-400">*</span></label>
                  <input 
                    type="tel" 
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    placeholder="+234..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Company / Organization (Optional)</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  placeholder="Acme Corp"
                />
              </div>
            </form>
          </motion.div>
        )}

      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50 pointer-events-none">
        <div className="max-w-2xl mx-auto flex gap-4 pointer-events-auto">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: themeColor }}
            >
              Continue to Details
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={!projectName.trim()}
              className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: themeColor }}
            >
              Continue to Contact
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {step === 3 && (
            <button
              form="quoteForm"
              type="submit"
              disabled={isPending || !customerName.trim() || !customerPhone.trim()}
              className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: themeColor }}
            >
              {isPending ? 'Submitting...' : 'Request Quote'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
