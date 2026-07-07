'use client'

import { useState, useMemo, useTransition } from 'react'
import { toast } from 'sonner'
import { Archive, BarChart2, ChevronDown, ChevronUp, Package, Plus, Search, Tag, X, AlertTriangle, Clock } from 'lucide-react'
import { addInventoryItem, updateInventoryItem, logInventoryMovement, archiveInventoryItem } from './actions'
import { BomManager } from './components/bom-manager'

type InventoryItem = {
  id: string
  organization_id: string
  location_id: string
  name: string
  sku: string | null
  category: string
  unit: string
  current_quantity: number
  reorder_threshold: number | null
  cost_price_minor: number | null
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type InventoryMovement = {
  id: string
  item_id: string
  movement_type: 'restock' | 'use' | 'wastage' | 'sale' | 'adjustment'
  quantity: number
  note: string | null
  recorded_by: string | null
  created_at: string
}

interface InventoryClientProps {
  organizationId: string
  locationId: string
  locationName: string
  currencyCode: string
  initialItems: InventoryItem[]
  initialMovements: InventoryMovement[]
  isEditor: boolean
}

const MOVEMENT_LABELS = {
  restock: { label: 'Restocked', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '↑' },
  use: { label: 'Used', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '↓' },
  wastage: { label: 'Wasted', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '✕' },
  sale: { label: 'Sold', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '↓' },
  adjustment: { label: 'Adjusted', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', icon: '~' },
}

function getStatus(item: InventoryItem) {
  if (item.current_quantity <= 0) return 'out_of_stock'
  if (item.reorder_threshold && item.current_quantity <= item.reorder_threshold) return 'low_stock'
  return 'in_stock'
}

function StatusBadge({ item }: { item: InventoryItem }) {
  const status = getStatus(item)
  if (status === 'out_of_stock') return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Out of Stock</span>
  )
  if (status === 'low_stock') return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
      <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
    </span>
  )
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">In Stock</span>
  )
}

