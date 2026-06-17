import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tier } from '@/lib/utils/billing'
import { togglePageStatus, deletePage } from './actions'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { BUSINESS_TYPE_PRESETS } from '@/lib/templates/presets'

export default async function PagesManager() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

  if (!user && !isDemo) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  let org: { id: string; subscription_tier: string; purchased_credits: number; monthly_free_credits_used: number; business_type: string | null } | null = null
  let role = 'viewer'
  let locData: { id: string; slug: string } | null = null
  let pages: {
    id: string; title: string; slug: string; is_published: boolean;
    template_type: string; is_primary: boolean; created_at: string
  }[] = []

  if (isDemo) {
    org = { id: 'demo-org', subscription_tier: 'pro', purchased_credits: 0, monthly_free_credits_used: 0, business_type: 'restaurant' }
    role = 'owner'
    locData = { id: 'demo-loc', slug: 'demo-venue' }
    pages = [
      { id: 'page-1', title: "Demo Venue's Menu", slug: 'menu', is_published: true, template_type: 'catalog', is_primary: true, created_at: new Date().toISOString() },
      { id: 'page-2', title: 'Allergen Information', slug: 'allergens', is_published: false, template_type: 'info', is_primary: false, created_at: new Date().toISOString() },
    ]
  } else {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations(id, subscription_tier, purchased_credits, monthly_free_credits_used, business_type)')
      .eq('user_id', userId)
      .single()

    if (member && member.organizations) {
      org = member.organizations as typeof org
      role = member.role
    } else {
      const { data } = await supabase
        .from('organizations')
        .select('id, subscription_tier, purchased_credits, monthly_free_credits_used, business_type')
        .eq('created_by', userId)
        .single()
      org = data
      role = 'owner'
    }

    const { data: locDataResult } = await supabase
      .from('locations')
      .select('id, slug')
      .eq('organization_id', org?.id || '')
      .single()
    locData = locDataResult

    if (locData) {
      const { data: pagesData } = await supabase
        .from('location_pages')
        .select('id, title, slug, is_published, template_type, is_primary, created_at')
        .eq('location_id', locData.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      pages = (pagesData || []) as typeof pages
    }
  }

  if (!org || !locData) {
    return <div className="p-8 text-zinc-500">Please create an organization and a location first.</div>
  }

  // If no pages yet → redirect to the business type wizard (primary setup)
  if (pages.length === 0) {
    redirect('/dashboard/pages/setup?mode=primary')
  }

  const { getFreePagesLimit } = await import('@/lib/utils/billing')
  const freeLimit = await getFreePagesLimit((org.subscription_tier as Tier) || 'starter')
  const { getCreditCosts } = await import('@/lib/utils/settings')
  const creditCosts = await getCreditCosts() as Record<string, number>
  const pageCost = creditCosts.custom_page || 10

  const currentCount = pages.length
  const isOverLimit = currentCount >= freeLimit
  const creditsRemaining = (org.purchased_credits || 0) + Math.max(0, (
    org.subscription_tier === 'pro' ? 50 :
    org.subscription_tier === 'enterprise' ? 200 : 0
  ) - (org.monthly_free_credits_used || 0))

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Pages</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {currentCount} of {freeLimit} free pages used
            {isOverLimit && <span className="text-amber-400 ml-2">· Extra pages cost {pageCost} credits each</span>}
          </p>
        </div>
        <Link
          href="/dashboard/pages/setup?mode=new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Page
        </Link>
      </div>

      {/* Pages list */}
      <div className="space-y-3">
        {pages.map((page) => {
          const fullUrl = `${baseUrl}/m/${locData!.slug}/p/${page.slug}`
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}&color=ffffff&bgcolor=09090b`
          const preset = page.template_type !== 'info' && page.template_type !== 'custom'
            ? Object.values(BUSINESS_TYPE_PRESETS).find(p => p.template_type === page.template_type)
            : null

          return (
            <div
              key={page.id}
              className={`flex items-center justify-between rounded-2xl border p-5 transition-all ${
                page.is_primary
                  ? 'border-violet-500/30 bg-violet-900/10'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-5">
                {/* QR */}
                <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt="QR Code" className="w-14 h-14 rounded-md" crossOrigin="anonymous" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">{page.title}</h3>
                    {page.is_primary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
                        Primary
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${templateBadgeClasses(page.template_type)}`}>
                      {templateTypeLabel(page.template_type)}
                    </span>
                  </div>

                  <Link
                    href={`/m/${locData!.slug}/p/${page.slug}`}
                    target="_blank"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {baseUrl.replace('https://', '')}/m/{locData!.slug}/p/{page.slug}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Share button */}
                <Link
                  href={`/dashboard/pages/${page.id}/share`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                  title="Share"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </Link>

                {/* Edit button */}
                <Link
                  href={`/dashboard/pages/${page.id}/edit`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>

                {/* Publish/Unpublish */}
                <form action={togglePageStatus}>
                  <input type="hidden" name="pageId" value={page.id} />
                  <input type="hidden" name="currentStatus" value={page.is_published.toString()} />
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      page.is_published
                        ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {page.is_published ? 'Live' : 'Hidden'}
                  </button>
                </form>

                {/* Delete */}
                <form action={deletePage}>
                  <input type="hidden" name="pageId" value={page.id} />
                  <button
                    type="submit"
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function templateTypeLabel(type: string): string {
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

function templateBadgeClasses(type: string): string {
  const classes: Record<string, string> = {
    catalog: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    booking: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    listing: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rate_card: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    info: 'bg-zinc-700/50 text-zinc-400 border border-zinc-700',
    custom: 'bg-zinc-700/50 text-zinc-400 border border-zinc-700',
  }
  return classes[type] ?? 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
}
