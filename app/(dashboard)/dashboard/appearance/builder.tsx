'use client'

import { useState, useRef, useEffect } from 'react'
import { DesignTokensEditor } from '../settings/design-tokens-editor'
import { AICoverStudio } from '../settings/ai-cover-studio'
import { PromotionsStudio } from './promotions-studio'
import { Monitor, Smartphone, Wand2, Palette, RotateCw, Megaphone, Eye, Sliders, ExternalLink, Sparkles, Laptop, Plus } from 'lucide-react'
import Link from 'next/link'

export function LiveBuilder({
  locationId,
  initialTokens,
  themeColor,
  coverImageUrl,
  creditsRemaining = 0,
  storefrontSlug,
  pages,
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
  const [tokens, setTokens] = useState(initialTokens)
  const [currentCover, setCurrentCover] = useState(coverImageUrl)
  const [activeTab, setActiveTab] = useState<'tokens' | 'ai_cover' | 'promos'>('tokens')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [mobileViewMode, setMobileViewMode] = useState<'editor' | 'preview'>('editor')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Scope selector state
  const [scope, setScope] = useState<'global' | string>(() => {
    if (pages.length > 1) return 'global'
    return pages[0]?.id || 'global'
  })
  const currentTokens = scope === 'global' ? tokens : (pages.find(p => p.id === scope)?.design_tokens || tokens)

  // Whenever tokens change, send a postMessage to the iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LIVE_PREVIEW_TOKENS',
        tokens: currentTokens,
        isGlobal: scope === 'global',
        pageId: scope === 'global' ? undefined : scope
      }, '*')
    }
  }, [currentTokens, scope])

  const selectedPage = pages.find(p => p.id === scope)
  const baseSrc = scope === 'global' 
    ? (pages.length === 1 ? `/m/${storefrontSlug}/p/${pages[0]?.slug}?preview=true` : `/m/${storefrontSlug}?preview=true`)
    : `/m/${storefrontSlug}/p/${selectedPage?.slug}?preview=true`
  const iframeSrc = refreshKey ? `${baseSrc}&_v=${refreshKey}` : baseSrc

  function handleCoverGenerated(newUrl: string) {
    setCurrentCover(newUrl)
    setRefreshKey(prev => prev + 1)
  }

  const renderSidebarContent = () => (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
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
          {/* Scope Selector */}
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
                className="w-full bg-zinc-950 text-white border-zinc-800 rounded-xl p-3 text-xs font-bold focus:ring-emerald-500 focus:border-emerald-500"
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
              <span className="text-[11px] text-zinc-500">Need another menu or catalog?</span>
              <Link href="/dashboard/menus" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> + New Page
              </Link>
            </div>
          </div>

          <DesignTokensEditor 
            locationId={locationId} 
            initialTokens={currentTokens} 
            onTokensChange={(newTokens) => {
              if (scope === 'global') setTokens(newTokens)
            }}
            isLiveBuilder={true}
            pageId={scope === 'global' ? undefined : scope}
          />
        </>
      )}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] -m-4 md:-m-8 overflow-hidden bg-black text-zinc-100">
      
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'editor'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Customize Design
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'preview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>
      </div>

      {/* Desktop Left Sidebar (Always Visible on PC) */}
      <div className="hidden md:block w-[420px] shrink-0 border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-6 scrollbar-hide">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Storefront Builder
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Real-time design token customizer & live studio.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="Refresh Preview Canvas"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6">
          {renderSidebarContent()}
        </div>
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
                className={`p-1.5 rounded-lg transition-all ${device === 'mobile' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-lg transition-all ${device === 'desktop' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xl shadow-blue-900/50 hover:bg-blue-500 active:scale-95 transition-all"
          >
            <Sliders className="w-4 h-4" />
            Back to Customize
          </button>
        </div>
      </div>
    </div>
  )
}
