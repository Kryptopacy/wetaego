'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Image as ImageIcon, Zap, Power } from 'lucide-react'
import { createAd, toggleAdStatus, deleteAd, getAdStats } from './actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface Ad {
  id: string
  location_id: string
  title: string
  category: string
  image_url: string
  target_link: string
  is_active: boolean
  approval_status: string
}

export function AdsManagerClient({ initialAds, locations }: { initialAds: Ad[], locations: {id: string, name: string}[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [isCreating, setIsCreating] = useState(false)

  const [stats, setStats] = useState<Record<string, { impressions: number, clicks: number, ctr: string }>>({})

  // Fetch stats for all ads on mount
  useEffect(() => {
    async function fetchAllStats() {
      const newStats: Record<string, { impressions: number, clicks: number, ctr: string }> = {}
      for (const ad of ads) {
        const res = await getAdStats(ad.id)
        if (!res.error) {
          newStats[ad.id] = res as { impressions: number, clicks: number, ctr: string }
        }
      }
      setStats(newStats)
    }
    if (ads.length > 0) fetchAllStats()
  }, [ads])

  const handleToggle = async (ad: Ad) => {
    const res = await toggleAdStatus(ad.id, !ad.is_active)
    if (res.error) {
      toast.error('Failed to update status')
    } else {
      setAds(ads.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a))
      toast.success(ad.is_active ? 'Ad paused' : 'Ad activated')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad? This will permanently delete its metrics too.')) return
    
    const res = await deleteAd(id)
    if (res.error) {
      toast.error('Failed to delete ad')
    } else {
      setAds(ads.filter(a => a.id !== id))
      toast.success('Ad deleted')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Active Campaigns</h3>
            <p className="text-sm text-zinc-400">Total active BYO sponsors running</p>
          </div>
        </div>
        <div className="text-3xl font-black text-white">
          {ads.filter(a => a.is_active).length} / {ads.length}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Your Ads</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors border border-zinc-700"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Cancel' : 'Create New Ad'}
        </button>
      </div>

      {isCreating && (
        <CreateAdForm 
          locations={locations} 
          onSuccess={(newAd) => {
            setAds([newAd, ...ads])
            setIsCreating(false)
          }} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      {ads.length === 0 && !isCreating ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No ads running</h3>
          <p className="text-zinc-500 text-sm">Upload your first sponsor banner to monetize your menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ads.map(ad => (
            <div key={ad.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="relative w-full h-48 bg-zinc-800">
                <Image src={ad.image_url} alt={ad.title} fill className="object-cover" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur border border-white/10 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                  {ad.category || 'Sponsor'}
                </div>
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-zinc-900 ${ad.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{ad.title}</h3>
                    <a href={ad.target_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      {ad.target_link} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggle(ad)}
                      className={`p-2 rounded-lg transition-colors border ${ad.is_active ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                      title={ad.is_active ? 'Pause Ad' : 'Activate Ad'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Impressions</span>
                    <span className="text-lg font-black text-white">{stats[ad.id]?.impressions ?? '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Clicks</span>
                    <span className="text-lg font-black text-emerald-400">{stats[ad.id]?.clicks ?? '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1">CTR</span>
                    <span className="text-lg font-black text-blue-400">{stats[ad.id]?.ctr ?? '-'}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateAdForm({ locations, onSuccess, onCancel }: { locations: {id: string, name: string}[], onSuccess: (ad: Ad) => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!imageUrl) {
      toast.error('Please upload an ad image')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      location_id: formData.get('location_id') as string,
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      target_link: formData.get('target_link') as string,
      image_url: imageUrl
    }

    const res = await createAd(data)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Ad created successfully')
      // Fake local ad object to append instantly
      onSuccess({
        id: Math.random().toString(), // fake id for UI until refresh
        ...data,
        is_active: true,
        approval_status: 'approved'
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-xl">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white">Upload BYO Sponsor</h3>
          <p className="text-xs text-zinc-400">Add a native ad to your catalog flow.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Ad Title (Internal)</label>
            <input required type="text" name="title" placeholder="e.g. Coca-Cola Summer Promo" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Target Location</label>
            <select required name="location_id" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Category Tag</label>
              <input required type="text" name="category" placeholder="e.g. SPONSORED" defaultValue="SPONSOR" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Target URL</label>
              <input required type="url" name="target_link" placeholder="https://..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Ad Creative (Banner)</label>
          <div className="w-full h-48 bg-zinc-800 border-2 border-zinc-700 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Ad creative" fill className="object-cover" />
                <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg z-10 hover:bg-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center">
                <ImageIcon className="w-8 h-8 text-zinc-600 mb-3" />
                <p className="text-xs text-zinc-400 mb-4">Paste an image URL directly for your ad creative.</p>
                <input 
                  type="url" 
                  placeholder="https://.../image.jpg" 
                  className="w-3/4 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  onBlur={(e) => {
                    if (e.target.value) setImageUrl(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (e.currentTarget.value) setImageUrl(e.currentTarget.value)
                    }
                  }}
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 text-center">Recommended aspect ratio: 16:9 or 2:1</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-zinc-400 hover:text-white font-medium text-sm transition-colors">
          Cancel
        </button>
        <button disabled={loading} type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors">
          {loading ? 'Deploying Ad...' : 'Deploy Campaign'}
        </button>
      </div>
    </form>
  )
}
