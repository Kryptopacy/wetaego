'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { Calendar, List } from 'lucide-react'

// Dummy action wrapper for client component since we can't easily pass Server Actions 
// if they are complex, but the existing code uses a form wrapper. We'll just copy the UI and use regular HTML forms since Next.js server actions work natively in forms.

export function BookingsClient({ bookings, children }: { bookings: Record<string, unknown>[], children: React.ReactNode }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management System</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage reservations, appointments, and service bookings.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'calendar' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView bookings={bookings} />
      ) : (
        children
      )}
    </div>
  )
}
