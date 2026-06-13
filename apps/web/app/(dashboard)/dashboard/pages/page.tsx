/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tier } from '@/lib/utils/billing'
import { createCustomPage, togglePageStatus, deletePage } from './actions'
import Link from 'next/link'
import { cookies } from 'next/headers'

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

  // Fetch organization and role
  let org = null
  let role = 'viewer'
  let locData = null

  let pages: any[] = []

  if (isDemo) {
    org = { id: 'demo-org', subscription_tier: 'pro', extra_pages_purchased: 0 }
    role = 'owner'
    locData = { id: 'demo-loc', slug: 'demo-venue' }
    pages = [
      { id: 'page-1', title: 'Dress Code Policy', slug: 'dress-code', is_published: true, created_at: new Date().toISOString() },
      { id: 'page-2', title: 'Allergen Information', slug: 'allergens', is_published: false, created_at: new Date().toISOString() }
    ]
  } else {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations(id, subscription_tier, extra_pages_purchased)')
      .eq('user_id', userId)
      .single()

    if (member && member.organizations) {
      org = member.organizations
      role = member.role
    } else {
      const { data } = await supabase
        .from('organizations')
        .select('id, subscription_tier, extra_pages_purchased')
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
        .select('*')
        .eq('location_id', locData.id)
        .order('created_at', { ascending: false })
      
      pages = pagesData || []
    }
  }
  
  const { getFreePagesLimit } = await import('@/lib/utils/billing')
  const freeLimit = await getFreePagesLimit((org.subscription_tier as Tier) || 'starter')
  const { getCreditCosts } = await import('@/lib/utils/settings')
  const creditCosts = await getCreditCosts() as Record<string, number>
  const pageCost = creditCosts.custom_page || 10

  const currentCount = pages.length
  const isOverLimit = currentCount >= freeLimit
  const creditsRemaining = (org.purchased_credits || 0) + Math.max(0, (org.subscription_tier === 'pro' ? 50 : org.subscription_tier === 'enterprise' ? 200 : 0) - (org.monthly_free_credits_used || 0))

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white">Custom Pages</h1>
        <div className="text-sm text-zinc-400">
          Tier: <span className="text-white font-medium capitalize">{org.subscription_tier || 'Starter'}</span> &bull; 
          Free Limit: <span className="text-white font-medium">{freeLimit}</span> &bull; 
          Total Usage: <span className="text-white font-medium">{currentCount}</span>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create New Page</h2>
        
        {isOverLimit && creditsRemaining < pageCost ? (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 p-6 flex flex-col items-center justify-center text-center">
            <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Insufficient Credits</h3>
            <p className="text-zinc-400 mb-6 max-w-md">
              You have reached the maximum number of free custom pages for your plan. Creating a new page costs {pageCost} Credits, but you only have {creditsRemaining} Credits remaining.
            </p>
            <div className="flex gap-4">
              <Link href="/dashboard/billing" className="px-6 py-2.5 rounded-lg bg-white text-zinc-900 font-bold hover:bg-zinc-200 transition-colors">
                Buy More Credits
              </Link>
            </div>
          </div>
        ) : (
          <form action={createCustomPage as any} className="space-y-4">
            <input type="hidden" name="location_id" value={locData.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Page Title</label>
                <input type="text" name="title" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Dress Code Policy" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">URL Slug</label>
                <input type="text" name="slug" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. dress-code" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title="Lowercase letters, numbers, and hyphens only" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Content (Markdown supported)</label>
              <textarea name="content" required rows={6} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Write your page content here..."></textarea>
            </div>
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2">
              {isOverLimit ? `Publish Page (Uses ${pageCost} Credits)` : 'Publish Page'}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Published Pages</h2>
        {pages.length === 0 ? (
          <div className="text-zinc-500 italic">No custom pages created yet.</div>
        ) : (
          pages.map((page: any) => {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenu.os'
            const fullUrl = `${baseUrl}/m/${locData.slug}/p/${page.slug}`
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}&color=ffffff&bgcolor=09090b`

            return (
            <div key={page.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-6">
                <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} alt="QR Code" className="w-14 h-14 rounded-md" crossOrigin="anonymous" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{page.title}</h3>
                  <Link href={`/m/${locData.slug}/p/${page.slug}`} target="_blank" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                    {baseUrl.replace('https://', '')}/m/{locData.slug}/p/{page.slug}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <form action={togglePageStatus as any}>
                  <input type="hidden" name="pageId" value={page.id} />
                  <input type="hidden" name="currentStatus" value={page.is_published.toString()} />
                  <button type={`submit`} className={`px-4 py-2 rounded-lg text-sm font-medium border ${page.is_published ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
                    {page.is_published ? 'Published' : 'Hidden'}
                  </button>
                </form>
                <form action={deletePage as any}>
                  <input type="hidden" name="pageId" value={page.id} />
                  <button type="submit" className="text-zinc-500 hover:text-red-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </form>
              </div>
            </div>
          )
        })
        )}
      </div>
    </div>
  )
}
