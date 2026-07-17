'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, ChevronRight, GripVertical, Check, X, CornerDownRight } from 'lucide-react'
import { createCollection, updateCollection, deleteCollection } from './actions'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/types'

type Collection = Database['public']['Tables']['page_collections']['Row']
type PageItem = Database['public']['Tables']['page_items']['Row']

export function TaxonomyEditor({ 
  orgId, 
  pages, 
  initialCollections,
  initialItems,
  activeLocationId 
}: { 
  orgId: string, 
  pages: any[], 
  initialCollections: Collection[],
  initialItems: any[],
  activeLocationId: string 
}) {
  const [activePageId, setActivePageId] = useState(pages[0]?.id || '')
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  
  const [isAdding, setIsAdding] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addingParentId, setAddingParentId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Build tree
  const tree = useMemo(() => {
    const map = new Map<string, Collection & { children: any[], itemCount: number }>()
    collections.forEach(c => map.set(c.id, { ...c, children: [], itemCount: 0 }))
    
    // Count items (just roughly by checking item link)
    initialItems.forEach(item => {
      item.page_item_collections?.forEach((link: any) => {
        const col = map.get(link.collection_id)
        if (col) col.itemCount++
      })
    })

    const root: any[] = []
    
    // Sort collections by sort_order
    const sorted = [...collections].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    
    sorted.forEach(c => {
      const node = map.get(c.id)!
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children.push(node)
      } else {
        root.push(node)
      }
    })
    
    return root
  }, [collections, initialItems])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    
    const res = await createCollection(activePageId, newCatName.trim(), addingParentId)
    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setCollections(prev => [...prev, res.data as Collection])
      toast.success('Category created')
      setNewCatName('')
      setIsAdding(false)
      setAddingParentId(null)
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return
    const res = await updateCollection(id, { name: editName.trim() })
    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setCollections(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim(), slug: (res.data as any).slug } : c))
      toast.success('Category updated')
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Any items inside will lose this category tag.')) return
    
    const res = await deleteCollection(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      setCollections(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
      toast.success('Category deleted')
    }
  }

  async function handleMoveUp(index: number, siblings: Collection[]) {
    if (index === 0) return
    const current = siblings[index]
    const prev = siblings[index - 1]
    
    const newCurrentOrder = prev.sort_order ?? 0
    const newPrevOrder = current.sort_order ?? 0

    // Optimistic
    setCollections(all => all.map(c => {
      if (c.id === current.id) return { ...c, sort_order: newCurrentOrder }
      if (c.id === prev.id) return { ...c, sort_order: newPrevOrder }
      return c
    }))

    await updateCollection(current.id, { sort_order: newCurrentOrder })
    await updateCollection(prev.id, { sort_order: newPrevOrder })
  }

  async function handleMoveDown(index: number, siblings: Collection[]) {
    if (index === siblings.length - 1) return
    const current = siblings[index]
    const next = siblings[index + 1]
    
    const newCurrentOrder = next.sort_order ?? 0
    const newNextOrder = current.sort_order ?? 0

    setCollections(all => all.map(c => {
      if (c.id === current.id) return { ...c, sort_order: newCurrentOrder }
      if (c.id === next.id) return { ...c, sort_order: newNextOrder }
      return c
    }))

    await updateCollection(current.id, { sort_order: newCurrentOrder })
    await updateCollection(next.id, { sort_order: newNextOrder })
  }

  const renderNode = (node: any, depth: number = 0, index: number, siblings: any[]) => {
    return (
      <div key={node.id} className="w-full">
        <div 
          className={`flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl mb-2 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 ${depth > 0 ? 'ml-8 relative' : ''}`}
        >
          {depth > 0 && (
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-zinc-600">
              <CornerDownRight className="w-4 h-4" />
            </div>
          )}
          
          <div className="flex flex-col gap-1 items-center justify-center shrink-0">
            <button onClick={() => handleMoveUp(index, siblings)} disabled={index === 0} className="text-zinc-500 hover:text-white disabled:opacity-30">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => handleMoveDown(index, siblings)} disabled={index === siblings.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {editingId === node.id ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="bg-black border border-emerald-500/50 text-white px-3 py-1.5 rounded-lg text-sm w-full focus:outline-none focus:border-emerald-500"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(node.id)}
                />
                <button onClick={() => handleSaveEdit(node.id)} className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium truncate">{node.name}</h3>
                  <p className="text-zinc-500 text-xs">/{node.slug} • {node.itemCount} items</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAddingParentId(node.id); setIsAdding(true); }} className="text-xs px-2.5 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors">
                    + Sub-category
                  </button>
                  <button onClick={() => { setEditingId(node.id); setEditName(node.name); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(node.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="flex flex-col w-full">
            {node.children.map((child: any, i: number) => renderNode(child, depth + 1, i, node.children))}
          </div>
        )}

        {isAdding && addingParentId === node.id && (
          <div className="ml-8 mb-2 p-4 bg-emerald-900/10 border border-emerald-500/30 rounded-xl relative">
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-emerald-600/50">
              <CornerDownRight className="w-4 h-4" />
            </div>
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Sub-category name..." 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="bg-black border border-emerald-500/30 text-white px-3 py-1.5 rounded-lg text-sm w-full focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button type="submit" className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400">
                <Check className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setAddingParentId(null); setNewCatName(''); }} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {pages.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePageId(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activePageId === p.id ? 'bg-white text-black shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            {p.title} <span className="opacity-50 font-normal ml-1 capitalize text-xs">({p.template_type})</span>
          </button>
        ))}
      </div>

      <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <button 
            onClick={() => { setAddingParentId(null); setIsAdding(true); }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Add Root Category
          </button>
        </div>

        {isAdding && addingParentId === null && (
          <form onSubmit={handleAdd} className="mb-4 p-4 bg-emerald-900/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Category name..." 
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="bg-black border border-emerald-500/30 text-white px-4 py-2 rounded-xl text-sm w-full focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400">
              Save
            </button>
            <button type="button" onClick={() => { setIsAdding(false); setNewCatName(''); }} className="px-4 py-2 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700">
              Cancel
            </button>
          </form>
        )}

        <div className="flex flex-col">
          {tree.length === 0 && !isAdding ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 mb-2">No categories yet.</p>
              <p className="text-zinc-600 text-sm">Create your first category to start organizing your catalog.</p>
            </div>
          ) : (
            tree.map((node, i) => renderNode(node, 0, i, tree))
          )}
        </div>
      </div>
    </div>
  )
}
