'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPageItem, updatePageItem, deletePageItem } from '../(dashboard)/dashboard/pages/actions'
import { AiGenerateButton } from './ai-generate-button'

interface PageItem {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  price_minor: number | null
  price_display: string | null
  availability_status: string
  item_data: any
  deposit_percentage: number | null
  payment_mode: string
}

interface PageBuilderFormProps {
  pageId: string
  templateType: string
  initialItems: PageItem[]
}

export function PageBuilderForm({ pageId, templateType, initialItems }: PageBuilderFormProps) {
  const [items, setItems] = useState<PageItem[]>(initialItems)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    formData.append('page_id', pageId)
    
    // Depending on templateType, format item_data properly if needed.
    if (templateType === 'catalog') {
      const category = formData.get('category') as string
      if (category) {
        formData.set('item_data', JSON.stringify({ category }))
      }
    }

    try {
      await addPageItem(formData)
      setIsAdding(false)
      // Force refresh to get new items
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to add item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>, itemId: string) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    formData.append('itemId', itemId)

    if (templateType === 'catalog') {
      const category = formData.get('category') as string
      if (category) {
        formData.set('item_data', JSON.stringify({ category }))
      }
    }

    try {
      await updatePageItem(formData)
      setEditingId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    setIsSaving(true)
    const formData = new FormData()
    formData.append('itemId', itemId)
    try {
      await deletePageItem(formData)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to delete item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIGenerate = async (formId: string) => {
    const form = document.getElementById(formId) as HTMLFormElement
    if (!form) return

    const titleInput = form.elements.namedItem('title') as HTMLInputElement
    const title = titleInput?.value
    if (!title) {
      alert('Please enter a title first to generate a description.')
      return
    }

    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          templateType,
        })
      })

      if (!res.ok) throw new Error('Failed to generate')
      const { text } = await res.json()
      
      const textarea = form.elements.namedItem('description') as HTMLTextAreaElement
      if (textarea) {
        textarea.value = text
      }
    } catch (err) {
      console.error('AI Gen Error:', err)
      alert('Failed to generate description. Please try again.')
    }
  }

  const renderFormFields = (formId: string, item?: PageItem) => {
    const category = item?.item_data?.category || ''

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
          <input required name="title" defaultValue={item?.title || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. VIP Consultation" />
        </div>

        {templateType === 'catalog' && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
            <input name="category" defaultValue={category} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Services" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-zinc-400">Description</label>
            <AiGenerateButton 
              onGenerate={() => handleAIGenerate(formId)} 
              tooltip="Write an AI description based on the title"
            />
          </div>
          <textarea name="description" defaultValue={item?.description || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white h-20" placeholder="Describe the item or service..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Price (Minor Units)</label>
            <input type="number" name="price_minor" defaultValue={item?.price_minor || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. 500000 for ₦5000" />
            <p className="text-[10px] text-zinc-500 mt-1">Multiply your price by 100.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Price Display (Optional)</label>
            <input name="price_display" defaultValue={item?.price_display || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Starting from ₦5,000" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Items & Services</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
            + Add New
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Add New Item</h3>
          <form id="add-item-form" onSubmit={handleAddSubmit}>
            {renderFormFields('add-item-form')}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {initialItems.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/50 rounded-xl border-dashed">
            <p className="text-sm text-zinc-500">No items found. Add your first one to get started.</p>
          </div>
        )}

        {initialItems.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            {editingId === item.id ? (
              <form id={`edit-item-form-${item.id}`} onSubmit={(e) => handleEditSubmit(e, item.id)}>
                {renderFormFields(`edit-item-form-${item.id}`, item)}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setEditingId(null)} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Update Item'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{item.title}</h4>
                    {item.item_data?.category && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {item.item_data.category}
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                    {item.price_minor ? (
                      <span className="text-emerald-400">₦{(item.price_minor / 100).toLocaleString()}</span>
                    ) : (
                      <span className="text-zinc-500">No price set</span>
                    )}
                    {item.price_display && (
                      <span className="text-zinc-500 text-xs">Display: {item.price_display}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditingId(item.id)} disabled={isSaving} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={isSaving} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
