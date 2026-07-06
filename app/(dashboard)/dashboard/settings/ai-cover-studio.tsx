
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Wand2, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'

export function AICoverStudio({ 
  locationId, 
  currentCoverUrl, 
  creditsRemaining 
}: { 
  locationId: string
  currentCoverUrl?: string | null
  creditsRemaining: number 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)

  async function handleGenerate() {
    if (!locationId) return
    setIsGenerating(true)
    
    try {
      const res = await fetch('/api/ai/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, prompt })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate cover image')
      }
      
      setCoverUrl(data.url)
      toast.success('Cover image generated successfully!')
      
    } catch (err: unknown) {
      toast.error((err as Error).message || 'An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Wand2 className="w-32 h-32 text-blue-500" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-400" />
              Generate Cover Image
            </h2>
            <p className="text-sm text-zinc-400">
              Instantly generate a high-end, photorealistic cover photo for your venue. 
              Costs 5 credits per generation.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400">
              {creditsRemaining} Credits Remaining
            </span>
          </div>
        </div>

        {coverUrl && (
          <div className="mb-6 relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
            { }
            <Image 
              src={coverUrl} 
              alt="Generated Cover" 
              width={800}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {!coverUrl && (
           <div className="mb-6 w-full h-48 sm:h-64 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 flex flex-col items-center justify-center text-zinc-500">
             <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
             <span className="text-sm">No cover image yet</span>
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional: Fine-tune the result (e.g. 'Add neon lights' or 'Make it a sunny patio')"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || creditsRemaining < 5}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <GemstoneSpinner size="xs" />
                Generating...
              </>
            ) : (
              <>
                Generate (5 Credits)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
