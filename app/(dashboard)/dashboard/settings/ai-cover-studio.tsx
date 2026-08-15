'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Wand2, ImageIcon, UploadCloud, Loader2, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'
import { uploadImage } from './upload-actions'
import { createClient } from '@/lib/supabase/client'

export function AICoverStudio({ 
  locationId, 
  currentCoverUrl, 
  creditsRemaining,
  onCoverGenerated,
  compact = false
}: { 
  locationId: string
  currentCoverUrl?: string | null
  creditsRemaining: number
  onCoverGenerated?: (url: string) => void
  compact?: boolean
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      onCoverGenerated?.(data.url)
      toast.success('Cover image generated successfully!')
      
    } catch (err: unknown) {
      toast.error((err as Error).message || 'An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await uploadImage(formData)
      if (uploadRes.error || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Upload failed')
      }

      // Save directly to the location record
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('locations')
        .update({ cover_image_url: uploadRes.url })
        .eq('id', locationId)

      if (dbError) {
        throw new Error('Failed to update venue cover image')
      }

      setCoverUrl(uploadRes.url)
      onCoverGenerated?.(uploadRes.url)
      toast.success('Custom cover image uploaded successfully!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to upload custom image.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-5 md:p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Wand2 className="w-32 h-32 text-blue-500" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-400" />
              Venue Hero Visuals
            </h2>
            <p className="text-xs text-zinc-400">
              Upload your own high-resolution photography or use AI generation.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              {creditsRemaining} Credits Available
            </span>
          </div>
        </div>

        {/* Cover Preview */}
        {coverUrl ? (
          <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
            <Image 
              src={coverUrl} 
              alt="Venue Cover" 
              width={1200}
              height={600}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                Active Cover Image
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Change Image
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="w-full h-44 sm:h-56 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50 cursor-pointer flex flex-col items-center justify-center text-zinc-400 transition-colors p-4 text-center"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-blue-400 mb-2" />
            )}
            <span className="text-sm font-semibold text-white">Click to upload your own cover photo</span>
            <span className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP • Max 5MB • 1920×1080 (16:9) recommended</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />

        {/* Upload Button + Specs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-blue-400" />}
            {isUploading ? 'Uploading...' : 'Upload Device Image'}
          </button>
          <span className="text-[11px] text-zinc-500">
            PNG, JPG, WEBP • Max 5MB (16:9 Recommended)
          </span>
        </div>

        {/* AI Diffusion Generation Section */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Or Generate with AI Studio (5 Credits)
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              '✨ Candlelit & Romantic',
              '🍸 Moody Neon & Velvet',
              '🌿 Botanical & Sunlit Patio',
              '🏛️ Minimalist Luxury',
              '🌆 Sunset Skyline View',
              '🎨 Creative Modern Studio'
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPrompt(suggestion.replace(/^[^\s]+\s/, ''))}
                className="px-2.5 py-1 text-[11px] rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Warm amber lighting, velvet booths, polished marble"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-white outline-none focus:border-blue-500 text-xs"
              disabled={isGenerating}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || creditsRemaining < 5}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <GemstoneSpinner size="xs" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  {coverUrl ? 'Regenerate (5 Cr)' : 'Generate (5 Cr)'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
