'use client'

import { useState } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/submit-button'
import { saveTax, deleteTax } from './taxes/actions'

export function TaxesView({ locationId, taxes }: { locationId: string, taxes: any[] }) {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white">Taxes & Service Charges</h2>
          <p className="text-sm text-zinc-400">Configure legally required taxes (like VAT) or custom service charges.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isAdding ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {isAdding && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ActionForm action={async (formData) => {
            const res = await saveTax(formData)
            if (res.success) setIsAdding(false)
          }} className="flex flex-col gap-4">
            <input type="hidden" name="location_id" value={locationId} />
            <input type="hidden" name="is_active" value="true" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. VAT (7.5%)"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Percentage (%)</label>
                <input
                  type="number"
                  name="percentage"
                  required
                  step="0.01"
                  min="0"
                  placeholder="e.g. 7.5"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <SubmitButton pendingText="Saving...">Save Tax Rule</SubmitButton>
          </ActionForm>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {taxes.length === 0 && !isAdding ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500">No taxes configured yet. By default, no taxes are collected.</p>
          </div>
        ) : (
          taxes.map(tax => (
            <div key={tax.id} className="flex justify-between items-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div>
                <h3 className="text-white font-medium">{tax.name}</h3>
                <p className="text-zinc-400 text-sm">{tax.percentage}%</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${tax.is_active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  {tax.is_active ? 'Active' : 'Inactive'}
                </span>
                <button 
                  onClick={() => deleteTax(tax.id, locationId)}
                  className="text-red-500 hover:text-red-400 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
