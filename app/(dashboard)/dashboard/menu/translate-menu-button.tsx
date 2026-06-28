
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { applyTranslations } from './actions'

interface TranslateMenuButtonProps {
  orgId: string
  categories: { id: string, name: string, menu_items?: { id: string, name: string, description: string | null }[] }[]
}

const LANGUAGES = [
  'Spanish', 'French', 'Arabic', 'Chinese', 'Portuguese', 'German', 'Italian'
]

export function TranslateMenuButton({ orgId, categories }: TranslateMenuButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])

  async function handleTranslate() {
    if (!categories || categories.length === 0) {
      toast.error('Your menu is empty!')
      return
    }

    const cost = categories.length * 2
    if (!window.confirm(`Translate your menu to ${selectedLang}? This will permanently overwrite current names and descriptions and will consume ${cost} Credits.`)) {
      return
    }

    setIsTranslating(true)
    try {
      // Map categories to the expected API format
      const menuData = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        items: cat.menu_items?.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined
        })) || []
      }))

      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        body: JSON.stringify({ targetLanguage: selectedLang, menuData, organizationId: orgId }),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Translation failed')
      }

      const data = await res.json()
      
      // Update the database via Server Action
      const result = await applyTranslations({ orgId, translatedCategories: data.translatedCategories })
      if (!result?.data?.success) {
        throw new Error('Failed to apply translations to the menu.')
      }

      toast.success(`Menu successfully translated to ${selectedLang}!`)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to translate.')
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        disabled={isTranslating}
        className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      >
        {LANGUAGES.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
      <button 
        onClick={handleTranslate}
        disabled={isTranslating}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
      >
        {isTranslating ? 'Translating...' : 'ðŸŒ Translate Menu'}
      </button>
    </div>
  )
}
