'use client'

import { useCartStore } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils/currency'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Tables } from '@/types'
import { Plus, Minus, ShoppingBag, X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { AnimatedDialog, AnimatedDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ShareButton } from '@/app/components/share-button'

interface ItemCardProps {
  item: Tables<'menu_items'>
}

interface ExtendedMenuItem extends Tables<'menu_items'> {
  original_price_minor?: number
}

export function ItemCard({ item }: ItemCardProps) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find(i => i.id === item.id)
  
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [modifiers, setModifiers] = useState('')
  const [mediaIndex, setMediaIndex] = useState(0)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const itemIdFromUrl = searchParams.get('item')
  useEffect(() => {
    if (itemIdFromUrl === item.id) {
      queueMicrotask(() => setShowDetailsModal(true))
    }
  }, [itemIdFromUrl, item.id])

  const handleOpenDetails = () => {
    router.replace(`${pathname}?item=${item.id}`, { scroll: false })
    setShowDetailsModal(true)
  }

  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('item')
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleAddToCart = () => {
    let finalName = item.name
    if (modifiers.trim()) {
      finalName = `${item.name} (${modifiers.trim()})`
    }
    const cartItemId = modifiers.trim() ? `${item.id}-${Date.now()}` : item.id
    
    addItem({ 
      id: item.id,
      cartKey: cartItemId,
      name: finalName, 
      price_minor: item.price_minor,
      pageId: ''
    })
    
    setShowModifierModal(false)
    setModifiers('')
  }
  
  const isAvailable = item.availability_status === 'available'
  const isHidden = item.availability_status === 'hidden'

  const mediaArray = item.images?.length ? item.images : (item.image_url ? [item.image_url] : [])

  const renderMedia = (url: string) => {
    if (url.startsWith('video:') || url.endsWith('.mp4') || url.endsWith('.webm')) {
      const videoUrl = url.startsWith('video:') ? url.substring(6) : url
      return <video src={videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
    }
    if (url.startsWith('vr:')) {
      return <iframe src={url.substring(3)} allow="xr-spatial-tracking; gyroscope; accelerometer" allowFullScreen className="w-full h-full border-0" />
    }
    if (url.startsWith('youtube:')) {
      const ytId = url.substring(8)
      return <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0`} className="w-full h-full object-cover pointer-events-none border-0" allow="autoplay; encrypted-media" />
    }
    return (
      <Image 
        src={url} 
        alt={item.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 500px"
        priority={mediaIndex === 0}
      />
    )
  }

  if (isHidden) return null

  return (
    <>
      <motion.div 
        onClick={handleOpenDetails}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`group relative cursor-pointer flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 ${!isAvailable ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        {/* Product Image */}
        {item.image_url && (
          <div className="w-[88px] h-[88px] shrink-0 relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
            <Image 
              src={item.image_url} 
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="88px"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88B8AAsUB4ZtvxwAAAABJRU5ErkJggg=="
            />
          </div>
        )}

        {/* Product Details */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-bold text-[16px] tracking-tight text-zinc-900 dark:text-white leading-tight line-clamp-2 ${!isAvailable ? 'line-through opacity-70' : ''}`}>
              {item.name}
            </h4>
            {!isAvailable && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold shrink-0">Sold Out</span>
            )}
          </div>

          {item.description && (
            <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1">
              {item.description}
            </p>
          )}
          
          {(item.dietary_tags?.length > 0 || item.allergen_tags?.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.dietary_tags?.map(tag => (
                <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">{tag}</span>
              ))}
              {item.allergen_tags?.map(tag => (
                <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">{tag}</span>
              ))}
            </div>
          )}
          
          <div className="mt-auto pt-3 flex items-end justify-between gap-2" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col min-w-0">
              {isAvailable && (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[15px] text-zinc-900 dark:text-white">
                      {formatCurrency(item.price_minor)}
                    </span>
                    {(item as ExtendedMenuItem).original_price_minor && ((item as ExtendedMenuItem).original_price_minor as number) > item.price_minor && (
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {Math.round(((((item as ExtendedMenuItem).original_price_minor as number) - item.price_minor) / ((item as ExtendedMenuItem).original_price_minor as number)) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  {(item as ExtendedMenuItem).original_price_minor && ((item as ExtendedMenuItem).original_price_minor as number) > item.price_minor && (
                    <span className="text-[12px] text-zinc-500 line-through mt-0.5">
                      {formatCurrency(((item as ExtendedMenuItem).original_price_minor as number))}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="shrink-0">
              {isAvailable && (
                cartItem ? (
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-zinc-800 rounded-full p-1 border border-emerald-100 dark:border-zinc-700 shadow-sm">
                    <button 
                      onClick={() => updateQuantity(cartItem.cartKey, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm hover:scale-105 transition-transform"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-emerald-700 dark:text-white font-bold text-sm min-w-[16px] text-center">{cartItem.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(cartItem.cartKey, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:scale-105 transition-all"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowModifierModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[13px] shadow-sm transition-all active:scale-95"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modifier Modal */}
      <AnimatedDialog open={showModifierModal} onOpenChange={setShowModifierModal}>
        <AnimatedDialogContent isOpen={showModifierModal} hideCloseButton>
          <DialogTitle className="sr-only">{item.name} Options</DialogTitle>
          <DialogDescription className="sr-only">Customize your order for {item.name}</DialogDescription>
          
          <button 
            onClick={() => setShowModifierModal(false)} 
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="mb-6 pr-10">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{item.name}</h3>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(item.price_minor )}</p>
          </div>

          <div className="mb-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3" htmlFor="special-instructions">Special Instructions</label>
            <textarea
              id="special-instructions"
              value={modifiers}
              onChange={e => setModifiers(e.target.value)}
              placeholder="e.g., Extra cheese, no onions, allergies..."
              rows={3}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-[15px] text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all placeholder:text-zinc-400"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-xl font-bold text-white text-[15px] bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Order
          </button>
        </AnimatedDialogContent>
      </AnimatedDialog>
      {/* Item Details Modal */}
      <AnimatedDialog open={showDetailsModal} onOpenChange={handleCloseDetails}>
        <AnimatedDialogContent isOpen={showDetailsModal} hideCloseButton>
          <DialogTitle className="sr-only">{item.name} Details</DialogTitle>
          <DialogDescription className="sr-only">Detailed view of {item.name}</DialogDescription>
          
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <ShareButton 
              title={item.name}
              description={item.description || `Check out ${item.name} on OurMenu`}
              url={`https://ourmenuos.online${pathname}?item=${item.id}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button 
              onClick={handleCloseDetails} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 backdrop-blur-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col h-full max-h-[85vh] overflow-y-auto scrollbar-hide -mx-6 px-6">
            {mediaArray.length > 0 ? (
              <div className="relative w-full aspect-square -mt-6 mb-6 rounded-b-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 group">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={mediaIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    {renderMedia(mediaArray[mediaIndex])}
                  </motion.div>
                </AnimatePresence>

                {mediaArray.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMediaIndex(i => i === 0 ? mediaArray.length - 1 : i - 1) }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMediaIndex(i => i === mediaArray.length - 1 ? 0 : i + 1) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                      {mediaArray.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={(e) => { e.stopPropagation(); setMediaIndex(i) }}
                          className={`h-1.5 rounded-full transition-all ${i === mediaIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-8 mb-6" />
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight mb-2">{item.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(item.price_minor)}
                </span>
                {(item as ExtendedMenuItem).original_price_minor && ((item as ExtendedMenuItem).original_price_minor as number) > item.price_minor && (
                  <>
                    <span className="text-[14px] text-zinc-500 line-through">
                      {formatCurrency(((item as ExtendedMenuItem).original_price_minor as number))}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                      {Math.round(((((item as ExtendedMenuItem).original_price_minor as number) - item.price_minor) / ((item as ExtendedMenuItem).original_price_minor as number)) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {item.description && (
              <div className="mb-8 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</h4>
                <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            )}

            {(item.dietary_tags?.length > 0 || item.allergen_tags?.length > 0) && (
              <div className="mb-8 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.dietary_tags?.map(tag => (
                    <span key={tag} className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
                      {tag}
                    </span>
                  ))}
                  {item.allergen_tags?.map(tag => (
                    <span key={tag} className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 pb-2">
              <button
                onClick={() => {
                  handleCloseDetails()
                  setShowModifierModal(true)
                }}
                disabled={!isAvailable}
                className="w-full py-4 rounded-xl font-bold text-white text-[15px] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-zinc-400 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 focus:outline-none"
              >
                <ShoppingBag className="w-5 h-5" />
                {isAvailable ? 'Add to Order' : 'Sold Out'}
              </button>
            </div>
          </div>
        </AnimatedDialogContent>
      </AnimatedDialog>
    </>
  )
}
