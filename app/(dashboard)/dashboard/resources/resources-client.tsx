'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Table, Smartphone, Search, MapPin, QrCode, Download, Link as LinkIcon, Trash2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Database } from '@/lib/supabase/types'
import { addResource, updateResource, deleteResource, generateResourceQr, generateQrBatch, deleteQrCode, assignQrTable, createQrZone, assignQrZone } from './actions'
import { DynamicQR } from '@/components/qr/DynamicQR'

type Resource = Database['public']['Tables']['resources']['Row']
type QrCodeType = Database['public']['Tables']['qr_codes']['Row']
type LocationType = Database['public']['Tables']['locations']['Row'] & { location_pages: any[] }

interface ResourcesClientProps {
  initialResources: Resource[]
  organizationId: string
  locationId: string
  slug: string
  location?: LocationType
  qrCodes: QrCodeType[]
  qrZones?: any[]
  baseUrl: string
  planLimit?: number
  creditBalance?: number
  orgLogo?: string | null
}

export function ResourcesClient({ initialResources, organizationId, locationId, slug, location, qrCodes, qrZones, baseUrl, planLimit, creditBalance, orgLogo }: ResourcesClientProps) {
  const [activeTab, setActiveTab] = useState<'static' | 'resources' | 'dynamic'>('resources')
  
  // -- Resources State --
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [search, setSearch] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [modalState, setModalState] = useState<{isOpen: boolean, isEdit: boolean, data: Resource | null, defaultType?: string}>({ isOpen: false, isEdit: false, data: null })

  // -- QR State --
  const [localQrCodes, setLocalQrCodes] = useState(qrCodes)
  const [localZones, setLocalZones] = useState(qrZones || [])
  const [isPending, startTransition] = useTransition()
  
  // -- Dynamic Fleet State --
  const [isGenerating, setIsGenerating] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningQr, setAssigningQr] = useState<QrCodeType | null>(null)
  const [tableInput, setTableInput] = useState('')

  // -- Computed Resources --
  const zones = useMemo(() => {
    const z = new Set(resources.map(r => r.zone_name).filter(Boolean) as string[])
    return Array.from(z).sort()
  }, [resources])

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
      const matchZone = selectedZone === 'all' || r.zone_name === selectedZone
      return matchSearch && matchZone
    })
  }, [resources, search, selectedZone])

  const groupedResources = useMemo(() => {
    const map: Record<string, Resource[]> = {}
    filteredResources.forEach(r => {
      const z = r.zone_name || 'Unassigned Zone'
      if (!map[z]) map[z] = []
      map[z].push(r)
    })
    return map
  }, [filteredResources])

  // -- Handlers: Resources --
  const handleSaveResource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const type = fd.get('type') as string
    const zone_name = fd.get('zone_name') as string
    const capacityStr = fd.get('capacity') as string
    const capacity = capacityStr ? parseInt(capacityStr) : undefined

    startTransition(async () => {
      if (modalState.isEdit && modalState.data) {
        const res = await updateResource({ id: modalState.data.id, name, type, zone_name, capacity })
        if (res.serverError) { toast.error(res.serverError); return }
        setResources(prev => prev.map(r => r.id === modalState.data!.id ? { ...r, name, type, zone_name: zone_name || null, capacity: capacity || null } : r))
        toast.success('Resource updated')
      } else {
        const res = await addResource({ organization_id: organizationId, location_id: locationId, name, type, zone_name, capacity })
        if (res.serverError) { toast.error(res.serverError); return }
        window.location.reload()
      }
      setModalState({ isOpen: false, isEdit: false, data: null })
    })
  }

  const handleDeleteResource = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    startTransition(async () => {
      const res = await deleteResource(id)
      if (res.serverError) { toast.error(res.serverError); return }
      setResources(prev => prev.filter(r => r.id !== id))
      toast.success('Resource deleted')
    })
  }

  const handleGenerateResourceQr = (resourceId: string, resourceType: string) => {
    startTransition(async () => {
      const res = await generateResourceQr({ organizationId, locationId, resourceId, resourceType })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res?.serverError || 'Failed to generate QR')
      } else {
        toast.success('Dynamic QR generated!')
        window.location.reload() // Force reload to get the new QR from server
      }
    })
  }

  // -- Handlers: Dynamic Fleet --
  async function handleGenerateBatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsGenerating(true)
    const formData = new FormData(e.currentTarget)
    const res = await generateQrBatch(formData)
    setIsGenerating(false)
    if (res?.serverError || res?.validationErrors) {
      toast.error(res?.serverError || 'Failed to generate QR batch')
    } else {
      toast.success('QR batch generated successfully!')
      window.location.reload()
    }
  }

  const handleAssignTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!assigningQr) return
    const res = await assignQrTable({ qrId: assigningQr.id, tableIdentifier: tableInput || null })
    if (res?.serverError) toast.error(res.serverError)
    else {
      toast.success('Table assigned successfully!')
      setLocalQrCodes(prev => prev.map(q => q.id === assigningQr.id ? { ...q, table_identifier: tableInput || null } : q))
      setAssignModalOpen(false)
    }
  }

  const downloadQR = (id: string, label: string) => {
    const svg = document.getElementById(id)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new globalThis.Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `${label.replace(/\s+/g, '-')}-QR.png`
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Helper to render a QR Card
  const renderQrCard = (qr: QrCodeType, title: string, subtitle: string) => {
    const themeColor = location?.theme_color || '#000000'
    const hexColor = themeColor.replace('#', '')
    const fullUrl = `${baseUrl}${qr.destination_path}?qr_id=${qr.id}`
    const displayUrl = `${baseUrl}${qr.destination_path}`.replace(/^https?:\/\//, '')

    return (
      <div key={qr.id} className="relative group border-2 rounded-2xl p-6 bg-gradient-to-b from-zinc-900/80 to-zinc-950 flex flex-col items-center print:border print:border-zinc-300 print:bg-white print:rounded-lg print:p-8 print:break-inside-avoid shadow-2xl transition-all hover:border-zinc-600 overflow-hidden" style={{ borderColor: themeColor }}>
        {/* Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 print:h-3" style={{ backgroundColor: `#${hexColor}` }} />

        {orgLogo && (
          <div className="mt-1 mb-3 print:mt-2">
            <Image src={orgLogo} alt="Venue Logo" width={120} height={48} className="h-8 md:h-10 w-auto object-contain print:h-12" crossOrigin="anonymous" />
          </div>
        )}

        <button 
          onClick={async () => {
            if (!confirm('Are you sure you want to delete this QR?')) return;
            const res = await deleteQrCode({ qrId: qr.id })
            if (res?.serverError) toast.error(res.serverError)
            else setLocalQrCodes(prev => prev.filter(q => q.id !== qr.id))
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all print:hidden z-10"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="bg-white p-3 rounded-xl mb-4 print:p-0 shadow-[0_0_15px_rgba(255,255,255,0.1)] print:shadow-none w-full max-w-[200px] aspect-square flex items-center justify-center">
          <div id={`qr-${qr.id}`} className="w-full h-full">
            <DynamicQR value={fullUrl} color={themeColor} size={180} />
          </div>
        </div>
        
        <div className="text-center w-full mb-4 print:mb-6 flex flex-col items-center">
          <div className="print:flex hidden items-center gap-1.5 mb-3 text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-full px-3 py-1">
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Scan with Camera</span>
          </div>
          <h2 className="font-extrabold text-white print:text-black text-xl md:text-2xl tracking-tight leading-tight w-full" style={{ color: `#${hexColor}` }}>
            {title}
          </h2>
          <p className="text-zinc-400 print:text-zinc-600 text-sm md:text-base font-semibold mt-2 uppercase tracking-widest">
            {subtitle}
          </p>
          
          <div className="mt-4 text-center w-full print:block hidden">
            <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Or visit link:</p>
            <p className="text-xs font-mono font-bold text-black border-2 border-zinc-200 bg-zinc-50 rounded-lg px-3 py-1.5 inline-block mx-auto max-w-full break-all">{displayUrl}</p>
          </div>
        </div>

        <div className="w-full border-t border-zinc-800/50 print:border-zinc-200 pt-4 flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 print:text-zinc-500 mb-2 text-center leading-relaxed">
            Scan to Rate & Tip<br/>
            <span className="text-[8px] tracking-normal font-medium">(Requires 4-digit PIN from receipt)</span>
          </p>
          <div className="bg-white p-1.5 rounded-lg print:p-0 w-20 h-20 shadow-inner flex items-center justify-center">
            <DynamicQR value={`${baseUrl}/api/feedback-entry?qr_id=${qr.id}`} color="#000000" size={80} />
          </div>
        </div>
        
        <div className="mt-6 flex flex-col gap-2 w-full print:hidden">
          <button 
            onClick={() => downloadQR(`qr-${qr.id}`, subtitle)}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download QR
          </button>
          {activeTab === 'dynamic' && (
            <button 
              onClick={() => { setAssigningQr(qr); setTableInput(qr.table_identifier || ''); setAssignModalOpen(true); }}
              className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" /> {qr.table_identifier ? 'Change Assignment' : 'Assign to Table'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="print:hidden border-b border-zinc-800 flex gap-6">
        <button 
          onClick={() => setActiveTab('resources')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${activeTab === 'resources' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Fixed Resources</div>
        </button>
        <button 
          onClick={() => setActiveTab('static')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${activeTab === 'static' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Storefront QRs</div>
        </button>
        <button 
          onClick={() => setActiveTab('dynamic')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${activeTab === 'dynamic' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Dynamic QR Fleet</div>
        </button>
      </div>

      {/* --- TAB: RESOURCES --- */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select 
                value={selectedZone} onChange={e => setSelectedZone(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
              >
                <option value="all">All Zones</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              <button 
                onClick={() => setModalState({ isOpen: true, isEdit: false, data: null, defaultType: 'register' })}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-colors"
              >
                <Smartphone className="w-5 h-5" /> Add Register
              </button>
              <button 
                onClick={() => setModalState({ isOpen: true, isEdit: false, data: null, defaultType: 'table' })}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-100 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-colors"
              >
                <Plus className="w-5 h-5" /> Add Table
              </button>
            </div>
          </div>

          {Object.entries(groupedResources).sort(([a],[b]) => a.localeCompare(b)).map(([zone, zoneResources]) => (
            <div key={zone} className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-emerald-500" /> {zone}
                <span className="bg-zinc-800 text-zinc-400 text-xs py-0.5 px-2 rounded-full font-medium ml-2">{zoneResources.length}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {zoneResources.map(resource => {
                  const dynamicQr = localQrCodes.find(q => q.table_identifier === resource.id)
                  
                  return (
                    <div key={resource.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-zinc-800 p-2.5 rounded-xl text-zinc-300">
                              {resource.type === 'table' ? <Table className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-white leading-tight">{resource.name}</h3>
                              <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mt-1">
                                {resource.type} {resource.capacity && `• ${resource.capacity} SEATS`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-zinc-800 flex gap-2 flex-wrap">
                        {dynamicQr ? (
                           <button onClick={() => window.alert('Scroll down to "Resource QRs" to view and print this QR.')} className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                             <QrCode className="w-4 h-4" /> Has Dynamic QR
                           </button>
                        ) : (
                           <button 
                             onClick={() => handleGenerateResourceQr(resource.id, resource.type)}
                             className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                           >
                             <QrCode className="w-4 h-4" /> Generate QR
                           </button>
                        )}
                        <button onClick={() => setModalState({ isOpen: true, isEdit: true, data: resource })} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteResource(resource.id, resource.name)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
              <p className="text-zinc-500">No resources found.</p>
            </div>
          )}

          {/* Grid of Dynamic QRs attached to resources */}
          {localQrCodes.filter(q => q.table_identifier && resources.find(r => r.id === q.table_identifier)).length > 0 && (
            <div className="mt-12 space-y-4">
               <div className="flex justify-between items-center print:hidden">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-white">Resource QRs</h2>
                 <button onClick={() => window.print()} className="bg-zinc-100 hover:bg-white text-zinc-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                   <Printer className="w-4 h-4" /> Print These QRs
                 </button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 print:grid-cols-4 print:gap-8 print:p-0">
                  {localQrCodes.filter(q => q.table_identifier && resources.find(r => r.id === q.table_identifier)).map(qr => {
                    const res = resources.find(r => r.id === qr.table_identifier)
                    return renderQrCard(qr, location?.name || 'Venue', res ? res.name : (qr.table_identifier || 'Unknown'))
                  })}
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: STATIC STOREFRONT QRS --- */}
      {activeTab === 'static' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 print:hidden">
            <h2 className="text-xl font-bold text-white mb-2">Static Storefront Links</h2>
            <p className="text-zinc-400 text-sm">
              These are free, static QR codes that point directly to your digital storefront or specific pages. They do not have unique IDs and cannot track which table an order came from. You can print them infinitely.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 print:grid-cols-4 print:gap-8 print:p-0">
            {/* Base Location Portal QR */}
            <div className="relative border-2 rounded-2xl p-6 bg-gradient-to-b from-zinc-900/80 to-zinc-950 flex flex-col items-center shadow-2xl overflow-hidden print:border print:border-zinc-300 print:bg-white" style={{ borderColor: location?.theme_color || '#333' }}>
               <div className="absolute top-0 left-0 right-0 h-2 print:h-3" style={{ backgroundColor: location?.theme_color || '#333' }} />
               <div className="bg-white p-3 rounded-xl mb-4 w-full max-w-[200px] aspect-square">
                 <div id="static-qr-portal" className="w-full h-full">
                    <DynamicQR value={`${baseUrl}/m/${slug}`} color={location?.theme_color || '#000'} size={180} />
                 </div>
               </div>
               <h2 className="font-extrabold text-white print:text-black text-xl mb-2">{location?.name}</h2>
               <p className="text-zinc-400 print:text-zinc-600 font-semibold uppercase tracking-widest text-sm mb-6">Storefront Portal</p>
               <button onClick={() => downloadQR('static-qr-portal', 'Storefront-Portal')} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold print:hidden"><Download className="w-4 h-4 inline mr-2" /> Download</button>
            </div>

            {/* Individual Pages */}
            {location?.location_pages?.map(p => (
              <div key={p.id} className="relative border-2 rounded-2xl p-6 bg-gradient-to-b from-zinc-900/80 to-zinc-950 flex flex-col items-center shadow-2xl overflow-hidden print:border print:border-zinc-300 print:bg-white" style={{ borderColor: location?.theme_color || '#333' }}>
                <div className="absolute top-0 left-0 right-0 h-2 print:h-3" style={{ backgroundColor: location?.theme_color || '#333' }} />
                <div className="bg-white p-3 rounded-xl mb-4 w-full max-w-[200px] aspect-square">
                  <div id={`static-qr-${p.id}`} className="w-full h-full">
                     <DynamicQR value={`${baseUrl}/m/${slug}/p/${p.slug}`} color={location?.theme_color || '#000'} size={180} />
                  </div>
                </div>
                <h2 className="font-extrabold text-white print:text-black text-xl mb-2">{location?.name}</h2>
                <p className="text-zinc-400 print:text-zinc-600 font-semibold uppercase tracking-widest text-sm mb-6">{p.title}</p>
                <button onClick={() => downloadQR(`static-qr-${p.id}`, p.title)} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold print:hidden"><Download className="w-4 h-4 inline mr-2" /> Download</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB: DYNAMIC QR FLEET --- */}
      {activeTab === 'dynamic' && (
        <div className="space-y-6">
          <div className="print:hidden border border-zinc-800 rounded-xl bg-zinc-900/50 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Dynamic QR Fleet</h2>
              <p className="text-zinc-500 text-sm max-w-md">
                Generate a batch of generic dynamic QRs that can be printed and later assigned to tables using Scan-to-Assign. Each dynamic QR uses 1 unified credit.
              </p>
            </div>

            <form onSubmit={handleGenerateBatch} className="flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <input type="hidden" name="organization_id" value={organizationId} />
                <input type="hidden" name="location_id" value={`${locationId}|/m/${slug}`} />
                <input 
                  type="number" name="quantity" min="1" max="200" 
                  value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-24 bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-all"
                  required
                />
                <button 
                  disabled={isGenerating || (Math.max(0, localQrCodes.length + quantity - (planLimit || 10)) > (creditBalance || 0))}
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black font-bold px-6 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Batch'}
                </button>
              </div>
              {(() => {
                const currentCount = localQrCodes.length
                const free = planLimit || 10
                const excess = (currentCount + quantity) - Math.max(currentCount, free)
                if (excess > 0) {
                  const canAfford = (creditBalance || 0) >= excess
                  return (
                    <div className={`text-xs px-2 ${canAfford ? 'text-emerald-400' : 'text-red-400 font-bold'}`}>
                      {excess} extra QR{excess > 1 ? 's' : ''} costs {excess} credit{excess > 1 ? 's' : ''} (Balance: {creditBalance || 0}).
                    </div>
                  )
                }
                return null
              })()}
            </form>
          </div>

          <div className="print:hidden flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Unassigned Fleet ({localQrCodes.filter(q => !q.table_identifier).length})</h3>
            <button onClick={() => window.print()} className="bg-zinc-100 hover:bg-white text-zinc-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Fleet
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 print:grid-cols-4 print:gap-8 print:p-0">
            {localQrCodes.filter(q => !q.table_identifier).map(qr => renderQrCard(qr, location?.name || 'Venue', 'Scan to Assign'))}
          </div>
          {localQrCodes.filter(q => !q.table_identifier).length === 0 && (
             <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
               No unassigned QR codes in the fleet.
             </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      {/* Resource Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">{modalState.isEdit ? 'Edit Resource' : 'Add Resource'}</h2>
            <form onSubmit={handleSaveResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name / Identifier</label>
                <input required name="name" defaultValue={modalState.data?.name} placeholder="e.g. Table 15 or Front Register" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                  <select name="type" defaultValue={modalState.data?.type || modalState.defaultType || 'table'} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
                    <option value="table">Table</option>
                    <option value="register">Register / Desk</option>
                    <option value="room">Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Capacity (Optional)</label>
                  <input type="number" name="capacity" defaultValue={modalState.data?.capacity || ''} min="1" placeholder="e.g. 4" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Zone (Optional)</label>
                <input name="zone_name" defaultValue={modalState.data?.zone_name || ''} placeholder="e.g. Patio, Main Hall" list="zone-list" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                <datalist id="zone-list">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalState({ isOpen: false, isEdit: false, data: null })} className="px-5 py-2.5 rounded-xl font-bold text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-colors">
                  {isPending ? 'Saving...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Table Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Assign to Table</h2>
              <p className="text-zinc-400 text-sm mb-6">Link this QR code to a specific table identifier. This allows customers to order directly to that table.</p>
              <form onSubmit={handleAssignTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Table Identifier</label>
                  <input type="text" autoFocus value={tableInput} onChange={(e) => setTableInput(e.target.value)} placeholder="e.g., Table 12 or T12" className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all" />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium">Cancel</button>
                  <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-6 py-2 rounded-lg font-bold transition-colors">Save Assignment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
