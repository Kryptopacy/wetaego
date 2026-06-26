  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, it, expect, vi } from 'vitest'

// We extract the math logic for testing
function evaluateSpinResult(
  config: { label: string; value: number; type: 'win' | 'loss' }[],
  randomDegree: number
) {
  const normalizedDegree = randomDegree % 360
  const segmentAngle = 360 / config.length
  // (360 - normalizedDegree) % 360
  const winningAngle = (360 - normalizedDegree) % 360
  const winningIndex = Math.floor(winningAngle / segmentAngle)
  return config[winningIndex]
}

describe('Gamification Spinner Math', () => {
  const config = [
    { label: '10% OFF', value: 10, type: 'win' as const },
    { label: 'Try Again', value: 0, type: 'loss' as const },
    { label: '5% OFF', value: 5, type: 'win' as const },
    { label: 'Better luck next time', value: 0, type: 'loss' as const },
  ]

  it('evaluates top segment at 0 degrees correctly', () => {
    // Top segment at 0 degrees spin is index 0
    const result = evaluateSpinResult(config, 0)
    expect(result.label).toBe('10% OFF')
  })

  it('evaluates top segment at 90 degrees spin correctly', () => {
    // 360 / 4 = 90 degrees per segment
    // spin 90 degrees clockwise -> top segment is index 3 (Better luck next time)
    const result = evaluateSpinResult(config, 90)
    expect(result.label).toBe('Better luck next time')
  })

  it('evaluates top segment at 180 degrees spin correctly', () => {
    // spin 180 degrees clockwise -> top segment is index 2
    const result = evaluateSpinResult(config, 180)
    expect(result.label).toBe('5% OFF')
  })

  it('always produces a valid segment index', () => {
    for (let i = 0; i < 1000; i++) {
      const randomDegree = Math.floor(Math.random() * 3600)
      const result = evaluateSpinResult(config, randomDegree)
      expect(result).toBeDefined()
      expect(['10% OFF', 'Try Again', '5% OFF', 'Better luck next time']).toContain(result.label)
    }
  })
})
