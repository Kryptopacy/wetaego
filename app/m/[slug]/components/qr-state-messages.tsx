export function InvalidQrMessage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Invalid QR Code</h1>
      <p className="text-zinc-400">This QR code is either invalid or inactive.</p>
    </div>
  )
}

interface UnassignedTableMessageProps {
  qrId: string
}

export function UnassignedTableMessage({ qrId }: UnassignedTableMessageProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Unassigned Table</h1>
      <p className="text-zinc-400 mb-8">This table has not been assigned a location yet. Please ask a host for assistance.</p>
      <a href={`/dashboard/qr/provision?id=${qrId}`} className="text-blue-500 text-sm font-medium hover:underline">
        Are you a host? Tap here to assign this table.
      </a>
    </div>
  )
}
