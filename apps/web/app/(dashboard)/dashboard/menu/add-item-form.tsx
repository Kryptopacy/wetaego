
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createItem } from './actions'
import { toast } from 'sonner'

export function AddItemForm({ orgId, categoryId, categoryName }: { orgId: string, categoryId: string, categoryName: string }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleMagicFill() {
    if (!name) {
      toast.error('Please enter an Item Name first!')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/copywriter', {
        method: 'POST',
        body: JSON.stringify({ itemName: name, categoryName, organizationId: orgId }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Failed to generate copy')
      
      const data = await res.json()
      if (data.description) setDescription(data.description)
      if (data.dietary_tags) setDietaryTags(data.dietary_tags)
      if (data.allergen_tags) setAllergens(data.allergen_tags)
      
      toast.success('AI magic applied successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'AI request failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleGenerateImage() {
    if (!name) {
      toast.error('Please enter an Item Name first to guide the AI!')
      return
    }
    
    if (!confirm('This will cost 5 AI Credits. Are you sure?')) return

    setIsGeneratingImg(true)
    try {
      const res = await fetch('/api/ai/generate-item-image', {
        method: 'POST',
        body: JSON.stringify({ itemName: name, itemContext: description, organizationId: orgId }),
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

  async function handleSubmit(formData: FormData) {
    const res = await createItem(formData)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Item added successfully!')
      setName('')
      setDescription('')
      setDietaryTags([])
      setAllergens([])
      setAiImageUrl(null)
      formRef.current?.reset()
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={orgId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="dietary_tags" value={JSON.stringify(dietaryTags)} />
      <input type="hidden" name="allergens" value={JSON.stringify(allergens)} />
      
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-2 min-w-[200px]">
          <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name (e.g. Spicy Jollof)" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" />
        </div>
        <div className="flex-1 min-w-[300px] relative">
          <input type="text" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500 pr-28" />
          <button 
            type="button" 
            onClick={handleMagicFill} 
            disabled={isGenerating || !name}
            className="absolute right-1 top-1 bottom-1 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-1 shadow-lg"
          >
            {isGenerating ? 'Wait...' : '✨ Magic Fill'}
          </button>
        </div>
        <div className="w-24">
          <input type="number" step="0.01" name="price" required placeholder="Price" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" />
        </div>
        <div className="w-48 relative flex flex-col gap-2">
          {aiImageUrl ? (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-700">
              { }
              <Image src={aiImageUrl} alt="AI Generated" width={300} height={300} className="object-cover w-full h-full" />
              <button 
                type="button" 
                onClick={() => setAiImageUrl(null)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-red-500/80 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <>
              <input type="file" name="image" accept="image/*" className="w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
              <button 
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImg || !name}
                className="w-full px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-1 shadow-lg"
              >
                {isGeneratingImg ? 'Generating...' : '✨ AI Image Studio'}
              </button>
            </>
          )}
          {aiImageUrl && <input type="hidden" name="ai_image_url" value={aiImageUrl} />}
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">Add Item</button>
      </div>

      {/* AI Tags Preview */}
      {(dietaryTags.length > 0 || allergens.length > 0) && (
        <div className="flex gap-6 mt-1 bg-zinc-900/50 px-4 py-3 rounded-lg border border-zinc-800/50 shadow-inner">
          {dietaryTags.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Dietary</span>
              <div className="flex gap-2 flex-wrap">
                {dietaryTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-400 border border-green-800/50 font-medium tracking-wide shadow-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {allergens.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Allergens</span>
              <div className="flex gap-2 flex-wrap">
                {allergens.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-800/50 font-medium tracking-wide shadow-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
