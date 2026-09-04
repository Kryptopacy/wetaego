import { createAnonClient } from '@/lib/supabase/server'
import { GlobalFeedbackFAB } from './components/global-feedback-fab'
import { ThemeInjector } from './theme-injector'
import { Plus_Jakarta_Sans, Cormorant_Garamond, Outfit, Space_Grotesk } from 'next/font/google'

// Storefront typography is per-location (modern/elegant/playful/industrial), so
// preloading the "modern" font unconditionally wastes bandwidth on storefronts
// that use another family and triggers "preloaded but not used" warnings.
const fontModern = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-modern', preload: false })
const fontElegant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-elegant', preload: false })
const fontPlayful = Outfit({ subsets: ['latin'], variable: '--font-playful', preload: false })
const fontIndustrial = Space_Grotesk({ subsets: ['latin'], variable: '--font-industrial', preload: false })

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const supabase = createAnonClient()
  let { data: location } = await supabase
    .from('locations')
    .select('id, theme_color, design_tokens')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!location) {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = await createAdminClient()
    const { data: adminLoc } = await admin
      .from('locations')
      .select('id, theme_color, design_tokens')
      .eq('slug', resolvedParams.slug)
      .single()
    location = adminLoc
  }

  if (!location) return <>{children}</>

  const tokens = (location.design_tokens as any) || {}
  const typography = tokens.typography || 'modern'
  
  const fontClass = 
    typography === 'elegant' ? `${fontElegant.variable} font-serif` :
    typography === 'playful' ? `${fontPlayful.variable} font-sans` :
    typography === 'industrial' ? `${fontIndustrial.variable} font-mono` :
    `${fontModern.variable} font-sans`

  return (
      <div 
        style={{ 
          "--theme-color": location.theme_color || "#10b981",
        } as React.CSSProperties}
        className={`location-theme-wrapper contents ${fontClass} ${fontModern.variable} ${fontElegant.variable} ${fontPlayful.variable} ${fontIndustrial.variable}`}
      >
        <ThemeInjector initialTokens={tokens} themeColor={location.theme_color || undefined}>
          {children}
        </ThemeInjector>
      </div>
  )
}
