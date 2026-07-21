import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DeskPayClient } from './desk-pay-client'

export const dynamic = 'force-dynamic'

export default async function DeskPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ terminal?: string }>
}) {
  const { slug } = await params
  const { terminal } = await searchParams

  if (!terminal) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-400">
        <p>Invalid terminal QR. Missing terminal ID.</p>
      </div>
    )
  }

  const supabase = await createClient()

  // Verify the page/slug
  const { data: page } = await supabase
    .from('location_pages')
    .select('id, title, location_id')
    .eq('slug', slug)
    .single()

  if (!page) notFound()

  // Verify the terminal exists and get its details
  const { data: resource } = await supabase
    .from('resources')
    .select('id, name, type, current_order_id')
    .eq('id', terminal)
    .single()

  if (!resource) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-400">
        <p>Terminal not found or deactivated.</p>
      </div>
    )
  }

  return (
    <DeskPayClient 
      resourceId={resource.id} 
      resourceName={resource.name} 
      slug={slug} 
      initialOrderId={resource.current_order_id} 
    />
  )
}
