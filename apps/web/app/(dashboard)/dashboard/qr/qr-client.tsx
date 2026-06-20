'use client'

import { Database } from '@/lib/supabase/types'
import { useState } from 'react'
import { generateQrBatch, deleteQrCode, assignQrTable } from './actions'
import { toast } from 'sonner'

export function QrClient({ organizationId, locations, qrCodes, baseUrl }: {
  organizationId: string
  locations: Database['public']['Tables']['locations']['Row'][]
  qrCodes: Database['public']['Tables']['qr_codes']['Row'][]
  baseUrl: string
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Modal state for assigning tables
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningQr, setAssigningQr] = useState<Database['public']['Tables']['qr_codes']['Row'] | null>(null)
  const [tableInput, setTableInput] = useState('')

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsGenerating(true)
    const formData = new FormData(e.currentTarget)
    const res = await generateQrBatch(formData)
    setIsGenerating(false)
    
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('QR batch generated successfully!')
    }
  }

  return (
    <div className="space-y-8 print:space-y-0">
      
      {/* Controls (Hidden during print) */}
      <div className="print:hidden border border-zinc-800 rounded-xl bg-zinc-900/50 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">QR Batch Generator</h2>
          <p className="text-zinc-500 text-sm max-w-md">
            Generate generic QR codes that can be assigned to tables later using the Scan-to-Assign feature. Print them out and stick them on your tables.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="flex gap-3">
          <input type="hidden" name="organization_id" value={organizationId} />
          
          <select name="location_id" className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2" required>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <select name="quantity" className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2">
            <option value="1">Generate 1</option>
            <option value="10">Generate 10</option>
            <option value="50">Generate 50</option>
            <option value="100">Generate 100</option>
          </select>

          <button 
            disabled={isGenerating}
            type="submit" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="print:hidden flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Generated QR Codes ({qrCodes.length})</h3>
        <button 
          onClick={() => window.print()}
          className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print All
        </button>
      </div>

      {/* Grid of QR Codes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 print:grid-cols-4 print:gap-8 print:p-0">
        {qrCodes.map((qr) => {
          const loc = locations.find((l) => l.id === qr.location_id)
          const themeColor = loc?.theme_color || '#000000'
          const hexColor = themeColor.replace('#', '')
          
          // Using qrserver API with color. (color format must be hex without hash)
          const fullUrl = `${baseUrl}${qr.destination_path}?qr_id=${qr.id}`
          const displayUrl = `${baseUrl}${qr.destination_path}`.replace(/^https?:\/\//, '')
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}&color=${hexColor}`

          return (
            <div key={qr.id} className="relative group border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 flex flex-col items-center print:border-zinc-300 print:bg-white print:break-inside-avoid">
              
              {/* Delete Button (Hidden during print) */}
              <button 
                onClick={async () => await deleteQrCode(qr.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all print:hidden"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="bg-white p-2 rounded-lg mb-2 print:p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="QR Code" className="w-full aspect-square" crossOrigin="anonymous" />
              </div>
              
              <div className="text-center w-full mb-3 print:mb-4 flex flex-col items-center">
                <div className="print:flex hidden items-center gap-1.5 mb-1.5 text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-full px-2.5 py-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-tight">Scan with Camera</span>
                </div>
                <p className="font-bold text-white print:text-black text-sm truncate">{loc?.name || 'Unknown'}</p>
                <p className="text-zinc-500 print:text-zinc-600 text-xs truncate mt-1">
                  {qr.table_identifier ? `Table: ${qr.table_identifier}` : 'Unassigned'}
                </p>
                
                {/* Fallback URL */}
                <div className="mt-2 text-center w-full print:block hidden">
                  <p className="text-[8px] uppercase tracking-wider text-zinc-500 mb-0.5">Or visit link:</p>
                  <p className="text-[10px] font-mono font-bold text-black border border-zinc-300 bg-zinc-50 rounded px-1.5 py-0.5 inline-block mx-auto truncate max-w-full">{displayUrl}</p>
                </div>
              </div>

              {/* Secondary Feedback QR */}
              <div className="w-full border-t border-zinc-800 print:border-zinc-300 pt-3 flex flex-col items-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 print:text-zinc-600 mb-2 text-center leading-tight">
                  Scan to Rate & Tip<br/>
                  <span className="text-[7px] lowercase normal-case">(Requires 4-digit PIN from receipt)</span>
                </p>
                <div className="bg-white p-1 rounded-md print:p-0 w-16 h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/api/feedback-entry?qr_id=${qr.id}`)}&color=000000`}
                    alt="Feedback QR" 
                    className="w-full h-full" 
                    crossOrigin="anonymous" 
                  />
                </div>
              </div>

              <div className="text-center w-full mt-3">
                <button
                  onClick={() => {
                    setAssigningQr(qr)
                    setTableInput(qr.table_identifier || '')
                    setAssignModalOpen(true)
                  }}
                  className="mt-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full print:hidden transition-colors"
                >
                  {qr.table_identifier ? 'Change Table' : 'Assign Table'}
                </button>
                <p className="text-zinc-700 print:text-zinc-400 text-[10px] font-mono mt-2 truncate">{qr.id.split('-')[0]}</p>
              </div>
            </div>
          )
        })}

        {qrCodes.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 print:hidden border border-dashed border-zinc-800 rounded-xl">
            No QR codes generated yet. Use the form above to generate a batch.
          </div>
        )}
      </div>

      {/* Assign Table Modal */}
      {assignModalOpen && assigningQr && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Assign Table</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Enter the table name or number (e.g., &quot;Table 14&quot; or &quot;VIP 2&quot;). Leave blank to unassign.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const qrId = assigningQr.id
              setAssignModalOpen(false)
              
              const res = await assignQrTable(qrId, tableInput.trim() || null)
              if (res?.error) {
                toast.error(res.error)
              } else {
                toast.success('Table assigned successfully!')
              }
            }}>
              <input 
                type="text" 
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g. Table 14"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
