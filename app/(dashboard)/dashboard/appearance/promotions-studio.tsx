'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tag, Sparkles, Percent, Check, Flame, Gift, Moon, Zap, Ban } from 'lucide-react'
import { saveLocationPromotions } from '../settings/promotions-actions'

interface PromotionPreset {
  id: string
  title: string
  icon: typeof Flame
  percentage: number
  bannerText: string
  description: string
  color: string
}

const PROMOTION_PRESETS: PromotionPreset[] = [
  {
    id: 'happy_hour',
    title: 'Happy Hour Flash Sale',
    icon: Flame,
    percentage: 20,
    bannerText: '🎉 Happy Hour: 20% off all orders placed in the next 2 hours!',
    description: '20% off with urgent flash-sale headline',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60'
  },
  {
    id: 'grand_opening',
    title: 'Grand Opening Special',
    icon: Sparkles,
    percentage: 15,
    bannerText: '✨ Grand Opening Celebration! Enjoy 15% off your entire selection today.',
    description: '15% celebration discount for new customers',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:border-purple-500/60'
  },
  {
    id: 'weekend_special',
    title: 'Weekend Special',
    icon: Zap,
    percentage: 10,
    bannerText: '⚡ Weekend Special: 10% instant discount applied automatically at checkout.',
    description: '10% sitewide weekend booster',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60'
  },
  {
    id: 'welcome_offer',
    title: 'Welcome First Order',
    icon: Gift,
    percentage: 5,
    bannerText: '🎁 Welcome to our digital storefront! Enjoy 5% off your order.',
    description: '5% introductory welcoming gesture',
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:border-blue-500/60'
  },
  {
    id: 'late_night',
    title: 'Late Night Delight',
    icon: Moon,
    percentage: 15,
    bannerText: '🌙 Late Night Specials: 15% off all items after dark.',
    description: '15% night-owl rush incentive',
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-500/60'
  }
]

export function PromotionsStudio({
  pageId,
  initialEnabled = false,
  initialPercentage = 0,
  initialBannerText = '',
  onPromotionChanged
}: {
  pageId: string
  initialEnabled?: boolean
  initialPercentage?: number
  initialBannerText?: string
  onPromotionChanged?: () => void
}) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [percentage, setPercentage] = useState(initialPercentage || 0)
  const [bannerText, setBannerText] = useState(initialBannerText || '')
  const [isPending, startTransition] = useTransition()

  function applyPreset(preset: PromotionPreset) {
    setIsEnabled(true)
    setPercentage(preset.percentage)
    setBannerText(preset.bannerText)

    saveChanges(true, preset.percentage, preset.bannerText)
  }

  function disablePromotions() {
    setIsEnabled(false)
    saveChanges(false, 0, '')
  }

  function saveChanges(enabled: boolean, pct: number, text: string) {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('pageId', pageId)
        if (enabled) formData.append('global_discount_enabled', 'on')
        formData.append('global_discount_percentage', pct.toString())
        formData.append('global_discount_banner_text', text)

        const res = await saveLocationPromotions(formData)
        if (res?.data?.success) {
          toast.success(enabled ? 'Promotional campaign active!' : 'Promotions turned off.')
          onPromotionChanged?.()
        } else {
          toast.error(res?.serverError || 'Failed to update promotion')
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to save')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          Merchandising & Promo Presets
        </h3>
        <p className="text-xs text-zinc-400">
          Pick a 1-click promotional preset to instantly activate banner merchandising and checkout discounts.
        </p>
      </div>

      {/* 1-Click Preset Cards */}
      <div className="space-y-2.5">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Instant Preset Campaigns
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {PROMOTION_PRESETS.map((preset) => {
            const Icon = preset.icon
            const isCurrent = isEnabled && percentage === preset.percentage && bannerText === preset.bannerText

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={isPending}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : `border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80`
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg border ${preset.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{preset.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-semibold text-emerald-400 border border-zinc-700">
                        {preset.percentage}% OFF
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{preset.description}</p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="shrink-0 p-1 rounded-full bg-emerald-500 text-black">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            )
          })}

          {isEnabled && (
            <button
              type="button"
              onClick={disablePromotions}
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 hover:border-red-500/40 bg-zinc-900/40 hover:bg-red-500/10 text-xs font-semibold text-zinc-400 hover:text-red-400 flex items-center justify-center gap-2 transition-all"
            >
              <Ban className="w-3.5 h-3.5" />
              Turn Off Active Promotions
            </button>
          )}
        </div>
      </div>

      {/* Manual Fine-Tuning Section */}
      <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-zinc-400" />
            Custom Fine-Tuning
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => {
                const next = e.target.checked
                setIsEnabled(next)
                saveChanges(next, percentage, bannerText)
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {isEnabled && (
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>Discount Percentage</span>
                <span className="font-bold text-white">{percentage}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Banner Announcement Text</label>
              <textarea
                rows={2}
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="e.g. 🎉 Special Flash Sale: 20% off all orders tonight!"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => saveChanges(isEnabled, percentage, bannerText)}
              disabled={isPending}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isPending ? 'Applying...' : 'Update Promotional Campaign'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
