'use client'




import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type GameMode = 'classic' | 'squad' | 'survivor' | 'chaos'

export function RouletteFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [namesText, setNamesText] = useState('')
  const [mode, setMode] = useState<GameMode>('classic')
  const [squadSize, setSquadSize] = useState(2)
  
  const [spinning, setSpinning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  // Results
  const [winners, setWinners] = useState<string[]>([])
  const [safeNames, setSafeNames] = useState<string[]>([])
  const [chaosResults, setChaosResults] = useState<{name: string, percentage: number}[]>([])
  
  // For the visual roulette display
  const [currentDisplay, setCurrentDisplay] = useState('?')

  const [isMounted, setIsMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), [])

  const namesList = namesText.split(',').map(n => n.trim()).filter(n => n.length > 0)

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
    }
  }

  if (!isMounted) return null

  return (
    <div className="pointer-events-auto relative z-[45]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: 0 }}
            className="fixed inset-4 md:inset-auto md:bottom-40 md:right-6 md:w-96 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[80vh] flex flex-col z-[60] custom-scrollbar"
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-purple-500/20 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-xl">Payment Roulette</h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white" aria-label="Close roulette">
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

                  <textarea 
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    placeholder="John, Sarah, Mike, Lisa..."
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-500 text-center text-lg leading-tight"
                  />

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

                  <button 
                    onClick={handleSpin}
                    disabled={namesList.length < 2 || (mode === 'squad' && squadSize >= namesList.length)}
                    className="w-full bg-purple-600 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:bg-purple-500 transition-colors disabled:opacity-50 mt-2"
                  >
                    SPIN THE WHEEL
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
                  
                  {/* The Spinner Screen */}
                  {mode !== 'chaos' || !isFinished ? (
                    <div className="w-full h-32 bg-zinc-950 border-2 border-zinc-800 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                      {spinning && <div className="absolute inset-0 border-4 border-purple-500 rounded-2xl animate-pulse" />}
                      <motion.div 
                        key={currentDisplay}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`text-2xl font-black text-center ${(isFinished && mode !== 'survivor') ? 'text-purple-400' : 'text-white'}`}
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
                        <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl text-center">
                          <span className="block text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">The Chosen Ones</span>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {winners.map(w => (
                              <span key={w} className="text-white text-lg font-medium bg-zinc-900 px-3 py-1 rounded-lg border border-purple-500/50">{w}</span>
                            ))}
                          </div>
                          <p className="text-zinc-400 text-sm mt-3 font-medium">Split it {mode === 'classic' ? 'all' : winners.length + ' ways'} via checkout!</p>
                        </div>
                      )}

                      {mode === 'survivor' && (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
                          <span className="block text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Last One Standing</span>
                          <span className="text-white text-xl font-medium">{winners[0]} pays it all! 💀</span>
                        </div>
                      )}

                      {mode === 'chaos' && (
                        <div className="space-y-3">
                          <span className="block text-purple-400 text-xs font-bold uppercase tracking-widest mb-2 text-center">The Chaos Split</span>
                          {chaosResults.map((r, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                              <span className="text-white font-medium">{r.name}</span>
                              <span className="text-purple-400 font-bold">{r.percentage}%</span>
                            </div>
                          ))}
                          <p className="text-zinc-500 text-xs text-center mt-2">Use the &quot;Custom Amount&quot; box at checkout.</p>
                        </div>
                      )}

                      <button 
                        onClick={() => { setIsFinished(false); setSpinning(false) }}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden" 
            onClick={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>

      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[136px] right-6 z-[45] h-14 w-14 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-purple-400 transition-colors group"
        aria-label={isOpen ? "Close roulette" : "Open roulette"}
      >
        <span className="absolute right-[115%] whitespace-nowrap bg-zinc-800 text-white font-semibold text-[13px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Roulette
        </span>
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
      </motion.button>
    </div>
  )
}
