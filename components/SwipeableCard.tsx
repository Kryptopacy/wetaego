'use client'

import { motion, useAnimation, PanInfo } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface SwipeableCardProps {
  children: ReactNode
  rightAction?: ReactNode
  leftAction?: ReactNode
  rightThreshold?: number
  leftThreshold?: number
  className?: string
}

export function SwipeableCard({
  children,
  rightAction,
  leftAction,
  rightThreshold = 100, // How far to reveal right action (swipe left)
  leftThreshold = -100, // How far to reveal left action (swipe right)
  className = ''
}: SwipeableCardProps) {
  const controls = useAnimation()
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null)

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    const offset = info.offset.x

    if (rightAction && offset < -50) {
      // Swiped left to reveal right action
      controls.start({ x: -rightThreshold })
      setIsOpen('right')
    } else if (leftAction && offset > 50) {
      // Swiped right to reveal left action
      controls.start({ x: -leftThreshold })
      setIsOpen('left')
    } else {
      controls.start({ x: 0 })
      setIsOpen(null)
    }
  }

  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      {/* Background Actions Layer */}
      <div className="absolute inset-0 flex justify-between items-center z-0">
        <div className="h-full flex items-center pl-4 w-1/2 overflow-hidden justify-start">
          {leftAction}
        </div>
        <div className="h-full flex items-center pr-4 w-1/2 overflow-hidden justify-end">
          {rightAction}
        </div>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ 
          left: rightAction ? -rightThreshold : 0, 
          right: leftAction ? -leftThreshold : 0 
        }}
        dragElastic={0.1}
        dragDirectionLock
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ cursor: 'grabbing' }}
        className={`relative z-10 bg-zinc-950 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} h-full w-full rounded-2xl`}
        style={{ touchAction: 'pan-y' }}
        role="group"
        aria-roledescription="swipeable card"
      >
        {children}
        {/* Invisible overlay to close if open */}
        {isOpen && !isDragging && (
          <div 
            className="absolute inset-0 z-20" 
            onClick={(e) => {
              e.stopPropagation();
              controls.start({ x: 0 })
              setIsOpen(null)
            }} 
          />
        )}
      </motion.div>
    </div>
  )
}
