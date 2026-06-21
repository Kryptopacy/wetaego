import { describe, it, expect } from 'vitest'
import { BUSINESS_TYPE_PRESETS } from '../presets'

describe('Business Type Presets', () => {
  it('should have valid configurations for all presets', () => {
    Object.entries(BUSINESS_TYPE_PRESETS).forEach(([key, preset]) => {
      expect(preset).toBeDefined()
      expect(preset.label).toBeDefined()
      expect(preset.template_type).toBeDefined()
      expect(['catalog', 'booking', 'listing', 'rate_card', 'info', 'custom']).toContain(preset.template_type)
      expect(['food_drink', 'hospitality', 'services', 'retail', 'property', 'creative']).toContain(preset.group)

      if (preset.payment_mode === 'deposit') {
        expect(preset.deposit_percentage).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('restaurant preset should be correctly configured', () => {
    const restaurant = BUSINESS_TYPE_PRESETS['restaurant']
    expect(restaurant.template_type).toBe('catalog')
    expect(restaurant.billing_enabled).toBe(true)
    expect(restaurant.billing_mode).toBe('table_service')
    expect(restaurant.payment_mode).toBe('full')
  })
})
