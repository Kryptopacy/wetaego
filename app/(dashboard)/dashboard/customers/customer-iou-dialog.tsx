'use client'

import { useState } from 'react'
import { AnimatedDialog as Dialog, AnimatedDialogContent as DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row']

interface CustomerIouDialogProps {
  organizationId: string
  customer: CustomerProfile | null
  currencyCode: string
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedCustomer: CustomerProfile) => void
}

export function CustomerIouDialog({
  organizationId,
  customer,
  currencyCode,
  isOpen,
  onClose,
  onUpdate,
}: CustomerIouDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  if (!customer) return null

  const handleUpdateLimit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const limitMajor = parseFloat(formData.get('credit_limit') as string)
    const limitMinor = Math.round(limitMajor * 100)
    const isApproved = formData.get('is_approved') === 'on'

    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .update({
          credit_limit_minor: limitMinor,
          is_iou_approved: isApproved,
        })
        .eq('id', customer.id)
        .select()
        .single()

      if (error) throw error
      if (data) onUpdate(data)
    } catch (err) {
      console.error('Failed to update IOU settings:', err)
      alert('Failed to update IOU settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGeneratePaymentLink = async () => {
    if ((customer.credit_balance_minor || 0) <= 0) {
      alert('No outstanding balance.')
      return
    }

    try {
      const res = await fetch('/api/iou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_payment_link',
          organizationId,
          customerId: customer.id,
          amountDueMinor: customer.credit_balance_minor,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert(`Payment link generated:\n${data.authorizationUrl}`)
        // In a real app, this could be copied to clipboard or emailed directly
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate payment link')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent isOpen={isOpen} className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <div className="mb-4">
          <DialogTitle>IOU Management</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage credit limits and view outstanding balance for {customer.email}.
          </DialogDescription>
        </div>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-400">Outstanding Balance</span>
            <span className="text-2xl font-bold text-rose-500">
              {formatCurrency(customer.credit_balance_minor || 0, currencyCode)}
            </span>
            {(customer.credit_balance_minor || 0) > 0 && (
              <button
                onClick={handleGeneratePaymentLink}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 w-fit"
              >
                Generate Repayment Link
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateLimit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="credit_limit" className="text-sm font-medium text-zinc-300">
                Credit Limit ({currencyCode})
              </label>
              <input
                id="credit_limit"
                name="credit_limit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={((customer.credit_limit_minor || 0) / 100).toFixed(2)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <input
                id="is_approved"
                name="is_approved"
                type="checkbox"
                defaultChecked={customer.is_iou_approved || false}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-600"
              />
              <label htmlFor="is_approved" className="text-sm font-medium text-zinc-300">
                Approve for IOU purchases
              </label>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
