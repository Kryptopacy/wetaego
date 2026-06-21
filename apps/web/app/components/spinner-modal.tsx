'use client'



import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store/cart'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

export type SpinnerSegment = {
  label: string
  value: number
  type: 'win' | 'loss'
}

interface SpinnerModalProps {
  locationId: string
  config: SpinnerSegment[]
}

export function SpinnerModal({ locationId, config }: SpinnerModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSpun, setHasSpun] = useState(true) // Default true until checked
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<SpinnerSegment | null>(null)
  const setSpinnerDiscount = useCartStore((state: any) => state.setSpinnerDiscount)
  
  useEffect(() => {
    // Check if user has already spun for this location today
    const storageKey = `spinner_spun_${locationId}`
    const spun = localStorage.getItem(storageKey)
    if (!spun) {
      setHasSpun(false)
    }
  }, [locationId])

  if (hasSpun) return null

  const spinWheel = () => {
    if (isSpinning) return
    setIsSpinning(true)
    
    // Calculate random degree
    const randomDegree = Math.floor(Math.random() * 360) + (360 * 5) // spin 5 times at least
    const normalizedDegree = randomDegree % 360
    
    // Each segment is 360 / config.length degrees
    const segmentAngle = 360 / config.length
    // Find winning segment (wheel top is usually at 0 deg, but CSS rotate goes clockwise)
    // Actually, top is at 0 degrees, but CSS rotates clockwise, meaning the segment that lands on top 
    // is (360 - normalizedDegree).
    const winningAngle = (360 - normalizedDegree) % 360
    const winningIndex = Math.floor(winningAngle / segmentAngle)
    const winningSegment = config[winningIndex]

    setRotation(randomDegree)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(winningSegment)
      
      const storageKey = `spinner_spun_${locationId}`
      localStorage.setItem(storageKey, 'true')
      
      if (winningSegment.type === 'win') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        })
        if (setSpinnerDiscount) {
          setSpinnerDiscount(winningSegment.value)
        }
        toast.success(`You won ${winningSegment.value}% off!`)
      } else {
        toast.error(`Aww! ${winningSegment.label}.`)
      }
      
      setTimeout(() => {
        setIsOpen(false)
        setHasSpun(true)
      }, 3000)
      
    }, 4000) // 4 seconds spin duration
  }

  // Generate pie slices
  const conicGradient = config.map((_, i) => {
    const start = (i * 100) / config.length
    const end = ((i + 1) * 100) / config.length
    const color = i % 2 === 0 ? '#3b82f6' : '#8b5cf6' // Alternate colors: blue and purple
    return `${color} ${start}% ${end}%`
  }).join(', ')

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center animate-bounce border-2 border-white/20 text-2xl"
      >
        🎁
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-3xl p-6 md:p-10 w-full max-w-md flex flex-col items-center border border-zinc-800 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h2 className="text-3xl font-black text-white mb-2 text-center">Spin to Win!</h2>
              <p className="text-zinc-400 text-center mb-8">Test your luck to win an instant discount on your meal.</p>

              <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
                {/* Pointer indicator */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white drop-shadow-xl" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0l-8 12h16z"/></svg>
                </div>
                
                {/* Wheel */}
                <div 
                  className="w-full h-full rounded-full border-4 border-zinc-800 shadow-[0_0_50px_rgba(139,92,246,0.3)] relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.15,0.85,0.15,1)]"
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(${conicGradient})`
                  }}
                >
                  {config.map((segment, i) => {
                    const angle = (i * 360) / config.length + (360 / config.length) / 2
                    return (
                      <div 
                        key={i} 
                        className="absolute w-full h-full"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 origin-bottom text-white font-black text-lg md:text-xl drop-shadow-md whitespace-nowrap" style={{ transform: 'rotate(-90deg)' }}>
                          {segment.label}
                        </div>
                      </div>
                    )
                  })}
                  {/* Inner circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-zinc-900 rounded-full border-4 border-zinc-800 shadow-inner flex items-center justify-center">
                    <span className="text-xl font-black text-white">★</span>
                  </div>
                </div>
              </div>

              {result ? (
                <div className="text-center h-14">
                  <h3 className={`text-2xl font-bold ${result.type === 'win' ? 'text-green-400' : 'text-zinc-400'}`}>
                    {result.type === 'win' ? `🎉 ${result.label}!` : `😢 ${result.label}`}
                  </h3>
                </div>
              ) : (
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
