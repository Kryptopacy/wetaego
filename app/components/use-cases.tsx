'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, ShoppingBag, Scissors, Briefcase, Building, ArrowRight } from 'lucide-react'
import Image from 'next/image'

const cases = [
  {
    id: 'hospitality',
    icon: Utensils,
    title: 'Hospitality',
    subtitle: 'Restaurants, Cafes, Bars & Food Trucks',
    description: 'Transform operations with live dine-in ordering, split payments, and a real-time fulfillment dashboard. Replace paper menus with dynamic, AI-translated catalogs.',
    color: 'from-orange-500 to-rose-500',
    metrics: ['Live Fulfillment', 'Split Payments', 'Table Mapping'],
    image: '/hero_restaurant_bg.png' // We reuse the existing hero image as a placeholder/visual
  },
  {
    id: 'retail',
    icon: ShoppingBag,
    title: 'Retail & Boutiques',
    subtitle: 'Gadgets, Fashion, Pharmacies & Stores',
    description: 'Deploy a high-converting digital storefront in minutes. Track inventory automatically, alert staff on low stock, and offer seamless pickup or delivery checkout.',
    color: 'from-blue-500 to-teal-600',
    metrics: ['Inventory Sync', 'Omnichannel', 'Low Stock Alerts'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'services',
    icon: Scissors,
    title: 'Salons & Services',
    subtitle: 'Spas, Therapists, Tutors & Barbers',
    description: 'Eliminate no-shows with upfront deposits and smart booking calendars. Clients can browse services, select staff, and book slots directly from their phones.',
    color: 'from-fuchsia-500 to-pink-600',
    metrics: ['Smart Booking', 'Upfront Deposits', 'Staff Selection'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'consultants',
    icon: Briefcase,
    title: 'Consultants & Agencies',
    subtitle: 'Freelancers, Marketers & B2B',
    description: 'Stop sending PDF proposals. Share interactive, polished digital rate cards. Clients can select service tiers, accept quotes, and pay retainers instantly.',
    color: 'from-emerald-500 to-teal-600',
    metrics: ['Digital Rate Cards', 'Quote Engine', 'Retainers'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'real-estate',
    icon: Building,
    title: 'Real Estate & Auto',
    subtitle: 'Property Rentals & Dealerships',
    description: 'Showcase high-value assets with image-heavy, immersive galleries. Capture leads effortlessly and allow clients to schedule viewings or test drives.',
    color: 'from-emerald-500 to-emerald-600',
    metrics: ['Immersive Galleries', 'Lead Capture', 'Scheduling'],
    image: '/hero_restaurant_bg.png'
  }
]

export function UseCases() {
  const [active, setActive] = useState(cases[0])

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-16">

        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          One Operating System.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-zinc-400 to-zinc-600">Every Business Type.</span>
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Our dynamic template builders instantly adapt the platform to fit your specific operational needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Navigation List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {cases.map((c) => {
            const isActive = active.id === c.id
            const Icon = c.icon
            return (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`group relative flex items-center gap-4 p-5 rounded-3xl transition-all duration-500 text-left overflow-hidden ${
                  isActive ? 'bg-zinc-900 border border-white/10 shadow-2xl' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-case-bg"
                    className="absolute inset-0 bg-white/5"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-500 ${
                  isActive ? `bg-gradient-to-br ${c.color} shadow-lg shadow-black/50` : 'bg-zinc-800'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}`} />
                </div>
                
                <div className="relative z-10 flex-1">
                  <h3 className={`font-bold text-lg transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {c.title}
                  </h3>
                  <p className={`text-xs font-medium transition-colors ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {c.subtitle}
                  </p>
                </div>

                <div className={`relative z-10 transition-transform duration-500 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
                  <ArrowRight className="w-5 h-5 text-white/50" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Dynamic Display Panel */}
        <div className="lg:col-span-7 h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="relative h-full min-h-[500px] rounded-[40px] overflow-hidden border border-white/10 group"
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${active.color} opacity-20 mix-blend-screen transition-opacity duration-1000 group-hover:opacity-30`} />
              
              {/* Image / Visual */}
              <div className="absolute inset-0">
                <Image
                  src={active.image}
                  alt={active.title}
                  fill
                  className="object-cover opacity-30 mix-blend-luminosity transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-10 md:p-14">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${active.color} flex items-center justify-center shadow-2xl mb-8`}>
                  <active.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                  {active.title}
                </h3>
                <p className="text-lg text-zinc-300 font-light leading-relaxed mb-8 max-w-lg">
                  {active.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {active.metrics.map(metric => (
                    <div key={metric} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-semibold text-white">
                      ✓ {metric}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
