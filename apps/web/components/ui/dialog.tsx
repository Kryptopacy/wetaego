'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function AnimatedDialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

interface AnimatedDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  isOpen: boolean;
  hideCloseButton?: boolean;
  children?: React.ReactNode;
}

export const AnimatedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AnimatedDialogContentProps
>(({ className, children, isOpen, hideCloseButton, ...props }, ref) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
          </DialogPrimitive.Overlay>
          
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 pointer-events-none">
            <DialogPrimitive.Content asChild {...props} ref={ref}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-2xl pointer-events-auto outline-none ${className || ''}`}
              >
                {children}
                
                {!hideCloseButton && (
                  <DialogPrimitive.Close 
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  )
})
AnimatedDialogContent.displayName = 'AnimatedDialogContent'
