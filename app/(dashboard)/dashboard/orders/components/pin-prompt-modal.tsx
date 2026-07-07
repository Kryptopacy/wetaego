'use client'

import { useState } from 'react'

interface PINPromptModalProps {
  title: string
  description: string
  actionLabel: string
  onConfirm: (pin: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export function PINPromptModal({ title, description, actionLabel, onConfirm, onCancel, isLoading }: PINPromptModalProps) {
  const [pin, setPin] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{description}</p>
        
        <input
          type="password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter Manager PIN"
          maxLength={6}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] text-lg placeholder-zinc-500 placeholder:tracking-normal focus:outline-none focus:border-red-500/50 mb-6"
        />
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={!pin || pin.length < 4 || isLoading}
            onClick={() => onConfirm(pin)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : null}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
