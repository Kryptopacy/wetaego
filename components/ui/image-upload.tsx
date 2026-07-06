'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { uploadImage } from '@/app/(dashboard)/dashboard/settings/upload-actions'

interface ImageUploadProps {
  name: string
  defaultValue?: string
  className?: string
}

export function ImageUpload({ name, defaultValue, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick frontend validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }

    setError(null)
    setIsUploading(true)

    // Show temporary preview
    const tempUrl = URL.createObjectURL(file)
    setPreview(tempUrl)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await uploadImage(formData)
      
      if (res.error) {
        setError(res.error)
        setPreview(defaultValue || null) // Revert preview on error
      } else if (res.url) {
        setPreview(res.url)
      }
    } catch (err) {
      setError('An unexpected error occurred during upload.')
      setPreview(defaultValue || null)
    } finally {
      setIsUploading(false)
      // Revoke the temporary URL to avoid memory leaks
      URL.revokeObjectURL(tempUrl)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden input to store the final URL for the parent form to submit */}
      <input type="hidden" name={name} value={preview || ''} />

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50 aspect-video max-w-sm flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={preview} 
            alt="Upload preview" 
            className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          {!isUploading && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                title="Change Image"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                title="Remove Image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full max-w-sm aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors
            ${error ? 'border-red-500' : 'border-zinc-700 hover:border-zinc-500'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400">
            {isUploading ? (
              <Loader2 className="w-8 h-8 mb-3 animate-spin text-blue-500" />
            ) : (
              <ImageIcon className="w-8 h-8 mb-3" />
            )}
            <p className="mb-1 text-sm font-semibold">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </p>
            <p className="text-xs text-zinc-500">PNG, JPG, WEBP (Max. 5MB)</p>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  )
}
