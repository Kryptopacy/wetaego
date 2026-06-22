'use client'

import { useState } from 'react'
import { ShareModal } from './ShareModal'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}

export function ShareButton({ url, title, description, className, children }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Use Web Share API if available (great for mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
        return
      } catch (err) {
        // Fallback to our custom modal if they cancelled or it failed
        if ((err as Error).name !== 'AbortError') {
          setIsOpen(true)
        }
      }
    } else {
      // Fallback to our custom modal on desktop
      setIsOpen(true)
    }
  }

  return (
    <>
      <button 
        onClick={handleShare}
        className={className}
      >
        {children}
      </button>

      <ShareModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        url={url}
        title={title}
        description={description}
      />
    </>
  )
}
