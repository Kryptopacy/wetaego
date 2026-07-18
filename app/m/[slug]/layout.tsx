import { createAnonClient } from '@/lib/supabase/server'
import { GlobalFeedbackFAB } from './components/global-feedback-fab'

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const supabase = createAnonClient()
  const { data: location } = await supabase
    .from('locations')
    .select('id, theme_color')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!location) return <>{children}</>

  return (
      <div 
        style={{ 
          "--theme-color": location.theme_color || "#10b981"
        } as React.CSSProperties}
        className="location-theme-wrapper contents"
      >
        {children}
        <GlobalFeedbackFAB locationId={location.id} slug={resolvedParams.slug} />
      </div>
  )
}
