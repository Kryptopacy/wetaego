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
    id: 'ai-webmcp',
    label: 'Tego AI & WebMCP Agents',
    features: [
      {
        icon: Sparkles,
        color: 'from-emerald-500 via-teal-500 to-cyan-500',
        tag: 'Real-Time Multimodal Live AI',
        badge: 'Real-time Voice & Vision',
        title: '"Tego, clone our supermarket catalog to Ikeja."',
        description: 'Talk directly with your business operating system using natural two-way voice, instant barge-in interruption, and live camera video to inspect stock or build menus with zero typing.',
      },
      {
        icon: ShieldCheck,
        color: 'from-purple-500 to-indigo-600',
        tag: 'Zero-Hallucination Frontline Concierge',
        badge: 'Staff Escalation Loop',
        title: 'Customer-facing AI that never invents answers.',
        description: 'Public conversational concierge strictly bounded to verified database catalog items and dietary tags (vegan, halal, allergies). If an inquiry is unlisted, Tego instantly alerts floor staff on the fulfillment dashboard.',
      },
      {
        icon: Cpu,
        color: 'from-cyan-500 to-blue-600',
        tag: 'Zero-Config WebMCP',
        badge: 'Agent Commerce Ready',
        title: 'Autonomous AI agents browse and buy.',
        description: 'Every storefront automatically exposes document.modelContext tools. AI browsing agents and autonomous assistants can discover items, customize orders, and checkout on behalf of customers.',
      },
      {
        icon: FileText,
        color: 'from-blue-600 to-indigo-600',
        tag: '1 FPS Camera OCR Menu Importer',
        badge: 'Zero manual typing',
        title: 'Snap a picture of a paper menu. We build the store.',
        description: 'Point your camera at physical menus, handwritten receipts, or vendor invoices. Our vision AI instantly structures items, prices, and dietary tags into your digital catalog in seconds.',
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
    id: 'operations-hardware',
    label: 'Operations & Hardware POS',
    features: [
      {
        icon: Printer,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Zero-Daemon ESC/POS Thermal Printing',
        badge: 'WebUSB / Bluetooth / Serial',
        title: 'Direct driverless hardware receipt printing.',
        description: 'Emits raw binary ESC/POS bytecode directly over WebUSB, RS-232 COM Serial, and WebBluetooth. Prints order chits in < 50ms with automatic cash drawer kicks (ESC p) and hardware paper cuts (GS V).',
      },
      {
        icon: ClipboardList,
        color: 'from-red-600 to-orange-600',
        tag: 'Live Kitchen Display System (KDS)',
        badge: '< 1s delivery',
        title: '"Order received. Kitchen notified."',
        description: 'Real-time order stream with audio sound chimes. Orders, table service calls, and bookings flash onto your fulfillment dashboard with keyboard hotkeys (Space to complete, P to print).',
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
    id: 'fleet-design',
    label: 'Enterprise Fleet & Design Engine',
    features: [
      {
        icon: Store,
        color: 'from-blue-600 to-teal-600',
        tag: 'Multi-Branch Fleet Switcher',
        badge: '1-Click Duplication',
        title: 'One brand. Infinite autonomous branches.',
        description: 'Replicate 5,000+ item catalogs to new franchise locations in < 1s. Manage supermarket sub-departments (Grocery, Bakery, Deli) with top-left fleet aggregation and localized tax overrides.',
      },
      {
        icon: Globe,
        color: 'from-emerald-600 to-fuchsia-600',
        tag: '9 Universal Templates & Design Tokens',
        badge: 'Bento, Masonry, Glass',
        title: 'A digital storefront that adapts to you.',
        description: 'Switch between Bento Grids, Clean Catalogs, Portfolios, Booking Calendars, and Rate Cards with sub-16ms live CSS design token previews and 1-click global revert.',
      },
      {
        icon: ShieldCheck,
        color: 'from-zinc-600 to-zinc-700',
        tag: 'Enterprise Role-Based Access Control',
        badge: 'Granular Permissions',
        title: 'Owner. Admin. Manager. Staff. Dispatcher.',
        description: 'Every team member sees exactly what they need and nothing more. Secure automated email invites with instant join links.',
      }
    ]
  },
  {
    id: 'intercom-staff',
    label: 'Staff Intercom & Floor Operations',
    features: [
      {
        icon: MessagesSquare,
        color: 'from-blue-500 to-teal-500',
        tag: 'Real-Time Floor Intercom',
        badge: 'Push-To-Talk Radio',
        title: 'Internal voice radio & table assistance paging.',
        description: 'Department-specific internal radio channels (Kitchen, Bar, Floor) plus customer-to-staff table assistance paging chimes with 1-click claim and dismiss.',
      },
      {
        icon: Star,
        color: 'from-amber-400 to-orange-500',
        tag: 'Staff Performance & Tipping',
        badge: 'Post-service feedback',
        title: 'Reward flawless service.',
        description: 'Customers leave a 1-5 star rating and an optional tip after their service, giving you powerful HR insights and gamified leaderboards for your top-performing staff.',
      },
      {
        icon: Users,
        color: 'from-emerald-500 to-teal-500',
        tag: 'Atomic Request Claiming',
        badge: 'Zero race conditions',
        title: 'No double-prep. No hoarding.',
        description: 'Staff claim requests securely. The system actively limits task hoarding, keeping fulfillment flowing smoothly across busy shifts.',
      }
    ]
  },
  {
    id: 'crm-financing',
    label: 'CRM, IOU Tab Financing & Marketing',
    features: [
      {
        icon: Wallet,
        color: 'from-emerald-600 to-teal-500',
        tag: 'Customer IOU Store Credit Tab',
        badge: 'Zero-fee In-House BNPL',
        title: 'The "Local Trust" Tab with automated reminders.',
        description: 'Approve trusted VIP clients for a Store Credit tab. They bypass card checkout, while automated SMS debt reminders keep balances settled without awkward conversations.',
      },
      {
        icon: Gamepad2,
        color: 'from-pink-500 to-rose-500',
        tag: 'Payment Roulette Game',
        badge: 'Viral Engagement',
        title: 'Who pays the bill? Spin the wheel.',
        description: 'Transform group payments. A gamified "spin to win" bill-splitting randomizer that turns checkout friction into a viral group experience at /tools/who-pays-the-bill.',
      },
      {
        icon: QrCode,
        color: 'from-emerald-600 to-teal-600',
        tag: 'Branded QR Code Generator',
        badge: 'Dual Output Modes',
        title: 'Print-ready branded presentation cards & raw QR codes.',
        description: 'Generate high-res QR codes per table, room, desk, or drive-thru lane. Download per-card PNGs or print directly on sticker sheets with custom logo embeds.',
      },
      {
        icon: CreditCard,
        color: 'from-green-600 to-emerald-600',
        tag: 'In-Built CRM & Multi-Channel Broadcasts',
        badge: 'Email & SMS Campaigns',
        title: 'Customer shadow profiles with dynamic brand sender.',
        description: 'Automatic customer profile capture at checkout with LTV tracking. Send broadcast marketing emails that display as your brand name with direct merchant Reply-To.',
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
