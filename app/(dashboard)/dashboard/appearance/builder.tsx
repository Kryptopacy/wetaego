'use client'

import { useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { DesignTokensEditor } from '../settings/design-tokens-editor'
import { AICoverStudio } from '../settings/ai-cover-studio'
import { PromotionsStudio } from './promotions-studio'
import { quickCreatePageAction } from './actions'
import { saveLocationTheme } from '../settings/actions'
import { Monitor, Smartphone, Wand2, Palette, RotateCw, Megaphone, Eye, Sliders, ExternalLink, Sparkles, Laptop, Plus, X, Layers, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function LiveBuilder({
  locationId,
  initialTokens,
  themeColor: initialThemeColor,
  coverImageUrl,
  creditsRemaining = 0,
  storefrontSlug,
  pages: serverPages = [],
}: {
  locationId: string
  initialTokens: any
  themeColor: string
  coverImageUrl?: string | null
  creditsRemaining?: number
  storefrontSlug: string
  pages: any[]
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [pages, setPages] = useState<any[]>(serverPages)
  const [tokens, setTokens] = useState<any>(initialTokens || {})
  const [themeColor, setThemeColor] = useState(initialThemeColor || '#10b981')
  const [pageTokens, setPageTokens] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {}
    serverPages.forEach(p => {
      map[p.id] = p.design_tokens || initialTokens || {}
    })
    return map
  })
  
  const [currentCover, setCurrentCover] = useState(coverImageUrl)
  const [activeTab, setActiveTab] = useState<'tokens' | 'ai_cover' | 'promos'>('tokens')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [mobileViewMode, setMobileViewMode] = useState<'editor' | 'preview'>('editor')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // In-situ page creation modal states
  const [showNewPageModal, setShowNewPageModal] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageTemplate, setNewPageTemplate] = useState('catalog')
  const [isCreatingPage, startCreatePageTransition] = useTransition()

  // Scope selector state
  const [scope, setScope] = useState<'global' | string>(() => {
    if (serverPages.length > 1) return 'global'
    return serverPages[0]?.id || 'global'
  })

  const currentTokens = scope === 'global' ? tokens : (pageTokens[scope] || tokens)

  // Broadcast tokens to iframe helper
  const broadcastTokens = useCallback((tokensToSend: any, colorToSend?: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LIVE_PREVIEW_TOKENS',
        tokens: tokensToSend,
        themeColor: colorToSend || themeColor,
        isGlobal: scope === 'global',
        pageId: scope === 'global' ? undefined : scope
      }, '*')
    }
  }, [scope, themeColor])

  // Instant token change handler
  const handleTokensChange = (newTokens: any) => {
    if (scope === 'global') {
      setTokens(newTokens)
    } else {
      setPageTokens(prev => ({ ...prev, [scope]: newTokens }))
    }
    broadcastTokens(newTokens, themeColor)
  }

  // Instant theme color change handler
  const handleThemeColorChange = (newColor: string) => {
    setThemeColor(newColor)
    broadcastTokens(currentTokens, newColor)

    // Persist to database in background
    const formData = new FormData()
    formData.append('locationId', locationId)
    formData.append('themeColor', newColor)
    saveLocationTheme(formData).catch(() => {})
  }

  // Send tokens whenever currentTokens or scope changes
  useEffect(() => {
    broadcastTokens(currentTokens, themeColor)
  }, [currentTokens, scope, themeColor, broadcastTokens])

  // Listen for iframe ready message and send latest tokens
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'LIVE_PREVIEW_READY') {
        broadcastTokens(currentTokens, themeColor)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentTokens, themeColor, broadcastTokens])

  const selectedPage = pages.find(p => p.id === scope)
  const baseSrc = scope === 'global' 
    ? (pages.length === 1 ? `/m/${storefrontSlug}/p/${pages[0]?.slug}?preview=true` : `/m/${storefrontSlug}?preview=true`)
    : `/m/${storefrontSlug}/p/${selectedPage?.slug}?preview=true`
  const iframeSrc = refreshKey ? `${baseSrc}&_v=${refreshKey}` : baseSrc

  function handleCoverGenerated(newUrl: string) {
    setCurrentCover(newUrl)
    setRefreshKey(prev => prev + 1)
  }

  function handleQuickCreatePage(e: React.FormEvent) {
    e.preventDefault()
    if (!newPageTitle.trim()) {
      toast.error('Please enter a page title')
      return
    }

    startCreatePageTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('locationId', locationId)
        formData.append('title', newPageTitle.trim())
        formData.append('template_type', newPageTemplate)

        const res = await quickCreatePageAction(formData)
        if (res?.data?.page) {
          const newPage = res.data.page
          setPages(prev => [...prev, newPage])
          setPageTokens(prev => ({ ...prev, [newPage.id]: tokens }))
          setScope(newPage.id)
          setShowNewPageModal(false)
          setNewPageTitle('')
          toast.success(`Created page "${newPage.title}"!`)
        } else {
          toast.error(res?.serverError || 'Failed to create page')
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error creating page')
      }
    })
  }

  const renderSidebarContent = () => (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Aesthetic
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai_cover')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ai_cover'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-blue-400" />
          Hero Cover
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('promos')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'promos'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
          Promotions
        </button>
      </div>

      {activeTab === 'promos' ? (
        <div className="space-y-4">
          <PromotionsStudio
            pageId={(scope === 'global' ? pages[0]?.id : scope) || ''}
            initialEnabled={(scope === 'global' ? pages[0]?.global_discount_enabled : selectedPage?.global_discount_enabled) || false}
            initialPercentage={(scope === 'global' ? pages[0]?.global_discount_percentage : selectedPage?.global_discount_percentage) || 0}
            initialBannerText={(scope === 'global' ? pages[0]?.global_discount_banner_text : selectedPage?.global_discount_banner_text) || ''}
            onPromotionChanged={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      ) : activeTab === 'ai_cover' ? (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-blue-400" />
              AI Hero Cover Studio
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Generate unique, photorealistic architectural headers tailored to your venue and instantly preview them.
            </p>
            <AICoverStudio
              locationId={locationId}
              currentCoverUrl={currentCover}
              creditsRemaining={creditsRemaining}
              onCoverGenerated={handleCoverGenerated}
              compact={true}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Scope Selector with In-Situ Quick Add */}
          <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-wider">
              Customization Target
            </label>
            {pages.length <= 1 ? (
              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-xs font-bold text-white truncate">
                  📄 {pages[0]?.title || 'Storefront Menu'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                  Single Page Mode
                </span>
              </div>
            ) : (
              <select 
                value={scope}
                onChange={(e) => {
                  const newScope = e.target.value
                  setScope(newScope)
                  if (newScope !== 'global') {
                    const p = pages.find(page => page.id === newScope)
                    if (p?.cover_image_url) setCurrentCover(p.cover_image_url)
                  } else {
                    setCurrentCover(coverImageUrl)
                  }
                }}
                className="w-full bg-zinc-950 text-white border-zinc-800 rounded-xl p-3 text-xs font-bold focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                <option value="global">🌐 Portal Hub (All Pages / Landing)</option>
                {pages.map(p => (
                  <option key={p.id} value={p.id}>📄 Page: {p.title}</option>
                ))}
              </select>
            )}
            {scope !== 'global' && pages.length > 1 && (
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Changes made here specifically style <span className="text-zinc-300 font-semibold">{selectedPage?.title}</span>.
              </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-500">Need another menu, wine list, or catalog?</span>
              <button
                type="button"
                onClick={() => setShowNewPageModal(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> + New Page
              </button>
            </div>
          </div>

          <DesignTokensEditor 
            locationId={locationId} 
            initialTokens={currentTokens} 
            themeColor={themeColor}
            onTokensChange={handleTokensChange}
            onThemeColorChange={handleThemeColorChange}
            isLiveBuilder={true}
            pageId={scope === 'global' ? undefined : scope}
          />
        </>
      )}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] -m-4 md:-m-8 overflow-hidden bg-black text-zinc-100 relative">
      
      {/* ── In-Situ Quick Add Page Modal ── */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Create Storefront Page</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Page Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cocktail & Wine List, VIP Lounge, Breakfast"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Template Type
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { type: 'catalog', label: '🍽️ Menu / Catalog', desc: 'Dishes, drinks & goods' },
                    { type: 'booking', label: '📅 Booking & Spa', desc: 'Appointments & slots' },
                    { type: 'rate_card', label: '💼 Rate Card', desc: 'Tiered service pricing' },
                    { type: 'listing', label: '🏨 Rooms & Stays', desc: 'Lodging & amenities' },
                    { type: 'quote', label: '📋 Quote Request', desc: 'Custom project estimates' },
                    { type: 'info', label: 'ℹ️ About & Info', desc: 'Story & venue guidelines' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setNewPageTemplate(t.type)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        newPageTemplate === t.type
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{t.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPage}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isCreatingPage ? 'Creating...' : 'Create & Style Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Header Bar & Mode Switcher */}
      <div className="md:hidden sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 p-3 space-y-2.5">
        {/* Device Recommendation Note */}
        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5 text-[11px] text-blue-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Laptop className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Dual-pane live preview is best on desktop</span>
          </div>
          <Link href={`/m/${storefrontSlug}`} target="_blank" className="flex items-center gap-1 text-blue-400 font-semibold hover:underline">
            Open <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile View Toggle Buttons */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
          <button
            type="button"
            onClick={() => setMobileViewMode('editor')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'editor'
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Customize Design
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'preview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>
      </div>

      {/* Desktop Left Sidebar: Controls & Settings */}
      <div className="hidden md:block w-[400px] border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-6 shrink-0 h-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Storefront Builder</h1>
            <p className="text-xs text-zinc-400 mt-1">Live customize brand themes, AI hero covers, & promotions.</p>
          </div>
        </div>

        {renderSidebarContent()}
      </div>

      {/* Mobile Content Pane: Editor Mode */}
      <div className={`md:hidden flex-1 overflow-y-auto p-4 pb-28 ${mobileViewMode === 'editor' ? 'block' : 'hidden'}`}>
        {renderSidebarContent()}
      </div>

      {/* Main Preview Area (Desktop Dual-Pane & Mobile Preview Mode) */}
      <div className={`flex-1 flex-col relative bg-zinc-950 ${mobileViewMode === 'preview' ? 'flex' : 'hidden md:flex'}`}>
        {/* Top bar for URL display and device switcher */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 max-w-[70%] truncate">
            <span className="text-xs font-mono text-zinc-400 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/40 truncate">
              ourmenuos.online/m/{storefrontSlug}
            </span>
            <Link
              href={`/m/${storefrontSlug}`}
              target="_blank"
              title="Open public storefront in new tab"
              className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop / Mobile Device Mode Toggles */}
            <div className="hidden md:flex items-center bg-zinc-800/80 rounded-xl p-1 border border-zinc-700/50">
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${device === 'mobile' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${device === 'desktop' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Reload Frame"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Canvas Frame */}
        <div className="flex-1 bg-zinc-950 overflow-hidden flex items-center justify-center p-2 sm:p-6">
          <div 
            className={`transition-all duration-300 ease-in-out bg-zinc-900 overflow-hidden ${
              device === 'mobile'
                ? 'w-full max-w-[390px] h-[calc(100vh-140px)] md:h-[740px] rounded-[36px] border-[6px] border-zinc-800 shadow-2xl shadow-black/90'
                : 'w-full h-full rounded-2xl border border-zinc-800 shadow-xl'
            }`}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={() => broadcastTokens(currentTokens, themeColor)}
              className="w-full h-full bg-white"
              style={{ border: 'none' }}
              title="Live Storefront Preview"
            />
          </div>
        </div>

        {/* Mobile floating switch back to customize */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            type="button"
            onClick={() => setMobileViewMode('editor')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xl shadow-blue-900/50 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            Back to Customize
          </button>
        </div>
      </div>
    </div>
  )
}
