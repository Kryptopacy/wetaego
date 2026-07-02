'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Building2, Banknote, QrCode, Clock, Wallet, Check, ChevronDown } from 'lucide-react'

interface BillingOptionDef {
  id: string
  label: string
  description: string
  when: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  borderSelected: string
  bgSelected: string
  note?: string
  deliveryOnly?: boolean
  tableOnly?: boolean
}

const BILLING_OPTIONS: BillingOptionDef[] = [
  {
    id: 'pay_now_card',
    label: 'Card Payment',
    description: 'Customers pay instantly via Paystack',
    when: 'Paid before order is placed',
    icon: <CreditCard className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    borderSelected: 'border-indigo-400 dark:border-indigo-500',
    bgSelected: 'bg-indigo-50/50 dark:bg-indigo-500/10',
    note: 'Requires Paystack to be configured',
  },
  {
    id: 'pay_now_transfer',
    label: 'Bank Transfer',
    description: 'Customer transfers to your account',
    when: 'Paid before order confirmed',
    icon: <Building2 className="w-5 h-5" />,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderSelected: 'border-amber-400 dark:border-amber-500',
    bgSelected: 'bg-amber-50/50 dark:bg-amber-500/10',
  },
  {
    id: 'pay_on_delivery_cash',
    label: 'Cash on Delivery',
    description: 'Rider collects cash at the door',
    when: 'Paid when order is delivered',
    icon: <Banknote className="w-5 h-5" />,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderSelected: 'border-emerald-400 dark:border-emerald-500',
    bgSelected: 'bg-emerald-50/50 dark:bg-emerald-500/10',
    deliveryOnly: true,
  },
  {
    id: 'pay_on_delivery_link',
    label: 'Pay on Arrival (Link)',
    description: 'System emails customer a Paystack link when rider arrives',
    when: 'Paid at door via phone, before handover',
    icon: <QrCode className="w-5 h-5" />,
    iconBg: 'bg-teal-100 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    borderSelected: 'border-teal-400 dark:border-teal-500',
    bgSelected: 'bg-teal-50/50 dark:bg-teal-500/10',
    note: 'Customer email is required at checkout',
    deliveryOnly: true,
  },
  {
    id: 'pay_after_service',
    label: 'Pay After Service',
    description: 'Customer enjoys first, you present the bill at the end',
    when: 'Paid after service is rendered',
    icon: <Clock className="w-5 h-5" />,
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderSelected: 'border-purple-400 dark:border-purple-500',
    bgSelected: 'bg-purple-50/50 dark:bg-purple-500/10',
    tableOnly: true,
    note: 'Use "Send Bill" or "Mark Paid" from your dashboard',
  },
  {
    id: 'pay_deposit',
    label: 'Deposit Required',
    description: 'Charge a percentage upfront, collect balance later',
    when: 'Deposit paid now, balance on completion',
    icon: <Wallet className="w-5 h-5" />,
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderSelected: 'border-rose-400 dark:border-rose-500',
    bgSelected: 'bg-rose-50/50 dark:bg-rose-500/10',
    note: 'Set your deposit percentage below when enabled',
  },
]

interface BillingOptionsSelectorProps {
  initialOptions?: string[]
  initialDepositPercentage?: number | null
}

export function BillingOptionsSelector({ initialOptions = [], initialDepositPercentage }: BillingOptionsSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialOptions))
  const [depositPct, setDepositPct] = useState<number>(initialDepositPercentage ?? 50)
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const showDepositPct = selected.has('pay_deposit')

  return (
    <div className="space-y-4">
      {/* Hidden inputs for form submission */}
      {Array.from(selected).map(opt => (
        <input key={opt} type="hidden" name="payment_options" value={opt} />
      ))}
      {showDepositPct && (
        <input type="hidden" name="deposit_percentage" value={depositPct} />
      )}

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BILLING_OPTIONS.map((opt, i) => {
          const isOn = selected.has(opt.id)
          const isExpanded = expandedInfo === opt.id
          return (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`
                relative rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
                ${isOn
                  ? `${opt.borderSelected} ${opt.bgSelected} shadow-md`
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }
              `}
              onClick={() => toggle(opt.id)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isOn ? opt.iconBg : 'bg-zinc-800'} ${isOn ? opt.iconColor : 'text-zinc-500'}`}>
                    {opt.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] font-bold transition-colors ${isOn ? 'text-white' : 'text-zinc-300'}`}>
                        {opt.label}
                      </span>
                      {/* Toggle indicator */}
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${isOn ? `${opt.borderSelected} ${opt.iconBg}` : 'border-zinc-600'}
                      `}>
                        <AnimatePresence>
                          {isOn && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <Check className={`w-2.5 h-2.5 ${opt.iconColor}`} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-snug transition-colors ${isOn ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* "When" timing tag */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${isOn ? `${opt.iconBg} ${opt.iconColor}` : 'bg-zinc-800 text-zinc-500'}`}>
                    {opt.when}
                  </span>
                  {(opt.note || opt.deliveryOnly || opt.tableOnly) && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setExpandedInfo(isExpanded ? null : opt.id) }}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors"
                    >
                      details
                      <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronDown className="w-3 h-3" />
                      </motion.span>
                    </button>
                  )}
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                        {opt.note && (
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            💡 {opt.note}
                          </p>
                        )}
                        {opt.deliveryOnly && (
                          <p className="text-[11px] text-zinc-500">📦 Only shown to customers choosing <span className="text-zinc-300 font-medium">Delivery</span></p>
                        )}
                        {opt.tableOnly && (
                          <p className="text-[11px] text-zinc-500">🪑 Only shown for <span className="text-zinc-300 font-medium">Dine-in / Table</span> orders</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Deposit % slider — reveals when deposit option is selected */}
      <AnimatePresence>
        {showDepositPct && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Deposit Percentage</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Customers pay this % upfront — you collect the balance after service</p>
                </div>
                <div className="text-3xl font-black text-rose-400 tabular-nums">{depositPct}%</div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={depositPct}
                  onChange={e => setDepositPct(Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{ background: `linear-gradient(to right, rgb(244,63,94) ${depositPct}%, rgb(63,63,70) ${depositPct}%)` }}
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[25, 30, 50, 70].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={e => { e.stopPropagation(); setDepositPct(p) }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${depositPct === p ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected.size === 0 && (
        <p className="text-xs text-amber-500 text-center py-2">⚠️ Select at least one billing option for your customers</p>
      )}
    </div>
  )
}
