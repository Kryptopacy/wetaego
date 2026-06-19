import { Database } from '@/lib/supabase/types'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

interface StockManagementViewProps {
  menuItems: MenuItemRow[]
  onToggleStock: (itemId: string, currentStatus: string) => Promise<void>
}

export function StockManagementView({ menuItems, onToggleStock }: StockManagementViewProps) {
  return (
      <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <h2 className="font-bold text-white">Stock Management</h2>
          <span className="text-sm text-zinc-400">Updates sync instantly to guest menus</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {menuItems.length === 0 ? (
            <p className="text-center text-zinc-500 py-10">No items on your menu yet.</p>
          ) : (
            menuItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div>
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-zinc-400">₦{(item.price_minor / 100).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => onToggleStock(item.id, item.availability_status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${item.availability_status === 'available' ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                >
                  {item.availability_status === 'available' ? 'Available' : 'Sold Out'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
  )
}
