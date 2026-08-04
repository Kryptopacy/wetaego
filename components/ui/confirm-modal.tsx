'use client'

import React from 'react'
import { AnimatedDialog, AnimatedDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Zap, AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  cost?: number
  confirmText?: string
  isDestructive?: boolean
  icon?: React.ReactNode
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed with this action?",
  cost,
  confirmText = "Confirm",
  isDestructive = false,
  icon
}: ConfirmModalProps) {
  return (
    <AnimatedDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatedDialogContent isOpen={isOpen} className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {icon ? icon : isDestructive ? <AlertTriangle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white tracking-tight mb-1">{title}</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>

          {cost !== undefined && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-sm font-medium text-zinc-300">Credit Cost</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{cost} Credits</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onConfirm()
              }}
              className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 flex items-center justify-center gap-2 ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 focus:ring-red-500' 
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 focus:ring-blue-500'
              }`}
            >
              {cost !== undefined && <Zap className="w-4 h-4" />}
              {confirmText}
            </button>
          </div>
        </div>
      </AnimatedDialogContent>
    </AnimatedDialog>
  )
}
