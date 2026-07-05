'use client'

import { useState } from 'react'

export function AdminTabs({ 
  tabs, 
  children 
}: { 
  tabs: string[], 
  children: React.ReactNode[] 
}) {
  const [activeTab, setActiveTab] = useState(0)
  
  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-zinc-800 pb-4 mb-6 scrollbar-hide">
        {tabs.map((tab, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === idx 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children[activeTab]}
      </div>
    </div>
  )
}
