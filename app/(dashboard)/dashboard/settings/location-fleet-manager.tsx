'use client'

import { useState } from 'react'
import { Building2, Sparkles, Plus, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/submit-button'
import { createLocation } from './actions'
import { EnterpriseQuoteModal } from '@/components/enterprise-quote-modal'
import Link from 'next/link'

interface LocationFleetManagerProps {
  locations: {
    id: string
    name: string
    slug: string
    address?: string | null
  }[]
  currentLocationId: string
  subscriptionTier: string
  companyName: string
}

export function LocationFleetManager({
  locations,
  currentLocationId,
  subscriptionTier,
  companyName
}: LocationFleetManagerProps) {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const isEnterprise = subscriptionTier === 'enterprise' || subscriptionTier === 'scale'
  const isEligibleToCreateDirectly = isEnterprise || locations.length === 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Fleet & Physical Branches
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your physical retail stores, restaurant branches, and venues across different cities.
          </p>
        </div>

        {!isEnterprise && locations.length >= 1 && (
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Add Branches (Enterprise Fleet)
          </button>
        )}
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const isCurrent = loc.id === currentLocationId
          return (
            <div
              key={loc.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent 
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                  : 'bg-zinc-800/40 border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-white text-base">{loc.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono mb-2">/m/{loc.slug}</p>
                {loc.address && (
                  <p className="text-xs text-zinc-500 line-clamp-1">{loc.address}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <Link
                  href={`/m/${loc.slug}`}
                  target="_blank"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  View Public Menu
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <ActionForm action={async () => {
                  const { setActiveLocationCookie } = await import('@/app/(dashboard)/layout-actions')
                  return setActiveLocationCookie(loc.id)
                }}>
                  <button
                    type="submit"
                    disabled={isCurrent}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                      isCurrent
                        ? 'text-zinc-500 border-zinc-800 bg-zinc-900 cursor-default'
                        : 'text-white border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {isCurrent ? 'Current' : 'Switch Context'}
                  </button>
                </ActionForm>
              </div>
            </div>
          )
        })}
      </div>

      {/* Creation / Upgrade Block */}
      <div className="pt-6 border-t border-zinc-800/50">
        {isEligibleToCreateDirectly ? (
          <div>
            <h3 className="text-md font-bold text-white mb-1">Launch New Location</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Add another physical store to your Enterprise fleet. It will feature independent stock, orders, and localized staff access.
            </p>

            <ActionForm action={createLocation} successMessage="Location launched! Switching context..." triggerConfettiOnSuccess className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Branch Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                    placeholder="e.g. Lekki Mega Store or Ikeja Branch"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">URL Slug</label>
                  <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden focus-within:border-emerald-500">
                    <span className="px-4 text-zinc-500">/m/</span>
                    <input
                      type="text"
                      name="slug"
                      required
                      pattern="[a-z0-9\-]+"
                      className="w-full bg-transparent py-2.5 text-white outline-none"
                      placeholder="supermarket-ikeja"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <SubmitButton className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                  + Launch New Branch
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        ) : (
          /* Enterprise Upgrade CTA for Multi-Branch */
          <div className="bg-linear-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-lg">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                Enterprise Fleet Scaling
              </div>
              <h3 className="text-lg font-bold text-white">Looking to open multiple branches or a supermarket chain?</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                Multi-branch fleet management unlocks Global HQ cross-branch analytics, 1-click master catalog cloning across stores, and tiered branch manager permissions.
              </p>
            </div>

            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 shrink-0"
            >
              Get Custom Fleet Pricing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Enterprise Quote Modal */}
      <EnterpriseQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        initialBranches={locations.length + 1}
        defaultCompanyName={companyName}
      />
    </div>
  )
}
