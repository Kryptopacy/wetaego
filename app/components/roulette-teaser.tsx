'use client'

import { FadeIn } from './animations'
import { Dices, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function RouletteTeaser() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/[0.04]">
      <FadeIn className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-rose-500/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-rose-500/30 transition-colors duration-700" />
        
        <div className="md:w-1/2 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold mb-6">
            <Dices className="w-4 h-4" /> Gamified Checkout
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            Who pays the bill? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Spin the wheel.</span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Transform the awkwardness of group payments into a viral experience. Our built-in <strong className="text-white">Payment Roulette</strong> lets customers spin a wheel to randomly select who pays the bill. It increases engagement, drives higher tips, and makes your business unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Enable for your business
            </Link>
          </div>
        </div>

        <div className="md:w-1/2 relative z-10 w-full flex justify-center perspective-[1000px]">
          {/* Conceptual wheel UI representation */}
          <div className="relative w-72 h-72 rounded-full border-[8px] border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl shadow-rose-500/10 transform rotate-12 group-hover:rotate-45 transition-transform duration-1000 ease-out">
            {/* Slices */}
            <div className="absolute inset-0 rounded-full border border-white/5 conic-gradient-wheel opacity-80" style={{ background: 'conic-gradient(from 0deg, #18181b 0 90deg, #f43f5e 90deg 180deg, #18181b 180deg 270deg, #f43f5e 270deg 360deg)' }} />
            {/* Center Pin */}
            <div className="w-16 h-16 rounded-full bg-zinc-900 border-4 border-zinc-800 z-10 flex items-center justify-center shadow-inner">
              <Dices className="w-6 h-6 text-rose-500" />
            </div>
            {/* Names (conceptual) */}
            <div className="absolute top-8 text-xs font-bold text-zinc-500 -rotate-45">Sarah</div>
            <div className="absolute bottom-8 text-xs font-bold text-zinc-500 -rotate-45">Michael</div>
            <div className="absolute left-8 text-xs font-bold text-white font-black drop-shadow-md">David</div>
            <div className="absolute right-8 text-xs font-bold text-white font-black drop-shadow-md">Emma</div>
            
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rotate-45 border-r-[12px] border-b-[12px] border-white z-20" style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }} />
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
