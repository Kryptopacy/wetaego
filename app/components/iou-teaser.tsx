'use client'

import { FadeIn } from './animations'
import { Handshake, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function IouTeaser() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/[0.04]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Handshake className="w-4 h-4" />
            Built-in Financing
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Ditch Klarna.<br />
            <span className="text-zinc-400">Keep the Trust.</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light mb-8 leading-relaxed">
            Stop bleeding 6% to BNPL apps. Our unique <strong>Local Trust IOU</strong> system lets you offer flexible payments to your loyal locals directly. Track tabs, set credit limits, and get paid on your terms.
          </p>
          
          <ul className="space-y-4 mb-10">
            {[
              "0% transaction fees on IOU balances",
              "Set custom credit limits per customer",
              "Automated gentle SMS reminders",
              "Instantly convert tabs to Paystack checkout links"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Start Offering IOUs <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeIn>
        
        {/* Right: Mock UI */}
        <FadeIn delay={0.2} className="relative">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          {/* Main Card */}
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Customer IOU Balance</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">$450.00</h3>
              </div>
              <div className="bg-amber-500/10 text-amber-500 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20">
                Limit: $500.00
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                    JS
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">John Smith</p>
                    <p className="text-zinc-500 text-xs">Last visit: 2 days ago</p>
                  </div>
                </div>
                <button className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
                  Settle Tab
                </button>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                    AD
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Alice Doe</p>
                    <p className="text-zinc-500 text-xs">Last visit: Today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">$85.00</p>
                  <p className="text-zinc-500 text-xs">Unpaid</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
               <button className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
                 Send Reminders
               </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
