import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'

export const metadata = {
  title: 'Page Not Found | OurMenu OS',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-6 selection:bg-violet-500/30 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-zinc-300 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-8">
          <Zap className="w-6 h-6 text-black" aria-hidden="true" />
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tighter mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">
          This page is off the menu.
        </h2>
        
        <p className="text-zinc-400 text-lg font-light mb-10 max-w-md mx-auto">
          We couldn't find the page you were looking for. It might have been moved or the URL might be incorrect.
        </p>

        <Link 
          href="/"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>
    </div>
  )
}