// ─── Quick Log Dialog ─────────────────────────────────────────────────────────
function QuickLogDialog({
  item,
  organizationId,
  locationId,
  onClose,
  onSuccess,
}: {
  item: InventoryItem
  organizationId: string
  locationId: string
  onClose: () => void
  onSuccess: (updatedItem: InventoryItem, movement: InventoryMovement) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'restock' | 'use' | 'wastage' | 'sale' | 'adjustment'>('use')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const quantity = parseFloat(qty)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }

    startTransition(async () => {
      const res = await logInventoryMovement({
        organization_id: organizationId,
        location_id: locationId,
        item_id: item.id,
        movement_type: type,
        quantity,
        note: note || undefined,
      })

      if (res?.serverError) {
        toast.error(res.serverError)
        return
      }

      const outbound = ['use', 'wastage', 'sale'].includes(type)
      const delta = outbound ? -quantity : quantity
      const updatedItem = { ...item, current_quantity: item.current_quantity + delta }
      const newMovement: InventoryMovement = {
        id: crypto.randomUUID(),
        item_id: item.id,
        movement_type: type,
        quantity: delta,
        note: note || null,
        recorded_by: null,
        created_at: new Date().toISOString(),
      }
      toast.success(`Logged ${type}: ${quantity} ${item.unit}`)
      onSuccess(updatedItem, newMovement)
    })
  }

  const typeOptions: Array<{ value: typeof type; label: string; desc: string; color: string }> = [
    { value: 'use', label: 'Used', desc: 'Staff consumed or deployed', color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
    { value: 'restock', label: 'Restocked', desc: 'New stock arrived', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    { value: 'wastage', label: 'Wasted / Lost', desc: 'Spoiled, damaged or missing', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
    { value: 'sale', label: 'Sold', desc: 'Item was sold directly', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    { value: 'adjustment', label: 'Adjustment', desc: 'Manual correction', color: 'border-zinc-600 bg-zinc-700/30 text-zinc-400' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-white text-lg">Log Movement</h2>
            <p className="text-zinc-500 text-sm mt-0.5">{item.name} · Currently {item.current_quantity} {item.unit}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Movement type */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${type === opt.value ? opt.color + ' border-opacity-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600'}`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Quantity ({item.unit})</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="0.001"
                step="0.001"
                placeholder="0"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
                required
              />
              {/* Quick amounts */}
              {[1, 5, 10, 25].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(String(n))}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 text-sm font-medium transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'wastage' ? 'e.g. Expired, dropped…' : type === 'restock' ? 'e.g. Supplier delivery' : 'e.g. Evening service'}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !qty}
            className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-40"
          >
            {isPending ? 'Logging...' : `Log ${typeOptions.find(t => t.value === type)?.label}`}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Add Item Dialog ──────────────────────────────────────────────────────────
function AddItemDialog({
  organizationId,
  locationId,
  categories,
  onClose,
  onSuccess,
  editItem,
}: {
  organizationId: string
  locationId: string
  categories: string[]
  onClose: () => void
  onSuccess: (item: InventoryItem) => void
  editItem?: InventoryItem
}) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editItem

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const costMajor = parseFloat(fd.get('cost_price') as string)
    const costMinor = isNaN(costMajor) ? undefined : Math.round(costMajor * 100)

    startTransition(async () => {
      if (isEdit) {
        const res = await updateInventoryItem({
          item_id: editItem.id,
          organization_id: organizationId,
          name: fd.get('name') as string,
          sku: (fd.get('sku') as string) || undefined,
          category: (fd.get('category') as string) || 'General',
          unit: fd.get('unit') as string,
          reorder_threshold: parseFloat(fd.get('reorder_threshold') as string) || undefined,
          cost_price_minor: costMinor,
          notes: (fd.get('notes') as string) || undefined,
        })
        if (res?.serverError) { toast.error(res.serverError); return }
        toast.success('Item updated')
        onSuccess({ ...editItem, name: fd.get('name') as string, sku: (fd.get('sku') as string) || null, category: (fd.get('category') as string) || 'General', unit: fd.get('unit') as string, reorder_threshold: parseFloat(fd.get('reorder_threshold') as string) || null, cost_price_minor: costMinor ?? null, notes: (fd.get('notes') as string) || null })
      } else {
        const res = await addInventoryItem({
          organization_id: organizationId,
          location_id: locationId,
          name: fd.get('name') as string,
          sku: (fd.get('sku') as string) || undefined,
          category: (fd.get('category') as string) || 'General',
          unit: fd.get('unit') as string,
          initial_quantity: parseFloat(fd.get('initial_quantity') as string) || 0,
          reorder_threshold: parseFloat(fd.get('reorder_threshold') as string) || undefined,
          cost_price_minor: costMinor,
          notes: (fd.get('notes') as string) || undefined,
        })
        if (res?.serverError) { toast.error(res.serverError); return }
        toast.success('Item added to inventory')
        onSuccess({
          id: res?.data?.itemId || crypto.randomUUID(),
          organization_id: organizationId,
          location_id: locationId,
          name: fd.get('name') as string,
          sku: (fd.get('sku') as string) || null,
          category: (fd.get('category') as string) || 'General',
          unit: fd.get('unit') as string,
          current_quantity: parseFloat(fd.get('initial_quantity') as string) || 0,
          reorder_threshold: parseFloat(fd.get('reorder_threshold') as string) || null,
          cost_price_minor: costMinor ?? null,
          notes: (fd.get('notes') as string) || null,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
        } as InventoryItem & { organization_id: string; location_id: string; is_archived: boolean; created_by: null })
      }
    })
  }

  const units = ['pieces', 'kg', 'g', 'liters', 'ml', 'bottles', 'cans', 'bags', 'boxes', 'rolls', 'pairs', 'sets', 'portions']
  const allCategories = [...new Set([...categories, 'General', 'Food', 'Drinks', 'Ingredients', 'Packaging', 'Supplies', 'Cleaning'])]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-bold text-white text-lg">{isEdit ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Item Name *</label>
              <input name="name" defaultValue={editItem?.name} required placeholder="e.g. Fresh Tilapia, Charcoal, Pepper" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <input name="category" defaultValue={editItem?.category ?? 'General'} list="categories-list" placeholder="General" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              <datalist id="categories-list">{allCategories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Unit</label>
              <select name="unit" defaultValue={editItem?.unit ?? 'pieces'} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {!isEdit && (
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Starting Stock</label>
                <input name="initial_quantity" type="number" step="0.001" min="0" defaultValue="0" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Low Stock Alert</label>
              <input name="reorder_threshold" type="number" step="0.001" min="0" defaultValue={editItem?.reorder_threshold ?? ''} placeholder="e.g. 5" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">SKU / Code</label>
              <input name="sku" defaultValue={editItem?.sku ?? ''} placeholder="Optional" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Cost Price</label>
              <input name="cost_price" type="number" step="0.01" min="0" defaultValue={editItem?.cost_price_minor ? (editItem.cost_price_minor / 100).toFixed(2) : ''} placeholder="Optional" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Notes</label>
              <input name="notes" defaultValue={editItem?.notes ?? ''} placeholder="e.g. Keep refrigerated, order from Ade's market" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={isPending} className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-40 mt-2">
            {isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Item')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function InventoryClient({
  organizationId,
  locationId,
  locationName,
  currencyCode,
  initialItems,
  initialMovements,
  isEditor,
}: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all')
  const [logItem, setLogItem] = useState<InventoryItem | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [activeTab, setActiveTab] = useState<'items' | 'log' | 'bom'>('items')
  const [isPending, startTransition] = useTransition()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort()
    return cats
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase())
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter
      const status = getStatus(item)
      const matchStatus = statusFilter === 'all' || status === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [items, search, categoryFilter, statusFilter])

  // Stats
  const totalItems = items.length
  const lowStockCount = items.filter(i => getStatus(i) === 'low_stock').length
  const outOfStockCount = items.filter(i => getStatus(i) === 'out_of_stock').length

  const handleArchive = (item: InventoryItem) => {
    if (!confirm(`Archive "${item.name}"? It will be hidden from the inventory.`)) return
    startTransition(async () => {
      const res = await archiveInventoryItem({ item_id: item.id, organization_id: organizationId })
      if (res?.serverError) { toast.error(res.serverError); return }
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast.success('Item archived')
    })
  }

  const movementsByItem = useMemo(() => {
    const map: Record<string, InventoryMovement[]> = {}
    movements.forEach(m => {
      if (!map[m.item_id]) map[m.item_id] = []
      map[m.item_id].push(m)
    })
    return map
  }, [movements])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{totalItems}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Total Items</div>
        </div>
        <button onClick={() => setStatusFilter(s => s === 'low_stock' ? 'all' : 'low_stock')} className={`border rounded-xl p-4 text-center transition-all ${statusFilter === 'low_stock' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-zinc-900/60 border-zinc-800 hover:border-amber-500/30'}`}>
          <div className="text-2xl font-black text-amber-400">{lowStockCount}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Low Stock</div>
        </button>
        <button onClick={() => setStatusFilter(s => s === 'out_of_stock' ? 'all' : 'out_of_stock')} className={`border rounded-xl p-4 text-center transition-all ${statusFilter === 'out_of_stock' ? 'bg-red-500/20 border-red-500/40' : 'bg-zinc-900/60 border-zinc-800 hover:border-red-500/30'}`}>
          <div className="text-2xl font-black text-red-400">{outOfStockCount}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Out of Stock</div>
        </button>
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
          <button onClick={() => setActiveTab('items')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'items' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" />Items
          </button>
          <button onClick={() => setActiveTab('log')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'log' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />Movement Log
          </button>
          <button onClick={() => setActiveTab('bom')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bom' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />BOM
          </button>
        </div>
        {isEditor && (
          <button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black font-bold px-4 py-2.5 rounded-xl shadow-lg transition-colors">
            <Plus className="w-4 h-4" />Add Item
          </button>
        )}
      </div>

      {activeTab === 'items' && (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Items list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {items.length === 0
                  ? 'No items yet. Add your first inventory item to start tracking stock.'
                  : 'No items match your filters.'}
              </p>
              {isEditor && items.length === 0 && (
                <button onClick={() => setAddDialogOpen(true)} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                  + Add first item
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const status = getStatus(item)
                const itemMovements = movementsByItem[item.id] ?? []
                const isExpanded = expandedItem === item.id

                return (
                  <div key={item.id} className={`rounded-xl border transition-all ${status === 'out_of_stock' ? 'border-red-500/20 bg-red-500/5' : status === 'low_stock' ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                    {/* Main row */}
                    <div className="flex items-center gap-3 p-4">
                      {/* Color bar */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${status === 'out_of_stock' ? 'bg-red-500' : status === 'low_stock' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white truncate">{item.name}</span>
                          <StatusBadge item={item} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                          <span>{item.category}</span>
                          {item.sku && <span>SKU: {item.sku}</span>}
                          {item.reorder_threshold && <span>Alert at {item.reorder_threshold}</span>}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="text-right shrink-0">
                        <div className={`text-2xl font-black tabular-nums ${status === 'out_of_stock' ? 'text-red-400' : status === 'low_stock' ? 'text-amber-400' : 'text-white'}`}>{item.current_quantity}</div>
                        <div className="text-xs text-zinc-500">{item.unit}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditor && (
                          <button
                            onClick={() => setLogItem(item)}
                            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all"
                            title="Log movement"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          {isEditor && (
                            <>
                              <button onClick={() => { setEditItem(item); setExpandedItem(null) }} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all flex items-center gap-1.5">
                                ✏️ Edit Details
                              </button>
                              <button onClick={() => handleArchive(item)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5">
                                <Archive className="w-3 h-3" /> Archive
                              </button>
                            </>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-zinc-500 mt-3 italic">📝 {item.notes}</p>
                        )}
                        {itemMovements.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent Activity</div>
                            {itemMovements.slice(0, 5).map(m => {
                              const meta = MOVEMENT_LABELS[m.movement_type]
                              return (
                                <div key={m.id} className="flex items-center gap-2 text-xs">
                                  <span className={`font-bold ${meta.color}`}>{meta.icon} {meta.label}</span>
                                  <span className="text-zinc-400">{Math.abs(m.quantity)} {item.unit}</span>
                                  {m.note && <span className="text-zinc-600 truncate">· {m.note}</span>}
                                  <span className="text-zinc-700 ml-auto shrink-0">{new Date(m.created_at).toLocaleDateString()}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'log' && (
        <div className="space-y-2">
          {movements.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No movements logged yet.</p>
            </div>
          ) : (
            movements.map(m => {
              const meta = MOVEMENT_LABELS[m.movement_type]
              const linkedItem = items.find(i => i.id === m.item_id) ?? { name: 'Unknown Item', unit: '' }
              return (
                <div key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg} transition-all`}>
                  <span className={`text-lg font-black ${meta.color} shrink-0`}>{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                      <span className="text-white text-sm font-medium truncate">{linkedItem.name}</span>
                    </div>
                    {m.note && <p className="text-xs text-zinc-500 mt-0.5 truncate">{m.note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold tabular-nums ${m.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity} {linkedItem.unit}
                    </div>
                    <div className="text-xs text-zinc-600">{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'bom' && (
        <BomManager 
          organizationId={organizationId} 
          inventoryItems={items} 
        />
      )}

      {/* Dialogs */}
      {logItem && (
        <QuickLogDialog
          item={logItem}
          organizationId={organizationId}
          locationId={locationId}
          onClose={() => setLogItem(null)}
          onSuccess={(updatedItem, newMovement) => {
            setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
            setMovements(prev => [newMovement, ...prev])
            setLogItem(null)
          }}
        />
      )}

      {(addDialogOpen || editItem) && (
        <AddItemDialog
          organizationId={organizationId}
          locationId={locationId}
          categories={categories}
          editItem={editItem ?? undefined}
          onClose={() => { setAddDialogOpen(false); setEditItem(null) }}
          onSuccess={(newItem) => {
            if (editItem) {
              setItems(prev => prev.map(i => i.id === newItem.id ? newItem : i))
            } else {
              setItems(prev => [newItem, ...prev])
            }
            setAddDialogOpen(false)
            setEditItem(null)
          }}
        />
      )}
    </div>
  )
}
