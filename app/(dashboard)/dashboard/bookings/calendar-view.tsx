'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BookingEvent {
  id: string
  title: string
  date: Date
  status: string
  customerName: string
  itemTitle?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-500/80',
  confirmed: 'bg-blue-500/80',
  completed: 'bg-emerald-500/80',
  cancelled: 'bg-red-500/60',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function CalendarView({ bookings }: { bookings: any[] }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selected, setSelected] = useState<Date | null>(null)

  // Map bookings to events
  const events: BookingEvent[] = bookings.flatMap(b => {
    if (!b.booking_date) return []
    const d = new Date(b.booking_date)
    if (isNaN(d.getTime())) return []
    return [{
      id: b.id,
      date: d,
      status: b.status || 'pending',
      customerName: b.customer_name || 'Unknown',
      title: b.customer_name || 'Booking',
      itemTitle: b.page_items?.title || b.location_pages?.title,
    }]
  })

  // Calendar grid
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function prevMonth() {
    setCurrent(new Date(year, month - 1, 1))
    setSelected(null)
  }
  function nextMonth() {
    setCurrent(new Date(year, month + 1, 1))
    setSelected(null)
  }

  function eventsOnDay(day: number) {
    return events.filter(e =>
      e.date.getFullYear() === year &&
      e.date.getMonth() === month &&
      e.date.getDate() === day
    )
  }

  const selectedEvents = selected
    ? events.filter(e =>
        e.date.getFullYear() === selected.getFullYear() &&
        e.date.getMonth() === selected.getMonth() &&
        e.date.getDate() === selected.getDate()
      )
    : []

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(null) }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-zinc-950/60 min-h-[80px]" />
          }
          const dayEvents = eventsOnDay(day)
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          const isSelected = selected?.getDate() === day && selected?.getMonth() === month && selected?.getFullYear() === year
          return (
            <button
              key={day}
              onClick={() => setSelected(new Date(year, month, day))}
              className={`min-h-[80px] p-1.5 text-left flex flex-col transition-colors ${
                isSelected
                  ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/40'
                  : 'bg-zinc-950/60 hover:bg-white/5'
              }`}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday ? 'bg-blue-500 text-white' : 'text-zinc-400'
              }`}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(ev => (
                  <span
                    key={ev.id}
                    className={`text-[10px] font-medium text-white px-1.5 py-0.5 rounded truncate ${STATUS_COLORS[ev.status] || 'bg-zinc-700'}`}
                  >
                    {ev.customerName}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-zinc-500 pl-1">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedEvents.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/5 bg-zinc-900/60 p-4 space-y-3">
          <h3 className="text-sm font-bold text-white">
            {selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            <span className="ml-2 text-zinc-500 font-normal text-xs">{selectedEvents.length} booking{selectedEvents.length !== 1 ? 's' : ''}</span>
          </h3>
          {selectedEvents.map(ev => (
            <div key={ev.id} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[ev.status] || 'bg-zinc-500'}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ev.customerName}</p>
                {ev.itemTitle && <p className="text-xs text-zinc-500 truncate">{ev.itemTitle}</p>}
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-zinc-500 shrink-0">{ev.status}</span>
            </div>
          ))}
        </div>
      )}

      {selected && selectedEvents.length === 0 && (
        <p className="text-center text-xs text-zinc-600 py-4">No bookings on this day</p>
      )}
    </div>
  )
}
