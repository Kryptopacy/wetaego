'use client'

import { useState } from 'react'
import { ArrowLeft, CreditCard, Repeat, ShoppingCart, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentTesterPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async (type: string) => {
    setLoading(type)
    setError(null)
    setResultUrl(null)

    try {
      const res = await fetch('/api/admin/tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Test initialization failed')
      }

      setResultUrl(data.url)
      
      // Auto-redirect to the Paystack checkout window
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  const testCases = [
    {
      id: 'subscription',
      name: 'Subscription Purchase',
      description: 'Simulates a user upgrading their organization to the Pro plan (₦69,000/mo).',
      icon: Repeat,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      id: 'credits',
      name: 'Credit Bundle',
      description: 'Simulates a user buying a bundle of 50 AI credits.',
      icon: CreditCard,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'order',
      name: 'Mock Item Order',
      description: 'Simulates a guest ordering a ₦15,000 item directly from a digital menu.',
      icon: ShoppingCart,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'split',
      name: 'Bill Splitting (Roulette)',
      description: 'Simulates a fractional IOU or roulette split payment of ₦5,000.',
      icon: Users,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/admin" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Payment Tester 
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-500 rounded-md">TEST MODE</span>
          </h1>
          <p className="text-zinc-400">Trigger isolated checkout flows using Paystack Test Keys.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {resultUrl && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-emerald-500">Checkout Initialized</p>
              <p className="text-xs text-zinc-400">Redirecting to Paystack test environment...</p>
            </div>
          </div>
          <a href={resultUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-emerald-400">
            Open Manually
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testCases.map((tc) => {
          const Icon = tc.icon
          const isProcessing = loading === tc.id

          return (
            <div key={tc.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col hover:border-zinc-700 transition">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${tc.bg}`}>
                  <Icon className={`w-6 h-6 ${tc.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{tc.name}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{tc.description}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-zinc-800">
                <button
                  onClick={() => handleTest(tc.id)}
                  disabled={!!loading}
                  className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Run Checkout Flow'
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
