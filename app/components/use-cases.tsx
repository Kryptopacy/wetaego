'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, ShoppingBag, Scissors, Briefcase, Building, Store, ArrowRight, Sparkles, Stethoscope, Wrench, Network } from 'lucide-react'
import Image from 'next/image'

const cases = [
  {
    id: 'supermarkets',
    icon: Store,
    title: 'Supermarkets & Multi-Branch Chains',
    subtitle: 'Grocery Chains, Hypermarkets & Department Stores',
    description: 'Manage entire multi-department supermarket fleets with unified HQ reporting, aisle sub-departments (Grocery, Fresh Bakery, Butchery & Deli), and 1-click catalog cloning across branches in < 1s.',
    color: 'from-emerald-500 via-teal-500 to-cyan-600',
    metrics: ['1-Click Catalog Duplication', 'Sub-Department Aisles', 'Fleet HQ Aggregation', 'Raw ESC/POS Thermal'],
    image: '/hero_emerald_gemstone.png'
  },
  {
    id: 'hospitality',
    icon: Utensils,
    title: 'Hospitality, Dining & Bars',
    subtitle: 'Restaurants, Cafes, Rooftop Lounges & Food Trucks',
    description: 'Transform guest operations with table-side QR ordering, zero-hallucination dining AI concierges, split bill payments, and live kitchen display system (KDS) order dispatch.',
    color: 'from-orange-500 to-rose-500',
    metrics: ['Live Kitchen Display (KDS)', 'Split Bill Payments', 'Table Intercom Calling', 'Payment Roulette'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'retail',
    icon: ShoppingBag,
    title: 'Retail Boutiques & Specialty Stores',
    subtitle: 'Fashion, Gadgets, Beauty & Pharmacies',
    description: 'Deploy a high-converting digital storefront in minutes. Track inventory automatically across variant matrices (color, size, storage), alert staff on low stock, and offer instant checkout.',
    color: 'from-blue-500 to-indigo-600',
    metrics: ['Variant Configuration Matrix', 'Atomic Stock Decrementing', 'Low Stock Alerts', 'Omnichannel POS'],
    image: '/hero_emerald_gemstone.png'
  },
  {
    id: 'services',
    icon: Scissors,
    title: 'Salons, Spas & Wellness',
    subtitle: 'Spas, Wellness Clinics, Barbers & Tutors',
    description: 'Eliminate no-shows with upfront deposits and smart booking calendars. Clients browse service menus, choose practitioner tiers, and book time slots directly from their mobile devices.',
    color: 'from-fuchsia-500 to-pink-600',
    metrics: ['Smart Booking Calendars', 'Upfront Deposit Billing', 'Staff Tier Assignment', 'Buffer Time Controls'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'consultants',
    icon: Briefcase,
    title: 'Creators, Consultants & Agencies',
    subtitle: 'Media Creators, Freelancers & B2B Agencies',
    description: 'Stop sending static PDF proposals and paying for bloated CRMs. Share interactive, dynamic rate cards and service catalogs with 2-tap client approvals and instant retainer payments.',
    color: 'from-emerald-500 to-teal-600',
    metrics: ['Dynamic Interactive Rate Cards', '2-Tap Scope Approvals', 'Milestone Deposits', 'Instant Retainers'],
    image: '/hero_emerald_gemstone.png'
  },
  {
    id: 'real-estate',
    icon: Building,
    title: 'Real Estate & Dealerships',
    subtitle: 'Luxury Properties, Rentals & Auto Showrooms',
    description: 'Showcase high-value physical assets with immersive galleries, virtual tour embeds, and detailed specifications. Capture qualified leads with instant WhatsApp broker routing.',
    color: 'from-amber-500 to-orange-600',
    metrics: ['High-Res Asset Galleries', 'Virtual Tour Embeds', 'Automated Lead Capture', 'Broker WhatsApp Routing'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'healthcare',
    icon: Stethoscope,
    title: 'Healthcare Clinics & Diagnostics',
    subtitle: 'Medical Practices, Dental & Diagnostic Labs',
    description: 'Streamline patient intake with medical consultation calendars, pre-appointment intake questionnaires, diagnostic test booking, and secure deposit collections.',
    color: 'from-teal-500 to-emerald-600',
    metrics: ['Patient Intake Forms', 'Doctor Scheduling', 'Diagnostic Test Booking', 'Secure Pre-Authorizations'],
    image: '/hero_emerald_gemstone.png'
  },
  {
    id: 'repair',
    icon: Wrench,
    title: 'Technical Repair & Services',
    subtitle: 'Auto Repair, Device Diagnostics & Contractors',
    description: 'Build custom diagnostic quote proposals with itemized parts and labor breakdowns. Customers review and authorize scope changes on their phone with 2-tap approvals.',
    color: 'from-blue-600 to-cyan-600',
    metrics: ['Itemized SOW Quotes', 'Parts & Labor Breakdown', '2-Tap Customer Approvals', 'Deposit Settlements'],
    image: '/hero_restaurant_bg.png'
  },
  {
    id: 'portals',
    icon: Network,
    title: 'Multi-Venue Enterprise Portals',
    subtitle: 'Parent Organizations, Resorts & Campus Chains',
    description: 'Unify diverse multi-concept operations under one parent umbrella. Allow guests to discover dining, wellness, retail, and lodging across your entire franchise network.',
    color: 'from-purple-600 to-pink-600',
    metrics: ['Parent Org Aggregation', 'Multi-Concept Directory', 'Cross-Brand Discovery', 'Unified HQ Telemetry'],
    image: '/hero_emerald_gemstone.png'
  }
]

export function UseCases() {
  const [active, setActive] = useState(cases[0])

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-16">

        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          One Operating System.<br />
          <span className="text-transparent bg-clip-text bg-linear-to-br from-zinc-400 to-zinc-600">Every Business Type.</span>
        </h2>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Our dynamic template builders instantly adapt the platform to fit your specific operational needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Navigation List */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 max-h-[620px] overflow-y-auto pr-1.5 custom-scrollbar">
          {cases.map((c) => {
            const isActive = active.id === c.id
            const Icon = c.icon
            return (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`group relative flex items-center gap-3.5 p-3.5 md:p-4 rounded-2xl transition-all duration-300 text-left overflow-hidden cursor-pointer ${
                  isActive ? 'bg-zinc-900 border border-white/10 shadow-xl' : 'hover:bg-white/5 border border-transparent'
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
                
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl shrink-0 transition-all duration-300 ${
                  isActive ? `bg-linear-to-br ${c.color} shadow-md shadow-black/50` : 'bg-zinc-800'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}`} />
                </div>
                
                <div className="relative z-10 flex-1 min-w-0">
                  <h3 className={`font-bold text-sm md:text-base truncate transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {c.title}
                  </h3>
                  <p className={`text-xs font-medium truncate transition-colors ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {c.subtitle}
                  </p>
                </div>

                <div className={`relative z-10 transition-transform duration-300 shrink-0 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`}>
                  <ArrowRight className="w-4 h-4 text-white/50" />
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
              className="relative h-full min-h-125 rounded-[40px] overflow-hidden border border-white/10 group"
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 bg-linear-to-br ${active.color} opacity-20 mix-blend-screen transition-opacity duration-1000 group-hover:opacity-30`} />
              
              {/* Image / Visual */}
              <div className="absolute inset-0">
                <Image
                  src={active.image}
                  alt={active.title}
                  fill
                  className="object-cover opacity-30 mix-blend-luminosity transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-10 md:p-14">
                <div className={`w-16 h-16 rounded-3xl bg-linear-to-br ${active.color} flex items-center justify-center shadow-2xl mb-8`}>
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
