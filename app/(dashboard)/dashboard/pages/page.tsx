import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tier } from '@/lib/utils/billing'
import { togglePageStatus, deletePage } from './actions'
import { ActionForm } from '@/components/ActionForm'
import Link from 'next/link'
import Image from 'next/image'
import { StaggeredList } from '@/components/StaggeredList'
import { SwipeableCard } from '@/components/SwipeableCard'

import { BUSINESS_TYPE_PRESETS } from '@/lib/templates/presets'
import { ShareButton } from '@/components/ShareButton'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { DuplicatePageModal } from './duplicate-page-modal'

export default async function PagesManager() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const userId = user.id

  let org: { id: string; subscription_tier: string; purchased_credits: number; monthly_free_credits_used: number; business_type: string | null } | null = null
  let locData: { id: string; slug: string } | null = null
  let pages: {
    id: string; title: string; slug: string; is_published: boolean;
    template_type: string; is_primary: boolean; created_at: string;
    business_type_preset?: string; billing_enabled?: boolean; billing_mode?: string
  }[] = []

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, subscription_tier, purchased_credits, monthly_free_credits_used, business_type)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
    org = member.organizations as unknown as typeof org
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id, subscription_tier, purchased_credits, monthly_free_credits_used, business_type')
      .eq('created_by', userId).limit(1).maybeSingle()
    org = data

    org = data
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
      .select('id, title, slug, is_published, template_type, is_primary, created_at, business_type_preset, billing_enabled, billing_mode')
      .eq('location_id', locData.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    pages = (pagesData || []) as typeof pages
  }

  if (!org || !locData) {
    return <div className="p-8 text-zinc-500">Please create an organization and a location first.</div>
  }

  // If no pages yet → redirect to the business type wizard (primary setup)
  if (pages.length === 0) {
    redirect('/dashboard/pages/setup?mode=primary')
  }

  const { getFreePagesLimit } = await import('@/lib/utils/billing')
  const freeLimit = await getFreePagesLimit((org.subscription_tier as Tier) || 'lite')
  const { getCreditCosts } = await import('@/lib/utils/settings')
  const creditCosts = await getCreditCosts() as Record<string, number>
  const pageCost = creditCosts.custom_page || 10

  const currentCount = pages.length
  const isOverLimit = currentCount >= freeLimit
  

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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-200 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Page
        </Link>
      </div>

      {/* Pages list */}
      <StaggeredList className="space-y-3">
        {pages.map((page) => {
          const fullUrl = `${baseUrl}/m/${locData!.slug}/p/${page.slug}`
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}&color=ffffff&bgcolor=09090b`
  
          const presetKey = page.template_type !== 'info' && page.template_type !== 'custom'
            ? Object.keys(BUSINESS_TYPE_PRESETS).find(k => BUSINESS_TYPE_PRESETS[k].template_type === page.template_type)
            : null

          return (
            <SwipeableCard
              key={page.id}
              className="rounded-2xl"
              rightThreshold={100}
              rightAction={
                <div className="flex items-center h-full gap-2">
                  <ActionForm action={deletePage} successMessage="Page deleted successfully" className="h-full">
                    <input type="hidden" name="pageId" value={page.id} />
                    <button type="submit" className="h-full px-4 bg-red-500/20 text-red-400 rounded-xl font-medium flex items-center justify-center">
                      Delete
                    </button>
                  </ActionForm>
                </div>
              }
            >
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 rounded-2xl border p-4 sm:p-5 transition-all w-full h-full ${
                  page.is_primary
                    ? 'border-emerald-500/30 bg-emerald-900/10'
                    : 'border-zinc-800 bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* QR */}
                  <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 shrink-0">
                    { }
                    <Image src={qrImageUrl} alt="QR Code" width={56} height={56} className="w-14 h-14 rounded-md" crossOrigin="anonymous" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{page.title}</h3>
                      {page.is_primary && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${templateBadgeClasses(page.template_type)}`}>
                        {templateTypeLabel(page.template_type)}
                      </span>
                    </div>

                    <Link
                      href={`/m/${locData!.slug}/p/${page.slug}?preview=true`}
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

                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  {/* Stats / Badges */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                      page.is_published 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${page.is_published ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                      {page.is_published ? 'Live' : 'Hidden'}
                    </div>

                    {page.billing_enabled && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {page.billing_mode === 'reservation_deposit' ? 'Deposits' : 'Payments'}
                      </div>
                    )}
                  </div>

                  {/* Primary Action */}
                  <Link
                    href={`/dashboard/pages/builder/${page.template_type === 'custom' || page.template_type === 'info' ? 'hotel' : presetKey}?mode=edit&pageId=${page.id}`}
                    className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors shrink-0"
                  >
                    Edit
                  </Link>

                  {/* Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {/* Share Option */}
                      <DropdownMenuItem asChild>
                        <ShareButton 
                          url={fullUrl} 
                          title={page.title} 
                          className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share Link
                        </ShareButton>
                      </DropdownMenuItem>
                      
                      {/* Duplicate Option */}
                      <DropdownMenuItem asChild>
                        <DuplicatePageModal 
                          sourcePageId={page.id} 
                          sourceTitle={page.title} 
                          sourceSlug={page.slug} 
                        />
                      </DropdownMenuItem>
                      
                      {/* Publish/Unpublish */}
                      <DropdownMenuItem asChild>
                        <ActionForm 
                          action={togglePageStatus} 
                          successMessage={page.is_published ? "Page hidden successfully" : "Page is now live!"}
                          triggerConfettiOnSuccess={!page.is_published}
                        >
                          <input type="hidden" name="pageId" value={page.id} />
                          <input type="hidden" name="currentStatus" value={page.is_published.toString()} />
                          <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer text-left">
                            <div className={`w-2 h-2 rounded-full ${page.is_published ? 'bg-zinc-500' : 'bg-green-500'}`} />
                            {page.is_published ? 'Set as Hidden' : 'Set as Live'}
                          </button>
                        </ActionForm>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />

                      {/* Delete */}
                      <DropdownMenuItem asChild>
                        <ActionForm action={deletePage} successMessage="Page deleted successfully">
                          <input type="hidden" name="pageId" value={page.id} />
                          <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 cursor-pointer text-red-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Page
                          </button>
                        </ActionForm>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SwipeableCard>
          )
        })}
      </StaggeredList>
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
    catalog: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    booking: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    listing: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rate_card: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    info: 'bg-zinc-700/50 text-zinc-400 border border-zinc-700',
    custom: 'bg-zinc-700/50 text-zinc-400 border border-zinc-700',
  }
  return classes[type] ?? 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
}
