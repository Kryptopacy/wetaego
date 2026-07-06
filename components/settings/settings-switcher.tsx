'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function SettingsContextSwitcher({ 
  pages, 
  activePageId, 
  currentTab 
}: { 
  pages: any[], 
  activePageId: string | null,
  currentTab: string 
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pageId = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (pageId) {
      params.set('page', pageId)
    } else {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!pages || pages.length === 0) return null

  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl mb-6 shadow-sm">
      <div className="text-sm font-medium text-zinc-300 whitespace-nowrap pl-2">
        Configuring For Page:
      </div>
      <select 
        value={activePageId || ''} 
        onChange={handlePageChange}
        className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
      >
        {pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.title} (/{page.slug})
          </option>
        ))}
      </select>
    </div>
  )
}
