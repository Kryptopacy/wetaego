'use client'

import { useMemo } from 'react'
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
  // Check if all data is completely zero
  const isAllZero = useMemo(() => {
    if (!data || data.length === 0) return true
    return data.every(d => d.revenue === 0 && d.orders === 0)
  }, [data])

  if (isAllZero) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-zinc-900/50 rounded-2xl border border-zinc-800/50 border-dashed relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/10 opacity-50"></div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center p-6"
        >
          <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Awaiting Your First Sale</h3>
          <p className="text-zinc-400 max-w-[280px] text-sm">
            Once you receive orders, your revenue and growth trends will appear here.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-zinc-900/40 rounded-2xl p-4 md:p-6 border border-zinc-800/50">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
          <p className="text-xs text-zinc-400">Last 7 days</p>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, left: -20, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#a1a1aa' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#a1a1aa' }} 
              tickFormatter={(value) => `${value > 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              formatter={(value, name) => {
                const numVal = typeof value === 'number' ? value : 0
                if (name === 'revenue') return [formatCurrency(numVal * 100, currencyCode), 'Revenue']
                return [numVal, 'Orders']
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
