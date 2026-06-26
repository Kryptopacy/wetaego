import React from 'react'

export function PreviewBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 py-2 px-4 text-center text-sm font-medium z-50 sticky top-0 backdrop-blur-md">
      <span className="font-bold mr-2 uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">Preview Mode</span>
      This page is hidden from the public. Only you can see it.
    </div>
  )
}
