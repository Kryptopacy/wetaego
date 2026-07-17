'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { addCustomDomain, removeCustomDomain, checkDomainStatus } from './actions'

export function DomainManager({ initialDomains, locations, organizationId }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialDomains: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  locations: any[]
  organizationId: string
}) {
  const [domains, setDomains] = useState(initialDomains)
  const [isAdding, setIsAdding] = useState(false)
  const [hostname, setHostname] = useState('')
  const [locationId, setLocationId] = useState(locations.length > 0 ? locations[0].id : '')
  const [isLoading, setIsLoading] = useState(false)

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault()
    if (!hostname || !locationId) return
    
    setIsLoading(true)
    const formData = new FormData()
    formData.append('hostname', hostname.toLowerCase().trim())
    formData.append('location_id', locationId)
    
    const res = await addCustomDomain(formData)
    setIsLoading(false)
    
    if (res?.serverError || res?.validationErrors) {
      toast.error(res?.serverError || 'Failed to add domain')
    } else if (res?.data) {
      toast.success('Domain added successfully')
      setDomains([{
        id: `temp-${Date.now()}`,
        hostname: hostname.toLowerCase().trim(),
        location_id: locationId,
        status: 'pending',
        ssl_status: 'pending',
        created_at: new Date().toISOString(),
      }, ...domains])
      setHostname('')
      setIsAdding(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Are you sure you want to remove this custom domain? This action cannot be undone.')) return
    
    const res = await removeCustomDomain({ domainId: id })
    if (res?.serverError) {
      toast.error(res?.serverError)
    } else {
      toast.success('Domain removed')
      setDomains(domains.filter(d => d.id !== id))
    }
  }

  async function handleCheckStatus(id: string, hostname: string) {
    toast.info(`Checking DNS status for ${hostname}...`)
    const res = await checkDomainStatus({ domainId: id })
    if (res?.serverError) {
      toast.error(res?.serverError)
    } else {
      toast.success(`Domain ${hostname} is active!`)
      setDomains(domains.map(d => d.id === id ? { ...d, status: 'active', ssl_status: 'active' } : d))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white">Your Domains</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Domain
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddDomain} className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Hostname</label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g., menu.yourbrand.com"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">Enter the exact domain or subdomain you want to use.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Target Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              required
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !hostname}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Adding...' : 'Save Domain'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {domains.length === 0 ? (
        <div className="text-center py-12 border border-zinc-800 border-dashed rounded-xl">
          <p className="text-zinc-500">No custom domains configured.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => {
            const loc = locations.find(l => l.id === domain.location_id)
            return (
              <div key={domain.id} className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-medium text-white">{domain.hostname}</h3>
                      {domain.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Pending Setup
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">
                      Points to: <span className="text-white">{loc?.name || 'Unknown Location'}</span>
                    </p>
                    
                    {domain.status !== 'active' && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mt-4">
                        <p className="text-sm font-medium text-zinc-300 mb-2">DNS Configuration Required</p>
                        <p className="text-xs text-zinc-500 mb-4">
                          Log in to your domain registrar and create a CNAME record pointing to our infrastructure.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="block text-zinc-500 text-xs mb-1">Type</span>
                            <code className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">CNAME</code>
                          </div>
                          <div>
                            <span className="block text-zinc-500 text-xs mb-1">Name / Host</span>
                            <code className="text-zinc-300">{domain.hostname.split('.')[0]}</code>
                          </div>
                          <div>
                            <span className="block text-zinc-500 text-xs mb-1">Value / Target</span>
                            <code className="text-zinc-300">cname.ourmenuos.online</code>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button 
                            onClick={() => handleCheckStatus(domain.id, domain.hostname)}
                            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                          >
                            Verify Connection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRemove(domain.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                    title="Remove Domain"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
