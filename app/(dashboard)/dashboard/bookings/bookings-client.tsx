'use client'

import { useState } from 'react'
import { CalendarView } from './calendar-view'
import { Calendar, List } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

// Dummy action wrapper for client component since we can't easily pass Server Actions 
// if they are complex, but the existing code uses a form wrapper. We'll just copy the UI and use regular HTML forms since Next.js server actions work natively in forms.

export function BookingsClient({ bookings, children }: { bookings: Record<string, unknown>[], children: React.ReactNode }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage reservations, appointments, and service bookings."
        action={
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === 'calendar' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
        }
      />

      {view === 'calendar' ? (
        <CalendarView bookings={bookings} />
      ) : (
        children
      )}
    </div>
  )
}

