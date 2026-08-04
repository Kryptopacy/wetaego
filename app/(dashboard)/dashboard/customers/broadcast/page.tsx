import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BroadcastClient } from './broadcast-client'

export default async function BroadcastPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  let orgId = ''
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).single()
  if (member) {
    orgId = member.organization_id
  } else {
    const { data: orgData } = await supabase.from('organizations').select('id').eq('created_by', user.id).limit(1).maybeSingle()
    if (orgData) orgId = orgData.id
  }

  if (!orgId) {
    return <div className="p-8 text-white">No organization found.</div>
  }

  // Fetch only the count of marketing opt-ins for a summary
  const { count: optInCount } = await supabase
    .from('customer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('marketing_opt_in', true)

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', orgId)

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-500" />
            Broadcast Messages
          </h1>
          <p className="text-zinc-400 mt-1">Send bulk emails or WhatsApp messages to your opted-in customers.</p>
        </div>
      </div>

      <BroadcastClient 
        organizationId={orgId} 
        optInCount={optInCount || 0} 
        locations={locations || []}
      />
    </div>
  )
}
