'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { duplicatePageAction } from './actions'

export function DuplicatePageModal({ 
  sourcePageId, 
  sourceTitle, 
  sourceSlug,
  locations = [],
  currentLocationId
}: {
  sourcePageId: string
  sourceTitle: string
  sourceSlug: string
  locations?: { id: string; name: string }[]
  currentLocationId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(`${sourceTitle} (Copy)`)
  const [slug, setSlug] = useState(`${sourceSlug}-copy`)
  const [targetLocationId, setTargetLocationId] = useState(currentLocationId || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData()
    formData.append('sourcePageId', sourcePageId)
    formData.append('newTitle', title.trim())
    formData.append('newSlug', slug.trim().toLowerCase())
    if (targetLocationId) {
      formData.append('targetLocationId', targetLocationId)
    }

    const res = await duplicatePageAction(formData)
    setIsLoading(false)

    if (res?.serverError || res?.validationErrors) {
      toast.error(res?.serverError || 'Failed to duplicate page')
    } else {
      toast.success('Catalog duplicated successfully!')
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer text-zinc-300 hover:text-white transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate Catalog
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-white">Duplicate Catalog / Page</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Create an autonomous clone of &quot;{sourceTitle}&quot; including all items, categories, and prices.
              </p>
            </div>

            <form onSubmit={handleDuplicate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">New Page Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">New URL Slug</label>
                <div className="flex items-center">
                  <span className="bg-zinc-800/50 border border-r-0 border-zinc-800 text-zinc-500 text-xs px-3 py-2 rounded-l-lg">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-r-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {locations && locations.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Target Branch / Location</label>
                  <select
                    value={targetLocationId}
                    onChange={(e) => setTargetLocationId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.id === currentLocationId ? '(Current Location)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Select which physical branch should receive this cloned catalog.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? 'Duplicating...' : 'Duplicate Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
