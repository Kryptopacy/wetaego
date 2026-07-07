'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/src/style.css'

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  minDate?: Date
  label?: string
}

export function DatePicker({ date, setDate, minDate, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl px-4 py-3 text-sm text-left text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <span className={!date ? 'text-zinc-500' : ''}>
          {date ? format(date, 'PPP') : 'Pick a date'}
        </span>
        <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50">
          <style dangerouslySetInnerHTML={{__html: `
            .rdp-root {
              --rdp-accent-color: #10b981;
              --rdp-accent-background-color: rgba(16, 185, 129, 0.15);
              --rdp-day-height: 36px;
              --rdp-day-width: 36px;
              --rdp-day_button-height: 34px;
              --rdp-day_button-width: 34px;
              --rdp-today-color: #10b981;
              color: #e4e4e7;
              font-family: inherit;
            }
            .rdp-root * { box-sizing: border-box; }
            .rdp-caption_label { color: #ffffff; font-weight: 700; font-size: 0.9rem; }
            .rdp-day { color: #d4d4d8; }
            .rdp-day_button { border-radius: 8px; transition: background 0.15s; }
            .rdp-day_button:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
            .rdp-weekday { color: #71717a; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
            .rdp-button_next, .rdp-button_previous { color: #a1a1aa; border-radius: 8px; }
            .rdp-button_next:hover, .rdp-button_previous:hover { background: rgba(255,255,255,0.08); }
            .rdp-day[data-outside] { opacity: 0.3; }
            .rdp-day[data-disabled] { opacity: 0.25; }
          `}} />
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d: Date | undefined) => {
              setDate(d)
              setIsOpen(false)
            }}
            disabled={minDate ? [{ before: minDate }] : undefined}
            showOutsideDays
            fixedWeeks
          />
        </div>
      )}
    </div>
  )
}
