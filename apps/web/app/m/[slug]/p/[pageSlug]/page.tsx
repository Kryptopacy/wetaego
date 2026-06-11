import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CustomPagePublicView({
  params
}: {
  params: { slug: string; pageSlug: string }
}) {
  const supabase = await createClient()
  const { slug, pageSlug } = params

  const { data: locData } = await supabase
    .from('locations')
    .select('id, name, theme_color, cover_image_url')
    .eq('slug', slug)
    .single()

  if (!locData) notFound()

  const { data: pageData } = await supabase
    .from('location_pages')
    .select('*')
    .eq('location_id', locData.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .single()

  if (!pageData) notFound()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="h-16 flex items-center px-4 md:px-8 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <Link href={`/m/${slug}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Menu
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ color: locData.theme_color }}>
          {pageData.title}
        </h1>
        <div className="prose prose-invert prose-blue max-w-none">
          {pageData.content?.split('\n').map((line: string, i: number) => {
            if (line.trim() === '') return <br key={i} />
            
            // Extremely basic markdown bold processing for headings
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('# ', '')}</h1>
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">{line.replace('## ', '')}</h2>
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>
            if (line.startsWith('- ')) return <li key={i} className="ml-4 text-zinc-300 mb-2">{line.replace('- ', '')}</li>
            
            return <p key={i} className="mb-4 text-zinc-300 leading-relaxed">{line}</p>
          })}
        </div>
      </main>
    </div>
  )
}
