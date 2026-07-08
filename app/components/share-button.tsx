'use client'



import { useState, useEffect } from 'react'
import { Share2 } from 'lucide-react'
import { ShareModal } from './share-modal'

interface ShareButtonProps {
  url?: string
  title: string
  description?: string
  className?: string
}

export function ShareButton({ url, title, description, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    queueMicrotask(() => setCurrentUrl(url || window.location.href))
  }, [url])

  const handleShare = async () => {
    setIsOpen(true)
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={className || "w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg"}
      >
        <Share2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <ShareModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          url={currentUrl}
          title={title}
          description={description}
        />
      )}
    </>
  )
}
