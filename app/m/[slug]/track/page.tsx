import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TrackOrderClient } from './track-client'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'

type TrackPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TrackOrderPage(props: TrackPageProps) {
  const params = await props.params;
  const { slug } = params;

  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      id, 
      name, 
      slug, 
      logo_url,
      cover_image_url,
      currency_code,
      organization_id,
      address,
      phone,
      organizations (
        name,
        business_type
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !location) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link 
          href={`/m/${slug}`}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Store
        </Link>
        {location.logo_url && (
          <>
            <Image src={location.logo_url} alt={location.name} width={64} height={32} className="h-8 w-auto object-contain" />
          </>
        )}
      </div>
      
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <TrackOrderClient location={location as never} />
      </main>
    </div>
  )
}
