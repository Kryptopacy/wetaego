import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ForecastClient } from './forecast-client'

export const metadata: Metadata = {
  title: 'Demand Forecast | OurMenu OS',
  description: 'AI-powered demand forecasting and stock alerts for your venue.'
}

export default async function ForecastPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  const cookieStore = await cookies()

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
      <div className="p-8 text-zinc-400">
        No location found. Please set up your venue first.
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Demand Forecast</h1>
            <p className="text-zinc-500 text-sm">{location.name}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-violet-900/30 to-indigo-900/20 border border-violet-800/40 rounded-xl text-sm text-violet-300 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span>Our AI analyses your last <strong>30 days</strong> of actual order data to predict which items to stock up on, flag potential shortages, and surface rising stars before they sell out.</span>
        </div>
      </div>

      <ForecastClient locationId={location.id} />
    </div>
  )
}
