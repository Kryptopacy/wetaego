import { Database } from '@/lib/supabase/types'
import { Bot, UserCheck, Bell, Receipt, Sparkles } from 'lucide-react'

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row']

interface ServiceRequestsPanelProps {
  pendingRequests: ServiceRequestRow[]
  onResolve: (id: string) => Promise<void>
}

export function ServiceRequestsPanel({ pendingRequests, onResolve }: ServiceRequestsPanelProps) {
  return (
    <div className="col-span-1 border border-zinc-800 rounded-2xl bg-zinc-900/40 flex flex-col overflow-hidden max-h-110 lg:max-h-full backdrop-blur-md">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-white text-sm">Active Service Requests</h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700">
          {pendingRequests.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-2">
            <UserCheck className="w-8 h-8 opacity-40" />
            <p className="text-xs">No pending service requests.</p>
          </div>
        ) : (
          pendingRequests.map((req) => {
            const isCritical = req.urgency_tier === 'critical'
            const isLow = req.urgency_tier === 'low'
            const isAiEscalation = Boolean(req.custom_request_text?.startsWith('[AI Escalation]')) || isCritical
            
            const borderClass = isCritical 
              ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse' 
              : isAiEscalation 
                ? 'border-emerald-500/40 bg-emerald-500/5' 
                : isLow 
                  ? 'border-blue-500/30' 
                  : 'border-yellow-500/30'
                  
            const bgClass = isCritical ? 'bg-red-500/10' : isAiEscalation ? 'bg-emerald-500/10' : isLow ? 'bg-blue-500/10' : 'bg-yellow-500/10'
            const accentClass = isCritical ? 'bg-red-500' : isAiEscalation ? 'bg-emerald-500' : isLow ? 'bg-blue-500' : 'bg-yellow-500'
            const textClass = isCritical ? 'text-red-400' : isAiEscalation ? 'text-emerald-400' : isLow ? 'text-blue-400' : 'text-yellow-400'
            const btnClass = isCritical 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' 
              : isAiEscalation
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                : isLow 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' 
                  : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300'

            return (
              <div key={req.id} className={`p-3.5 rounded-xl border ${bgClass} relative overflow-hidden ${borderClass} transition-all`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentClass}`} />
                
                <div className="flex justify-between items-start mb-1.5 pl-1.5">
                  <div className="flex items-center gap-1.5">
                    {isAiEscalation ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Sparkles className="w-3 h-3" /> AI Escalation
                      </span>
                    ) : (
                      <span className={`font-bold text-xs ${textClass}`}>
                        {req.table_identifier || 'Storefront'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-zinc-400">
                    {req.urgency_tier || 'STANDARD'}
                  </span>
                </div>

                <div className="pl-1.5 mb-2.5">
                  <p className="text-white text-xs font-medium leading-relaxed">
                    {req.custom_request_text ? `"${req.custom_request_text}"` : `Needs ${req.request_type}`}
                  </p>
                  {isAiEscalation && req.table_identifier && (
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Origin: <span className="text-zinc-200 font-semibold">{req.table_identifier}</span>
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => onResolve(req.id)}
                  className={`w-full py-1.5 rounded-lg ${btnClass} text-xs font-bold transition-all active:scale-98`}
                >
                  ✓ Mark Resolved & Hand Back
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
