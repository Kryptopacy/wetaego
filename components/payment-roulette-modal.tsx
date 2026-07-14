'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

type GameMode = 'classic' | 'squad' | 'survivor' | 'chaos'

interface PaymentRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentRouletteModal({ isOpen, onClose }: PaymentRouletteModalProps) {
  const [namesText, setNamesText] = useState('')
  const [mode, setMode] = useState<GameMode>('classic')
  const [squadSize, setSquadSize] = useState(2)
  
  const [spinning, setSpinning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  const [winners, setWinners] = useState<string[]>([])
  const [safeNames, setSafeNames] = useState<string[]>([])
  const [chaosResults, setChaosResults] = useState<{name: string, percentage: number}[]>([])
  const [useNames, setUseNames] = useState(false)
  const [playerCount, setPlayerCount] = useState(3)
  
  // For the visual roulette display
  const [currentDisplay, setCurrentDisplay] = useState('?')

  const [isMounted, setIsMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), [])

  const namesList = useNames 
    ? namesText.split(',').map(n => n.trim()).filter(n => n.length > 0)
    : Array.from({ length: playerCount }, (_, i) => `Player ${i + 1}`)

  const handleCloseOrBack = () => {
    if (spinning || isFinished) {
      setIsFinished(false)
      setSpinning(false)
      setWinners([])
      setSafeNames([])
      setChaosResults([])
    } else {
      onClose()
    }
  }

