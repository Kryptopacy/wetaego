'use client'

export function CancelButton() {
  return (
    <button 
      type="submit"
      className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors hover:underline px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg"
      onClick={(e) => {
        if (!window.confirm('Are you sure you want to cancel your subscription?')) {
          e.preventDefault()
        }
      }}
    >
      Cancel Subscription
    </button>
  )
}
