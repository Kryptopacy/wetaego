'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface AiGenerateButtonProps {
  onGenerate: () => Promise<void>
  tooltip?: string
  className?: string
}

export function AiGenerateButton({ onGenerate, tooltip = 'Generate with AI', className = '' }: AiGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleClick = async () => {
    setIsGenerating(true)
    try {
      await onGenerate()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isGenerating}
      title={tooltip}
      className={`p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all disabled:opacity-50 ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
    </button>
  )
}
