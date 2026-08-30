'use client'

import { useState } from 'react'
import { resetFlagshipDemo } from './actions'
import { toast } from 'sonner'
import { RotateCcw, CheckCircle2, Loader2, Sparkles, ExternalLink } from 'lucide-react'

export function ResetDemoButton({ variant = 'header' }: { variant?: 'header' | 'danger_zone' }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastReset, setLastReset] = useState<string | null>(null)

  const handleReset = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      const res = await resetFlagshipDemo({})
      if (res?.data?.success) {
        toast.success('Flagship Demo Re-Seeded!', {
          description: 'Pacy Group restored with 76 curated items across all 9 concept storefronts.',
          duration: 6000
        })
        setLastReset(new Date().toLocaleTimeString())
      } else {
        toast.error('Failed to reset demo', {
          description: res?.serverError || 'Check admin credentials in Supabase.'
        })
      }
    } catch (err) {
      toast.error('Reset error', {
        description: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'danger_zone') {
    return (
      <div className="p-5 bg-zinc-950/60 border border-emerald-500/20 rounded-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Reset Flagship Showcase (/m/demo)</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Nukes any stale/polluted demo rows and re-provisions the full 9-concept Pacy Group catalog (76 items with rich variants, doneness, storage, sizes, images, and live WebMCP support).
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {loading ? 'Re-seeding Catalog...' : 'Reset Demo Data'}
          </button>
        </div>

        {lastReset && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Last reset at {lastReset}. Ready for live demos &amp; WebMCP crawls.</span>
            <a
              href="/m/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 underline text-emerald-300 hover:text-white"
            >
              View /m/demo <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {showConfirm && (
          <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-300">Re-seed all 9 Pacy concepts and 76 items now?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        {loading ? 'Re-seeding...' : 'Reset Demo Showcase'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Flagship Demo Showcase</h3>
                <p className="text-xs text-zinc-400">Restore Pacy Group (/m/demo) to 76 pristine items</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This will purge any test orders or outdated items under the flagship demo and seed all 9 concept storefronts (Restaurant, Spa, Boutique, Gadgets, Stays, Hotels, Repairs, Media, Links) with verified imagery and multi-variant specs.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition shadow-lg shadow-emerald-500/20"
              >
                Yes, Re-Seed Showcase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
