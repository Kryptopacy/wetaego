
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PageBuilderForm } from '@/app/components/page-builder-form'
import { updatePage } from '../../actions'
import { ActionForm } from '@/components/ActionForm'
import { BillingOptionsSelector } from './billing-options-selector'

export default async function PageEditDashboard({
  params
}: {
  params: Promise<{ pageId: string }>
}) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')
  // Removed unused user variable

  // 1. Fetch page and verify org
  const { data: page } = await supabase
    .from('location_pages')
    .select(`
      *,
      locations!inner(organization_id, slug)
    `)
    .eq('id', resolvedParams.pageId)
    .single()

  if (!page) notFound()

  // Verify membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', page.locations.organization_id)
    .eq('user_id', userData.user!.id)
    .single()

  if (!member) {
    // Check if owner
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', page.locations.organization_id)
      .eq('created_by', userData.user!.id)
      .single()
    
    if (!org) redirect('/dashboard')
  }

  // 2. Fetch page items
  const { data: items } = await supabase
    .from('page_items')
    .select('*')
    .eq('page_id', page.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pages" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edit Page: {page.title}</h1>
          <p className="text-sm text-zinc-400 mt-1 capitalize">{page.template_type} Template • {page.slug}</p>
        </div>
        <div className="ml-auto">
          <Link
            href={`/m/${page.locations.slug}/p/${page.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors border border-zinc-700"
          >
            Live Preview
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Page Settings</h2>
        <ActionForm action={updatePage} className="space-y-4 max-w-xl">
          <input type="hidden" name="pageId" value={page.id} />
          <input type="hidden" name="billing_enabled" value="true" />
          <input type="hidden" name="billing_mode" value={page.billing_mode || 'standard_checkout'} />
          <input type="hidden" name="payment_mode" value={page.payment_mode || 'full'} />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Page Title</label>
            <input name="title" defaultValue={page.title || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Page Description (Optional)</label>
            <textarea name="content" defaultValue={page.content || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white h-20" />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div>
              <p className="text-sm font-bold text-white">Payment Roulette Add-on</p>
  
              <p className="text-xs text-zinc-400 mt-0.5">Enable the "Surprise Me" spinning wheel for customers who can't decide.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="randomizer_enabled" value="true" defaultChecked={page.randomizer_enabled || false} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {page.template_type === 'catalog' && (
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
              <div>
                <p className="text-sm font-bold text-white">Hide Delivery Address Field</p>
                <p className="text-xs text-zinc-400 mt-0.5">Remove the delivery address input entirely from the checkout modal.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                {/* @ts-expect-error - JSONB typing issues */}
                <input type="checkbox" name="hide_delivery" value="true" defaultChecked={page.template_data?.hide_delivery || false} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-white/5">
            {/* Billing Options */}
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-bold text-white">Checkout & Billing Options</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Choose which payment methods your customers can use on this page. You can enable more than one.</p>
              </div>
              <BillingOptionsSelector
                // @ts-expect-error JSONB typing
                initialOptions={(page.template_data?.payment_options as string[]) || []}
                initialDepositPercentage={page.deposit_percentage}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Cancellation & Refund Policy</label>
              {/* @ts-expect-error JSONB typing */}
              <textarea name="refund_policy" defaultValue={page.template_data?.refund_policy || ''} placeholder="e.g. Deposits are non-refundable if cancelled within 48 hours." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white h-16 placeholder:text-zinc-600" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
            <div>
              <p className="text-sm font-bold text-white">Milestone Billing (Add-on)</p>
              <p className="text-xs text-zinc-400 mt-0.5">Allow splitting invoices into custom payment milestones (e.g., 30% upfront, 70% completion).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              {/* @ts-expect-error JSONB typing */}
              <input type="checkbox" name="milestones_enabled" value="true" defaultChecked={page.template_data?.milestones_enabled || false} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          <div className="pt-4">
            <button type="submit" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
              Save Settings
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <PageBuilderForm 
          pageId={page.id} 
          templateType={page.template_type} 
          
          initialItems={(items as any[]) || []} 
          orgId={page.locations.organization_id}
        />
      </div>
    </div>
  )
}
