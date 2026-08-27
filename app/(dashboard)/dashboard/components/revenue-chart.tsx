'use client'

import { useState, useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

export type RevenueDataPoint = {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currencyCode?: string
}

export function RevenueChart({ data, currencyCode = 'NGN' }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'month'>('7d')

  // Check if all data is completely zero
  const isAllZero = useMemo(() => {
    if (!data || data.length === 0) return true
    return data.every(d => d.revenue === 0 && d.orders === 0)
  }, [data])

  const totalPeriodRevenue = useMemo(() => {
    if (!data) return 0
    return data.reduce((sum, d) => sum + (d.revenue || 0), 0)
  }, [data])

  const totalPeriodOrders = useMemo(() => {
    if (!data) return 0
    return data.reduce((sum, d) => sum + (d.orders || 0), 0)
  }, [data])

  if (isAllZero) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/20 opacity-50"></div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-14 h-14 mb-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <Calendar className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Awaiting Sales & Booking Activity</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            As guests place orders, book appointments, or request quotes, your real-time revenue velocity will appear here.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full bg-zinc-900/40 rounded-2xl p-5 md:p-6 border border-zinc-800/60 shadow-xl space-y-4">
      {/* Chart Header with Time Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Revenue Pacing</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              {formatCurrency(totalPeriodRevenue, currencyCode)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {totalPeriodOrders} transactions recorded in this period
          </p>
        </div>

        {/* Time Scale Buttons */}
        <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 gap-1 self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'month', label: 'This Month' },
          ].map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setTimeRange(range.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === range.id
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Area Chart Canvas */}
      <div className="h-[240px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, left: -20, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.6} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#71717a' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#71717a' }} 
              tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#09090b', 
                border: '1px solid #27272a',
                borderRadius: '14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                padding: '10px 14px'
              }}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}
              formatter={(value, name) => {
                const numVal = typeof value === 'number' ? value : 0
                if (name === 'revenue') return [formatCurrency(numVal, currencyCode), 'Gross Volume']
                return [numVal, 'Transactions']
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
