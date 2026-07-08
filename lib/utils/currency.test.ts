import { describe, it, expect } from 'vitest'
import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats NGN correctly', () => {
    // 150000 minor = 1500 major (1500 NGN)
    const result = formatCurrency(150000, 'NGN')
    // Intl.NumberFormat might use narrow or standard symbol, we just check if it contains 1,500 and NGN or ₦
    expect(result).toMatch(/1,500/)
    expect(result).toMatch(/₦|NGN/)
  })

  it('formats USD correctly', () => {
    // 9900 minor = 99 major (99 USD)
    const result = formatCurrency(9900, 'USD')
    expect(result).toMatch(/99/)
    expect(result).toMatch(/\$|USD/)
  })

  it('handles zero correctly', () => {
    const result = formatCurrency(0, 'NGN')
    expect(result).toMatch(/0/)
  })

  it('defaults to NGN if no currency code provided', () => {
    const result = formatCurrency(50000)
    expect(result).toMatch(/500/)
    expect(result).toMatch(/₦|NGN/)
  })
})
