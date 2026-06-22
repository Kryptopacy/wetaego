'use client'

import { Database } from '@/lib/supabase/types'
import { useState } from 'react'
import Image from 'next/image'
import { generateQrBatch, deleteQrCode, assignQrTable } from './actions'
import { toast } from 'sonner'

export function QrClient({ organizationId, orgLogo, locations, qrCodes, baseUrl }: {
  organizationId: string
  orgLogo?: string | null
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
          
          <select name="location_id" className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all" required>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <input 
            type="number" 
            name="quantity" 
            min="1" 
            max="200" 
            defaultValue="10" 
            className="w-24 bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            required
            title="Number of QR codes to generate"
          />

          <button 
            disabled={isGenerating}
            type="submit" 
            className="bg-white hover:bg-zinc-200 text-black font-bold px-6 py-2 rounded-lg shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="print:hidden flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Generated QR Codes ({qrCodes.length})</h3>
        <button 
          onClick={() => window.print()}
          className="bg-zinc-100 hover:bg-white text-zinc-900 font-bold px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
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
            <div key={qr.id} className="relative group border-2 border-zinc-800 rounded-2xl p-6 bg-gradient-to-b from-zinc-900/80 to-zinc-950 flex flex-col items-center print:border print:border-zinc-300 print:bg-white print:rounded-lg print:p-8 print:break-inside-avoid shadow-2xl transition-all hover:border-zinc-600 overflow-hidden">
              
              {/* Brand Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 print:h-3" style={{ backgroundColor: `#${hexColor}` }} />

              {orgLogo && (
                <div className="mt-1 mb-3 print:mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image src={orgLogo} alt="Venue Logo" width={120} height={48} className="h-8 md:h-10 w-auto object-contain print:h-12" crossOrigin="anonymous" />
                </div>
              )}

              {/* Delete Button (Hidden during print) */}
              <button 
                onClick={async () => await deleteQrCode(qr.id)}
                className="absolute top-4 right-4 p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all print:hidden"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="bg-white p-3 rounded-xl mb-4 print:p-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] print:shadow-none w-full max-w-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image src={qrImageUrl} alt="QR Code" width={300} height={300} className="w-full aspect-square" crossOrigin="anonymous" />
              </div>
              
              <div className="text-center w-full mb-4 print:mb-6 flex flex-col items-center">
                <div className="print:flex hidden items-center gap-1.5 mb-3 text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-full px-3 py-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Scan with Camera</span>
                </div>
                <h2 className="font-extrabold text-white print:text-black text-xl md:text-2xl tracking-tight leading-tight w-full" style={{ color: `#${hexColor}` }}>
                  {loc?.name || 'Unknown'}
                </h2>
                <p className="text-zinc-400 print:text-zinc-600 text-sm md:text-base font-semibold mt-2 uppercase tracking-widest">
                  {qr.table_identifier ? qr.table_identifier : 'Scan to Order'}
                </p>
                
                {/* Fallback URL */}
                <div className="mt-4 text-center w-full print:block hidden">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Or visit link:</p>
                  <p className="text-xs font-mono font-bold text-black border-2 border-zinc-200 bg-zinc-50 rounded-lg px-3 py-1.5 inline-block mx-auto max-w-full break-all">{displayUrl}</p>
                </div>
              </div>

              {/* Secondary Feedback QR */}
              <div className="w-full border-t border-zinc-800/50 print:border-zinc-200 pt-4 flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 print:text-zinc-500 mb-2 text-center leading-relaxed">
                  Scan to Rate & Tip<br/>
                  <span className="text-[8px] tracking-normal font-medium">(Requires 4-digit PIN from receipt)</span>
                </p>
                <div className="bg-white p-1.5 rounded-lg print:p-0 w-20 h-20 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/api/feedback-entry?qr_id=${qr.id}`)}&color=000000`}
                    alt="Feedback QR" 
                    width={150}
                    height={150}
                    className="w-full h-full" 
                    crossOrigin="anonymous" 
                  />
                </div>
              </div>
              
              <div className="w-full mt-6 pt-4 border-t border-zinc-800/30 print:border-zinc-100 flex justify-center print:block hidden">
                 <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest text-center">Powered by OurMenu OS</p>
              </div>

              <div className="text-center w-full mt-4 flex flex-col items-center">
                <button
                  onClick={() => {
                    setAssigningQr(qr)
                    setTableInput(qr.table_identifier || '')
                    setAssignModalOpen(true)
                  }}
                  className="mt-2 text-[11px] font-medium bg-zinc-800 hover:bg-white hover:text-black text-zinc-300 px-4 py-1.5 rounded-full print:hidden transition-all shadow-md"
                >
                  {qr.table_identifier ? 'Change Table' : 'Assign Table'}
                </button>
                <p className="text-zinc-700 print:text-zinc-400 text-[9px] font-mono mt-3 truncate opacity-50">{qr.id.split('-')[0]}</p>
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
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all shadow-inner"
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
                  className="bg-white hover:bg-zinc-200 text-black font-bold px-6 py-2 rounded-lg transition-colors shadow-lg"
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
