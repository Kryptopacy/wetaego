'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'
import { initiateIouPayment } from './actions'
import { toast } from 'sonner'

interface Props {
  organizationId: string
  organizationName: string
  logoUrl?: string
  customerId: string
  customerName: string
  balanceMinor: number
  currency: string
  minPercentage: number
  slug: string
}

export default function IouPaymentClient({
  organizationId,
  organizationName,
  logoUrl,
  customerId,
  customerName,
  balanceMinor,
  currency,
  minPercentage,
  slug
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // They can input the value they want to pay.
  // The input is in major units (e.g., NGN).
  const [payAmountMajor, setPayAmountMajor] = useState<number>(balanceMinor / 100)

  const minPaymentMajor = Math.ceil((balanceMinor * (minPercentage / 100)) / 100)

  const handlePay = async () => {
    if (payAmountMajor < minPaymentMajor) {
      toast.error(`Minimum payment is ${formatCurrency(minPaymentMajor * 100, currency)}`)
      return
    }

    if (payAmountMajor > balanceMinor / 100) {
      toast.error(`Cannot pay more than your outstanding balance`)
      return
    }

    setLoading(true)

    try {
      const result = await initiateIouPayment(
        organizationId,
        customerId,
        Math.floor(payAmountMajor * 100),
        currency
      )

      if (result.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="w-16 h-16 mx-auto mb-4 relative rounded-full overflow-hidden border border-zinc-800 bg-zinc-950">
              <Image src={logoUrl} alt={organizationName} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
              <span className="text-xl font-bold">{organizationName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-semibold mb-1">{organizationName}</h1>
          <p className="text-sm text-zinc-400">IOU Repayment Portal</p>
        </div>

        <div className="bg-zinc-950 rounded-2xl p-5 mb-6 border border-zinc-800/50 text-center">
          <p className="text-sm text-zinc-500 mb-1 uppercase tracking-wider font-medium">Outstanding Balance</p>
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(balanceMinor, currency)}
          </div>
          <p className="text-sm text-zinc-400">Hi, {customerName}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            How much would you like to pay?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-zinc-400 font-medium">{currency}</span>
            </div>
            <input
              type="number"
              value={payAmountMajor || ''}
              onChange={(e) => setPayAmountMajor(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-14 pr-4 text-white font-medium text-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="0.00"
              step="0.01"
              min={minPaymentMajor}
              max={balanceMinor / 100}
            />
          </div>
          {minPercentage < 100 && (
            <p className="text-xs text-zinc-500 mt-3 text-center bg-zinc-950 py-2 rounded-lg border border-zinc-800/50">
              Minimum allowed payment: <strong className="text-zinc-300">{formatCurrency(minPaymentMajor * 100, currency)}</strong> ({minPercentage}%)
            </p>
          )}
        </div>

        <button
          onClick={handlePay}
          disabled={loading || payAmountMajor < minPaymentMajor || payAmountMajor > balanceMinor / 100}
          className="w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            `Pay ${formatCurrency(payAmountMajor * 100 || 0, currency)}`
          )}
        </button>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Payments are securely processed by Paystack.
        </p>
      </div>
    </div>
  )
}
