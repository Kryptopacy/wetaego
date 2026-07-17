'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createItem } from './actions'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/submit-button'

interface Collection {
  id: string;
  name: string;
}

export function AddItemForm({ orgId, pageId, activeCollectionId, allCollections, templateType }: { orgId: string, pageId: string, activeCollectionId: string, allCollections: Collection[], templateType?: string }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  
  const [selectedCollections, setSelectedCollections] = useState<string[]>([activeCollectionId])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const [requiresBooking, setRequiresBooking] = useState(false)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Ensure activeCollectionId is always selected by default if state gets reset
  useEffect(() => {
    if (!selectedCollections.includes(activeCollectionId) && activeCollectionId !== 'uncategorized') {
      setSelectedCollections(prev => [...prev, activeCollectionId])
    }
  }, [activeCollectionId])

  async function handleMagicFill() {
    if (!name) {
      toast.error('Please enter an Item Name first!')
      return
    }

    setIsGenerating(true)
    try {
      const activeName = allCollections.find(c => c.id === activeCollectionId)?.name || 'General'
      const res = await fetch('/api/ai/copywriter', {
        method: 'POST',
        body: JSON.stringify({ itemName: name, categoryName: activeName, organizationId: orgId }),
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
    if (selectedCollections.length === 0 && activeCollectionId !== 'uncategorized') {
      toast.error('Please select at least one collection.')
      return;
    }
    
    // Convert boolean to string for FormData
    formData.append('requires_booking', requiresBooking.toString())
    formData.append('collection_ids', JSON.stringify(selectedCollections))

    const res = await createItem(formData)
    if (res?.serverError || res?.validationErrors) {
      toast.error(res?.serverError || 'Validation error');
    } else {
      toast.success('Item added successfully!')
      setName('')
      setDescription('')
      setDietaryTags([])
      setAllergens([])
      setRequiresBooking(false)
      setSelectedCollections([activeCollectionId])
      setAiImageUrl(null)
      formRef.current?.reset()
    }
  }

  const toggleCollection = (id: string) => {
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="organization_id" value={orgId} />
      <input type="hidden" name="page_id" value={pageId} />
      <input type="hidden" name="dietary_tags" value={JSON.stringify(dietaryTags)} />
      <input type="hidden" name="allergens" value={JSON.stringify(allergens)} />
      
      <div className="flex gap-4 items-start flex-wrap">
        <div className="w-full sm:w-1/3 min-w-[200px] flex flex-col gap-3">
          <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name (e.g. Spicy Jollof)" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" />
          
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full text-left rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500 flex justify-between items-center"
            >
              <span>{selectedCollections.length} Collection(s) Selected</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                <div className="p-2 flex flex-col gap-1">
                  {allCollections.map(col => (
                    <label key={col.id} className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedCollections.includes(col.id)} 
                        onChange={() => toggleCollection(col.id)}
                        className="w-4 h-4 rounded border-zinc-600 text-blue-500 bg-zinc-900 focus:ring-blue-600 focus:ring-offset-zinc-800"
                      />
                      <span className="text-sm text-zinc-200">{col.name}</span>
                    </label>
                  ))}
                  {allCollections.length === 0 && (
                    <p className="text-sm text-zinc-500 p-2 text-center">No collections available</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Conditionally render Booking toggle based on template type */}
          {(templateType === 'services' || templateType === 'hybrid' || templateType === 'events' || templateType === 'appointments') && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 cursor-pointer hover:bg-zinc-800/50 transition-colors mt-4">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={requiresBooking}
                onChange={(e) => setRequiresBooking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-200">Requires Booking / Time Slot?</span>
              <span className="text-xs text-zinc-500">Enable for services, reservations, etc.</span>
            </div>
          </label>
          )}
        </div>

        <div className="flex-1 min-w-[300px] flex flex-col gap-3">
          <div className="relative">
            <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500 resize-none"></textarea>
            <button 
              type="button" 
              onClick={handleMagicFill} 
              disabled={isGenerating || !name}
              className="absolute right-2 bottom-3 px-3 bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-md text-xs font-bold py-1.5 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-1 shadow-lg"
            >
              {isGenerating ? 'Wait...' : '✨ Magic Fill'}
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="w-1/3">
              <input type="number" step="0.01" name="price" required placeholder="Price" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
            <div className="w-1/3">
              <input type="number" step="1" name="stock_count" placeholder="Stock (opt)" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" title="Leave blank for infinite supply" />
            </div>
            <div className="w-1/3">
              <input type="text" name="department" placeholder="Dept (e.g. Tailor)" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500" title="Workstation Routing" />
            </div>
          </div>
        </div>

        <div className="w-48 relative flex flex-col gap-2 shrink-0">
          {aiImageUrl ? (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-700">
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
              <input type="file" name="image" accept="image/*,video/mp4,video/webm,video/quicktime" className="w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer" />
              <button 
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImg || !name}
                className="w-full px-3 py-2 bg-linear-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-1 shadow-lg"
              >
                {isGeneratingImg ? 'Generating...' : '✨ AI Image Studio'}
              </button>
            </>
          )}
          {aiImageUrl && <input type="hidden" name="ai_image_url" value={aiImageUrl} />}
          <SubmitButton className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors mt-auto">
            Add Item
          </SubmitButton>
        </div>
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
