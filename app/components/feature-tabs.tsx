'use client'

import { useState } from 'react'
import {
  Zap, ChefHat, Globe, BarChart3, ClipboardList,
  QrCode, Bell, FileText, ShieldCheck, CreditCard,
  Star, Users, MessageCircle, Gamepad2, Wallet, Package, MessagesSquare,
  Sparkles, Printer, Store, Cpu
} from 'lucide-react'
import { StaggerContainer, StaggerItem } from './animations'

const categories = [
  {
    id: 'ai-intelligence',
    label: 'Tego Live AI & Vision',
    features: [
      {
        icon: Sparkles,
        color: 'from-emerald-500 via-teal-500 to-cyan-500',
        tag: 'Gemini Live',
        badge: 'Real-time Voice & Vision',
        title: '"Tego, clone our supermarket catalog to Ikeja."',
        description: 'Talk directly with your business operating system using natural two-way voice, instant barge-in interruption, and live camera video to inspect stock or build menus with zero typing.',
      },
      {
        icon: ChefHat,
        color: 'from-blue-600 to-indigo-600',
        tag: 'AI Copywriter + Cover Studio',
        badge: '3× faster launches',
        title: 'Studio-grade visuals and sensory descriptions.',
        description: 'Type an item name. Gemini automatically crafts evocative sensory copy, tags allergens and dietary flags, and renders high-res cover imagery for your catalog.',
      },
      {
        icon: BarChart3,
        color: 'from-amber-500 to-orange-600',
        tag: 'Predictive Demand Forecaster',
        badge: '30-day velocity matrix',
        title: 'Never stock out on your best-sellers.',
        description: 'Analyzes recent sales velocity and predicts upcoming item demand, firing stock alerts before shelves run dry across all physical branches.',
      }
    ]
  },
  {
    id: 'command-center',
    label: 'Operations & Hardware',
    features: [
      {
        icon: ClipboardList,
        color: 'from-red-600 to-orange-600',
        tag: 'Live Fulfillment Dashboard',
        badge: '< 1s delivery',
        title: '"Order received. Floor notified."',
        description: 'Realtime order stream powered by Supabase WebSockets. Orders, table service calls, and bookings flash onto your fulfillment dashboard instantly without refresh.',
      },
      {
        icon: Printer,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Raw ESC/POS Thermal Printing',
        badge: 'WebUSB / Bluetooth / Serial',
        title: 'Zero-daemon hardware printing.',
        description: 'Direct binary printing over WebUSB, Serial COM, and Bluetooth BLE. Print thermal order chits and receipts in < 50ms with automatic cash drawer pulses and zero browser dialogs.',
      },
      {
        icon: Package,
        color: 'from-teal-600 to-cyan-600',
        tag: 'Atomic Inventory Manager',
        badge: 'Real-time sync',
        title: 'Physical stock tracking per branch.',
        description: 'Track retail items, kitchen ingredients, or spa products with low-stock alerts, wastage logs, and instant atomic sell-out triggers to prevent overselling.',
      }
    ]
  },
  {
    id: 'architecture',
    label: 'Fleet & Design Engine',
    features: [
      {
        icon: Store,
        color: 'from-blue-600 to-teal-600',
        tag: 'Enterprise Multi-Branch Fleet',
        badge: '1-Click Duplication',
        title: 'One brand. Infinite autonomous branches.',
        description: 'Replicate 5,000+ item catalogs to new locations in < 1s. Manage supermarket sub-departments (Grocery, Bakery, Deli) with localized staff permissions.',
      },
      {
        icon: Globe,
        color: 'from-emerald-600 to-fuchsia-600',
        tag: '9 Universal Templates & Design Tokens',
        badge: 'Bento, Masonry, Glass',
        title: 'A digital storefront that adapts to you.',
        description: 'Switch between Bento Grids, Clean Catalogs, Portfolios, Booking Calendars, and Rate Cards with sub-16ms live CSS design token previews.',
      },
      {
        icon: Cpu,
        color: 'from-amber-600 to-orange-600',
        tag: '6-Language i18n & Edge Translator',
        badge: 'en, es, fr, yo, ig, ha',
        title: 'Localized for global & domestic customers.',
        description: 'Full multi-language support across English, Spanish, French, Yorùbá, Igbo, and Hausa for seamless customer engagement.',
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
      }
    ]
  },
  {
    id: 'payments',
    label: 'Payments & IOUs',
    features: [
      {
        icon: Wallet,
        color: 'from-emerald-600 to-teal-500',
        tag: 'Store Credit & IOUs',
        badge: 'Zero-fee BNPL',
        title: 'The "Local Trust" Tab.',
        description: 'Approve trusted VIP clients for a Store Credit tab. They bypass card payments at checkout and deduct instantly from their tab. Completely eliminates third-party BNPL merchant fees (like Klarna/Affirm).',
      },
      {
        icon: CreditCard,
        color: 'from-green-600 to-emerald-600',
        tag: 'Instant Payouts',
        badge: 'Paystack / Bachs',
        title: 'Get paid when they checkout.',
        description: 'Revenue lands directly in your account the moment a client completes an order or booking. Your business, your payment routing.',
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
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none -mx-6 px-6 lg:mx-0 lg:px-0 lg:sticky lg:top-24 snap-x snap-mandatory">
          {categories.map((category) => {
            const isActive = category.id === activeTab
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`shrink-0 snap-start text-left px-4 py-3 text-sm lg:text-base lg:px-5 lg:py-4 rounded-2xl transition-all duration-300 font-bold whitespace-nowrap lg:whitespace-normal group relative overflow-hidden ${
                  isActive 
                    ? 'text-white bg-white/5 lg:bg-transparent' 
                    : 'text-zinc-500 hover:text-zinc-300 bg-white/2 lg:bg-transparent border border-transparent lg:border-none'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
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
                  className={`group relative rounded-3xl border border-white/6 bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${isFullWidth ? 'md:col-span-2' : ''}`}
                >
                  <div className={`absolute inset-0 bg-linear-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-all duration-700 blur-2xl group-hover:scale-110`} />
                  <div className="p-8 h-full flex flex-col z-10 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${f.color} flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
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
