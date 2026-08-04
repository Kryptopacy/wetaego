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
      { id: 'locations', label: 'Manage Locations' },
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

  const advancedLinks = isOwnerOrManager ? [
    { href: '/dashboard/deals', label: 'Deals & Sales' },
    { href: '/dashboard/promotions', label: 'Promo Codes' },
    { href: '/dashboard/ads', label: 'Ad Manager' },
    { href: '/dashboard/resources', label: 'Resources & QRs' },
    { href: '/dashboard/availability', label: 'Availability Engine' },
    { href: '/dashboard/webhooks', label: 'Outbound Webhooks' },
    { href: '/dashboard/manage/feedback', label: 'Feedback Inbox' },
  ] : []

  return (
    <>
      {/* Mobile Layout: Custom Dropdown */}
      <div className="md:hidden relative mb-6">
        <label className="sr-only">Select Settings Tab</label>
        <select
          value={currentTab}
          onChange={(e) => {
            const val = e.target.value
            if (val.startsWith('link:')) {
              router.push(val.replace('link:', ''))
            } else {
              router.push(`?tab=${val}`)
            }
          }}
          className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
          {advancedLinks.length > 0 && (
            <optgroup label="Apps & Integrations">
              {advancedLinks.map((link) => (
                <option key={link.href} value={`link:${link.href}`}>
                  {link.label}
                </option>
              ))}
            </optgroup>
          )}
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

        {advancedLinks.length > 0 && (
          <>
            <div className="mt-8 mb-2 px-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apps & Integrations</h3>
            </div>
            {advancedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent flex items-center justify-between group"
              >
                <span>{link.label}</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </>
        )}
      </div>
    </>
  )
}
