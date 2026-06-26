import { describe, it, expect } from 'vitest'

// Core logic decoupled for testing from roulette-fab.tsx
function simulateChaosMode(names: string[]) {
  let remaining = 100
  const results = names.map((name, i) => {
    if (i === names.length - 1) return { name, percentage: remaining }
    const maxShare = remaining - (names.length - 1 - i)
    const p = Math.floor(Math.random() * maxShare) + 1
    remaining -= p
    return { name, percentage: p }
  })
  return results
}

function simulateSurvivorMode(names: string[]) {
  let available = [...names]
  const safe: string[] = []
  
  while (available.length > 1) {
    const savedIndex = Math.floor(Math.random() * available.length)
    const saved = available[savedIndex]
    safe.push(saved)
    available = available.filter((_, i) => i !== savedIndex)
  }
  return { winner: available[0], safe }
}

describe('Roulette Pay Randomizer Math', () => {
  const testNames = ['John', 'Sarah', 'Mike', 'Lisa', 'Emma']

  describe('Chaos Mode', () => {
    it('always assigns exactly 100% across all participants', () => {
      // Run 100 simulations
      for (let run = 0; run < 100; run++) {
        const results = simulateChaosMode(testNames)
        const total = results.reduce((sum, r) => sum + r.percentage, 0)
        expect(total).toBe(100)
      }
    })

    it('ensures nobody ever pays 0%', () => {
      for (let run = 0; run < 100; run++) {
        const results = simulateChaosMode(testNames)
        results.forEach(r => {
          expect(r.percentage).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Survivor Mode', () => {
    it('always eliminates down to exactly 1 person paying', () => {
      for (let run = 0; run < 100; run++) {
        const { winner, safe } = simulateSurvivorMode(testNames)
        expect(winner).toBeDefined()
        expect(safe).toHaveLength(testNames.length - 1)
        expect(safe).not.toContain(winner)
        // All original names are accounted for
        expect([...safe, winner].sort()).toEqual([...testNames].sort())
      }
    })
  })
})
