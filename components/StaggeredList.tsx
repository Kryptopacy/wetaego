'use client'

import { motion } from 'framer-motion'
import { ReactNode, Children, isValidElement } from 'react'

interface StaggeredListProps {
  children: ReactNode
  className?: string
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {Children.map(children, child => {
        if (isValidElement(child)) {
          // Check if child is a Fragment, if so, we should probably wrap its children
          // But to keep it simple, we wrap the direct child in a motion.div
          // However, if we're rendering tr elements inside a tbody, motion.div breaks the table layout!
          // So StaggeredList is better used for flex/grid items.
          return <motion.div variants={item} className="h-full w-full">{child}</motion.div>
        }
        return child
      })}
    </motion.div>
  )
}
