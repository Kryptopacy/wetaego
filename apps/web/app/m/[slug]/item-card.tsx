'use client'

import { useCartStore } from '@/lib/store/cart'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

import { Tables } from '../../../../../types'

interface ItemCardProps {
  item: Tables<'menu_items'>
}

import { useState } from 'react'

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
    // We add to cart using the original item.id but the modified name.
    // Wait, if they add multiple of the same item with DIFFERENT modifiers, 
    // the store checks by id. It will just increment quantity of the first one!
    // To support unique modifiers, we need a unique ID for the cart item.
    const cartItemId = modifiers.trim() ? `${item.id}-${Date.now()}` : item.id
    
    addItem({ 
      id: cartItemId, 
      name: finalName, 
      price_minor: item.price_minor 
    })
    
    setShowModifierModal(false)
    setModifiers('')
  }
  
  const isAvailable = item.availability_status === 'available'
  const isHidden = item.availability_status === 'hidden'

  if (isHidden) return null

  return (
    <div className={`group flex gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800 transition-colors ${!isAvailable ? 'opacity-60' : ''}`}>
      {/* Product Image on the Left */}
      {item.image_url ? (
        <div className="w-[72px] h-[72px] shrink-0 relative rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 animate-pulse">
          <Image 
            src={item.image_url} 
            alt={item.name}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="72px"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88B8AAsUB4ZtvxwAAAABJRU5ErkJggg=="
            onLoad={(e) => {
              const target = e.target as HTMLElement;
              target.parentElement?.classList.remove('animate-pulse');
            }}
          />
        </div>
      ) : (
        <div className="w-[72px] h-[72px] shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-[10px] uppercase">
          {item.name.slice(0, 2)}
        </div>
      )}

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h4 className={`font-bold text-[15px] text-[#17201b] dark:text-zinc-100 leading-snug ${!isAvailable ? 'line-through' : ''}`}>
            {item.name}
          </h4>
          {item.description && (
            <p className="text-[13px] text-[#69746c] dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1">{item.description}</p>
          )}
          {(item.dietary_tags?.length > 0 || item.allergen_tags?.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.dietary_tags?.map(tag => (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{tag}</span>
              ))}
              {item.allergen_tags?.map(tag => (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">Contains {tag}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 gap-2">
          {isAvailable ? (
            <span className="font-extrabold text-[14px] text-[#17201b] dark:text-zinc-100 shrink-0">₦{(item.price_minor / 100).toLocaleString()}</span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-bold shrink-0">Sold Out</span>
          )}

          {isAvailable && (
            cartItem ? (
              <div className="flex items-center gap-3 bg-[#0f7b55]/10 dark:bg-white/10 rounded-full px-2 py-1">
                <button 
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0f7b55]/20 dark:bg-white/10 text-[#0f7b55] dark:text-white hover:bg-[#0f7b55] hover:text-white transition-colors"
                >-</button>
                <span className="text-[#0f7b55] dark:text-white font-bold text-sm min-w-[12px] text-center">{cartItem.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0f7b55] dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
                >+</button>
              </div>
            ) : (
              <button 
                onClick={() => setShowModifierModal(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0f7b55] hover:bg-[#095a3d] dark:bg-white/10 dark:hover:bg-white/20 text-white transition-colors active:scale-90"
                aria-label="Customize and Add to Order"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* Modifier Modal */}
      <AnimatePresence>
        {showModifierModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setShowModifierModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setShowModifierModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">✕</button>
              
              <h3 className="text-lg font-bold text-[#17201b] dark:text-white mb-1">Customize</h3>
              <p className="text-sm text-[#69746c] dark:text-zinc-400 mb-4">{item.name}</p>

              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Special Instructions</label>
                <textarea
                  value={modifiers}
                  onChange={e => setModifiers(e.target.value)}
                  placeholder="e.g., Extra cheese, no onions, allergies..."
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-[#17201b] dark:text-white focus:border-[#0f7b55] outline-none resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-[#0f7b55] hover:bg-[#095a3d] transition-colors"
              >
                Add to Cart - ₦{(item.price_minor / 100).toLocaleString()}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
