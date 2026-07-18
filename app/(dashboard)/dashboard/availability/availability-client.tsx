'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, MapPin, Loader2 } from 'lucide-react'
import { upsertAvailability } from './actions'
import { toast } from 'sonner'
import { AvailabilitySchedule } from '@/lib/utils/availability'

const DAYS_OF_WEEK = [
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
  { id: '0', label: 'Sunday' },
]

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC'
]

const INTERVALS = [15, 30, 45, 60, 90, 120]

interface AvailabilityClientProps {
  locationId: string
  initialData: {
    timezone: string
    slot_interval: number
    schedule: AvailabilitySchedule
  }
}

export function AvailabilityClient({ locationId, initialData }: AvailabilityClientProps) {
  const [timezone, setTimezone] = useState(initialData.timezone)
  const [slotInterval, setSlotInterval] = useState(initialData.slot_interval)
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(initialData.schedule)
  const [isSaving, setIsSaving] = useState(false)

  const handleAddBlock = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }]
    }))
  }

  const handleRemoveBlock = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }))
  }

  const handleUpdateBlock = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map((block, i) => i === index ? { ...block, [field]: value } : block)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await upsertAvailability({
        location_id: locationId,
        timezone,
        slot_interval: slotInterval,
        schedule
      })
      
      if (res?.data?.success) {
        toast.success('Availability settings saved.')
      } else {
        toast.error('Failed to save settings.')
      }
    } catch (e) {
      toast.error('An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Operational Timezone</h3>
              <p className="text-xs text-zinc-500">All slots align to this timezone.</p>
            </div>
          </div>
          <select 
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Slot Duration</h3>
              <p className="text-xs text-zinc-500">Duration per booking slot.</p>
            </div>
          </div>
          <select 
            value={slotInterval}
            onChange={(e) => setSlotInterval(Number(e.target.value))}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {INTERVALS.map(min => (
              <option key={min} value={min}>{min} Minutes</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Weekly Schedule</h3>
            <p className="text-sm text-zinc-400 mt-1">Define your open hours for each day. Leave empty to mark as closed.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 h-10 px-6"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </button>
        </div>
        
        <div className="divide-y divide-zinc-800/60">
          {DAYS_OF_WEEK.map(day => {
            const blocks = schedule[day.id] || []
            const isOpen = blocks.length > 0

            return (
              <div key={day.id} className="p-6 flex flex-col md:flex-row gap-4 md:items-start">
                <div className="w-32 flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOpen}
                    onClick={() => {
                      if (isOpen) {
                        setSchedule(prev => ({ ...prev, [day.id]: [] }))
                      } else {
                        handleAddBlock(day.id)
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${isOpen ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  >
                    <span
                      data-state={isOpen ? 'checked' : 'unchecked'}
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isOpen ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${isOpen ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {day.label}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {!isOpen ? (
                    <div className="text-sm text-zinc-500 py-2 italic">Closed</div>
                  ) : (
                    blocks.map((block, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input 
                          type="time" 
                          value={block.start}
                          onChange={(e) => handleUpdateBlock(day.id, index, 'start', e.target.value)}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <span className="text-zinc-500">-</span>
                        <input 
                          type="time" 
                          value={block.end}
                          onChange={(e) => handleUpdateBlock(day.id, index, 'end', e.target.value)}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <button 
                          onClick={() => handleRemoveBlock(day.id, index)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  {isOpen && (
                    <button 
                      onClick={() => handleAddBlock(day.id)}
                      className="inline-flex items-center text-xs font-medium text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Hours
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
