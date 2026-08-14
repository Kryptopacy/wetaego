'use client'

import { useState, useTransition } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X, Mail, ArrowRight, Search } from 'lucide-react'

// Simple SVG Icons for Socials
const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
)
const Twitter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
)
const Facebook = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)
const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
)
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { useTheme } from '../../../theme-injector'

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black" style={{ backgroundColor: page.background_color || undefined }}>
      
      <div className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-8">
        <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </BackButton>
      </div>

      {/* 1. HERO SECTION */}
      <header className="relative pt-32 pb-16 px-6 md:px-12 max-w-5xl mx-auto flex flex-col items-center text-center">
        {location.organizations?.logo_url ? (
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-2xl mb-8">
            <Image 
              src={location.organizations.logo_url} 
              alt={location.name} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 128px, 160px"
              priority
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-8 shadow-xl">
            <span className="text-3xl font-black text-zinc-500">{location.name.charAt(0)}</span>
          </div>
        )}

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
          {location.name}
        </h1>
        
        {page.content && (
          <div className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed mb-8 whitespace-pre-wrap">
            {page.content}
          </div>
        )}

        {/* Socials */}
        <div className="flex items-center gap-4 justify-center mb-8">
          {location.instagram_handle && (
            <a href={`https://instagram.com/${location.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {location.twitter_handle && (
            <a href={`https://twitter.com/${location.twitter_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          )}
          {location.facebook_handle && (
            <a href={`https://facebook.com/${location.facebook_handle}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
          )}
        </div>
        
        <InfoStrip location={location as { name: string, organizations?: { logo_url?: string } | null, whatsapp_number?: string | null, phone_number?: string | null, instagram_handle?: string | null, x_handle?: string | null, tiktok_handle?: string | null, currency?: string | null }} />
      </header>

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
                        <Github className="w-4 h-4" /> View Source
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
