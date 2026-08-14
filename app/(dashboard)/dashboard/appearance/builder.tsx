'use client'

import { useState, useRef, useEffect } from 'react'
import { DesignTokensEditor } from '../settings/design-tokens-editor'
import { AICoverStudio } from '../settings/ai-cover-studio'
import { Monitor, Smartphone, Wand2, Palette, RotateCw, Minimize2 } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'tokens' | 'ai_cover'>('tokens')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Scope selector state
  const [scope, setScope] = useState<'global' | string>('global') // 'global' or pageId
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
    ? `/m/${storefrontSlug}?preview=true` 
    : `/m/${storefrontSlug}/p/${selectedPage?.slug}?preview=true`
  const iframeSrc = refreshKey ? `${baseSrc}&_v=${refreshKey}` : baseSrc

  function handleCoverGenerated(newUrl: string) {
    setCurrentCover(newUrl)
    setRefreshKey(prev => prev + 1)
  }

  const renderSidebarContent = () => (
    <>
      {/* Tab Switcher */}
      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'tokens'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Style & Tokens
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai_cover')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ai_cover'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-blue-400" />
          Hero Visuals
        </button>
      </div>

      {activeTab === 'ai_cover' ? (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-blue-400" />
              AI Hero Cover Generator
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Generate unique, photorealistic architectural covers tailored to your venue and preview them live.
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
          <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Editing Scope</label>
            <select 
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-zinc-800 text-white border-zinc-700 rounded-lg p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="global">Global (All Pages)</option>
              {pages.map(p => (
                <option key={p.id} value={p.id}>Page: {p.title}</option>
              ))}
            </select>
            {scope !== 'global' && (
              <p className="text-xs text-zinc-500 mt-2">
                Any changes made here will only apply to {selectedPage?.title}, overriding the Global aesthetic.
              </p>
            )}
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
    </>
  )

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] -m-4 md:-m-8 overflow-hidden bg-black">
      
      {/* Desktop Sidebar Controls (Hidden on mobile) */}
      <div className="hidden md:block w-96 border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-6 scrollbar-hide">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-white">Storefront Builder</h1>
          <button
            type="button"
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="Refresh Preview"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm text-zinc-400 mb-6">Real-time appearance & hero customization.</p>
        
        {renderSidebarContent()}
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar for device toggle */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-zinc-400 px-2 py-1 rounded-md bg-zinc-800">
              ourmenuos.online/m/{storefrontSlug}
            </div>
          </div>
          
          <div className="hidden md:flex items-center bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50">
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-md transition-all ${device === 'mobile' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-md transition-all ${device === 'desktop' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile toggle button */}
          <button 
            className="md:hidden bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            onClick={() => setIsSheetOpen(true)}
          >
            Edit Appearance
          </button>
        </div>

        {/* Iframe Canvas */}
        <div className="flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center p-4">
          <div 
            className={`transition-all duration-300 ease-in-out bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 ${
              device === 'mobile' ? 'w-93.75 h-203' : 'w-full h-full rounded-lg border-none shadow-none'
            }`}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full bg-white"
              style={{ border: 'none' }}
            />
          </div>
        </div>

        {/* Mobile Bottom Sheet (Drawer) */}
        {isSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSheetOpen(false)} />
            <div className="relative bg-zinc-950 w-full h-[85vh] rounded-t-3xl border-t border-zinc-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* Grab Handle */}
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 mb-1" />

              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Appearance</h3>
                  <p className="text-xs text-zinc-400">Live preview update as you edit</p>
                </div>
                <button onClick={() => setIsSheetOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-24">
                {renderSidebarContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
