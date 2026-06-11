'use client'

import { useCartStore } from '@/lib/store/cart'

import Image from 'next/image'

interface ItemCardProps {
  item: any
}

export function ItemCard({ item }: ItemCardProps) {
  const addItem = useCartStore(state => state.addItem)
  const isAvailable = item.availability_status === 'available'
  const isHidden = item.availability_status === 'hidden'

  if (isHidden) return null

  return (
    <div className={`group flex gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800 transition-colors ${!isAvailable ? 'opacity-60' : ''}`}>
      {/* Product Image on the Left */}
      {item.image_url ? (
        <div className="w-[72px] h-[72px] shrink-0 relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Image 
            src={item.image_url} 
            alt={item.name}
            fill
            className="object-cover"
            sizes="72px"
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
        </div>
        
        <div className="flex items-center justify-between mt-2 gap-2">
          {isAvailable ? (
            <span className="font-extrabold text-[14px] text-[#17201b] dark:text-zinc-100 shrink-0">₦{(item.price_minor / 100).toLocaleString()}</span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-bold shrink-0">Sold Out</span>
          )}

          {isAvailable && (
            <button 
              onClick={() => addItem({ id: item.id, name: item.name, price_minor: item.price_minor })}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0f7b55] hover:bg-[#095a3d] dark:bg-white/10 dark:hover:bg-white/20 text-white transition-colors active:scale-90"
              aria-label="Add to Order"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
