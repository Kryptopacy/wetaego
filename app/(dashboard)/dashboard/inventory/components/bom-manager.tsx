'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Save, Link as LinkIcon, Trash, Loader2, X, Package } from 'lucide-react'

type CatalogueItem = {
  id: string
  name: string
  type: 'menu_item' | 'page_item'
}

type InventoryItem = {
  id: string
  name: string
  unit: string
  cost_price_minor: number | null
}

type BomEntry = {
  id?: string
  inventory_item_id: string
  quantity_required: number
  inventory_item?: InventoryItem
}

export function BomManager({
  organizationId,
  locationId,
  inventoryItems
}: {
  organizationId: string
  locationId?: string
  inventoryItems: InventoryItem[]
}) {
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([])
  const [localInventoryItems, setLocalInventoryItems] = useState<InventoryItem[]>(inventoryItems)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [bomItems, setBomItems] = useState<BomEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // In-situ raw material creation state
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [targetRowIndex, setTargetRowIndex] = useState<number | null>(null)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialUnit, setNewMaterialUnit] = useState('pieces')
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('0')
  const [newMaterialCost, setNewMaterialCost] = useState('')
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setLocalInventoryItems(inventoryItems)
  }, [inventoryItems])

  useEffect(() => {
    async function fetchCatalogue() {
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('organization_id', organizationId)
      
      const catalog: CatalogueItem[] = (menuData || []).map(m => ({
        id: m.id,
        name: m.name,
        type: 'menu_item'
      }))

      setCatalogue(catalog)
    }
    fetchCatalogue()
  }, [organizationId, supabase])

  useEffect(() => {
    if (!selectedProduct) {
      queueMicrotask(() => setBomItems([]))
      return
    }
    
    async function fetchBom() {
      const product = catalogue.find(p => p.id === selectedProduct)
      if (!product) return

      const filterCol = product.type === 'menu_item' ? 'menu_item_id' : 'page_item_id'
      const { data } = await supabase
        .from('item_ingredients')
        .select('*, inventory_item:inventory_items(id, name, unit, cost_price_minor)')
        .eq(filterCol, selectedProduct)

      if (data) {
        setBomItems(data.map(d => ({
          id: d.id,
          inventory_item_id: d.inventory_item_id,
          quantity_required: d.quantity_required,
          inventory_item: Array.isArray(d.inventory_item) ? d.inventory_item[0] : d.inventory_item
        } as BomEntry)))
      }
    }
    fetchBom()
  }, [selectedProduct, catalogue, supabase])

  const handleSave = async () => {
    if (!selectedProduct) return
    setIsSaving(true)
    
    const product = catalogue.find(p => p.id === selectedProduct)
    if (!product) return

    const filterCol = product.type === 'menu_item' ? 'menu_item_id' : 'page_item_id'

    // Delete existing
    await supabase.from('item_ingredients').delete().eq(filterCol, selectedProduct)

    // Insert new
    if (bomItems.length > 0) {
      // Filter out empty rows
      const validItems = bomItems.filter(b => b.inventory_item_id && b.quantity_required > 0)
      if (validItems.length > 0) {
        const inserts = validItems.map(b => {
          const payload: import('@/lib/supabase/types').Database['public']['Tables']['item_ingredients']['Insert'] = {
            organization_id: organizationId,
            inventory_item_id: b.inventory_item_id,
            quantity_required: b.quantity_required
          }
          if (filterCol === 'menu_item_id') payload.menu_item_id = selectedProduct
          else payload.page_item_id = selectedProduct
          return payload
        })
        
        const { error } = await supabase.from('item_ingredients').insert(inserts)
        if (error) {
          toast.error('Failed to save components')
          setIsSaving(false)
          return
        }
      }
    }
    
    toast.success('Components updated successfully')
    setIsSaving(false)
  }

  const handleCreateRawMaterial = async () => {
    if (!newMaterialName.trim()) {
      toast.error('Material name is required')
      return
    }

    setIsCreatingMaterial(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const initialQty = parseFloat(newMaterialQuantity) || 0
      const costMinor = newMaterialCost ? Math.round(parseFloat(newMaterialCost) * 100) : null

      let resolvedLocId = locationId
      if (!resolvedLocId) {
        const { data: loc } = await supabase
          .from('locations')
          .select('id')
          .eq('organization_id', organizationId)
          .limit(1)
          .maybeSingle()
        resolvedLocId = loc?.id || ''
      }

      if (!resolvedLocId) throw new Error('No location found for this organization')

      const { data: newItem, error } = await supabase
        .from('inventory_items')
        .insert({
          organization_id: organizationId,
          location_id: resolvedLocId,
          name: newMaterialName.trim(),
          category: 'Raw Materials',
          unit: newMaterialUnit || 'pieces',
          current_quantity: initialQty,
          cost_price_minor: costMinor,
          created_by: userData.user?.id || null
        })
        .select('id, name, unit, cost_price_minor')
        .single()

      if (error) throw error

      if (newItem) {
        const formatted: InventoryItem = {
          id: newItem.id,
          name: newItem.name,
          unit: newItem.unit,
          cost_price_minor: newItem.cost_price_minor
        }

        setLocalInventoryItems(prev => [...prev, formatted])

        // If triggered from a specific row, immediately assign it
        if (targetRowIndex !== null && bomItems[targetRowIndex]) {
          const newItems = [...bomItems]
          newItems[targetRowIndex].inventory_item_id = formatted.id
          newItems[targetRowIndex].inventory_item = formatted
          setBomItems(newItems)
        }

        toast.success(`Material "${formatted.name}" created and linked!`)
        setShowAddMaterialModal(false)
        setNewMaterialName('')
        setNewMaterialQuantity('0')
        setNewMaterialCost('')
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to create raw material')
    } finally {
      setIsCreatingMaterial(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Component Breakdown (Bill of Materials)</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setTargetRowIndex(null)
            setShowAddMaterialModal(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> + New Raw Material
        </button>
      </div>
      <p className="text-zinc-400 text-sm mb-6 max-w-3xl leading-relaxed">
        A Bill of Materials (BOM) lets you link physical inventory items (like "Flour" or "Sugar") to the final products you sell (like "Cake"). When a customer buys a Cake, the system will automatically deduct the correct amounts of Flour and Sugar from your stock, keeping your inventory synced.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Select Product to Map</label>
          <div className="flex gap-2">
            <select 
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none"
            >
              <option value="">-- Choose a product --</option>
              {catalogue.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500 mt-2">When this product is sold, the selected materials will automatically be deducted from inventory.</p>
        </div>

        {selectedProduct && (
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300">Required Materials</h3>
            
            {bomItems.map((bom, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <select
                    value={bom.inventory_item_id}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setTargetRowIndex(index)
                        setShowAddMaterialModal(true)
                      } else {
                        const newItems = [...bomItems]
                        newItems[index].inventory_item_id = e.target.value
                        const matched = localInventoryItems.find(i => i.id === e.target.value)
                        if (matched) newItems[index].inventory_item = matched
                        setBomItems(newItems)
                      }
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Material...</option>
                    {localInventoryItems.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                    ))}
                    <option value="__add_new__" className="font-bold text-indigo-400 bg-zinc-900">+ Add New Raw Material...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRowIndex(index)
                      setShowAddMaterialModal(true)
                    }}
                    title="Quick Add Material"
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    step="0.001"
                    value={bom.quantity_required}
                    onChange={(e) => {
                      const newItems = [...bomItems]
                      newItems[index].quantity_required = parseFloat(e.target.value) || 0
                      setBomItems(newItems)
                    }}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-center"
                    placeholder="Qty"
                  />

                  <span className="text-xs text-zinc-500 w-16 truncate">
                    {bom.inventory_item?.unit || 'units'}
                  </span>

                  <button 
                    type="button"
                    onClick={() => setBomItems(bomItems.filter((_, i) => i !== index))}
                    className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setBomItems([...bomItems, { inventory_item_id: '', quantity_required: 1 }])}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium py-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Component
            </button>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[150px] cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Component Map'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-Situ Quick Add Material Modal */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Quick Add Raw Material</h3>
                  <p className="text-xs text-zinc-400">Add an ingredient directly to inventory</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Material Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flour, Espresso Beans, Vanilla Syrup"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={newMaterialUnit}
                    onChange={(e) => setNewMaterialUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pieces">Pieces / Units</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="litres">Litres (L)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="portions">Portions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Current Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newMaterialQuantity}
                    onChange={(e) => setNewMaterialQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingMaterial || !newMaterialName.trim()}
                onClick={handleCreateRawMaterial}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCreatingMaterial ? 'Creating...' : 'Create & Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
