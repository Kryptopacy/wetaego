'use client'

import { format } from 'date-fns'

interface Shift {
  id: string
  clock_in_time: string
  clock_out_time: string | null
  status: string
  profiles: { full_name?: string; email?: string }
  locations: { name?: string }
}

export function StaffShifts({ shifts }: { shifts: Shift[] }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden mt-8 shadow-2xl">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white">Staff Shifts & Logs</h2>
        <p className="text-sm text-zinc-400 mt-1">Monitor when your team clocks in and out across your locations.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-zinc-900/50">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Staff Member</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clock In</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clock Out</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No shift records found. Staff can clock in using the timeclock widget on the dashboard.
                </td>
              </tr>
            ) : (
              shifts.map((shift) => {
                const clockIn = new Date(shift.clock_in_time)
                const clockOut = shift.clock_out_time ? new Date(shift.clock_out_time) : null
                
                let durationStr = '-'
                if (clockOut) {
                  const diffMs = clockOut.getTime() - clockIn.getTime()
                  const diffHrs = Math.floor(diffMs / 3600000)
                  const diffMins = Math.round((diffMs % 3600000) / 60000)
                  durationStr = `${diffHrs}h ${diffMins}m`
                }

                return (
                  <tr key={shift.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{shift.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-zinc-500">{shift.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{shift.locations?.name || 'Unknown Location'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {shift.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          Clocked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {format(clockIn, 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {clockOut ? format(clockOut, 'MMM d, h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-medium">
                      {durationStr}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
