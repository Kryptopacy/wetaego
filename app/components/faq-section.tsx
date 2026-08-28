'use client'

import { useState } from 'react'
import { Bot, Store, Cpu, Users, Sparkles, ChevronDown, ArrowRight, MessageSquareCode, Terminal, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItem {
  question: string
  answer: string
  tag?: string
}

const FAQS_BY_AUDIENCE: Record<string, { label: string; icon: React.ElementType; items: FAQItem[] }> = {
  business: {
    label: 'For Businesses & Operators',
    icon: Store,
    items: [
      {
        question: 'Can I replace my expensive POS hardware and print receipts directly from a browser?',
        answer: 'Yes. WETAEGO includes a built-in driverless ESC/POS hardware engine. You can connect standard thermal receipt printers over WebUSB, WebSerial (RS232 COM), or WebBluetooth directly from any laptop, tablet, or mobile phone. It triggers hardware paper cuts and cash drawer kick pulses (ESC p) with zero print drivers or background software.',
        tag: 'Hardware & POS'
      },
      {
        question: 'How do I duplicate my catalog across multiple branches without manual re-entry?',
        answer: 'WETAEGO features 1-second atomic catalog duplication (duplicatePageAction). You can replicate your entire master catalog—including categories, items, variant matrices, and dietary tags—to any new branch or sub-department with one click, while maintaining branch-specific pricing and stock levels.',
        tag: 'Fleet Management'
      },
      {
        question: 'What commercial business models and templates does WETAEGO support out of the box?',
        answer: 'WETAEGO provides 9 specialized commercial engines: Hospitality QR Dining (dine-in ordering, split tabs, kitchen tickets), Supermarkets & Retail (aisle navigation, barcode POS), Wellness & Spas (appointment BMS, deposit capture), Retail Boutiques & Gadgets (variant matrices), B2B Dynamic Rate Cards (quotes & retainers), Real Estate & Automotive (listing PMS), and Creator Portals.',
        tag: 'Multi-Model'
      },
      {
        question: 'How does the customer IOU store credit and tab financing system work?',
        answer: 'WETAEGO gives you an in-house Buy Now Pay Later tab ledger. You can grant trusted customers credit limits, track outstanding tabs across visits, and trigger automated SMS/email payment reminders with built-in risk controls.',
        tag: 'Financing'
      }
    ]
  },
  agents: {
    label: 'For AI Agents & Developers',
    icon: Bot,
    items: [
      {
        question: 'How do autonomous browsing agents interact with WETAEGO storefronts via WebMCP?',
        answer: 'Every WETAEGO storefront dynamically registers 8 standardized WebMCP tools directly onto document.modelContext (search_catalog, get_item_details, create_cart, add_to_cart, get_cart, update_cart, initiate_checkout, submit_order). Browsing agents like ChatGPT Desktop or Chrome 149+ can discover, filter, customize items, and co-browse with the user in real time.',
        tag: 'WebMCP'
      },
      {
        question: 'What is the security model for autonomous agent payments and orders?',
        answer: 'WETAEGO enforces an architectural Human-in-the-Loop Safe Payment Gate. An agent can discover items, calculate totals, and call initiate_checkout, but cannot debit funds or finalize orders without explicit human customer confirmation (authorization.confirmed === true in submit_order).',
        tag: 'Security'
      },
      {
        question: 'Is there an MCP server endpoint for enterprise backoffice automation?',
        answer: 'Yes. External AI agents (Claude Desktop, ChatGPT Enterprise, automated scripts) can authenticate with a Bearer API token at https://ourmenuos.online/api/mcp to execute staff operations: get_active_orders, update_order_status, mark_item_unavailable, get_table_status, and get_daily_sales.',
        tag: 'Staff MCP'
      },
      {
        question: 'What agent discovery protocols does WETAEGO support?',
        answer: 'WETAEGO implements 14 open machine standards including RFC 9727 API Catalog (/.well-known/api-catalog), Model Context Protocol (/.well-known/mcp.json), Agentic Resource Discovery (/.well-known/ai-catalog.json), Auth.md (/auth.md), x402 HTTP Agent Payments, and DNS-AID discovery.',
        tag: 'Protocols'
      }
    ]
  },
  customers: {
    label: 'For Customers & Guests',
    icon: Users,
    items: [
      {
        question: 'Do I need to download an app or create an account to order or book?',
        answer: 'Never. Scanning any WETAEGO QR code or opening a store link opens an instant, high-speed Progressive Web App in your phone’s browser. You can browse, customize items, and pay via Apple Pay, Google Pay, Card, Bank Transfer, or Crypto in under 30 seconds.',
        tag: 'Instant Access'
      },
      {
        question: 'How does the Payment Roulette bill-splitting game work?',
        answer: 'When dining or ordering with friends, you can activate Payment Roulette (/tools/who-pays-the-bill). The table spins an interactive digital wheel to randomly decide who pays the check or split the bill seamlessly with zero math arguments.',
        tag: 'Payment Roulette'
      },
      {
        question: 'Can I ask questions or call a waiter directly from my phone?',
        answer: 'Yes. Every storefront features an AI Concierge grounded in the venue’s verified catalog, plus a 1-tap "Request Staff" button that chimes the server or floor team with your exact table or room number.',
        tag: 'Concierge'
      }
    ]
  }
}

export function FAQSection() {
  const [activeTab, setActiveTab] = useState<'business' | 'agents' | 'customers'>('business')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const currentCategory = FAQS_BY_AUDIENCE[activeTab]

  return (
    <section id="faq" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> Intelligence & Operational FAQ
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Everything You Need to Know.
        </h2>
        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Preemptive answers tailored for merchant operators, autonomous AI agents, and guest shoppers.
        </p>
      </div>

      {/* ── TEGO AI KNOWLEDGE HERO CALLOUT ── */}
      <div className="mb-14 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-black border border-emerald-500/30 shadow-2xl shadow-emerald-950/30 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4" /> Tego AI Knows Everything About WETAEGO
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Have a specific question? Just ask Tego.
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-light">
              Tego is fully trained on WETAEGO’s architecture, WebMCP protocols, 9 industry engines, hardware printing, and pricing tiers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <Link
              href="/m/demo"
              className="px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs md:text-sm font-bold transition-all text-center inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" /> Ask Tego on Live Demo
            </Link>
            <Link
              href="/docs"
              className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs md:text-sm font-medium transition-all text-center inline-flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" /> Developer Portal
            </Link>
          </div>
        </div>

        {/* Interactive Quick Prompts */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">Popular questions Tego answers instantly:</span>
          <div className="flex flex-wrap gap-2">
            {[
              'How does zero-daemon ESC/POS printing work?',
              'How do WebMCP agent tools work?',
              'How do I clone a catalog to a new branch in 1s?',
              'Can I run customer IOU tabs with SMS reminders?',
              'How does Payment Roulette settle split checks?'
            ].map((prompt, i) => (
              <Link
                key={i}
                href="/m/demo"
                className="text-xs text-zinc-300 hover:text-emerald-300 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
              >
                <MessageSquareCode className="w-3 h-3 text-emerald-400" />
                <span>&quot;{prompt}&quot;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {(Object.keys(FAQS_BY_AUDIENCE) as Array<keyof typeof FAQS_BY_AUDIENCE>).map((key) => {
          const cat = FAQS_BY_AUDIENCE[key]
          const Icon = cat.icon
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key)
                setOpenIndex(0)
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-zinc-500'}`} />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3.5">
        {currentCategory.items.map((item, idx) => {
          const isOpen = openIndex === idx
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-zinc-900/80 border-emerald-500/30 shadow-lg shadow-black/40'
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 md:p-6 text-left flex items-center justify-between gap-4 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  {item.tag && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 shrink-0">
                      {item.tag}
                    </span>
                  )}
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                    {item.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 md:px-6 md:pb-6 text-sm text-zinc-300 font-light leading-relaxed border-t border-white/[0.04] pt-4">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
