'use client'

import { useState } from 'react'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, Bell, FileText, ShieldCheck, CreditCard,
  Star, Users, MessageCircle
} from 'lucide-react'
import { StaggerContainer, StaggerItem } from './animations'

const categories = [
  {
    id: 'command-center',
    label: 'Command Center',
    features: [
      {
        icon: ClipboardList,
        color: 'from-red-600 to-orange-600',
        tag: 'Live KDS',
        badge: '< 1s delivery',
        title: '"Table 7 ordered. Kitchen notified."',
        description: 'Realtime order stream powered by Supabase subscriptions. New orders flash onto your Kitchen Display before the guest puts their phone down. No refresh. No delay. Ever.',
      },
      {
        icon: MessageCircle,
        color: 'from-blue-600 to-cyan-600',
        tag: 'AI Dining Advisor',
        badge: 'Gemini-powered',
        title: 'Your best waiter, always on shift.',
        description: 'Guests chat to get recommendations, ask about allergens, customize items, and add to cart — all without flagging down staff.',
      }
    ]
  },
  {
    id: 'guest-experience',
    label: 'Guest Experience',
    features: [
      {
        icon: QrCode,
        color: 'from-violet-600 to-indigo-600',
        tag: 'QR Table Mapping',
        badge: 'Per-table precision',
        title: 'Every table has a unique identity.',
        description: 'Generate individual QR codes per table. Orders arrive pre-tagged with the exact table number. Zero confusion at the pass.',
      },
      {
        icon: Bell,
        color: 'from-emerald-600 to-teal-600',
        tag: 'WhatsApp Notifications',
        badge: 'via Termii',
        title: 'No shouting. Just a ping.',
        description: 'Guests receive a WhatsApp message the moment their order is ready. Staff spend less time yelling across the floor.',
      },
      {
        icon: Globe,
        color: 'from-amber-500 to-orange-600',
        tag: 'Edge Translator',
        badge: '40+ languages',
        title: 'Every tourist reads your menu.',
        description: 'Browser language detected on arrival. The menu auto-translates into French, Mandarin, Yoruba, Arabic, and more in seconds.',
      }
    ]
  },
  {
    id: 'ai-intelligence',
    label: 'AI Intelligence',
    features: [
      {
        icon: ChefHat,
        color: 'from-violet-600 to-indigo-600',
        tag: 'AI Copywriter + Cover Studio',
        badge: '3× faster menu updates',
        title: 'Studio-quality menus. Zero effort.',
        description: 'Type a dish name. Gemini generates sensory, appetizing copy — complete with allergen flags, dietary tags, and an AI-generated photo. Your menu becomes your sales pitch.',
      },
      {
        icon: BarChart3,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Demand Forecaster',
        badge: '30-day data window',
        title: 'Never stock out on your best-sellers.',
        description: 'Analyses 30 days of sales velocity. Predicts the next 7 days of demand, and fires stock alerts before shelves run dry. Suya trending up? We knew two days ago.',
      }
    ]
  },
  {
    id: 'growth',
    label: 'Built for Growth',
    features: [
      {
        icon: FileText,
        color: 'from-blue-600 to-indigo-600',
        tag: 'Custom Pages',
        badge: 'Unlimited creativity',
        title: 'More than a menu.',
        description: 'Build a cocktail guide, event calendar, or brand story page — all hosted on your menu URL. No separate website needed.',
      },
      {
        icon: ShieldCheck,
        color: 'from-zinc-600 to-zinc-700',
        tag: 'Team Roles',
        badge: 'Granular permissions',
        title: 'Owner. Manager. Viewer.',
        description: 'Every staff member sees exactly what they need and nothing more. Invite your whole team without losing control.',
      },
      {
        icon: CreditCard,
        color: 'from-green-600 to-emerald-600',
        tag: 'Paystack Payouts',
        badge: 'Direct to your bank',
        title: 'Get paid when they order.',
        description: 'Connect your Nigerian bank account via Paystack. Revenue lands directly in your account the moment a guest completes an order.',
      }
    ]
  },
  {
    id: 'staff-ops',
    label: 'Staff Operations',
    features: [
      {
        icon: Star,
        color: 'from-amber-400 to-orange-500',
        tag: 'Staff Performance & Tipping',
        badge: 'Post-meal feedback',
        title: 'Reward flawless service.',
        description: 'Tipping shouldn\'t be demanded upfront. Customers leave a 1-5 star rating and an optional tip after their meal, giving you powerful HR insights into your top-performing staff.',
      },
      {
        icon: Users,
        color: 'from-emerald-500 to-teal-500',
        tag: 'Atomic Order Claiming',
        badge: 'Zero race conditions',
        title: 'No double-prep. No hoarding.',
        description: 'Staff claim orders securely. The system actively limits how many orders a single waiter can hoard, keeping your kitchen flowing smoothly.',
      }
    ]
  }
]

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(categories[0].id)

  const activeCategory = categories.find(c => c.id === activeTab)

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
      {/* Navigation - Horizontal on mobile, Vertical on desktop */}
      <div className="lg:w-1/4 shrink-0">
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 lg:mx-0 lg:px-0 lg:sticky lg:top-24">
          {categories.map((category) => {
            const isActive = category.id === activeTab
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-shrink-0 text-left px-5 py-4 rounded-2xl transition-all duration-300 font-bold whitespace-nowrap lg:whitespace-normal ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-xl shadow-black/20 border border-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="lg:w-3/4">
        {activeCategory && (
          <StaggerContainer key={activeTab} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCategory.features.map((f, i) => {
              const Icon = f.icon
              // Make the first card span 2 columns if there's an odd number of features and it's the first one.
              const isFullWidth = activeCategory.features.length % 2 !== 0 && i === 0;

              return (
                <StaggerItem 
                  key={f.tag} 
                  className={`group relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${isFullWidth ? 'md:col-span-2' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
                  <div className="p-8 h-full flex flex-col z-10 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md self-start sm:self-auto">
                        <Zap className="w-3 h-3 text-white" aria-hidden="true" />
                        <span className="text-xs font-bold text-white">{f.badge}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">{f.tag}</span>
                    <h3 className={`font-bold text-white mb-3 leading-tight ${isFullWidth ? 'text-2xl md:text-3xl' : 'text-xl'}`}>{f.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
