'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Save, Link as LinkIcon, Trash, Loader2 } from 'lucide-react'

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
  inventoryItems
}: {
  organizationId: string
  inventoryItems: InventoryItem[]
}) {
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [bomItems, setBomItems] = useState<BomEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

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
          const payload: any = {
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <LinkIcon className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Component Breakdown (BOM)</h2>
      </div>

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
                <select
                  value={bom.inventory_item_id}
                  onChange={(e) => {
                    const newItems = [...bomItems]
                    newItems[index].inventory_item_id = e.target.value
                    const matched = inventoryItems.find(i => i.id === e.target.value)
                    if (matched) newItems[index].inventory_item = matched
                    setBomItems(newItems)
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select Material...</option>
                  {inventoryItems.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                  ))}
                </select>
                
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
                    onClick={() => setBomItems(bomItems.filter((_, i) => i !== index))}
                    className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-800/50 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setBomItems([...bomItems, { inventory_item_id: '', quantity_required: 1 }])}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium py-2"
            >
              <Plus className="w-4 h-4" /> Add Component
            </button>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[150px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Component Map'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
