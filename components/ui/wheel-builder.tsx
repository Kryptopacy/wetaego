'use client'

import { useState } from 'react'

interface Segment {
  label: string
  value: number
  type: 'win' | 'loss'
}

interface WheelBuilderProps {
  name: string
  defaultValue: string
}

const defaultSegments: Segment[] = [
  { label: '10% Off', value: 10, type: 'win' },
  { label: 'Try Again', value: 0, type: 'loss' },
  { label: '5% Off', value: 5, type: 'win' },
  { label: 'No Luck', value: 0, type: 'loss' }
]

export function WheelBuilder({ name, defaultValue }: WheelBuilderProps) {
  const [segments, setSegments] = useState<Segment[]>(() => {
    try {
      if (defaultValue) return JSON.parse(defaultValue)
      return defaultSegments
    } catch {
      return defaultSegments
    }
  })

  const updateSegment = (index: number, field: keyof Segment, value: string | number) => {
    const newSegments = [...segments]
    newSegments[index] = { ...newSegments[index], [field]: value } as Segment
    setSegments(newSegments)
  }

  const addSegment = () => {
    setSegments([...segments, { label: 'New Prize', value: 0, type: 'win' }])
  }

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Hidden input to submit the JSON back to the server */}
      <input type="hidden" name={name} value={JSON.stringify(segments)} />
      
      <div className="space-y-3">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex-1 grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <input
                  type="text"
                  value={segment.label}
                  onChange={(e) => updateSegment(i, 'label', e.target.value)}
                  placeholder="Label (e.g. 10% Off)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div className="col-span-3 relative">
                <input
                  type="number"
                  value={segment.value}
                  onChange={(e) => updateSegment(i, 'value', Number(e.target.value))}
                  placeholder="Value"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div className="col-span-4">
                <select
                  value={segment.type}
                  onChange={(e) => updateSegment(i, 'type', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                </select>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => removeSegment(i)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={addSegment}
        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium px-2 py-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Segment
      </button>
    </div>
  )
}
