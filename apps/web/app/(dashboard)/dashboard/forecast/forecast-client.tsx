/* eslint-disable @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
'use client'

import { useState } from 'react'

type StockAlert = 'critical' | 'order_soon' | 'sufficient'
type Trend = 'rising' | 'stable' | 'declining'

interface ForecastItem {
  item_name: string
  trend: Trend
  predicted_units_next_7d: number
  stock_alert: StockAlert
  insight: string
}

interface ForecastClientProps {
  locationId: string
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'rising') return (
    <span title="Rising" className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      Rising
    </span>
  )
  if (trend === 'declining') return (
    <span title="Declining" className="flex items-center gap-1 text-red-400 text-xs font-bold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
      Declining
    </span>
  )
  return (
    <span title="Stable" className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" /></svg>
      Stable
    </span>
  )
}

const AlertBadge = ({ alert }: { alert: StockAlert }) => {
  const map = {
    critical: { label: 'âš ï¸ Stock Critical', cls: 'bg-red-500/20 text-red-400 border border-red-500/50' },
    order_soon: { label: 'ðŸ“¦ Order Soon', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' },
    sufficient: { label: 'âœ… Sufficient', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' },
  }
  const { label, cls } = map[alert]
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}

export function ForecastClient({ locationId }: ForecastClientProps) {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const maxPredicted = Math.max(...forecasts.map(f => f.predicted_units_next_7d), 1)

  const handleGenerate = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId })
      })
      const data = await res.json()
      if (data.forecasts) setForecasts(data.forecasts)
      if (data.message) setMessage(data.message)
      setHasGenerated(true)
    } catch (_e) {
      setMessage('Failed to generate forecast. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Hero CTA */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {hasGenerated
            ? <p className="text-zinc-400 text-sm">Showing AI-powered demand predictions for the next 7 days.</p>
            : <p className="text-zinc-400 text-sm">Analyse your last 30 days of sales to predict what to stock up on.</p>
          }
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/30"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analysing sales data...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {hasGenerated ? 'Regenerate Forecast' : 'Generate Forecast'}
            </>
          )}
        </button>
      </div>

      {/* Empty / Message state */}
      {!hasGenerated && !isLoading && (
        <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed border-zinc-800 rounded-2xl">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Ready to forecast</h3>
          <p className="text-zinc-500 text-sm max-w-xs">Hit &quot;Generate Forecast&quot; and our AI will crunch 30 days of sales data to tell you exactly what to restock.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      )}

      {message && !isLoading && (
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-sm text-center">
          {message}
        </div>
      )}

      {/* Forecast Grid */}
      {!isLoading && forecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecasts.map((item) => {
            const barWidth = Math.max(4, Math.round((item.predicted_units_next_7d / maxPredicted) * 100))
            const barColor = item.stock_alert === 'critical' ? 'bg-red-500' : item.stock_alert === 'order_soon' ? 'bg-yellow-500' : 'bg-emerald-500'

            return (
              <div
                key={item.item_name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm leading-snug">{item.item_name}</h3>
                  <AlertBadge alert={item.stock_alert} />
                </div>

                {/* Demand bar */}
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                    <span>Predicted demand (next 7d)</span>
                    <span className="font-bold text-white">{item.predicted_units_next_7d} units</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <TrendIcon trend={item.trend} />
                  <p className="text-zinc-400 text-xs italic text-right max-w-[60%]">{item.insight}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
