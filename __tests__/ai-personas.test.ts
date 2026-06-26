import { describe, it, expect } from 'vitest'
import { getBusinessMode, resolvePersona } from '@/lib/templates/ai-personas'

describe('AI Personas Logic', () => {
  describe('getBusinessMode', () => {
    it('returns catalog_table_service when catalog and table_service', () => {
      expect(getBusinessMode('catalog', 'table_service')).toBe('catalog_table_service')
    })

    it('returns catalog_standard_checkout when catalog but not table_service', () => {
      expect(getBusinessMode('catalog', 'standard_checkout')).toBe('catalog_standard_checkout')
      expect(getBusinessMode('catalog')).toBe('catalog_standard_checkout')
    })

    it('handles booking presets correctly', () => {
      expect(getBusinessMode('booking', null, 'spa_wellness')).toBe('booking_spa')
      expect(getBusinessMode('booking', null, 'hotel')).toBe('booking_hotel')
      expect(getBusinessMode('booking', null, 'unknown')).toBe('booking_generic')
    })
    
    it('returns custom for unknown templates', () => {
      expect(getBusinessMode('unknown_template')).toBe('custom')
    })
  })

  describe('resolvePersona', () => {
    it('returns default persona when no custom name is provided', () => {
      const persona = resolvePersona('catalog_table_service')
      expect(persona.defaultName).toBe('AI Waiter')
    })

    it('overrides defaultName when custom name is provided', () => {
      const persona = resolvePersona('catalog_table_service', 'Jarvis')
      expect(persona.defaultName).toBe('Jarvis')
      expect(persona.subtitle).toBe('Live Dining Assistant') // Preserves other fields
    })
  })
})
