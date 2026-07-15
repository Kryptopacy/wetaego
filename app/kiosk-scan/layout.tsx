import { Suspense } from 'react'
import KioskScanPage from './page'

export default function KioskScanLayout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <KioskScanPage />
    </Suspense>
  )
}
