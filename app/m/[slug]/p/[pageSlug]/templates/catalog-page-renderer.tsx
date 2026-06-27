'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { motion } from 'framer-motion'
import { CartFAB } from '../../../cart-fab'
import { formatCurrency } from '@/lib/utils/currency'

// The catalog page renderer is a light version for pages created via the pages builder
// (NOT the main /m/[slug] menu — that stays as is).
// Used for: retail stores, phone shops, boutiques, secondary menu pages, etc.

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  item_data?: { category?: string }
}

interface CatalogPageRendererProps {
  location: {
    id: string
    organization_id: string
    name: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
    currency?: string
    whatsapp_number?: string
    phone_number?: string
    delivery_enabled?: boolean | null
    delivery_fee_minor?: number | null
    delivery_minimum_order_minor?: number | null
    delivery_note?: string | null
    fulfillment_location_label?: string | null
  }
  page: {
    id: string
    title: string
    content?: string
    billing_enabled?: boolean
    billing_mode?: string
    template_data?: Record<string, unknown>
  }
  paymentIsLive?: boolean
  items: PageItem[]
  locationSlug: string
  referralSource?: string
}

const AVAILABILITY_STYLES: Record<string, string> = {
  available: 'text-emerald-400',
  sold_out: 'text-red-400',
  coming_soon: 'text-blue-400',
  unavailable: 'text-zinc-500',
}

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'In Stock',
  sold_out: 'Sold Out',
  coming_soon: 'Coming Soon',
  unavailable: 'Unavailable',
}

export function CatalogPageRenderer({ location, page, items, locationSlug, paymentIsLive }: CatalogPageRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const { addItem } = useCartStore()

  // Group by category if any items have one
  const categories = [...new Set(items.map(i => i.item_data?.category).filter(Boolean) as string[])]
  const hasCategories = categories.length > 0

  const groupedItems = hasCategories
    ? Object.fromEntries(categories.map(cat => [cat, items.filter(i => i.item_data?.category === cat)]))
    : { all: items }

  const uncategorized = hasCategories ? items.filter(i => !i.item_data?.category) : []

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full min-h-[32vh] md:max-h-[340px] flex flex-col justify-end overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30, #0a0a0f)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
        <div className="relative z-10 w-full p-5 pt-[calc(env(safe-area-inset-top,24px)+40px)] max-w-4xl mx-auto flex flex-col justify-end mt-auto">
          {location.organizations?.logo_url && (
            <div className="relative h-10 w-24 mb-3 drop-shadow-lg">
              <Image src={location.organizations.logo_url} alt="Logo" fill sizes="96px" className="object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-black text-white">{page.title}</h1>
          {page.content && <p className="text-white/60 text-sm mt-1">{page.content}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </Link>

        {/* Category tabs if grouped */}
        {hasCategories && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <a key={cat} href={`#${cat}`} className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-colors capitalize">
                {cat}
              </a>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([cat, catItems]) => (
            <div key={cat} id={cat}>
              {hasCategories && cat !== 'all' && (
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 capitalize">{cat}</h2>
              )}
              <motion.div 
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {catItems.map(item => {
                  const isAvail = item.availability_status === 'available'
                  return (
                    <motion.div 
                      variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                      whileHover={isAvail ? { scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
                      key={item.id} 
                      className={`rounded-2xl border p-4 transition-all ${isAvail ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 backdrop-blur-sm' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm">{item.title}</h3>
                          {item.subtitle && <p className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</p>}
                          {item.description && <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>}
                          <span className={`text-xs font-bold mt-2 block ${AVAILABILITY_STYLES[item.availability_status] || 'text-zinc-500'}`}>
                            {AVAILABILITY_LABELS[item.availability_status] || item.availability_status}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          {item.price_display ? (
                            <div className="font-bold text-white text-sm">{item.price_display}</div>
                          ) : item.price_minor ? (
                            <div className="font-bold text-white text-sm">{formatCurrency(item.price_minor, location.currency || 'NGN')}</div>
                          ) : null}
                        </div>
                      </div>

                      {isAvail && page.billing_enabled && item.price_minor ? (
                        <button
                          onClick={() => addItem({
                            id: item.id,
                            name: item.title,
                            price_minor: item.price_minor || 0
                          })}
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}88)` }}
                        >
                          Add to Cart
                        </button>
                      ) : isAvail && location.whatsapp_number ? (
                        <a
                          href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white/90 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          Enquire
                        </a>
                      ) : null}
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          ))}

          {uncategorized.length > 0 && hasCategories && (
            <div>
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Other</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uncategorized.map(item => (
                  <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-white text-sm">{item.title}</h3>
                      {item.price_minor && <span className="font-bold text-white text-sm">{formatCurrency(item.price_minor, location.currency || 'NGN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">No items yet.</div>
        )}

        <div className="mt-12 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>

      {page.billing_enabled && (
        <CartFAB 
          organizationId={location.organization_id}
          locationId={location.id}
          paymentIsLive={paymentIsLive}
          templateType="catalog"
          menuItems={items.map(i => ({ id: i.id, name: i.title, price_minor: i.price_minor || 0 }))}
          hideAddressField={page.template_data?.hide_delivery === true}
          deliveryEnabled={location.delivery_enabled ?? false}
          deliveryFeeMinor={location.delivery_fee_minor ?? 0}
          deliveryMinimumOrderMinor={location.delivery_minimum_order_minor ?? 0}
          deliveryNote={location.delivery_note ?? ''}
          fulfillmentLocationLabel={location.fulfillment_location_label ?? ''}
          pageId={page.id}
          refundPolicy={page.template_data?.refund_policy as string | undefined}
          pageFulfillmentOptions={
            page.template_data?.fulfillment_options as { pickup: boolean, delivery: boolean, table: boolean } | undefined
          }
          pageBillingMode={page.billing_mode}
        />
      )}
    </div>
  )
}
