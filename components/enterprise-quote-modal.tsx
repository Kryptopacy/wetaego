'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Users, Printer, Sparkles, CheckCircle2, ArrowRight, X, Phone, Mail, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { submitEnterpriseInquiryAction } from '@/app/actions/enterprise-inquiry'

interface EnterpriseQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  initialBranches?: number
  defaultCompanyName?: string
}

export function EnterpriseQuoteModal({
  isOpen,
  onClose,
  initialBranches = 3,
  defaultCompanyName = ''
}: EnterpriseQuoteModalProps) {
  const [branches, setBranches] = useState<number>(initialBranches < 2 ? 2 : initialBranches)
  const [staffSize, setStaffSize] = useState<string>('10-50 staff')
  const [volume, setVolume] = useState<string>('5,000 - 25,000 orders/mo')
  const [selectedHardware, setSelectedHardware] = useState<string[]>([])
  
  const [companyName, setCompanyName] = useState(defaultCompanyName)
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  const [isPending, startTransition] = useTransition()
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Live estimated formula: $149 base + $35 per branch (discounted at higher branch volume)
  const perBranchCost = branches > 10 ? 25 : branches > 5 ? 30 : 35
  const estimatedTotal = 149 + (branches * perBranchCost)

  const hardwareOptions = [
    { id: 'escpos_printers', label: 'Raw ESC/POS Thermal Printers (USB/BLE)' },
    { id: 'kds_kitchen', label: 'Kitchen & Floor KDS Tablet Stations' },
    { id: 'sub_departments', label: 'Supermarket Aisle Sub-Departments' },
    { id: 'custom_erp', label: 'Custom ERP / Inventory API Sync' },
    { id: 'dedicated_sla', label: '24/7 Dedicated Account Manager' },
  ]

  const toggleHardware = (id: string) => {
    setSelectedHardware(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await submitEnterpriseInquiryAction({
        companyName,
        contactName,
        email,
        phone,
        branchCount: branches,
        staffSize,
        hardwareNeeds: selectedHardware.map(id => hardwareOptions.find(h => h.id === id)?.label || id),
        estimatedMonthlyOrders: volume,
        notes
      })

      if (res.success) {
        setIsSubmitted(true)
        toast.success('Inquiry submitted successfully!')
      } else {
        toast.error(res.error || 'Failed to submit inquiry')
      }
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8 text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Enterprise Fleet & Multi-Branch Plan
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                Scale Your Entire Multi-Store Fleet
              </h2>
              <p className="text-sm text-zinc-400 mb-6 font-light">
                Multi-branch operations (supermarkets, restaurant chains, franchise boutiques) require dedicated cross-location aggregation, 1-click catalog cloning, and custom RBAC.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Branch Count Slider */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      Number of Physical Branches
                    </label>
                    <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">
                      {branches} {branches === 50 ? '50+ Branches' : 'Branches'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={branches}
                    onChange={(e) => setBranches(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                    <span>2 Branches</span>
                    <span>10 Branches</span>
                    <span>25 Branches</span>
                    <span>50+ Multi-Region</span>
                  </div>
                </div>

                {/* 2. Staff Size & Monthly Volume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
                      Total Staff Across Fleet
                    </label>
                    <select
                      value={staffSize}
                      onChange={(e) => setStaffSize(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="5-15 staff">5 – 15 Staff Members</option>
                      <option value="15-50 staff">15 – 50 Staff Members</option>
                      <option value="50-150 staff">50 – 150 Staff Members</option>
                      <option value="150+ enterprise">150+ Enterprise Workforce</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
                      Estimated Monthly Orders
                    </label>
                    <select
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="1,000 - 5,000 orders/mo">1,000 – 5,000 orders/mo</option>
                      <option value="5,000 - 25,000 orders/mo">5,000 – 25,000 orders/mo</option>
                      <option value="25,000 - 100,000 orders/mo">25,000 – 100,000 orders/mo</option>
                      <option value="100,000+ orders/mo">100,000+ High-Volume Enterprise</option>
                    </select>
                  </div>
                </div>

                {/* 3. Hardware & Architecture Needs */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2.5">
                    Hardware & Architectural Modules Needed
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hardwareOptions.map((opt) => {
                      const isSelected = selectedHardware.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleHardware(opt.id)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-zinc-700'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Live Estimated Price Box */}
                <div className="bg-linear-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-zinc-400 block font-medium">Instant Estimate for {branches} Branches:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">${estimatedTotal}</span>
                      <span className="text-xs text-zinc-400">/ month (billed monthly)</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-center sm:text-right">
                    Includes HQ Dashboard + 1-Click Catalog Duplication + Custom RBAC
                  </div>
                </div>

                {/* 5. Contact Details */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">Company / Chain Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mega Mart Stores Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">Contact Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Johnson (Executive Director)"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@megamart.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isPending ? 'Submitting Inquiry...' : 'Submit Enterprise Request'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Success View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Enterprise Proposal Requested!</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto font-light leading-relaxed">
                Thank you for reaching out for <strong>{companyName}</strong>. Our enterprise solutions architect has received your specifications for <strong>{branches} branches</strong> and will contact you at <strong>{email}</strong> or <strong>{phone}</strong> within 4 hours.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
