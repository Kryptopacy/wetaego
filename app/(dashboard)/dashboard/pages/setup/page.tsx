import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Link from 'next/link'
import {
  BUSINESS_TYPE_GROUPS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BUSINESS_TYPE_PRESETS,
  getPresetsByGroup,
} from '@/lib/templates/presets'
import { setBusinessTypeAction } from '../actions'

export default async function BusinessTypeSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; from?: string }>
}) {
  const { mode = 'primary' } = await searchParams
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) redirect('/login')

  const userId = user.id

  let org: { id: string; name: string; business_type: string | null } | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('organizations(id, name, business_type)')
    .eq('user_id', userId)
    .single()

  if (member?.organizations) {
    org = member.organizations as unknown as typeof org
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, business_type')
      .eq('created_by', userId)
      .single()
    org = data
  }

  if (!org) redirect('/dashboard')

  const isPrimary = mode === 'primary'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 h-16 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
        <Link href="/dashboard/pages" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page Setup</div>
        <div className="w-16" />
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-16">
        {/* Hero copy */}
        <div className="text-center mb-16">
          {isPrimary ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
                First-time setup
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                What kind of business<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-white to-zinc-400">
                  are you running?
                </span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light leading-relaxed">
                We&apos;ll set everything up for you automatically — the right template, billing settings, and AI tools for your business type. You can adjust anything afterward.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Add a new page
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light">
                Choose the type of page that fits what you want to publish. Each type comes fully configured with the right tools.
              </p>
            </>
          )}
        </div>

        {/* Business type groups */}
        <div className="space-y-12">
          {BUSINESS_TYPE_GROUPS.map((group) => {
            const presets = getPresetsByGroup(group.id)
            if (presets.length === 0) return null

            return (
              <div key={group.id}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-base font-bold text-white">{group.label}</h2>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs text-zinc-600">{group.description}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presets.map(({ key, preset }) => (
                    <form key={key} action={setBusinessTypeAction}>
                      <input type="hidden" name="businessType" value={key} />
                      <input type="hidden" name="orgId" value={org!.id} />
                      <input type="hidden" name="mode" value={mode} />
                      <button
                        type="submit"
                        className="group w-full text-left rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-5 hover:border-violet-500/40 hover:bg-zinc-900 transition-all duration-200 hover:shadow-lg hover:shadow-violet-900/10 active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{preset.icon}</span>
                          {/* Template type badge */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${templateBadge(preset.template_type)}`}>
                            {templateLabel(preset.template_type)}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm mb-1 group-hover:text-violet-200 transition-colors">
                          {preset.label}
                        </h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {preset.billing_enabled && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Billing
                            </span>
                          )}
                          {preset.billing_mode === 'table_service' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              KDS
                            </span>
                          )}
                          {preset.payment_mode === 'deposit' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Deposits
                            </span>
                          )}
                        </div>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Advanced option */}
        <div className="mt-16 pt-8 border-t border-white/[0.05] text-center">
          <p className="text-zinc-600 text-sm mb-4">
            Need something different? Build from scratch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(['info', 'custom'] as const).map((type) => (
              <form key={type} action={setBusinessTypeAction}>
                <input type="hidden" name="businessType" value={type} />
                <input type="hidden" name="orgId" value={org!.id} />
                <input type="hidden" name="mode" value={mode} />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all text-sm font-medium"
                >
                  {type === 'info' ? '📄 Info / Policy Page' : '✏️ Custom (Blank)'}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function templateLabel(type: string): string {
  const labels: Record<string, string> = {
    catalog: 'Catalog',
    booking: 'Bookings',
    listing: 'Listings',
    rate_card: 'Rate Card',
    info: 'Info',
    custom: 'Custom',
  }
  return labels[type] ?? type
}

function templateBadge(type: string): string {
  const styles: Record<string, string> = {
    catalog: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    booking: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    listing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rate_card: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    info: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    custom: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  return styles[type] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}
