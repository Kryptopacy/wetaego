import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { assignQrCode } from './actions'
import { cookies } from 'next/headers'

export default async function QRProvisionPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const qrId = params.id

  if (!qrId) {
    return <div className="p-8 text-red-400">Error: No QR ID provided.</div>
  }

  const supabase = await createClient()

  // Ensure user is logged in
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  
  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

  if (!user) {
    return redirect(`/login?next=/dashboard/qr/provision?id=${qrId}`)
  }

  // Fetch the QR code
  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select('*, locations(name)')
    .eq('id', qrId)
    .single()

  if (error || !qrCode) {
    return <div className="p-8 text-red-400">Error: Invalid or deleted QR Code.</div>
  }

  // Ensure the user belongs to this organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', qrCode.organization_id)
    .eq('user_id', user?.id || 'demo-id')
    .single()

  let isAuthorized = !!member
  if (!member) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', qrCode.organization_id)
      .eq('created_by', user?.id || 'demo-id')
      .single()
    isAuthorized = !!org
  }

  if (!isAuthorized) {
    return <div className="p-8 text-red-400">Error: You do not have permission to manage this QR code.</div>
  }

  // Use a Server Action for submission
  async function onSubmit(formData: FormData) {
    'use server'
    await assignQrCode(formData)
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50">
      <h1 className="text-2xl font-bold text-white mb-2">Assign Table</h1>
      <p className="text-zinc-400 text-sm mb-8">
        You are provisioning a physical QR code for <strong className="text-white">{qrCode.locations?.name}</strong>. What table or cabana is this sticker placed on?
      </p>

      <form action={onSubmit} className="space-y-6">
        <input type="hidden" name="qr_id" value={qrCode.id} />
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Table / Cabana Identifier</label>
          <input 
            type="text" 
            name="table_identifier" 
            defaultValue={qrCode.table_identifier || ''}
            placeholder="e.g. Table 4, VIP Cabana 1" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            required
            autoFocus
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {qrCode.table_identifier ? 'Update Assignment' : 'Assign to Table'}
        </button>
      </form>
    </div>
  )
}
