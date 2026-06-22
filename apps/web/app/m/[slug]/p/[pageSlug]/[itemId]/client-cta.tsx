'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import Link from 'next/link'

interface ClientCTAProps {
  item: {
    id: string
    title: string
    price_minor: number | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item_data?: any
  }
  pageInfo: {
    template_type: string
    billing_enabled: boolean
    slug: string
  }
  location: {
    whatsapp_number?: string | null
  }
  isAvailable: boolean
  themeColor: string
  slug: string
}

export function ClientCTA({ item, pageInfo, location, isAvailable, themeColor, slug }: ClientCTAProps) {
  const { addItem } = useCartStore()
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  const variations = item.item_data?.variations as Record<string, string[]> | undefined
  const hasVariations = variations && Object.keys(variations).length > 0
  const allVariantsSelected = hasVariations 
    ? Object.keys(variations).every(k => selectedVariants[k]) 
    : true

  const handleAddToCart = () => {
    if (!allVariantsSelected) return
    
    let variantSuffix = ''
    if (hasVariations) {
      variantSuffix = ' (' + Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ') + ')'
    }

    addItem({
      id: item.id + JSON.stringify(selectedVariants), // Unique ID for this variant combo
      name: item.title + variantSuffix,
      price_minor: item.price_minor || 0,
    })
  }

  if (pageInfo.template_type === 'catalog') {
    if (pageInfo.billing_enabled && item.price_minor) {
      return (
        <div className="space-y-6">
          {hasVariations && (
            <div className="space-y-4">
              {Object.entries(variations).map(([name, options]) => (
                <div key={name}>
                  <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">{name}</label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [name]: opt }))}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedVariants[name] === opt ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable || !allVariantsSelected}
            className="flex items-center justify-center w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a' }}
          >
            {isAvailable ? (allVariantsSelected ? 'Add to Cart' : 'Select Options') : 'Currently Unavailable'}
          </button>
        </div>
      )
    }

    // Fallback to enquire if billing disabled
    return (
      <a
        href={`https://wa.me/${(location.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg"
        style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a', pointerEvents: isAvailable ? 'auto' : 'none', opacity: isAvailable ? 1 : 0.5 }}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
        {isAvailable ? 'Enquire via WhatsApp' : 'Currently Unavailable'}
      </a>
    )
  }

  // Listing template
  if (pageInfo.template_type === 'listing') {
    return (
      <a
        href={`https://wa.me/${(location.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg"
        style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a', pointerEvents: isAvailable ? 'auto' : 'none', opacity: isAvailable ? 1 : 0.5 }}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
        {isAvailable ? 'Enquire via WhatsApp' : 'Currently Unavailable'}
      </a>
    )
  }

  // Booking or Rate Card
  return (
    <Link
      href={`/m/${slug}/p/${pageInfo.slug}`}
      className="flex items-center justify-center w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg"
      style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a' }}
    >
      {isAvailable ? 'Return to Services' : 'Back'}
    </Link>
  )
}
