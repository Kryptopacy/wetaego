'use client'

import { useState, forwardRef } from 'react'
import { ShareModal } from './ShareModal'

interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  url: string
  title: string
  description?: string
}

export const ShareButton = forwardRef<HTMLButtonElement, ShareButtonProps>(({ url, title, description, className, children, onClick, ...props }, ref) => {
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
        ref={ref}
        onClick={(e) => {
          handleShare(e)
          onClick?.(e as React.MouseEvent<HTMLButtonElement>)
        }}
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        {...props}
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
})
ShareButton.displayName = 'ShareButton'

