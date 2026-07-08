'use client'

import { useState } from 'react'
import { Search, Mail, MessageSquare, CreditCard, Clock, Wallet } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Customer {
  id: string
  email: string
  phone_number: string | null
  credit_balance_minor: number | null
  last_iou_reminder_sent_at: string | null
  last_visit_at: string | null
}

export function IOUClient({ initialCustomers, currencyCode }: { initialCustomers: Customer[], currencyCode: string }) {
  const [search, setSearch] = useState('')

  const filtered = initialCustomers.filter(c => 
    c.email.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone_number && c.phone_number.includes(search))
  )

  const handleRemind = async (customerId: string, channel: 'email' | 'whatsapp') => {
    // In a real implementation, this would call a server action
    alert(`Sending reminder via ${channel} to ${customerId}`)
  }

  const handleSettle = async (customerId: string) => {
    alert(`Initiating settlement for ${customerId}`)
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 overflow-hidden flex flex-col min-h-[500px]">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            placeholder="Search active tabs by email or phone..." 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-zinc-800 bg-black/20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-500 gap-2">
            <Wallet className="w-8 h-8 opacity-50 mb-2" />
            <p>No active tabs found</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900/50 text-zinc-500 uppercase font-medium text-xs sticky top-0 z-10 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Details</th>
                <th className="px-6 py-4 font-medium">Outstanding Balance</th>
                <th className="px-6 py-4 font-medium">Last Visit</th>
                <th className="px-6 py-4 font-medium">Last Reminder</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">{c.email}</span>
                      <span className="text-xs text-zinc-500">{c.phone_number || 'No phone number'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format((c.credit_balance_minor || 0) / 100)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                    {c.last_visit_at ? formatDistanceToNow(new Date(c.last_visit_at), { addSuffix: true }) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.last_iou_reminder_sent_at ? (
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(c.last_iou_reminder_sent_at), { addSuffix: true })}
                      </div>
                    ) : (
                      <span className="text-zinc-600">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRemind(c.id, c.phone_number ? 'whatsapp' : 'email')}
                        className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
                      >
                        {c.phone_number ? <MessageSquare className="w-3.5 h-3.5 mr-2 text-green-500" /> : <Mail className="w-3.5 h-3.5 mr-2" />}
                        Remind
                      </button>
                      <button 
                        onClick={() => handleSettle(c.id)}
                        className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-2" />
                        Settle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
