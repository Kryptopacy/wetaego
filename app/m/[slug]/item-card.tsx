'use client'

import { useCartStore } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils/currency'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Tables } from '@/types'
import { Plus, Minus, ShoppingBag, X } from 'lucide-react'
import { AnimatedDialog, AnimatedDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface ItemCardProps {
  item: Tables<'menu_items'>
}

export function ItemCard({ item }: ItemCardProps) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find(i => i.id === item.id)
  
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [modifiers, setModifiers] = useState('')

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
      pageId: pageId || ''
    })
    
    setShowModifierModal(false)
    setModifiers('')
  }
  
  const isAvailable = item.availability_status === 'available'
  const isHidden = item.availability_status === 'hidden'

  if (isHidden) return null

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`group relative flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 ${!isAvailable ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        {/* Product Image */}
        {item.image_url ? (
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
        ) : (
          <div className="w-[88px] h-[88px] shrink-0 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600 font-black text-2xl uppercase shadow-inner">
            {item.name.slice(0, 1)}
          </div>
        )}

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h4 className={`font-bold text-[16px] tracking-tight text-zinc-900 dark:text-white leading-tight truncate ${!isAvailable ? 'line-through opacity-70' : ''}`}>
                {item.name}
              </h4>
              {isAvailable ? (
                <span className="font-bold text-[15px] text-zinc-900 dark:text-white shrink-0">
                  {formatCurrency(item.price_minor )}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold shrink-0">Sold Out</span>
              )}
            </div>

            {item.description && (
              <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1.5 pr-8">
                {item.description}
              </p>
            )}
            
            {(item.dietary_tags?.length > 0 || item.allergen_tags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {item.dietary_tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">{tag}</span>
                ))}
                {item.allergen_tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">{tag}</span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end mt-3 gap-2">
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
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-sm transition-all active:scale-95"
                >
                  <span>Add</span>
                  <Plus className="w-4 h-4" />
                </button>
              )
            )}
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
    </>
  )
}
