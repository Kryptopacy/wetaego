'use client'

import React, { useState } from 'react'
import { searchDirectory } from '../actions'
import { Search, ArrowRight } from 'lucide-react'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'
import { toast } from 'sonner'

export function DirectorySearch({ className = '' }: { className?: string }) {
  const [isSearching, setIsSearching] = useState(false)

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSearching(true)
    const formData = new FormData(e.currentTarget)
    
    const result = await searchDirectory(formData)
    
    // If it redirects, the code below won't execute. If it returns an error, it will.
    if (result?.error) {
      toast.error(result.error)
      setIsSearching(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative w-full group ${className}`} aria-label="Search live store directory">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-emerald-400 group-focus-within:scale-110 transition-transform" />
      </div>
      <input
        type="text"
        name="query"
        aria-label="Venue or brand name"
        className="block w-full pl-11 pr-20 py-3.5 bg-zinc-900/95 border border-white/20 hover:border-white/30 rounded-2xl text-white placeholder-zinc-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        placeholder="Find venue menu (e.g. Pacy Grills)..."
        required
      />
      <button 
        type="submit" 
        disabled={isSearching}
        className="absolute inset-y-2 right-2 px-4 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-zinc-950 text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
      >
        {isSearching ? (
          <GemstoneSpinner size="xs" />
        ) : (
          <>
            <span>Go</span>
            <ArrowRight className="w-3 h-3 stroke-[3]" />
          </>
        )}
      </button>
    </form>
  )
}
