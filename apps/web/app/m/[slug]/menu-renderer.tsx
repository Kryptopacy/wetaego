'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ItemCard } from './item-card'
import { toast } from 'sonner'
import { Tables } from '../../../../../types'
import { Sparkles, Search, X, Globe, ChevronRight } from 'lucide-react'

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
  const [recommendedItems, setRecommendedItems] = useState<Tables<'menu_items'>[]>([])
  const [isPersonalizing, setIsPersonalizing] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // AI Personalization
  useEffect(() => {
    const fetchPersonalization = async () => {
      try {
        const pastStr = localStorage.getItem('pastOrderedItemIds')
        if (!pastStr) return
        const pastItemIds = JSON.parse(pastStr)
        if (!Array.isArray(pastItemIds) || pastItemIds.length === 0) return

        setIsPersonalizing(true)
        const availableItems = initialCategories.flatMap(c => c.menu_items || [])

        const res = await fetch('/api/ai/personalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pastItemIds, availableItems })
        })

        if (res.ok) {
          const { recommendedItemIds } = await res.json()
          if (recommendedItemIds && recommendedItemIds.length > 0) {
            const recs = availableItems.filter((i) => recommendedItemIds.includes(i.id))
            setRecommendedItems(recs)
          }
        }
      } catch (e) {
        console.error('Personalization failed', e)
      } finally {
        setIsPersonalizing(false)
      }
    }
    fetchPersonalization()
  }, [initialCategories])

  // Scroll detection for sticky header and active category
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      const sections = categories.map(c => document.getElementById(`cat-${c.id}`))
      const scrollPos = window.scrollY + 200 // Offset for sticky header
      
      for (const section of sections) {
        if (!section) continue
        if (section.offsetTop <= scrollPos && section.offsetTop + section.offsetHeight > scrollPos) {
          setActiveCat(section.id.replace('cat-', ''))
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categories])

  useEffect(() => {
    try {
      const lang = navigator.language.split('-')[0]
      if (lang && lang !== 'en') {
        const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTargetLang(languageNames.of(lang) || lang)
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
    
    const payload = initialCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      items: (cat.menu_items || []).map((item: Tables<'menu_items'>) => ({
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
      
      const newCategories = initialCategories.map(cat => {
        const translatedCat = translatedCategories.find((tc: { id: string; name?: string; items?: { id: string; name?: string; description?: string }[] }) => tc.id === cat.id)
        if (!translatedCat) return cat
        
        return {
          ...cat,
          name: translatedCat.name || cat.name,
          menu_items: (cat.menu_items || []).map((item: Tables<'menu_items'>) => {
            const tItem = translatedCat.items?.find((ti: { id: string; name?: string; description?: string }) => ti.id === item.id)
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
      toast.success(`Menu is now in ${targetLang} ✨`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to translate menu. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    const query = searchQuery.toLowerCase()
    return categories
      .map(category => ({
        ...category,
        menu_items: category.menu_items?.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.description?.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.menu_items && category.menu_items.length > 0)
  }, [categories, searchQuery])

  return (
    <div className="relative pb-32">
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm"
          >
            <div className="bg-zinc-900/95 dark:bg-white/95 backdrop-blur-xl text-white dark:text-zinc-900 p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Translate Menu?</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Switch to {targetLang}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowPrompt(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleTranslate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Yes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header with Search & Navigation */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-2xl shadow-sm border-b border-zinc-200/50 dark:border-zinc-800/50 pt-3 pb-3' : 'bg-transparent pt-4 pb-4'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients..."
              className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {!searchQuery && !isTranslating && categories.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
              >
                {categories.map((category) => {
                  const isActive = activeCat === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        const el = document.getElementById(`cat-${category.id}`)
                        if (el) {
                          const y = el.getBoundingClientRect().top + window.scrollY - 180
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
                      className={`shrink-0 px-5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-300 ${
                        isActive 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md transform scale-105' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6">
        {isTranslating && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Translating culinary terms...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isTranslating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {!searchQuery && (recommendedItems.length > 0 || isPersonalizing) && (
                <section className="scroll-mt-40">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                      For You
                    </h2>
                    {isPersonalizing && (
                      <div className="ml-2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  <div className="grid gap-4">
                    {recommendedItems.map(item => (
                      <ItemCard key={`rec-${item.id}`} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {filteredCategories.map((category) => (
                <section 
                  key={category.id} 
                  id={`cat-${category.id}`} 
                  className="scroll-mt-[180px]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                      {category.name}
                      <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                    </h2>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 ml-4"></div>
                  </div>
                  
                  <div className="grid gap-4">
                    {category.menu_items?.map(item => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}

              {filteredCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-900 dark:text-white font-bold text-lg">No matches found</p>
                  <p className="text-zinc-500 mt-2 max-w-sm">We couldn&apos;t find any items matching &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
