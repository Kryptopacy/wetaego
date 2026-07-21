'use client'

import { useState } from 'react'
import { UIOrder } from '@/lib/types/frontend'
import { Plus, Check, Link as LinkIcon, Wrench, CreditCard, Clock, Trash2 } from 'lucide-react'
import { addMilestoneAction, completeMilestoneAction, addAdHocItemAction, logManualPaymentAction, deleteAdHocItemAction, deleteManualPaymentAction } from '../actions'
import { toast } from 'sonner'
import { AnimatedDialog, AnimatedDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils/currency'

interface MilestonesManagerProps {
  order: UIOrder
  isOpen: boolean
  onClose: () => void
}

type Tab = 'milestones' | 'parts' | 'payments'

export function MilestonesManager({ order, isOpen, onClose }: MilestonesManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('milestones')
  
  // Milestones State
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [mTitle, setMTitle] = useState('')
  const [mDesc, setMDesc] = useState('')
  
  // Parts State
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [pName, setPName] = useState('')
  const [pPrice, setPPrice] = useState('')
  
  // Payment State
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'pos_terminal' | 'bank_transfer'>('cash')

  const [isLoading, setIsLoading] = useState(false)

  const milestones = order.order_milestones || []
  const items = order.order_items || []
  
  const total = order.total_amount_minor || 0
  const paid = order.amount_paid_minor || 0
  const balance = total - paid

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mTitle.trim()) return

    setIsLoading(true)
    try {
      const res = await addMilestoneAction({
        orderId: order.id,
        title: mTitle.trim(),
        description: mDesc.trim() || undefined
      })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to add milestone')
      } else {
        toast.success('Milestone added')
        setIsAddingMilestone(false)
        setMTitle('')
        setMDesc('')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error adding milestone')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      const res = await completeMilestoneAction({ orderId: order.id, milestoneId })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to mark complete')
      } else {
        toast.success('Milestone completed')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error completing milestone')
    }
  }

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = parseFloat(pPrice)
    if (!pName.trim() || isNaN(priceNum) || priceNum < 0) return

    setIsLoading(true)
    try {
      const res = await addAdHocItemAction({
        orderId: order.id,
        itemName: pName.trim(),
        priceMinor: Math.round(priceNum * 100),
        quantity: 1
      })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to add part')
      } else {
        toast.success('Part added to order')
        setIsAddingPart(false)
        setPName('')
        setPPrice('')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error adding part')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amtNum = parseFloat(payAmount)
    if (isNaN(amtNum) || amtNum <= 0) return

    setIsLoading(true)
    try {
      const res = await logManualPaymentAction({ 
        orderId: order.id, 
        amountMinor: Math.round(parseFloat(payAmount) * 100),
        paymentMethod: payMethod 
      })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to log payment')
      } else {
        toast.success('Payment logged successfully')
        setIsAddingPayment(false)
        setPayAmount('')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error logging payment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePart = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this part/cost?')) return
    setIsLoading(true)
    try {
      const res = await deleteAdHocItemAction({ orderId: order.id, orderItemId: itemId })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to delete part')
      } else {
        toast.success('Part deleted')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error deleting part')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return
    setIsLoading(true)
    try {
      const res = await deleteManualPaymentAction({ orderId: order.id, paymentId })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to delete payment')
      } else {
        toast.success('Payment deleted')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error deleting payment')
    } finally {
      setIsLoading(false)
    }
  }

  const copyTrackingLink = () => {
    if (!order.tracking_code) {
      toast.error('Add a milestone first to generate a tracking code.')
      return
    }
    const trackUrl = `${window.location.origin}/m/${order.organizations?.slug}/track`
    navigator.clipboard.writeText(`${trackUrl} (Code: ${order.tracking_code})`)
    toast.success('Tracking code copied to clipboard')
  }

  return (
    <AnimatedDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <AnimatedDialogContent isOpen={isOpen} className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0 rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">Manage Service Order</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
            Track progress, add parts, and manage deposits.
          </DialogDescription>
          
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'milestones' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Clock className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'parts' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Wrench className="w-4 h-4" />
              Parts
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payments' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <CreditCard className="w-4 h-4" />
              Pay
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Tracking Code</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
                    {order.tracking_code || 'Pending'}
                  </p>
                </div>
                <button
                  onClick={copyTrackingLink}
                  className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-blue-600 transition-colors"
                  title="Copy Tracking Info"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No milestones yet.</p>
                ) : (
                  milestones.map(m => (
                    <div key={m.id} className={`p-4 rounded-xl border ${m.is_completed ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20' : 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className={`font-bold ${m.is_completed ? 'text-emerald-900 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                            {m.title}
                          </h4>
                          {m.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{m.description}</p>
                          )}
                        </div>
                        {!m.is_completed ? (
                          <button
                            onClick={() => handleCompleteMilestone(m.id)}
                            className="shrink-0 p-1.5 rounded-full bg-zinc-100 hover:bg-emerald-100 text-zinc-400 hover:text-emerald-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isAddingMilestone ? (
                <form onSubmit={handleAddMilestone} className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                  <input
                    type="text"
                    placeholder="Milestone Title"
                    value={mTitle}
                    onChange={e => setMTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                  <textarea
                    placeholder="Description (Optional)"
                    value={mDesc}
                    onChange={e => setMDesc(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none h-20"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAddingMilestone(false)} className="flex-1 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Cancel</button>
                    <button type="submit" disabled={isLoading || !mTitle.trim()} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50">Save</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAddingMilestone(true)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Add Milestone
                </button>
              )}
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No parts/costs added.</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.item_name}</p>
                        <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(item.price_minor * item.quantity)}</p>
                        <button
                          onClick={() => handleDeletePart(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between items-center p-3 border-t border-zinc-200 dark:border-zinc-700">
                <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">Total</span>
                <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(total)}</span>
              </div>

              {isAddingPart ? (
                <form onSubmit={handleAddPart} className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                  <input
                    type="text"
                    placeholder="Part Name (e.g. Screen Replacement)"
                    value={pName}
                    onChange={e => setPName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₦</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={pPrice}
                      onChange={e => setPPrice(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsAddingPart(false)} className="flex-1 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Cancel</button>
                    <button type="submit" disabled={isLoading || !pName.trim() || !pPrice} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50">Add Part</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAddingPart(true)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Add Part / Fee
                </button>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Due</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(total)}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Paid</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(paid)}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex justify-between items-center">
                <span className="font-bold text-blue-700 dark:text-blue-300">Balance</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(Math.max(0, balance))}</span>
              </div>

              {order.order_payments && order.order_payments.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Payment History</h4>
                  {order.order_payments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {payment.provider_reference?.startsWith('manual_cash') ? 'Cash Payment' :
                           payment.provider_reference?.startsWith('manual_pos') ? 'POS Terminal Payment' :
                           payment.provider_reference?.startsWith('manual_bank') ? 'Bank Transfer' :
                           payment.provider_reference?.startsWith('manual_') ? 'Manual Deposit' : 'Online Payment'}
                        </p>
                        <p className="text-xs text-zinc-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(payment.amount_minor)}</p>
                        {payment.provider_reference?.startsWith('manual_') && (
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete manual payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {balance > 0 && (
                isAddingPayment ? (
                  <form onSubmit={handleLogPayment} className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Log Manual Deposit / Payment</p>
                    <div className="space-y-3">
                      <select
                        value={payMethod}
                        onChange={e => setPayMethod(e.target.value as any)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="pos_terminal">💳 POS Terminal (Card at Desk)</option>
                        <option value="bank_transfer">🏦 Bank Transfer</option>
                      </select>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₦</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount Received"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsAddingPayment(false)} className="flex-1 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Cancel</button>
                      <button type="submit" disabled={isLoading || !payAmount} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50">Confirm Paid</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setIsAddingPayment(true)} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> Log Payment Received
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </AnimatedDialogContent>
    </AnimatedDialog>
  )
}
