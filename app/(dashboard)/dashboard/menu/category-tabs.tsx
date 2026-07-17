
'use client'

import { useState, useEffect } from 'react'
import { AddItemForm } from './add-item-form'
import { toggleItemStatus } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Database } from '@/lib/supabase/types'

type Category = any // Temporary until we generate types
type PageItem = any

import { useOptimistic, startTransition } from 'react'

import { updateItem, deleteItem } from './actions'

import { toast } from 'sonner'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'

function OptimisticItem({ item, orgId, categoryName }: { item: PageItem, orgId: string, categoryName: string }) {
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    item.availability_status,
    (state: string, newStatus: string) => newStatus
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAvailable = optimisticStatus === 'available';

  const [editName, setEditName] = useState(item.name)
  const [editDescription, setEditDescription] = useState(item.description || '')
  const [editPrice, setEditPrice] = useState(item.price || 0)
  const [editStock, setEditStock] = useState(item.item_data?.stock_count?.toString() || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)

  async function handleMagicFill() {
    if (!editName) {
      toast.error('Please enter an Item Name first!')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/copywriter', {
        method: 'POST',
        body: JSON.stringify({ itemName: editName, categoryName, organizationId: orgId }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Failed to generate copy')
      
      const data = await res.json()
      if (data.description) setEditDescription(data.description)
      
      toast.success('AI magic applied successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'AI request failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleGenerateImage() {
    if (!editName) {
      toast.error('Please enter an Item Name first to guide the AI!')
      return
    }
    
    if (!confirm('This will cost 5 AI Credits. Are you sure?')) return

    setIsGeneratingImg(true)
    try {
      const res = await fetch('/api/ai/generate-item-image', {
        method: 'POST',
        body: JSON.stringify({ itemName: editName, itemContext: editDescription, organizationId: orgId }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate image')
      }
      
      const data = await res.json()
      if (data.url) setAiImageUrl(data.url)
      
      toast.success('AI Image generated successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'AI request failed.')
    } finally {
      setIsGeneratingImg(false)
    }
  }

  if (isEditing) {
    return (
      <div className="py-4 first:pt-0 last:pb-0">
        <form action={async (formData) => {
          await updateItem(formData);
          setIsEditing(false);
        }} className="space-y-4">
          <input type="hidden" name="item_id" value={item.id} />
          
          <div className="flex gap-4 items-start flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Item Name</label>
              <input type="text" name="name" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="flex-2 min-w-[300px] relative">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
              <input type="text" name="description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 pr-28 text-sm text-white outline-none focus:border-blue-500" />
              <button 
                type="button" 
                onClick={handleMagicFill} 
                disabled={isGenerating || !editName}
                className="absolute right-1 bottom-1 px-3 py-1 bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50 shadow-lg"
              >
                {isGenerating ? 'Wait...' : '✨ Magic Fill'}
              </button>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Price (Minor)</label>
              <input type="number" name="price" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-zinc-400 mb-1" title="Leave blank for infinite supply">Stock</label>
              <input type="number" name="stock_count" value={editStock} onChange={(e) => setEditStock(e.target.value)} min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="w-full sm:w-auto flex flex-col gap-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Update Image</label>
              {aiImageUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-700">
                  <Image src={aiImageUrl} alt="AI Generated" width={96} height={96} className="object-cover w-full h-full" />
                  <input type="hidden" name="ai_image_url" value={aiImageUrl} />
                  <button type="button" onClick={() => setAiImageUrl(null)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-red-500/80 transition-colors">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <input type="file" name="image" accept="image/*" className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
                  <button 
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImg || !editName}
                    className="w-full px-3 py-1.5 bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-lg mt-1"
                  >
                    {isGeneratingImg ? 'Generating...' : '✨ AI Image Studio'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="py-4 flex justify-between items-center first:pt-0 last:pb-0 group">
      <div>
        <h3 className="font-semibold text-white">
          {item.title} 
          <span className="text-zinc-400 font-normal ml-2">{formatCurrency(item.price * 100)}</span>
        </h3>
        {item.description && <p className="text-sm text-zinc-400 mt-1">{item.description}</p>}
        <div className="mt-2 flex gap-2">
          <button onClick={() => setIsEditing(true)} className="text-xs font-medium text-blue-400 hover:text-blue-300">Edit</button>
          <button onClick={async () => {
            if (confirm('Are you sure you want to delete this item?')) {
              setIsDeleting(true);
              await deleteItem({ itemId: item.id });
            }
          }} disabled={isDeleting} className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      <div>
        <form action={async () => {
          const nextStatus = isAvailable ? 'sold_out' : 'available';
          startTransition(() => {
            addOptimisticStatus(nextStatus);
          });
          await toggleItemStatus({ itemId: item.id, currentStatus: optimisticStatus });
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

export function CategoryTabs({ categories, orgId, menuId, allCollections, pageId, templateType }: { categories: Category[], orgId: string, menuId: string, allCollections: any[], pageId: string, templateType?: string }) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id || '')
  const [optimisticCategories, addOptimisticCategory] = useOptimistic(
    categories,
    (state, newCat: Category) => [...state, newCat]
  )

  useEffect(() => {
    if (categories.length > 0 && !categories.some(c => c.id === activeTab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(categories[0]?.id || '')
    } else if (categories.length === 0 && activeTab !== '') {
      setActiveTab('')
    }
  }, [categories, activeTab])

  const activeCategory = optimisticCategories.find(c => c.id === activeTab) || optimisticCategories[0] || categories[0]

  return (
    <div className="mt-8">
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Category</h2>
        <form action={async (formData) => {
          const name = formData.get('name') as string;
          const tempId = `temp-${Date.now()}`;
          const newCat: Category = {
            id: tempId,
            organization_id: orgId,
            page_id: pageId,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            parent_id: null,
            sort_order: optimisticCategories.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            menu_items: []
          };
          
          startTransition(() => {
            addOptimisticCategory(newCat);
            setActiveTab(tempId);
          });
          
          const { createCategory } = await import('./actions');
          await createCategory(formData);
        }} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-zinc-300">Category Name</label>
            <input type="text" name="name" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Signature Cocktails" />
            <input type="hidden" name="page_id" value={pageId} />
            <input type="hidden" name="organization_id" value={orgId} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors border border-zinc-700">Add Category</button>
        </form>
      </div>

      {optimisticCategories.length === 0 ? (
        <p className="text-zinc-500 mt-6">No categories found. Add one above to get started.</p>
      ) : (
        <>
          {/* Horizontal Pills */}
          <div className="flex overflow-x-auto pb-4 mb-2 gap-2 hide-scrollbar">
            {optimisticCategories.map(category => (
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
          
          <div className="bg-zinc-800/30 p-6 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="text-blue-500">＋</span> Add New Item to {activeCategory.name}
            </h3>
            <AddItemForm orgId={orgId} pageId={pageId} activeCollectionId={activeCategory.id} allCollections={allCollections} templateType={templateType} />
          </div>

          <div className="p-6 divide-y divide-zinc-800/50">
            {activeCategory.menu_items?.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No items yet in this category.</p>
            ) : (
              activeCategory.menu_items?.map((item: any) => (
                <OptimisticItem key={item.id} item={item} orgId={orgId} categoryName={activeCategory.name} />
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
        </>
      )}
    </div>
  )
}
