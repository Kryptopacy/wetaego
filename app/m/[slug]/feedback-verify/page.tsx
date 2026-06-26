'use client'



import { useState } from 'react'
import { motion } from 'framer-motion'
import { verifyFeedbackPin } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function FeedbackVerifyPage({
  params
}: {
  params: { slug: string }
}) {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits')
      return
    }

    setIsLoading(true)
    try {
      const { orderId, error } = await verifyFeedbackPin(params.slug, pin)
      if (error) {
        toast.error(error)
        setPin('')
      } else if (orderId) {
        toast.success('Verified!')
        router.push(`/m/${params.slug}/feedback/${orderId}`)
      }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Failed to verify PIN')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-3xl rounded-full" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-white">Enter Receipt PIN</h1>
            <p className="text-zinc-400 text-sm mt-2">
              To rate and tip the staff, please enter the 4-digit PIN found on your receipt or order confirmation.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <input 
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0000"
              className="w-full h-16 text-center text-3xl tracking-[1em] pl-[1em] font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={pin.length !== 4 || isLoading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <div className="pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => router.push(`/m/${params.slug}/feedback/general`)}
                className="w-full text-zinc-500 text-sm font-medium hover:text-white transition-colors"
              >
                I don&apos;t have an order (General Feedback)
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
