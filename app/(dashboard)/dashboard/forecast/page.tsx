import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { ForecastClient } from './forecast-client'
import { PageHeader } from '@/components/ui/page-header'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Demand Forecast | WETAEGO',
  description: 'AI-powered demand forecasting and stock alerts for your venue.'
}

export default async function ForecastPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use a fallback user ID for demo purposes if not logged in
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  // Fetch the user's active location
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: location } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', membership.organization_id)
    .single()

  if (!location) {
    return (
      <div className="max-w-5xl space-y-6">
        <PageHeader
          title="Demand Forecast"
          description="AI-powered demand forecasting, shortage alerts, and sales predictions."
        />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400">
          No location found. Please set up your venue in Settings first.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <PageHeader
        title="Demand Forecast"
        description={`AI-driven demand predictions and inventory shortage alarms for ${location.name}.`}
        eyebrow="AI Analytics"
      />

      <div className="p-4 bg-linear-to-r from-emerald-950/40 via-zinc-900/60 to-zinc-900/40 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300/90 flex items-start gap-3 shadow-lg">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
        <span>Our AI engine analyses your last <strong>30 days</strong> of actual order velocity to forecast consumption, flag potential shortages, and recommend optimal prep quantities.</span>
      </div>

      <ForecastClient locationId={location.id} />
    </div>
  )
}
