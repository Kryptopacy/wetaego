'use client'

import React, { useState, useMemo } from 'react'
import { QRCodeCanvas } from '@/components/ui/qr-code-canvas'
import { QrCode, Trash2, Printer, Plus, Download, ToggleLeft, ToggleRight, Sparkles, Utensils, Hotel, Monitor, FileText, Layers, Wifi, Star } from 'lucide-react'
import { toast } from 'sonner'

export type QRType = 'table' | 'room' | 'desk' | 'page' | 'review' | 'wifi'

export interface QRItem {
  id: string
  num: string
  section: string
  url: string
  type: QRType
}

interface PageOption {
  id: string
  title: string
  slug: string
  template_type?: string | null
  business_type_preset?: string | null
}

export function QRGeneratorClient({
  locationSlug,
  locationName,
  themeColor = '#10b981',
  logoUrl,
  businessType,
  pages = [],
  initialResources = []
}: {
  locationSlug: string
  locationName: string
  themeColor?: string
  logoUrl?: string | null
  businessType?: string | null
  pages?: PageOption[]
  initialResources?: { id: string; name: string; type: string }[]
}) {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_BASE_URL || 'https://ourmenuos.online')

  // Generate URL helper
  const generateURL = (num: string, type: QRType): string => {
    if (type === 'page') {
      const cleanSlug = num.startsWith('/') ? num.slice(1) : num
      return `${baseUrl}/m/${locationSlug}/p/${cleanSlug}`
    }
    if (type === 'review') {
      return `${baseUrl}/m/${locationSlug}/feedback/general`
    }
    return `${baseUrl}/m/${locationSlug}?${type}=${encodeURIComponent(num)}`
  }

  // Compute allowed QR types relevant to this venue's business model
  const allowedTypes = useMemo<QRType[]>(() => {
    const types: QRType[] = []

    const hasTableResource = initialResources.some(r => r.type === 'table')
    const hasDiningTemplate = pages.some(p => ['catalog', 'restaurant', 'bar_lounge'].includes(p.template_type || ''))
    const isFoodBusinessType = ['restaurant', 'bar_lounge', 'food_truck', 'cafe', 'food_drink', 'bakery', 'pub', 'club'].includes(businessType || '')
    
    if (hasTableResource || hasDiningTemplate || isFoodBusinessType || (!businessType && initialResources.length === 0 && pages.length === 0)) {
      types.push('table')
    }

    const hasRoomResource = initialResources.some(r => r.type === 'room')
    const hasHotelTemplate = pages.some(p => ['hotel', 'stay', 'listing'].includes(p.template_type || ''))
    const isHotelBusinessType = ['hotel', 'stay', 'resort', 'shortlet', 'lodging', 'apartment'].includes(businessType || '')

    if (hasRoomResource || hasHotelTemplate || isHotelBusinessType) {
      types.push('room')
    }

    // Counter / Desk checkouts, Direct Pages, Feedback always available
    types.push('desk')
    types.push('page')
    types.push('review')

    return types
  }, [initialResources, pages, businessType])

  // Pre-populate with initial items from resources/tables or page
  const [items, setItems] = useState<QRItem[]>(() => {
    if (initialResources.length > 0) {
      return initialResources.map((res) => ({
        id: res.id,
        num: res.name.replace(/^(Table|Room|Desk)\s+/i, ''),
        section: '',
        type: (res.type as QRType) || 'table',
        url: generateURL(res.name.replace(/^(Table|Room|Desk)\s+/i, ''), (res.type as QRType) || 'table')
      }))
    }

    const initialList: QRItem[] = []
    
    if (allowedTypes.includes('table')) {
      initialList.push(
        { id: 'init-1', num: '1', section: 'Main Area', type: 'table', url: generateURL('1', 'table') },
        { id: 'init-2', num: '2', section: 'Main Area', type: 'table', url: generateURL('2', 'table') }
      )
    } else if (allowedTypes.includes('room')) {
      initialList.push(
        { id: 'init-101', num: '101', section: 'Standard Rooms', type: 'room', url: generateURL('101', 'room') },
        { id: 'init-102', num: '102', section: 'Standard Rooms', type: 'room', url: generateURL('102', 'room') }
      )
    } else {
      initialList.push(
        { id: 'init-desk-1', num: 'Main Counter', section: 'Checkout', type: 'desk', url: generateURL('Main Counter', 'desk') }
      )
    }

    initialList.push({
      id: 'init-review',
      num: 'Feedback & Tips',
      section: 'Guest Reviews',
      type: 'review',
      url: generateURL('review', 'review')
    })

    return initialList
  })

  const [activeCategory, setActiveCategory] = useState<'all' | 'table' | 'room' | 'desk' | 'page'>('all')
  const [identifier, setIdentifier] = useState('')
  const [section, setSection] = useState('')
  const [qrType, setQrType] = useState<QRType>(() => allowedTypes[0] || 'table')
  const [simpleMode, setSimpleMode] = useState(false)

  // Batch generator states
  const [batchStart, setBatchStart] = useState(1)
  const [batchEnd, setBatchEnd] = useState(10)
  const [batchPrefix, setBatchPrefix] = useState('')
  const [showBatchModal, setShowBatchModal] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = identifier.trim()
    if (!trimmed && qrType !== 'review') {
      toast.error('Please enter an identifier (e.g. 12, VIP-1, or /menu)')
      return
    }

    const normalizedNum = qrType === 'page' && !trimmed.startsWith('/') ? `/${trimmed}` : (trimmed || 'Guest Feedback')
    const generatedUrl = generateURL(normalizedNum, qrType)

    // Check duplicates
    if (items.some(i => i.url.toLowerCase() === generatedUrl.toLowerCase())) {
      toast.error(`A QR code for ${normalizedNum} already exists!`)
      return
    }

    const newItem: QRItem = {
      id: Math.random().toString(36).substring(2, 9),
      num: normalizedNum,
      section: section.trim(),
      url: generatedUrl,
      type: qrType,
    }

    setItems(prev => [newItem, ...prev])
    setIdentifier('')
    setSection('')
    toast.success(`Generated QR for ${labelFor(newItem)}!`)
  }

  const handleBatchGenerate = () => {
    if (batchEnd < batchStart) {
      toast.error('End number must be greater than or equal to start number.')
      return
    }
    const count = batchEnd - batchStart + 1
    if (count > 50) {
      toast.error('Maximum 50 items per batch.')
      return
    }

    const newBatch: QRItem[] = []
    for (let i = batchStart; i <= batchEnd; i++) {
      const numLabel = batchPrefix ? `${batchPrefix}-${i}` : `${i}`
      const url = generateURL(numLabel, qrType)
      if (!items.some(it => it.url.toLowerCase() === url.toLowerCase())) {
        newBatch.push({
          id: Math.random().toString(36).substring(2, 9),
          num: numLabel,
          section: section.trim(),
          url,
          type: qrType
        })
      }
    }

    if (newBatch.length === 0) {
      toast.info('All items in this range already exist.')
    } else {
      setItems(prev => [...newBatch, ...prev])
      toast.success(`Created ${newBatch.length} QR codes!`)
    }
    setShowBatchModal(false)
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    toast.info('QR Code removed')
  }

  const downloadQR = (item: QRItem) => {
    const canvas = document.getElementById(`qr-canvas-${item.id}`) as HTMLCanvasElement
    if (!canvas) {
      toast.error('Could not export canvas image')
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `ourmenu-qr-${item.type}-${item.num.replace(/[\/\s]/g, '-')}.png`
    a.click()
    toast.success('PNG downloaded!')
  }

  const labelFor = (item: QRItem): string => {
    if (item.type === 'page') {
      const match = pages.find(p => p.slug === item.num.replace(/^\//, ''))
      return match ? match.title : `Page: ${item.num}`
    }
    if (item.type === 'review') return 'Guest Reviews & Tips'
    if (item.type === 'desk') return `Counter ${item.num}`
    if (item.type === 'room') return `Room ${item.num}`
    return `Table ${item.num}`
  }

  const subLabelFor = (item: QRItem): string => {
    if (item.type === 'page') return 'Scan to view direct catalog'
    if (item.type === 'review') return 'Scan to leave review & tip staff'
    if (item.type === 'desk') return 'Scan to pay or order at counter'
    if (item.type === 'room') return 'Scan for room dining & amenities'
    return 'Scan to view menu & order'
  }

  const tc = themeColor || '#10b981'

  // Filter items by category
  const filteredItems = items.filter(item => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'page') return item.type === 'page' || item.type === 'review'
    return item.type === activeCategory
  })

  // Dynamic scope tabs based on business types
  const categoryTabs = useMemo(() => {
    const list: { id: 'all' | 'table' | 'room' | 'desk' | 'page'; label: string; icon: React.ElementType; count: number }[] = [
      { id: 'all', label: 'All QR Codes', icon: Layers, count: items.length },
    ]

    if (allowedTypes.includes('table')) {
      list.push({ id: 'table', label: 'Tables & Dining', icon: Utensils, count: items.filter(i => i.type === 'table').length })
    }

    if (allowedTypes.includes('room')) {
      list.push({ id: 'room', label: 'Rooms & Stays', icon: Hotel, count: items.filter(i => i.type === 'room').length })
    }

    if (allowedTypes.includes('desk')) {
      list.push({ id: 'desk', label: 'Counter & POS', icon: Monitor, count: items.filter(i => i.type === 'desk').length })
    }

    list.push({ id: 'page', label: 'Pages & Reviews', icon: FileText, count: items.filter(i => i.type === 'page' || i.type === 'review').length })

    return list
  }, [allowedTypes, items])

  return (
    <div className="max-w-6xl space-y-8 pb-20">
      {/* ── Dynamic Print CSS ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            display: grid !important;
            grid-template-columns: repeat(${simpleMode ? '4' : '2'}, 1fr) !important;
            gap: ${simpleMode ? '12px' : '20px'} !important;
            padding: 20px !important;
          }
          .no-print { display: none !important; }
          .print-break { break-inside: avoid; }
        }
      `}} />

      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">QR Code Generator & Signage Station</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Print-ready tabletop stands, room plaques, counter checkouts, and promotional cards for {locationName}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setItems([])}
            disabled={items.length === 0}
            className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl border border-zinc-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={filteredItems.length === 0}
            className="flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Sheet ({filteredItems.length})
          </button>
        </div>
      </div>

      {/* ── Business Type Scope Tabs ── */}
      <div className="flex flex-wrap gap-2 bg-zinc-900/70 p-1.5 rounded-2xl border border-zinc-800 no-print">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id as typeof activeCategory)
                if (tab.id !== 'all') {
                  setQrType(tab.id as QRType)
                }
              }}
              className={`flex-1 min-w-[120px] flex items-center justify-center sm:justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="truncate">{tab.label}</span>
              </div>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-zinc-950/60 rounded font-mono text-zinc-400">
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Mode Toggle & Batch Create Panel ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${!simpleMode ? 'text-white' : 'text-zinc-500'}`}>
            Branded Cards <span className="text-[10px] ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Default</span>
          </span>
          <span className="hidden sm:inline text-xs text-zinc-500">• Full tabletop displays with logo, section pill, and scan frame.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Batch Create</span>
          </button>

          <button
            type="button"
            onClick={() => setSimpleMode(!simpleMode)}
            className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
          >
            {simpleMode ? (
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-zinc-400" />
            )}
            <span className="text-xs font-bold">{simpleMode ? 'Simple Mode' : 'Branded Mode'}</span>
          </button>
        </div>
      </div>

      {/* ── Batch Modal ── */}
      {showBatchModal && (
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4 no-print animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Batch Generate QR Codes
            </h3>
            <button onClick={() => setShowBatchModal(false)} className="text-zinc-500 hover:text-white text-xs font-bold">
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Target Type</label>
              <select
                value={qrType}
                onChange={(e) => setQrType(e.target.value as QRType)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                {allowedTypes.includes('table') && <option value="table">🍽️ Table</option>}
                {allowedTypes.includes('room') && <option value="room">🏨 Room</option>}
                {allowedTypes.includes('desk') && <option value="desk">🖥️ Counter / Desk</option>}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Optional Prefix</label>
              <input
                type="text"
                placeholder="e.g. VIP or Patio"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">From Number</label>
              <input
                type="number"
                min="1"
                value={batchStart}
                onChange={(e) => setBatchStart(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">To Number</label>
              <input
                type="number"
                min="1"
                value={batchEnd}
                onChange={(e) => setBatchEnd(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleBatchGenerate}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Generate Batch ({Math.max(0, batchEnd - batchStart + 1)} QR Cards)
          </button>
        </div>
      )}

      {/* ── Single Generator Form ── */}
      <form
        onSubmit={handleGenerate}
        className="bg-zinc-900/60 border border-zinc-800 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end no-print"
      >
        {/* Type Select */}
        <div className="w-full md:w-44">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Target Type
          </label>
          <select
            value={qrType}
            onChange={(e) => setQrType(e.target.value as QRType)}
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 text-white text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
          >
            {allowedTypes.includes('table') && <option value="table">🍽️ Table</option>}
            {allowedTypes.includes('room') && <option value="room">🏨 Room</option>}
            {allowedTypes.includes('desk') && <option value="desk">🖥️ Counter / Desk</option>}
            {allowedTypes.includes('page') && <option value="page">📄 Direct Page</option>}
            {allowedTypes.includes('review') && <option value="review">⭐ Feedback & Tip</option>}
          </select>
        </div>

        {/* Identifier Input */}
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            {qrType === 'page' ? 'Page Slug or Path' : qrType === 'review' ? 'Label (Default: Guest Reviews)' : `${qrType.charAt(0).toUpperCase() + qrType.slice(1)} Number / Label`}
          </label>
          <input
            type="text"
            list="pages-datalist"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={
              qrType === 'page'
                ? 'e.g. /menu or select below'
                : qrType === 'review'
                ? 'e.g. Feedback & Tips Stand'
                : qrType === 'room'
                ? 'e.g. 204, Penthouse'
                : qrType === 'desk'
                ? 'e.g. Front Desk, Cashier 1'
                : 'e.g. 1, Patio-4, VIP-2'
            }
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 text-white text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all"
          />
          {pages.length > 0 && qrType === 'page' && (
            <datalist id="pages-datalist">
              {pages.map((p) => (
                <option key={p.id} value={`/${p.slug}`}>
                  {p.title}
                </option>
              ))}
            </datalist>
          )}
        </div>

        {/* Section Input */}
        <div className="w-full md:w-56">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Section / Area <span className="text-zinc-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g. Rooftop Lounge, Patio"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 text-white text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full md:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add QR Card
        </button>
      </form>

      {/* ── Print / Output Grid ── */}
      <div
        id="print-area"
        className={`grid gap-6 ${
          simpleMode
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-500 font-medium border border-dashed border-zinc-800 rounded-3xl no-print bg-zinc-950/40">
            <QrCode className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">No QR codes in this category.</p>
            <p className="text-xs text-zinc-600 mt-1">Add items or switch tabs to view other generated signage.</p>
          </div>
        )}

        {filteredItems.map((item) => (
          <div key={item.id} className="print-break">
            {simpleMode ? (
              <div className="relative group bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col items-center gap-2 print-break shadow-sm">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                  <button
                    onClick={() => downloadQR(item)}
                    className="p-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 shadow-sm cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <span className="text-xs font-bold text-zinc-800 truncate max-w-full">
                  {labelFor(item)}
                </span>
                
                <div className="p-2 bg-white rounded-xl">
                  <QRCodeCanvas
                    id={`qr-canvas-${item.id}`}
                    value={item.url}
                    size={130}
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                <span className="text-[10px] text-zinc-400 font-mono truncate max-w-full">
                  {locationSlug}
                </span>
              </div>
            ) : (
              <div className="relative group bg-white text-zinc-900 border-2 border-zinc-200 rounded-3xl p-6 flex flex-col items-center justify-between text-center print-break shadow-md min-h-[360px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-3" style={{ backgroundColor: tc }} />

                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity no-print z-20">
                  <button
                    onClick={() => downloadQR(item)}
                    className="p-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-md cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-500 shadow-md cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full flex flex-col items-center mt-2">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={locationName} 
                      className="h-10 max-w-[140px] object-contain mb-2 rounded"
                    />
                  ) : (
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight line-clamp-1 mb-1">
                      {locationName}
                    </h2>
                  )}

                  {item.section ? (
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3"
                      style={{ backgroundColor: `${tc}15`, color: tc }}
                    >
                      {item.section}
                    </span>
                  ) : (
                    <div className="h-4 mb-2" />
                  )}
                </div>

                <div className="my-2 p-3 bg-white rounded-2xl border border-zinc-200 shadow-inner flex flex-col items-center">
                  <div className="mb-1.5 px-3 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                    Scan Me ↓
                  </div>
                  <QRCodeCanvas
                    id={`qr-canvas-${item.id}`}
                    value={item.url}
                    size={155}
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="w-full flex flex-col items-center mt-2">
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                    {labelFor(item)}
                  </h3>
                  <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">
                    {subLabelFor(item)}
                  </p>
                </div>

                <div className="w-full mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-400 font-medium">
                  <span>Powered by OurMenu OS</span>
                  <span className="font-mono">{locationSlug}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
