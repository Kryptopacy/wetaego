'use client'

import { useState, useEffect } from 'react'
import { ItemCard } from './item-card'
import { toast } from 'sonner'
import { Tables } from '../../../../../types'

export type CategoryWithItems = Tables<'menu_categories'> & {
  menu_items?: Tables<'menu_items'>[]
}

export function MenuRenderer({ initialCategories }: { initialCategories: CategoryWithItems[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [isTranslating, setIsTranslating] = useState(false)
  const [targetLang, setTargetLang] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [activeCat, setActiveCat] = useState<string>(initialCategories[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(c => document.getElementById(`cat-${c.id}`))
      const scrollPos = window.scrollY + 150 // Offset for sticky header
      
      for (const section of sections) {
        if (!section) continue
        if (section.offsetTop <= scrollPos && section.offsetTop + section.offsetHeight > scrollPos) {
          setActiveCat(section.id.replace('cat-', ''))
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categories])

  useEffect(() => {
    // Detect non-English browser language
    try {
      const lang = navigator.language.split('-')[0]
      if (lang && lang !== 'en') {
        const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
        setTargetLang(languageNames.of(lang) || lang)
        setShowPrompt(true)
      }
    } catch (e) {
      console.warn("Language detection failed", e)
    }
  }, [])

  async function handleTranslate() {
    if (!targetLang) return
    setIsTranslating(true)
    setShowPrompt(false)
    toast.info(`Translating menu to ${targetLang}...`)
    
    // We only send the exact data we need translated to save tokens and speed up the response
    const payload = initialCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      items: (cat.menu_items || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description
      }))
    }))

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ targetLanguage: targetLang, menuData: payload }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Translation failed')
      
      const { categories: translatedCategories } = await res.json()
      
      // Merge translated fields back into the full categories array so we don't lose prices, images, etc.
      const newCategories = initialCategories.map(cat => {
        const translatedCat = translatedCategories.find((tc: any) => tc.id === cat.id)
        if (!translatedCat) return cat
        
        return {
          ...cat,
          name: translatedCat.name || cat.name,
          menu_items: (cat.menu_items || []).map((item: any) => {
            const tItem = translatedCat.items?.find((ti: any) => ti.id === item.id)
            if (!tItem) return item
            return {
              ...item,
              name: tItem.name || item.name,
              description: tItem.description || item.description
            }
          })
        }
      })
      
      setCategories(newCategories)
      toast.success('Menu translated successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to translate menu. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="space-y-10 relative">
      {/* Edge Translation Prompt */}
      {showPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
            <div className="text-sm font-medium flex items-center gap-2">
              <span className="text-xl">🌍</span> Translate menu to <span className="font-bold">{targetLang}</span>?
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={handleTranslate}
                className="bg-white text-indigo-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-zinc-100 transition-colors shadow-sm"
              >
                Translate
              </button>
              <button 
                onClick={() => setShowPrompt(false)}
                className="text-white/60 hover:text-white px-2 py-1 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {isTranslating && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-medium">Translating culinary terms...</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!isTranslating && categories.length > 0 && (
        <div className="sticky top-0 z-50 bg-[#f5f7f5]/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 -mx-6 px-6 pt-2 pb-3 mb-6 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0f7b55]/50 transition-shadow text-[#17201b] dark:text-zinc-100 placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sticky Category Navigation (Only show if not searching) */}
          {!searchQuery && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    const el = document.getElementById(`cat-${category.id}`)
                    if (el) window.scrollTo({ top: el.offsetTop - 150, behavior: 'smooth' })
                  }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                    activeCat === category.id 
                      ? 'bg-[#17201b] dark:bg-white text-white dark:text-black shadow-md' 
                      : 'bg-black/5 dark:bg-white/5 text-[#69746c] dark:text-zinc-400 hover:text-[#17201b] dark:hover:text-white border border-transparent dark:border-white/5'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Categories */}
      {!isTranslating && categories
        .map(category => {
          // If searching, filter items
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const filteredItems = category.menu_items?.filter(item => 
              item.name.toLowerCase().includes(query) || 
              item.description?.toLowerCase().includes(query)
            )
            return { ...category, menu_items: filteredItems }
          }
          return category
        })
        .filter(category => !searchQuery || (category.menu_items && category.menu_items.length > 0))
        .map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-40 mb-8">
            <h2 className="text-[18px] font-black text-[#17201b] dark:text-zinc-100 mb-2">{category.name}</h2>
            <div className="space-y-0">
            {category.menu_items?.length === 0 && (
              <p className="text-sm text-zinc-500 italic py-4">No items available.</p>
            )}
            {category.menu_items?.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {categories.length === 0 && !searchQuery && (
        <p className="text-center text-[#69746c] dark:text-zinc-500 py-12">This menu is currently empty.</p>
      )}

      {searchQuery && categories.every(cat => !cat.menu_items?.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase()))) && (
        <div className="text-center py-12">
          <p className="text-[#17201b] dark:text-zinc-300 font-medium text-lg">No matches found</p>
          <p className="text-[#69746c] dark:text-zinc-500 text-sm mt-1">We couldn't find any items matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}
