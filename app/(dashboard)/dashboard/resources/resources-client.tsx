'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Table, Edit2, Trash2, MapPin, Search, ChevronDown, CheckCircle, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/types'
import { addResource, updateResource, deleteResource } from './actions'

type Resource = Database['public']['Tables']['resources']['Row']

interface ResourcesClientProps {
  initialResources: Resource[]
  organizationId: string
  locationId: string
  slug: string
}

export function ResourcesClient({ initialResources, organizationId, locationId, slug }: ResourcesClientProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  
  const [modalState, setModalState] = useState<{isOpen: boolean, isEdit: boolean, data: Resource | null}>({ isOpen: false, isEdit: false, data: null })

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

  // Group by zone for the grid
  const groupedResources = useMemo(() => {
    const map: Record<string, Resource[]> = {}
    filteredResources.forEach(r => {
      const z = r.zone_name || 'Unassigned Zone'
      if (!map[z]) map[z] = []
      map[z].push(r)
    })
    return map
  }, [filteredResources])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
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
        // Force refresh to grab generated ID from DB
        window.location.reload()
      }
      setModalState({ isOpen: false, isEdit: false, data: null })
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    startTransition(async () => {
      const res = await deleteResource(id)
      if (res.serverError) { toast.error(res.serverError); return }
      setResources(prev => prev.filter(r => r.id !== id))
      toast.success('Resource deleted')
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Top Bar: Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <select 
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
          >
            <option value="all">All Zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        
        <button 
          onClick={() => setModalState({ isOpen: true, isEdit: false, data: null })}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-100 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Grid View Grouped by Zone */}
      {Object.entries(groupedResources).sort(([a],[b]) => a.localeCompare(b)).map(([zone, zoneResources]) => (
        <div key={zone} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 text-emerald-500" />
            {zone}
            <span className="bg-zinc-800 text-zinc-400 text-xs py-0.5 px-2 rounded-full font-medium ml-2">
              {zoneResources.length}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {zoneResources.map(resource => (
              <div key={resource.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 p-2.5 rounded-xl text-zinc-300">
                        {resource.type === 'table' ? <Table className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white leading-tight">{resource.name}</h3>
                        <p className="text-sm text-zinc-500 capitalize mt-0.5">{resource.type} {resource.capacity ? `• Seats ${resource.capacity}` : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`w-2 h-2 rounded-full ${resource.status === 'occupied' ? 'bg-amber-500 animate-pulse' : resource.status === 'reserved' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                    <span className={`${resource.status === 'occupied' ? 'text-amber-500' : resource.status === 'reserved' ? 'text-blue-500' : 'text-emerald-500'} uppercase tracking-wider`}>{resource.status}</span>
                  </div>

                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`/api/qr?data=${encodeURIComponent(`https://ourmenuos.online/m/${slug}?resource=${resource.id}`)}`} 
                      target="_blank"
                      className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1.5"
                      title="Download Provisioned QR"
                    >
                      <MapPin className="w-3.5 h-3.5" /> GET QR
                    </a>
                    <button onClick={() => setModalState({ isOpen: true, isEdit: true, data: resource })} className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(resource.id, resource.name)} className="p-2 bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredResources.length === 0 && (
        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
          <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-300">No resources found</h3>
          <p className="text-zinc-500 text-sm mt-1">Add your first table, room, or bay to get started.</p>
        </div>
      )}

      {/* Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">{modalState.isEdit ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={() => setModalState({ isOpen: false, isEdit: false, data: null })} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Resource Name</label>
                <input required name="name" defaultValue={modalState.data?.name} placeholder="e.g. Table 12, Room 404" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Type</label>
                  <select name="type" defaultValue={modalState.data?.type || 'table'} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="table">Table</option>
                    <option value="room">Room</option>
                    <option value="bay">Bay</option>
                    <option value="chair">Chair</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Capacity (Optional)</label>
                  <input type="number" min="1" name="capacity" defaultValue={modalState.data?.capacity || ''} placeholder="e.g. 4" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Zone / Area</label>
                <input required name="zone_name" defaultValue={modalState.data?.zone_name || ''} list="zones" placeholder="e.g. Main Floor, Patio, VIP" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                <datalist id="zones">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>

              <button type="submit" disabled={isPending} className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-40 mt-2">
                {isPending ? 'Saving...' : 'Save Resource'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function X(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}
