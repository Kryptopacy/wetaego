'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SettingsNavigationProps {
  currentTab: string
  isOwnerOrManager: boolean
}

export function SettingsNavigation({ currentTab, isOwnerOrManager }: SettingsNavigationProps) {
  const router = useRouter()

  const tabs = [
    ...(isOwnerOrManager ? [
      { id: 'general', label: 'General & Payments' },
      { id: 'venue', label: 'Venue Information' },
      { id: 'ai', label: 'AI Assistant' },
      { id: 'promotions', label: 'Promotions' },
      { id: 'portal', label: 'Portal Customization' },
      { id: 'kyc', label: 'KYC & Compliance' },
    ] : []),
    ...(isOwnerOrManager ? [
      { id: 'loyalty', label: 'Loyalty & CRM' },
      { id: 'addons', label: 'Add-ons' },
      { id: 'taxes', label: 'Taxes & Fees' },
    ] : []),
  ]

  return (
    <>
      {/* Mobile Layout: Custom Dropdown */}
      <div className="md:hidden relative mb-6">
        <label className="sr-only">Select Settings Tab</label>
        <select
          value={currentTab}
          onChange={(e) => router.push(`?tab=${e.target.value}`)}
          className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Desktop Layout: Vertical Sidebar */}
      <div className="hidden md:flex flex-col space-y-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}`}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
