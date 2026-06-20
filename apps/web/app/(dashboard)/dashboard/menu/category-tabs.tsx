
'use client'

import { useState } from 'react'
import { AddItemForm } from './add-item-form'
import { toggleItemStatus } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Database } from '@/lib/supabase/types'

type Category = Database['public']['Tables']['menu_categories']['Row'] & { menu_items?: Database['public']['Tables']['menu_items']['Row'][] }

import { useOptimistic, startTransition } from 'react'

function OptimisticItem({ item }: { item: NonNullable<Category['menu_items']>[0] }) {
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    item.availability_status,
    (state: string, newStatus: string) => newStatus
  );

  const isAvailable = optimisticStatus === 'available';

  return (
    <div className="py-4 flex justify-between items-center first:pt-0 last:pb-0 group">
      <div>
        <h3 className="font-semibold text-white">
          {item.name} 
          <span className="text-zinc-400 font-normal ml-2">₦{(item.price_minor / 100).toLocaleString()}</span>
        </h3>
        {item.description && <p className="text-sm text-zinc-400 mt-1">{item.description}</p>}
      </div>
      <div>
        <form action={async () => {
          const nextStatus = isAvailable ? 'sold_out' : 'available';
          startTransition(() => {
            addOptimisticStatus(nextStatus);
          });
          await toggleItemStatus(item.id, optimisticStatus);
        }}>
          <button type="submit" className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
            isAvailable 
              ? 'border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20' 
              : 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20'
          }`}>
            {isAvailable ? 'In Stock' : 'Sold Out'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function CategoryTabs({ categories, orgId }: { categories: Category[], orgId: string }) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id || '')

  if (categories.length === 0) {
    return <p className="text-zinc-500 mt-6">No categories found. Add one above to get started.</p>
  }

  const activeCategory = categories.find(c => c.id === activeTab) || categories[0]

  return (
    <div className="mt-8">
      {/* Horizontal Pills */}
      <div className="flex overflow-x-auto pb-4 mb-2 gap-2 hide-scrollbar">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === category.id 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-700/50'
            }`}
          >
            {category.name}
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {category.menu_items?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Active Category Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{activeCategory.name}</h2>
          </div>
          
          <div className="p-6 border-b border-zinc-800/50">
            <AddItemForm orgId={orgId} categoryId={activeCategory.id} categoryName={activeCategory.name} />
          </div>

          <div className="p-6 divide-y divide-zinc-800/50">
            {activeCategory.menu_items?.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No items yet in this category.</p>
            ) : (
              activeCategory.menu_items?.map((item) => (
                <OptimisticItem key={item.id} item={item} />
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