  // Handlers
  const handleSpin = async () => {
    if (namesList.length < 2) return

    setSpinning(true)
    setIsFinished(false)
    setWinners([])
    setSafeNames([])
    setChaosResults([])
    
    // Helper for sleep
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    
    if (mode === 'classic' || mode === 'squad') {
      const numToPick = mode === 'classic' ? 1 : Math.min(squadSize, namesList.length - 1)
      let available = [...namesList]
      const chosen: string[] = []
      
      for (let i = 0; i < numToPick; i++) {
        // Spin effect
        let iterations = 0
        const maxIter = 20
        while (iterations < maxIter) {
          const r = available[Math.floor(Math.random() * available.length)]
          setCurrentDisplay(r)
          await sleep(50 + (iterations * 5)) // slows down
          iterations++
        }
        
        // Pick one
        const winner = available[Math.floor(Math.random() * available.length)]
        chosen.push(winner)
        setCurrentDisplay(winner)
        setWinners([...chosen])
        available = available.filter(n => n !== winner)
        
        if (i < numToPick - 1) {
          await sleep(1000) // pause before next pick
        }
      }
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff']
      })
    }
    
    else if (mode === 'survivor') {
      let available = [...namesList]
      const safe: string[] = []
      
      while (available.length > 1) {
        // Spin effect
        let iterations = 0
        while (iterations < 15) {
          const r = available[Math.floor(Math.random() * available.length)]
          setCurrentDisplay(r)
          await sleep(80)
          iterations++
        }
        
        // Cross off one
        const saved = available[Math.floor(Math.random() * available.length)]
        safe.push(saved)
        setSafeNames([...safe])
        setCurrentDisplay(`${saved} is SAFE!`)
        available = available.filter(n => n !== saved)
        
        await sleep(1500)
      }
      
      // Last one standing pays
      setWinners([available[0]])
      setCurrentDisplay(available[0])
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f87171', '#ffffff'] // Red theme for survivor
      })
    }

    else if (mode === 'chaos') {
      // Rapid shuffle of numbers
      let iterations = 0
      while (iterations < 30) {
        setCurrentDisplay(Math.floor(Math.random() * 100) + '%')
        await sleep(50)
        iterations++
      }
      
      // Generate percentages that equal 100
      let remaining = 100
      const results = namesList.map((name, i) => {
        if (i === namesList.length - 1) return { name, percentage: remaining }
        // Give a random chunk of the remaining (ensuring at least 1% for everyone)
        const maxShare = remaining - (namesList.length - 1 - i)
        const p = Math.floor(Math.random() * maxShare) + 1
        remaining -= p
        return { name, percentage: p }
      })
      
      // Shuffle the results so the last person doesn't predictably get the smallest/largest
      results.sort(() => Math.random() - 0.5)
      
      setChaosResults(results)
      setCurrentDisplay('CHAOS!')
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#10b981', '#34d399', '#eab308', '#3b82f6', '#22c55e'] // Chaos colors
      })
    }
  }

  if (!isMounted) return null

  return (
    <div className="pointer-events-auto relative z-[65]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%', left: '50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%', left: '50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%', left: '50%' }}
            className="fixed inset-4 md:inset-auto md:top-24 md:w-96 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[80vh] flex flex-col z-[70] custom-scrollbar"
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/20 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-xl">Payment Roulette</h3>
                <span className="sr-only">Free randomizer for who pays the bills, split the check, and restaurant bill roulette.</span>
                <button onClick={handleCloseOrBack} className="text-zinc-500 hover:text-white" aria-label="Close roulette">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {!spinning && !isFinished ? (
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {/* Mode Selector */}
                  <div className="flex bg-zinc-950 rounded-lg p-1">
                    {[
                      { id: 'classic', label: 'Classic' },
                      { id: 'squad', label: 'Squad' },
                      { id: 'survivor', label: 'Survivor' },
                      { id: 'chaos', label: 'Chaos' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as GameMode)}
                        className={`flex-1 text-[11px] font-bold py-2 rounded-md transition-colors ${mode === m.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Mode Explanations */}
                  <div className="text-center text-xs text-zinc-400 h-8">
                    {mode === 'classic' && "One spin. One person pays it all."}
                    {mode === 'squad' && "Pick exactly how many people are splitting it."}
                    {mode === 'survivor' && "Names are safely crossed off until 1 is left."}
                    {mode === 'chaos' && "Everyone pays a completely random percentage."}
                  </div>

                  <div className="flex bg-zinc-950 rounded-lg p-1 w-max mx-auto mb-2">
                    <button
                      onClick={() => setUseNames(false)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${!useNames ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Use Numbers (Quick)
                    </button>
                    <button
                      onClick={() => setUseNames(true)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${useNames ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Use Names
                    </button>
                  </div>

                  {!useNames ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-2">
                      <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4">
                        <button onClick={() => setPlayerCount(Math.max(2, playerCount - 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <div className="text-center">
                          <span className="block text-3xl font-black text-white">{playerCount}</span>
                          <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Players</span>
                        </div>
                        <button onClick={() => setPlayerCount(Math.min(20, playerCount + 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium">Pick a number amongst yourselves!</p>
                    </div>
                  ) : (
                    <textarea 
                      value={namesText}
                      onChange={(e) => setNamesText(e.target.value)}
                      placeholder="John, Sarah, Mike, Lisa..."
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-emerald-500 text-center text-lg leading-tight"
                    />
                  )}

                  {mode === 'squad' && (
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2">
                      <span className="text-sm font-medium text-zinc-400">How many chosen?</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSquadSize(Math.max(2, squadSize - 1))} className="w-8 h-8 rounded-md bg-zinc-800 text-white">-</button>
                        <span className="text-white font-bold w-4 text-center">{squadSize}</span>
                        <button onClick={() => setSquadSize(Math.min(namesList.length - 1 || 2, squadSize + 1))} className="w-8 h-8 rounded-md bg-zinc-800 text-white">+</button>
                      </div>
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSpin}
                    disabled={namesList.length < 2 || (mode === 'squad' && squadSize >= namesList.length)}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 mt-2 group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      SPIN THE WHEEL 🎰
                    </span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
                  
                  {/* The Spinner Screen */}
                  {mode !== 'chaos' || !isFinished ? (
                    <div className="w-full h-32 bg-zinc-950 border-2 border-zinc-800 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                      {spinning && <div className="absolute inset-0 border-4 border-emerald-500 rounded-2xl animate-pulse shadow-[inset_0_0_30px_rgba(16,185,129,0.4)]" />}
                      <motion.div 
                        key={currentDisplay}
                        initial={{ y: 30, opacity: 0, filter: 'blur(5px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`text-3xl md:text-4xl font-black text-center ${(isFinished && mode !== 'survivor') ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-white drop-shadow-lg'}`}
                      >
                        {currentDisplay}
                      </motion.div>
                    </div>
                  ) : null}
                  
                  {/* SURVIVOR PROGRESS */}
                  {mode === 'survivor' && spinning && safeNames.length > 0 && (
                    <div className="w-full space-y-2">
                      <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest text-center">Safe (They survive!)</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {safeNames.map(n => (
                          <span key={n} className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-md line-through">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WINNER RESULTS */}
                  {isFinished && (
                    <div className="w-full space-y-4 animate-in fade-in zoom-in duration-500">
                      
                      {(mode === 'classic' || mode === 'squad') && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
                          <span className="block text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">The Chosen Ones</span>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {winners.map(w => (
                              <span key={w} className="text-white text-lg font-medium bg-zinc-900 px-3 py-1 rounded-lg border border-emerald-500/50">{w}</span>
                            ))}
                          </div>
                          <p className="text-zinc-400 text-sm mt-3 font-medium">Split it {mode === 'classic' ? 'all' : winners.length + ' ways'} via checkout!</p>
                        </div>
                      )}

                      {mode === 'survivor' && (
                        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl text-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                          <span className="block text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Last One Standing</span>
                          <span className="text-white text-2xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{winners[0]} pays it all! 💀</span>
                        </div>
                      )}

                      {mode === 'chaos' && (
                        <div className="space-y-3">
                          <span className="block text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 text-center">The Chaos Split</span>
                          {chaosResults.map((r, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                              <span className="text-white font-medium">{r.name}</span>
                              <span className="text-emerald-400 font-bold">{r.percentage}%</span>
                            </div>
                          ))}
                          <p className="text-zinc-400 text-sm mt-4">
                  Use the &quot;Custom Amount&quot; box at checkout.
                </p>        </div>
                      )}

                      <button 
                        onClick={handleSpin}
                        className="w-full py-3 text-zinc-400 text-sm font-bold hover:text-white transition-colors mt-2"
                      >
                        Play Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" 
            onClick={onClose} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
