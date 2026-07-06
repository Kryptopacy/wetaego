import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/utils/admin'
import { ActionForm } from '@/components/ActionForm'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react'

export const updateKycStatus = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const orgId = formData.get('org_id') as string
    const status = formData.get('status') as string // 'approved', 'rejected', 'waived'
    const notes = formData.get('notes') as string

    if (!orgId || !status) throw new Error('Missing fields')

    // If 'waived', we just approve the org but don't strictly approve the KYC record 
    // (or we can mark the KYC record as 'waived' if it exists)
    if (status !== 'waived') {
      await (supabase as any)
        .from('organization_kyc')
        .update({
          status: status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('organization_id', orgId)
    }

    // Update org table
    await (supabase as any)
      .from('organizations')
      .update({ status: (status === 'approved' || status === 'waived') ? 'approved' : 'pending_kyc' })
      .eq('id', orgId)

    revalidatePath('/dashboard/admin')
    revalidatePath(`/dashboard/admin/kyc/${orgId}`)
    
    return { success: true }
  })

export default async function KycReviewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!isAdminEmail(userData?.user?.email)) {
    redirect('/dashboard')
  }

  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('*, organization_kyc(*)')
    .eq('id', orgId)
    .single()

  if (!org) notFound()

  const kyc = org.organization_kyc?.[0] as any

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/admin" className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">KYC Review: {org.name}</h1>
          <p className="text-zinc-400">Review business information and approve for publishing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Submitted Information</h2>
            
            {kyc ? (
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Business Type</dt>
                  <dd className="text-sm text-zinc-200 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{kyc.business_type === 'individual' ? 'Individual / Sole Proprietor' : 'Registered Business (CAC)'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Legal Name</dt>
                  <dd className="text-sm text-zinc-200 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{kyc.legal_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Registration Number (RC/NIN)</dt>
                  <dd className="text-sm font-mono text-zinc-200 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">{kyc.registration_number}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      kyc.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      kyc.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {kyc.status}
                    </span>
                  </dd>
                </div>
                {kyc.admin_notes && (
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Previous Admin Notes</dt>
                    <dd className="text-sm text-zinc-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{kyc.admin_notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500">No KYC information submitted yet.</p>
              </div>
            )}
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Platform Preview</h2>
            <p className="text-sm text-zinc-400 mb-4">View how their portal looks currently.</p>
            <div className="aspect-[9/16] sm:aspect-video rounded-xl overflow-hidden border border-zinc-700 relative bg-black">
              <iframe src={`/m/${org.slug}?preview=true`} className="w-full h-full absolute inset-0 border-0" />
            </div>
            <div className="mt-4 flex justify-end">
               <a href={`/m/${org.slug}?preview=true`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300">Open full screen &rarr;</a>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-8">
            <h2 className="text-lg font-bold text-white mb-4">Admin Decision</h2>
            
            <ActionForm action={updateKycStatus} className="space-y-6">
              <input type="hidden" name="org_id" value={org.id} />
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Internal Notes (Optional)</label>
                <textarea 
                  name="notes" 
                  rows={4} 
                  placeholder="Reason for rejection or internal remarks..."
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <button 
                  type="submit" 
                  name="status" 
                  value="approved"
                  disabled={!kyc || kyc.status === 'approved'}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none group"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-emerald-500 text-center">Approve</span>
                </button>
                
                <button 
                  type="submit" 
                  name="status" 
                  value="waived"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 rounded-xl transition-colors group"
                >
                  <CheckCircle2 className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-amber-500 text-center">Waive (Provisional)</span>
                </button>

                <button 
                  type="submit" 
                  name="status" 
                  value="rejected"
                  disabled={!kyc || kyc.status === 'rejected'}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none group"
                >
                  <XCircle className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-rose-500 text-center">Reject</span>
                </button>
              </div>
            </ActionForm>
          </div>
        </div>
      </div>
    </div>
  )
}
