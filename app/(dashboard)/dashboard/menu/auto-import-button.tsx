'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, Loader2, Check, X, ShieldAlert } from 'lucide-react'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'
import { bulkInsertMenu } from './actions'

interface AutoImportButtonProps {
  orgId: string
  menuId: string
}

export function AutoImportButton({ orgId, menuId }: AutoImportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewItems, setPreviewItems] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('organizationId', orgId)

    try {
      const res = await fetch('/api/ai/auto-import', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to extract menu')
      }
      const data = await res.json()
      setPreviewItems(data.items || [])
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('organization_id', orgId)
      formData.append('menu_id', menuId)
      formData.append('items', JSON.stringify(previewItems))
      
      const res = await bulkInsertMenu(formData)
      if (res?.data?.success) {
        setShowPreview(false)
        setPreviewItems([])
      }
    } catch (err) {
      setError('Failed to save items.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {loading && !showPreview ? <GemstoneSpinner size="xs" /> : <FileUp className="w-4 h-4" />}
          Auto-Import Menu (OCR)
        </button>
      </div>

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl my-8 relative">
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Review Extracted Menu
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">AI Assisted</span>
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Please verify the categories, items, and prices before saving.</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/10 rounded-lg transition text-zinc-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="max-h-[50vh] overflow-y-auto bg-zinc-950 rounded-xl border border-zinc-800 p-4 mb-6">
                {previewItems.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No items were extracted. Please try a clearer image.</p>
                ) : (
                  <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="text-xs uppercase bg-zinc-900 text-zinc-500 sticky top-0">
                      <tr>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Item Name</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {previewItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/50">
                          <td className="px-4 py-3 font-medium text-blue-400">{item.category_name}</td>
                          <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-[200px]">{item.description}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-medium">${item.price?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition">Cancel</button>
                <button type="button" onClick={handleSave} disabled={loading || previewItems.length === 0} className="px-5 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save {previewItems.length} Items
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
