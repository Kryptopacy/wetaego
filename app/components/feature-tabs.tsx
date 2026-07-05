'use client'

import { useState } from 'react'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, Bell, FileText, ShieldCheck, CreditCard,
  Star, Users, MessageCircle, Gamepad2, Wallet, Package, MessagesSquare
} from 'lucide-react'
import { StaggerContainer, StaggerItem } from './animations'

const categories = [
  {
    id: 'architecture',
    label: 'Flexible Architecture',
    features: [
      {
        icon: Globe,
        color: 'from-blue-600 to-teal-600',
        tag: 'Multi-template/Multibusiness',
        badge: 'Any business type',
        title: 'Built for more than just restaurants.',
        description: 'Our multi-template architecture supports custom templates for restaurants, salons, consulting, and hotels. Your digital storefront adapts exactly to your business model.',
      },
      {
        icon: FileText,
        color: 'from-emerald-600 to-fuchsia-600',
        tag: 'Custom Flows & Structure',
        badge: 'Tailored to you',
        title: 'Design your own operational flows.',
        description: 'Define varied data structures, custom checkout steps, and unique operational flows to match the precise way your team works.',
      }
    ]
  },
  {
    id: 'command-center',
    label: 'Operations Hub',
    features: [
      {
        icon: ClipboardList,
        color: 'from-red-600 to-orange-600',
        tag: 'Live Fulfillment Dashboard',
        badge: '< 1s delivery',
        title: '"Order received. Team notified."',
        description: 'Realtime request stream powered by Supabase WebSockets. New orders, bookings, and quotes flash onto your fulfillment dashboard instantly. No refresh. No delay. Ever.',
      },
      {
        icon: MessageCircle,
        color: 'from-blue-600 to-cyan-600',
        tag: 'AI Digital Concierge',
        badge: 'Gemini-powered',
        title: 'Your best associate, always on shift.',
        description: 'Clients chat to get recommendations, ask about services, customize items, and add to cart — all without flagging down staff.',
      },
      {
        icon: Package,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Inventory Manager',
        badge: 'Atomic Tracking',
        title: 'Real-time physical stock tracking.',
        description: 'Track retail items, kitchen ingredients, or spa products. Features low-stock alerts, wastage logs, and instant atomic sell-out triggers to prevent overselling.',
      }
    ]
  },
  {
    id: 'guest-experience',
    label: 'Client Experience',
    features: [
      {
        icon: QrCode,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Dynamic Location Mapping',
        badge: 'Precision routing',
        title: 'Every table, room, or desk has an identity.',
        description: 'Generate individual QR codes per zone. Orders arrive pre-tagged with the exact location. Zero confusion during fulfillment.',
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
        color: 'from-emerald-600 to-teal-600',
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
        description: 'Analyses 30 days of sales velocity. Predicts the next 7 days of demand, and fires stock alerts before shelves run dry. Bestsellers trending up? We knew two days ago.',
      },
      {
        icon: MessagesSquare,
        color: 'from-fuchsia-500 to-pink-600',
        tag: 'Admin AI Copilot',
        badge: 'Actionable & Secure',
        title: 'Manage your business via chat.',
        description: 'A deeply integrated dashboard assistant with strict role-based access control. Simply ask it to generate financial reports, create menu categories, or instantly add items to your catalog.',
      },
      {
        icon: FileText,
        color: 'from-cyan-500 to-blue-600',
        tag: 'Multimodal Menu Importer',
        badge: 'Zero typing',
        title: 'Snap a picture. We build the menu.',
        description: 'Upload a photo of your physical menu. Our vision AI instantly reads and structures it into a beautiful digital catalog, saving you hours of manual data entry.',
      }
    ]
  },
  {
    id: 'growth',
    label: 'Built for Growth',
    features: [
      {
        icon: FileText,
        color: 'from-blue-600 to-teal-600',
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
        title: 'Get paid when they checkout.',
        description: 'Connect your bank account via Paystack. Revenue lands directly in your account the moment a client completes an order or booking.',
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
        badge: 'Post-service feedback',
        title: 'Reward flawless service.',
        description: 'Customers leave a 1-5 star rating and an optional tip after their service, giving you powerful HR insights into your top-performing staff.',
      },
      {
        icon: Users,
        color: 'from-emerald-500 to-teal-500',
        tag: 'Atomic Request Claiming',
        badge: 'Zero race conditions',
        title: 'No double-prep. No hoarding.',
        description: 'Staff claim requests securely. The system actively limits how many tasks a single associate can hoard, keeping your operations flowing smoothly.',
      },
      {
        icon: MessagesSquare,
        color: 'from-blue-500 to-teal-500',
        tag: 'Enterprise Intercom',
        badge: 'Real-time Comms',
        title: 'Internal chat. Zero walkie-talkies.',
        description: 'Department-specific internal channels (e.g. Kitchen, Concierge). Supabase Realtime WebSockets ensure messages propagate across staff dashboards instantly.',
      }
    ]
  },
  {
    id: 'crm-gamification',
    label: 'CRM & Gamification',
    features: [
      {
        icon: Gamepad2,
        color: 'from-pink-500 to-rose-500',
        tag: 'Payment Roulette',
        badge: 'Viral Engagement',
        title: 'Who pays the bill? Spin the wheel.',
        description: 'Transform group payments. A gamified "spin to win" bill-splitting randomizer that turns checkout friction into a highly engaging, viral group experience.',
      },
      {
        icon: Wallet,
        color: 'from-emerald-600 to-teal-500',
        tag: 'Store Credit & IOUs',
        badge: 'B2B & B2C',
        title: 'Buy now. Pay later. Built-in.',
        description: 'Approve trusted clients for a Store Credit tab. They bypass card payments at checkout and deduct instantly from their tab, tracked automatically in your dashboard ledger.',
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
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 lg:mx-0 lg:px-0 lg:sticky lg:top-24 snap-x snap-mandatory">
          {categories.map((category) => {
            const isActive = category.id === activeTab
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-shrink-0 snap-start text-left px-4 py-3 text-sm lg:text-base lg:px-5 lg:py-4 rounded-2xl transition-all duration-300 font-bold whitespace-nowrap lg:whitespace-normal group relative overflow-hidden ${
                  isActive 
                    ? 'text-white bg-white/5 lg:bg-transparent' 
                    : 'text-zinc-500 hover:text-zinc-300 bg-white/[0.02] lg:bg-transparent border border-transparent lg:border-none'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
                )}
                <span className="relative z-10">{category.label}</span>
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
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-all duration-700 blur-2xl group-hover:scale-110`} />
                  <div className="p-8 h-full flex flex-col z-10 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
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
