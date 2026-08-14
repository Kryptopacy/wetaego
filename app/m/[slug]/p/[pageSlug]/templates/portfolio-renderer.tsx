'use client'

import { useState, useTransition } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X, Mail, ArrowRight, Search, Sparkles, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { useTheme } from '../../../theme-injector'
import { StorefrontHero } from '../../../components/storefront-hero'
import { EmptyState } from '@/components/ui/empty-state'

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

interface PortfolioRendererProps {
  location: {
    name: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
    whatsapp_number?: string
    phone_number?: string
    instagram_handle?: string
    twitter_handle?: string
    facebook_handle?: string
    x_handle?: string
    tiktok_handle?: string
    currency?: string
  }
  page: {
    id: string
    title: string
    content?: string
    slug?: string
    background_color?: string
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
}

export function PortfolioRenderer({ location, page, items, locationSlug }: PortfolioRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const [selectedItem, setSelectedItem] = useState<PageItem | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const { tokens } = useTheme()
  const layoutMode = tokens.layout_mode || 'masonry'
  
  const searchedItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || 
           item.subtitle?.toLowerCase().includes(query) ||
           item.description?.toLowerCase().includes(query) ||
           item.item_data?.category?.toLowerCase().includes(query);
  });

  // Separate projects (free/display) from services (paid)
  const projects = searchedItems.filter(i => !i.price_minor || i.price_minor === 0)
  const services = searchedItems.filter(i => i.price_minor && i.price_minor > 0)

  // Inquiries state
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  
  function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.message) return

    startTransition(async () => {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: page.id,
          location_slug: locationSlug,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          message: form.message,
        })
      })

      if (!res.ok) {
        toast.error('Failed to send message. Please try again.')
        return
      }

      toast.success("Message sent! I'll get back to you soon.")
      setForm({ name: '', email: '', phone: '', message: '' })
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white selection:bg-white selection:text-black" style={{ backgroundColor: page.background_color || undefined }}>
      {/* Universal Luxury Hero */}
      <StorefrontHero
        title={page.title || location.name}
        subtitle={page.content}
        badge={{ text: '✨ Creative Portfolio' }}
        coverImageUrl={location.cover_image_url}
        businessTypePreset="portfolio"
        templateType="portfolio"
        logoUrl={location.organizations?.logo_url}
        themeColor={themeColor}
        location={location}
        maxContentWidth="max-w-5xl"
      />

      <div className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-8">
        <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </BackButton>
      </div>

      <main className="max-w-6xl mx-auto px-6 md:px-12 pb-24">
        
        {/* Search Bar */}
        <div className="mb-12 relative group max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, services..."
            className="w-full pl-12 pr-12 py-3.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-500 shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* 2. PROJECTS (MASONRY GRID) */}
        {projects.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Selected Work</h2>
            </div>
            
            <div className={
              layoutMode === 'list' ? 'space-y-6' :
              layoutMode === 'bento_grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
              'columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6' // masonry
            }>
              {projects.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`cursor-pointer group ${layoutMode === 'masonry' ? 'break-inside-avoid' : ''} ${(layoutMode === 'bento_grid' && idx === 0 && projects.length > 1) ? 'md:col-span-2' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-4 ring-1 ring-black/5 dark:ring-white/10">
                    {item.images && item.images.length > 0 ? (
                      <div className="relative aspect-4/5 sm:aspect-4/3 md:aspect-auto">
                        <Image 
                          src={item.images[0]} 
                          alt={item.title} 
                          width={600} 
                          height={800} 
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-6 text-center">
                        <span className="text-zinc-400 font-medium">{item.title}</span>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                      <span className="px-6 py-3 bg-white text-black rounded-full font-semibold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        View Project <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <h3 className="text-lg font-bold tracking-tight mb-1">{item.title}</h3>
                    {item.subtitle && <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{item.subtitle}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 3. SERVICES (MONETIZATION) */}
        {services.length > 0 && (
          <section className="mb-24">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-10">Services</h2>
            <div className={
              layoutMode === 'list' ? 'space-y-6' :
              layoutMode === 'masonry' ? 'columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6' :
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' // bento
            }>
              {services.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col h-full ${layoutMode === 'masonry' ? 'break-inside-avoid' : ''} ${(layoutMode === 'bento_grid' && idx === 0 && services.length > 1) ? 'md:col-span-2' : ''}`}
                >
                  {item.images?.[0] && (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm grow mb-6 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl font-black" style={{ color: themeColor }}>
                      {formatCurrency(item.price_minor || 0, location.currency || 'USD')}
                    </span>
                    
                    {/* Note: In a full implementation, this links to the unified Cart/Checkout page for this ecosystem. */}
                    <Link 
                      href={`/m/${locationSlug}/checkout?item=${item.id}`} 
                      className="px-6 py-3 rounded-full text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book Now
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {searchedItems.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title={searchQuery ? "No Matching Projects" : "Portfolio in Preparation"}
            description={searchQuery ? `No projects found matching "${searchQuery}".` : "Selected works and services will be showcased here once published."}
            className="my-12"
          />
        )}

        {/* 4. CONTACT SECTION */}
        <section className="max-w-2xl mx-auto text-center bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-2xl border border-zinc-100 dark:border-zinc-800">
          <Mail className="w-10 h-10 mx-auto mb-6 text-zinc-400" />
          <h2 className="text-3xl font-black tracking-tight mb-4">Let's Work Together</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
            Interested in collaborating? Drop me a message below.
          </p>
          
          <form onSubmit={submitLead} className="flex flex-col gap-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input 
                type="text" 
                required
                placeholder="Your Name" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:outline-none"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input 
                type="email" 
                required
                placeholder="Your Email" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:outline-none"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              <input 
                type="tel" 
                required
                placeholder="Your Phone Number" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:outline-none"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <textarea 
              required
              placeholder="Tell me about your project..." 
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:outline-none resize-none"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 disabled:opacity-70 mt-2"
              style={{ backgroundColor: themeColor }}
            >
              {isPending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

      </main>

      {/* 5. PROJECT DRAWER (MODAL) */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl z-101 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedItem.title}</h3>
                  {selectedItem.subtitle && <p className="text-zinc-500 font-medium">{selectedItem.subtitle}</p>}
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="grow overflow-y-auto p-6 md:p-8">
                {/* Images */}
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {selectedItem.images.map((img, i) => (
                      <div key={i} className="relative w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image 
                          src={img} 
                          alt={`${selectedItem.title} - Image ${i + 1}`}
                          width={1200}
                          height={800}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Description */}
                {selectedItem.description && (
                  <div className="prose prose-zinc dark:prose-invert max-w-none mb-8 whitespace-pre-wrap">
                    {selectedItem.description}
                  </div>
                )}

                {/* Meta / Links */}
                {selectedItem.item_data && (
                  <div className="flex flex-wrap gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    {selectedItem.item_data.skills && (
                      <div className="w-full flex flex-wrap gap-2 mb-4">
                        {selectedItem.item_data.skills.split(',').map(s => (
                          <span key={s} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedItem.item_data.github_url && (
                      <a href={selectedItem.item_data.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-sm hover:scale-105 transition-transform">
                        <Code2 className="w-4 h-4" /> View Source
                      </a>
                    )}
                    {selectedItem.item_data.live_url && (
                      <a href={selectedItem.item_data.live_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm hover:scale-105 transition-transform" style={{ backgroundColor: themeColor }}>
                        <ExternalLink className="w-4 h-4" /> Live Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
