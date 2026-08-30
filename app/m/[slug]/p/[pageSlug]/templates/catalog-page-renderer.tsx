'use client'

import { useState, Fragment } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { motion } from 'framer-motion'
import { CartFAB } from '../../../cart-fab'
import { VariantSelector } from '@/components/variant-selector'
import { formatCurrency } from '@/lib/utils/currency'
import { Search, X, ShoppingBag } from 'lucide-react'
import { getConditionBadgeStyles } from '@/lib/utils/condition-badges'
import { PartnerShowcaseCard } from '@/components/native-ad-card'
import { useTheme } from '../../../theme-injector'
import { StorefrontHero } from '../../../components/storefront-hero'
import { EmptyState } from '@/components/ui/empty-state'
import { ItemImagePlaceholder } from '@/components/ui/item-placeholder'

// The catalog page renderer is a light version for pages created via the pages builder
// (NOT the main /m/[slug] menu — that stays as is).
// Used for: retail stores, phone shops, boutiques, secondary menu pages, etc.

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  original_price_minor?: number
  price_display?: string
  availability_status: string
  images?: string[]
  item_data?: {
    category?: string
    variants?: { name: string; options: string[]; required: boolean }[]
  }
  is_upsell_eligible?: boolean
}

interface CatalogPageRendererProps {
  location: {
    id: string
    organization_id: string
    name: string
    portal_display_name?: string
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
    business_type_preset?: string
    global_discount_enabled?: boolean
    global_discount_percentage?: number
    global_discount_banner_text?: string
  }
  paymentIsLive?: boolean
  items: PageItem[]
  locationSlug: string
  referralSource?: string
  sponsoredAds?: { id: string; title: string; category: string; image_url: string; target_link: string }[]
  tableIdentifier?: string
  upsellMode?: string
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

export function CatalogPageRenderer({ location, page, items, locationSlug, paymentIsLive, sponsoredAds, tableIdentifier, upsellMode }: CatalogPageRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const { addItem } = useCartStore()
  const [variantItem, setVariantItem] = useState<PageItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  
  const { tokens } = useTheme()
  const layoutMode = tokens.layout_mode || 'bento_grid' // Default to bento grid for catalogs usually, or fallback
  
  function handleAddToCart(item: PageItem) {
    const variants = item.item_data?.variants
    if (variants && variants.length > 0) {
      setVariantItem(item)
    } else {
      addItem({ id: item.id, cartKey: item.id, name: item.title, price_minor: item.price_minor || 0, pageId: page.id })
    }
  }

  function handleVariantConfirm(selections: Record<string, string>, cartKey: string, label: string) {
    if (!variantItem) return
    addItem({
      id: variantItem.id,
      cartKey,
      name: variantItem.title,
      price_minor: variantItem.price_minor || 0,
      variantSelections: selections,
      variantLabel: label,
      pageId: page.id,
    })
    setVariantItem(null)
  }

  const searchedItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || 
           item.description?.toLowerCase().includes(query) || 
           item.item_data?.category?.toLowerCase().includes(query);
  });

  const allConditions = [...new Set(searchedItems
    .map(i => i.item_data?.variants?.find(v => v.name.toLowerCase() === 'condition')?.options[0])
    .filter(Boolean) as string[])]
    
  const filteredItems = searchedItems.filter(item => {
    if (!selectedCondition) return true;
    const condition = item.item_data?.variants?.find(v => v.name.toLowerCase() === 'condition')?.options[0];
    return condition === selectedCondition;
  });

  // Group by category if any items have one
  const categories = [...new Set(filteredItems.map(i => i.item_data?.category).filter(Boolean) as string[])]
  const hasCategories = categories.length > 0

  const groupedItems = hasCategories
    ? Object.fromEntries(categories.map(cat => [cat, filteredItems.filter(i => i.item_data?.category === cat)]))
    : { all: filteredItems }

  const uncategorized = hasCategories ? filteredItems.filter(i => !i.item_data?.category) : []

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: (page as { background_color?: string }).background_color || undefined }}>
      {/* Universal Luxury Hero */}
      <StorefrontHero
        title={page.title}
        subtitle={page.content}
        badge={{ text: '🛍️ Store Catalog' }}
        coverImageUrl={location.cover_image_url}
        businessTypePreset={(page as { business_type_preset?: string }).business_type_preset || 'boutique'}
        templateType="catalog"
        logoUrl={location.organizations?.logo_url}
        themeColor={themeColor}
        tableIdentifier={tableIdentifier}
        promotionalBanner={page.global_discount_enabled ? page.global_discount_banner_text : null}
        discountPercentage={page.global_discount_enabled ? page.global_discount_percentage : null}
        location={location}
        maxContentWidth="max-w-4xl"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.portal_display_name || location.name}
        </BackButton>

        {/* Search Bar */}
        <div className="mb-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, categories..."
            className="w-full pl-12 pr-12 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-white placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category tabs if grouped */}
        {(hasCategories || allConditions.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide no-scrollbar">
            {allConditions.length > 0 && (
              <div className="flex gap-2 pr-4 border-r border-zinc-800 mr-2 shrink-0">
                <button
                  onClick={() => setSelectedCondition(null)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${!selectedCondition ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:border-zinc-500'}`}
                >
                  Any Condition
                </button>
                {allConditions.map(cond => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors capitalize ${selectedCondition === cond ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:border-zinc-500'}`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            )}
            {hasCategories && categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  const el = document.getElementById(`cat-section-${cat}`)
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100
                    window.scrollTo({ top: y, behavior: 'smooth' })
                  }
                }}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-emerald-500/50 hover:text-white transition-all capitalize"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([cat, catItems]) => (
            <div key={cat} id={`cat-section-${cat}`} className="scroll-mt-24">
              {hasCategories && cat !== 'all' && (
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">{cat}</h2>
              )}
              <motion.div 
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                className={
                  layoutMode === 'bento_grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' :
                  layoutMode === 'masonry' ? 'columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3' :
                  'grid grid-cols-1 md:grid-cols-2 gap-3' // List
                }
              >
                {catItems.map((item, idx) => {
                  const isAvail = item.availability_status === 'available'
                  
                  // Inject an ad every 4 items if we have active ads
                  const adToInject = sponsoredAds && sponsoredAds.length > 0 && (idx + 1) % 4 === 0 
                    ? sponsoredAds[((idx + 1) / 4 - 1) % sponsoredAds.length] 
                    : null;
                    
                  const bentoClass = (layoutMode === 'bento_grid' && idx === 0 && catItems.length > 3) ? 'sm:col-span-2' : ''
                  const masonryClass = layoutMode === 'masonry' ? 'break-inside-avoid' : ''

                  return (
                    <Fragment key={item.id}>
                    <motion.div 
                      variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                      whileHover={isAvail ? { scale: 1.015, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
                      className={`rounded-2xl border p-4 transition-all h-full flex flex-col justify-between ${isAvail ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 backdrop-blur-sm' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'} ${bentoClass} ${masonryClass}`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-1">
                        {item.images?.[0] ? (
                          <div className="w-18 h-18 shrink-0 rounded-xl overflow-hidden bg-zinc-800 relative block">
                            <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-18 h-18 shrink-0 rounded-xl overflow-hidden relative shadow-inner border border-white/5 bg-zinc-800">
                            <ItemImagePlaceholder title={item.title} size="sm" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-sm capitalize line-clamp-2">{item.title}</h3>
                            {item.item_data?.variants?.find(v => v.name.toLowerCase() === 'condition') && (
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getConditionBadgeStyles(item.item_data.variants.find(v => v.name.toLowerCase() === 'condition')!.options[0] || '')}`}>
                                {item.item_data.variants.find(v => v.name.toLowerCase() === 'condition')!.options[0]}
                              </span>
                            )}
                          </div>
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
                            <div className="flex flex-col items-end">
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                {formatCurrency(item.price_minor, location.currency || 'NGN')}
                                {item.original_price_minor && item.original_price_minor > item.price_minor && (
                                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full">
                                    {Math.round(((item.original_price_minor - item.price_minor) / item.original_price_minor) * 100)}% OFF
                                  </span>
                                )}
                              </div>
                              {item.original_price_minor && item.original_price_minor > item.price_minor && (
                                <div className="text-xs text-zinc-500 line-through mt-0.5">
                                  {formatCurrency(item.original_price_minor, location.currency || 'NGN')}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {isAvail && page.billing_enabled && item.price_minor ? (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}88)` }}
                        >
                          {item.item_data?.variants && item.item_data.variants.length > 0 ? 'Select Options' : 'Add to Cart'}
                        </button>
                      ) : isAvail && location.whatsapp_number ? (
                        <a
                          href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white/90 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          Send Message
                        </a>
                      ) : null}
                    </motion.div>

                    {adToInject && (
                      <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                        className="col-span-1"
                      >
                        <PartnerShowcaseCard partner={adToInject} />
                      </motion.div>
                    )}
                    </Fragment>
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

        {filteredItems.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title={searchQuery ? "No Matching Items" : "Catalog in Preparation"}
            description={searchQuery ? `No items found matching "${searchQuery}". Try a different keyword.` : "Items and collections will appear here once published."}
            className="my-8"
          />
        )}

        <div className="mt-12 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
            Powered by WETAEGO
          </a>
        </div>
      </div>

      {page.billing_enabled && (
        <CartFAB 
          organizationId={location.organization_id}
          locationId={location.id}
          paymentIsLive={paymentIsLive}
          tableIdentifier={tableIdentifier}
          templateType="catalog"
          menuItems={items.map(i => ({ id: i.id, name: i.title, price_minor: i.price_minor || 0, is_upsell_eligible: i.is_upsell_eligible, category: (i as any).category_name || (i as any).category?.name || 'General' }))}
          hideAddressField={page.template_data?.hide_delivery === true}
          deliveryEnabled={location.delivery_enabled ?? false}
          deliveryFeeMinor={location.delivery_fee_minor ?? 0}
          deliveryMinimumOrderMinor={location.delivery_minimum_order_minor ?? 0}
          deliveryNote={location.delivery_note ?? ''}
          fulfillmentLocationLabel={location.fulfillment_location_label ?? ''}
          pageId={page.id}
          refundPolicy={(location.organizations as { refund_policy?: string })?.refund_policy || (page.template_data?.refund_policy as string | undefined)}
          upsellMode={upsellMode}
          pageFulfillmentOptions={
            page.template_data?.fulfillment_options as { pickup: boolean, delivery: boolean, table: boolean } | undefined
          }
          pageBillingMode={page.billing_mode}
          pagePaymentOptions={(page.template_data?.payment_options as string[]) || []}
        />
      )}

      {/* Variant Selector Modal */}
      {variantItem && variantItem.item_data?.variants && (
        <VariantSelector
          item={{
            id: variantItem.id,
            name: variantItem.title,
            price_minor: variantItem.price_minor || 0,
            variants: variantItem.item_data.variants,
          }}
          currency={location.currency || 'NGN'}
          themeColor={themeColor}
          onConfirm={handleVariantConfirm}
          onCancel={() => setVariantItem(null)}
        />
      )}
    </div>
  )
}

