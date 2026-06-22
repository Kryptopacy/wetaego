import { describe, expect, it } from 'vitest'

// Assuming a simplified structure for the logic we're testing.
// In reality, this would import the actual calculations or services.

describe('Affiliate Earnings', () => {
  // Pure function representing the affiliate earnings calculation logic
  // Extracted from webhook handler logic
  const calculateAffiliateEarnings = (
    chargeAmount: number, 
    affiliatePercentage: number
  ) => {
    return Math.floor((chargeAmount * affiliatePercentage) / 100)
  }

  it('calculates 10% standard commission correctly', () => {
    const charge = 10000 // ₦10,000 (1000000 kobo usually, but working with pure numbers)
    const commission = calculateAffiliateEarnings(charge, 10)
    expect(commission).toBe(1000)
  })

  it('calculates custom higher commissions correctly', () => {
    const charge = 50000 
    const commission = calculateAffiliateEarnings(charge, 25)
    expect(commission).toBe(12500)
  })

  it('handles small fractional amounts safely using floor', () => {
    const charge = 9999 
    const commission = calculateAffiliateEarnings(charge, 10)
    expect(commission).toBe(999) // 999.9 floored
  })
})
