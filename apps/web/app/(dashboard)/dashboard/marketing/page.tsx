'use client'

import { useState } from 'react'
import { sendBroadcastAction } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-black text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
    >
      {pending ? 'Sending Broadcast...' : 'Send to All Customers'}
    </button>
  )
}

export default function MarketingPage({
  searchParams
}: {
  searchParams: { org: string }
}) {
  const [result, setResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null)
  const orgId = searchParams.org

  if (!orgId) {
    return <div className="p-8">Please select an organization from the sidebar.</div>
  }

  async function clientAction(formData: FormData) {
    const res = await sendBroadcastAction(formData)
    setResult(res)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Broadcast Marketing</h1>
      <p className="text-gray-600 mb-8">
        Send promotional emails or updates to all customers who have ordered from your menu.
      </p>

      {result?.success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
          Successfully queued broadcast to {result.count} unique customers!
        </div>
      )}

      {result?.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {result.error}
        </div>
      )}

      <form action={clientAction} className="space-y-6">
        <input type="hidden" name="organization_id" value={orgId} />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email Subject</label>
          <input 
            type="text" 
            name="subject"
            required
            className="w-full border rounded-lg px-4 py-2"
            placeholder="e.g. 50% off all Pasta this Friday!"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Message Body</label>
          <textarea 
            name="message"
            required
            rows={8}
            className="w-full border rounded-lg px-4 py-2 font-sans"
            placeholder="Write your email here..."
          />
        </div>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6">
          <strong>Note:</strong> We will automatically find all unique customer emails associated with your paid orders and deliver this message via our high-deliverability Resend infrastructure.
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}
