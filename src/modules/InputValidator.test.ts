/**
 * Unit Tests für InputValidator
 * Testet alle Validierungsfunktionen gegen PAP-Anforderungen
 */

import { describe, it, expect } from 'vitest'
import { InputValidator } from './InputValidator'

describe('InputValidator', () => {
  const validator = new InputValidator(2026)

  describe('validateLohnZZ', () => {
    it('should accept valid LZZ values', () => {
      const result = validator.validateLohnZZ(1)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept 2 (Monat)', () => {
      const result = validator.validateLohnZZ(2)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid LZZ value', () => {
      const result = validator.validateLohnZZ(5)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].severity).toBe('error')
    })

    it('should reject non-numeric LZZ', () => {
      const result = validator.validateLohnZZ('monat')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateSteuerklasse', () => {
    it('should accept valid steuerklassen', () => {
      for (let i = 1; i <= 6; i++) {
        const result = validator.validateSteuerklasse(i)
        expect(result.valid).toBe(true)
      }
    })

    it('should reject invalid steuerklasse', () => {
      const result = validator.validateSteuerklasse(7)
      expect(result.valid).toBe(false)
      expect(result.errors[0].severity).toBe('error')
    })
  })

  describe('validateBruttolohn', () => {
    it('should accept valid bruttolohn', () => {
      const result = validator.validateBruttolohn(200000) // 2.000 EUR
      expect(result.valid).toBe(true)
    })

    it('should reject negative bruttolohn', () => {
      const result = validator.validateBruttolohn(-100)
      expect(result.valid).toBe(false)
      expect(result.errors[0].severity).toBe('error')
    })

    it('should accept zero bruttolohn', () => {
      const result = validator.validateBruttolohn(0)
      expect(result.valid).toBe(true)
    })

    it('should warn on unrealistic high bruttolohn', () => {
      const result = validator.validateBruttolohn(1000000000)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('warning')
    })
  })

  describe('validateFaktor', () => {
    it('should accept valid faktor for STKL IV', () => {
      const result = validator.validateFaktor(1.0)
      expect(result.valid).toBe(true)
    })

    it('should warn on unusual faktor values', () => {
      const result = validator.validateFaktor(2.5)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('warning')
    })
  })

  describe('validateRVStatus', () => {
    it('should accept 0 (gesetzlich)', () => {
      const result = validator.validateRVStatus(0)
      expect(result.valid).toBe(true)
    })

    it('should accept 9 (beamte)', () => {
      const result = validator.validateRVStatus(9)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid RV status', () => {
      const result = validator.validateRVStatus(5)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateKVStatus', () => {
    it('should accept 0 (gesetzlich)', () => {
      const result = validator.validateKVStatus(0)
      expect(result.valid).toBe(true)
    })

    it('should accept 1 (privat)', () => {
      const result = validator.validateKVStatus(1)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid KV status', () => {
      const result = validator.validateKVStatus(2)
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePVStatus', () => {
    it('should accept valid PV status', () => {
      const result = validator.validatePVStatus(0)
      expect(result.valid).toBe(true)

      const result2 = validator.validatePVStatus(1)
      expect(result2.valid).toBe(true)
    })

    it('should reject invalid PV status', () => {
      const result = validator.validatePVStatus(5)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateKinderfreibetraege', () => {
    it('should accept 0 kinderfreibeträge', () => {
      const result = validator.validateKinderfreibetraege(0)
      expect(result.valid).toBe(true)
    })

    it('should accept valid number of kinderfreibeträge', () => {
      const result = validator.validateKinderfreibetraege(3)
      expect(result.valid).toBe(true)
    })

    it('should reject negative kinderfreibeträge', () => {
      const result = validator.validateKinderfreibetraege(-1)
      expect(result.valid).toBe(false)
    })

    it('should warn on unrealistic high kinderfreibeträge', () => {
      const result = validator.validateKinderfreibetraege(20)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('warning')
    })
  })

  describe('validateGeburtsjahr', () => {
    it('should accept valid geburtsjahr', () => {
      const result = validator.validateGeburtsjahr(1975)
      expect(result.valid).toBe(true)
    })

    it('should reject year below 1900', () => {
      const result = validator.validateGeburtsjahr(1800)
      expect(result.valid).toBe(false)
    })

    it('should reject year in future', () => {
      const futureYear = new Date().getFullYear() + 1
      const result = validator.validateGeburtsjahr(futureYear)
      expect(result.valid).toBe(false)
    })

    it('should reject non-integer geburtsjahr', () => {
      const result = validator.validateGeburtsjahr(1975.5)
      expect(result.valid).toBe(false)
    })

    it('should warn on very young age', () => {
      const recentYear = new Date().getFullYear() - 15
      const result = validator.validateGeburtsjahr(recentYear)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].severity).toBe('warning')
    })
  })

  describe('validateWestOst', () => {
    it('should accept 1 (West)', () => {
      const result = validator.validateWestOst(1)
      expect(result.valid).toBe(true)
    })

    it('should accept 2 (Ost)', () => {
      const result = validator.validateWestOst(2)
      expect(result.valid).toBe(true)
    })

    it('should reject other values', () => {
      const result = validator.validateWestOst(3)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateAllInputs', () => {
    it('should validate complete input set', () => {
      const inputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 200000,
        rvStatus: 0,
        kvStatus: 0,
        kvZusatzbeitragSatz: 2.5,
        pvStatus: 0,
        pvSachsenZuschlag: 0,
        anzahlKinderfreibetraege: 0,
        westOst: 1,
        geringfuegig: 0,
        gleitzone: 0,
      }

      const result = validator.validateAllInputs(inputs)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject incomplete input (missing lohnZZ)', () => {
      const inputs = {
        stkl: 1,
        bruttolohn: 200000,
      }

      const result = validator.validateAllInputs(inputs)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === 'lohnZZ')).toBe(true)
    })

    it('should collect multiple errors', () => {
      const inputs = {
        lohnZZ: 7, // Invalid
        stkl: 8, // Invalid
        bruttolohn: -500, // Invalid
      }

      const result = validator.validateAllInputs(inputs)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(2)
    })
  })

  describe('Static utility methods', () => {
    it('should format EUR correctly', () => {
      const result = InputValidator.formatEUR(200000)
      expect(result).toContain('2.000,00')
      expect(result).toContain('EUR')
    })

    it('should parse EUR string correctly', () => {
      const result = InputValidator.parseEUR('2.000,50 EUR')
      expect(result).toBe(200050)
    })

    it('should parse EUR without EUR suffix', () => {
      const result = InputValidator.parseEUR('2000.50')
      expect(result).toBe(200050)
    })
  })
})
