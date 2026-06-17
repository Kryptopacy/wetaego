'use client'

import React, { useState } from 'react'
import { searchDirectory } from '../actions'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DirectorySearch() {
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
    <form onSubmit={handleSearch} className="relative w-full max-w-sm group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-violet-400 transition-colors" />
      </div>
      <input
        type="text"
        name="query"
        className="block w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] focus:bg-white/10"
        placeholder="Find venue menu (e.g. Pacy Grills)..."
        required
      />
      <button 
        type="submit" 
        disabled={isSearching}
        className="absolute inset-y-1.5 right-1.5 px-3 bg-white text-black text-xs font-bold rounded-full hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
      </button>
    </form>
  )
}
