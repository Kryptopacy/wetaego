'use client'

import { useState } from 'react'
import { FadeIn } from './animations'
import { Dices, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

type GameMode = 'classic' | 'squad' | 'survivor' | 'chaos'

export function RouletteTeaser() {
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
  const [currentDisplay, setCurrentDisplay] = useState('?')

  const namesList = useNames 
    ? namesText.split(',').map(n => n.trim()).filter(n => n.length > 0)
    : Array.from({ length: playerCount }, (_, i) => `Player ${i + 1}`)

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  const handleSpin = async () => {
    if (namesList.length < 2) return

    setSpinning(true)
    setIsFinished(false)
    setWinners([])
    setSafeNames([])
    setChaosResults([])
    
    if (mode === 'classic' || mode === 'squad') {
      const numToPick = mode === 'classic' ? 1 : Math.min(squadSize, namesList.length - 1)
      let available = [...namesList]
      const chosen: string[] = []
      
      for (let i = 0; i < numToPick; i++) {
        let iterations = 0
        while (iterations < 20) {
          const r = available[Math.floor(Math.random() * available.length)]
          setCurrentDisplay(r)
          await sleep(50 + (iterations * 5))
          iterations++
        }
        
        const winner = available[Math.floor(Math.random() * available.length)]
        chosen.push(winner)
        setCurrentDisplay(winner)
        setWinners([...chosen])
        available = available.filter(n => n !== winner)
        
        if (i < numToPick - 1) await sleep(1000)
      }
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#d946ef', '#ffffff']
      })
    }
    else if (mode === 'survivor') {
      let available = [...namesList]
      const safe: string[] = []
      
      while (available.length > 1) {
        let iterations = 0
        while (iterations < 15) {
          const r = available[Math.floor(Math.random() * available.length)]
          setCurrentDisplay(r)
          await sleep(80)
          iterations++
        }
        
        const saved = available[Math.floor(Math.random() * available.length)]
        safe.push(saved)
        setSafeNames([...safe])
        setCurrentDisplay(`${saved} is SAFE!`)
        available = available.filter(n => n !== saved)
        
        await sleep(1500)
      }
      
      setWinners([available[0]])
      setCurrentDisplay(available[0])
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f87171', '#ffffff']
      })
    }
    else if (mode === 'chaos') {
      let iterations = 0
      while (iterations < 30) {
        setCurrentDisplay(Math.floor(Math.random() * 100) + '%')
        await sleep(50)
        iterations++
      }
      
      let remaining = 100
      const results = namesList.map((name, i) => {
        if (i === namesList.length - 1) return { name, percentage: remaining }
        const maxShare = remaining - (namesList.length - 1 - i)
        const p = Math.floor(Math.random() * maxShare) + 1
        remaining -= p
        return { name, percentage: p }
      })
      
      results.sort(() => Math.random() - 0.5)
      setChaosResults(results)
      setCurrentDisplay('CHAOS!')
      setIsFinished(true)
      setSpinning(false)
      
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#eab308', '#3b82f6', '#22c55e']
      })
    }
  }

  const handleReset = () => {
    setIsFinished(false)
    setSpinning(false)
    setWinners([])
    setSafeNames([])
    setChaosResults([])
  }

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/[0.04]">
      <FadeIn className="bg-zinc-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-700" />
        
        <div className="lg:w-1/2 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-6">
            <Dices className="w-4 h-4" /> Built-in Add-on
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            Who pays the bill? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Spin the wheel.</span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Transform the awkwardness of group payments into a viral experience. The <strong className="text-white">Payment Roulette</strong> randomizer is built directly into your checkout page. It dramatically increases engagement, drives higher tips, and turns checkout friction into fun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Enable for your business
            </Link>
          </div>
        </div>

        <div className="lg:w-1/2 relative z-10 w-full flex justify-center perspective-[1000px]">
          {/* LIVE EMBEDDED ROULETTE UI */}
          <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-800 rounded-3xl shadow-2xl p-6 backdrop-blur-xl flex flex-col z-[70]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black text-xl">Payment Roulette</h3>
              {isFinished && (
                <button onClick={handleReset} className="text-zinc-500 hover:text-white text-xs font-bold uppercase">
                  Reset
                </button>
              )}
            </div>

            {!spinning && !isFinished ? (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {/* Mode Selector */}
                <div className="flex bg-zinc-900 rounded-lg p-1">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'squad', label: 'Squad' },
                    { id: 'survivor', label: 'Survivor' },
                    { id: 'chaos', label: 'Chaos' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as GameMode)}
                      className={`flex-1 text-[11px] font-bold py-2 rounded-md transition-colors ${mode === m.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="text-center text-xs text-zinc-400 h-8">
                  {mode === 'classic' && "One spin. One person pays it all."}
                  {mode === 'squad' && "Pick exactly how many people are splitting it."}
                  {mode === 'survivor' && "Names are safely crossed off until 1 is left."}
                  {mode === 'chaos' && "Everyone pays a completely random percentage."}
                </div>

                <div className="flex bg-zinc-900 rounded-lg p-1 w-max mx-auto mb-2">
                  <button
                    onClick={() => setUseNames(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${!useNames ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Use Numbers
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
                    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4">
                      <button onClick={() => setPlayerCount(Math.max(2, playerCount - 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                        -
                      </button>
                      <div className="text-center w-16">
                        <span className="block text-3xl font-black text-white">{playerCount}</span>
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Players</span>
                      </div>
                      <button onClick={() => setPlayerCount(Math.min(20, playerCount + 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea 
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    placeholder="John, Sarah, Mike, Lisa..."
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-500 text-center text-lg leading-tight"
                  />
                )}

                {mode === 'squad' && (
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
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
                  className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black py-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 mt-2 group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    SPIN THE WHEEL 🎰
                  </span>
                </motion.button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
                
                {mode !== 'chaos' || !isFinished ? (
                  <div className="w-full h-32 bg-zinc-900 border-2 border-zinc-800 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                    {spinning && <div className="absolute inset-0 border-4 border-purple-500 rounded-2xl animate-pulse shadow-[inset_0_0_30px_rgba(168,85,247,0.4)]" />}
                    <motion.div 
                      key={currentDisplay}
                      initial={{ y: 30, opacity: 0, filter: 'blur(5px)' }}
                      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`text-3xl md:text-4xl font-black text-center ${(isFinished && mode !== 'survivor') ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-white drop-shadow-lg'}`}
                    >
                      {currentDisplay}
                    </motion.div>
                  </div>
                ) : null}
                
                {mode === 'survivor' && spinning && safeNames.length > 0 && (
                  <div className="w-full space-y-2">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest text-center">Safe</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {safeNames.map(n => (
                        <span key={n} className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-md line-through">{n}</span>
                      ))}
                    </div>
                  </div>
                )}

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
                        <span className="block text-purple-400 text-xs font-bold uppercase tracking-widest mb-2 text-center">The Chaos Split</span>
                        {chaosResults.map((r, i) => (
                          <div key={i} className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                            <span className="text-white font-medium">{r.name}</span>
                            <span className="text-purple-400 font-bold">{r.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={handleReset}
                      className="w-full py-3 text-zinc-400 text-sm font-bold hover:text-white transition-colors mt-2"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
