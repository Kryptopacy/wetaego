import { Database } from '@/lib/supabase/types'

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row']

interface ServiceRequestsPanelProps {
  pendingRequests: ServiceRequestRow[]
  onResolve: (id: string) => Promise<void>
}

export function ServiceRequestsPanel({ pendingRequests, onResolve }: ServiceRequestsPanelProps) {
  return (
      <div className="col-span-1 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col overflow-hidden max-h-[400px] lg:max-h-full">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="font-bold text-white flex justify-between items-center">
            Table Requests
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{pendingRequests.length}</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-zinc-500 py-10">No pending requests.</p>
          ) : (
            pendingRequests.map(req => {
              const isCritical = req.urgency_tier === 'critical'
              const isLow = req.urgency_tier === 'low'
              
              const borderClass = isCritical ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : isLow ? 'border-blue-500/30' : 'border-yellow-500/30'
              const bgClass = isCritical ? 'bg-red-500/10' : isLow ? 'bg-blue-500/10' : 'bg-yellow-500/10'
              const accentClass = isCritical ? 'bg-red-500' : isLow ? 'bg-blue-500' : 'bg-yellow-500'
              const textClass = isCritical ? 'text-red-400' : isLow ? 'text-blue-400' : 'text-yellow-400'
              const btnClass = isCritical ? 'bg-red-500/20 hover:bg-red-500/30' : isLow ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-yellow-500/20 hover:bg-yellow-500/30'
              const textMutedClass = isCritical ? 'text-red-500/70' : isLow ? 'text-blue-500/70' : 'text-yellow-500/70'
              
              return (
              <div key={req.id} className={`p-4 rounded-lg border ${bgClass} relative overflow-hidden ${borderClass}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentClass}`}></div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-bold ${textClass}`}>{req.table_identifier}</span>
                  <span className={`text-xs ${textMutedClass} uppercase tracking-widest font-bold`}>{req.urgency_tier || 'STANDARD'}</span>
                </div>
                <p className="text-white font-medium capitalize">
                  {(req.request_type as string) === 'custom' ? `"${req.custom_request_text}"` : `Needs ${req.request_type}`}
                </p>
                <button 
                  onClick={() => onResolve(req.id)}
                  className={`mt-3 w-full py-2 rounded ${btnClass} ${textClass} text-sm font-medium transition-colors`}
                >
                  Mark Resolved
                </button>
              </div>
            )})
          )}
        </div>
      </div>
  )
}
