/**
 * Unit Tests für TaxCalculator
 * Validiert Tarifberechnung gegen PAP 2026
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { TaxCalculator } from './TaxCalculator'
import type { LohnsteuerInputs, ParameterSet } from '../types/index.js'

// Minimale Parameter für Tests
const testParameters: ParameterSet = {
  version: '2026.1.0',
  jahr: 2026,
  valid_from: '2026-01-01',
  valid_to: '2026-12-31',
  pap_reference: 'Test',
  pap_publication_date: '2026-01-01',

  tariff: {
    jahr: 2026,
    grundfreibetrag: 1160000,
    spitzensteuersatz_ab: 6281000,
    spitzensteuersatz_prozent: 0.45,
    formeln: {
      zone_A: { min: 0, max: 1160000 },
      zone_B: { min: 1160000, max: 6281000 },
      zone_C: { min: 6281000, max: 18600000 },
      zone_D: { min: 18600000 },
    },
    pap_pages: '12-13',
  },

  contributions: {
    rv: {
      name: 'RV',
      rate_percent: 18.6,
      employee_percent: 9.3,
      employer_percent: 9.3,
      bemessungsgrenzleWest: 10140000,
      bemessungsgrenzleOst: 10710000,
      pap_page: 7,
      law: '§ 168 SGB VI',
    },
    alv: {
      name: 'ALV',
      rate_percent: 2.6,
      employee_percent: 2.6,
      employer_percent: 2.6,
      beitragsbemessungsgrenze: 10140000,
      pap_page: 7,
      law: '§ 341 SGB III',
    },
    kv: {
      name: 'KV',
      basis_rate_percent: 14.0,
      employee_percent: 7.0,
      employer_percent: 7.0,
      beitragsbemessungsgrenze: 6975000,
      zusatzbeitrag: {
        durchschnitt_percent: 2.5,
        kassenindividuell: true,
      },
      pap_page: 8,
      law: '§ 242 SGB V',
    },
    pv: {
      name: 'PV',
      basis_rate_percent: 3.6,
      employee_percent: 1.8,
      employer_percent: 1.8,
      zuschlag_kinderlos_percent: 0.6,
      abschlag_pro_kind_percent: 0.25,
      sachsen_zuschlag_percent: 0.75,
      pap_page: 8,
      law: '§ 55 SGB XI',
    },
  },

  solidarity: {
    name: 'SZ',
    rate_percent: 5.5,
    freigrenze: 2035000,
    law: '§ 5 SolzG',
    pap_page: 16,
  },

  church_tax: {
    name: 'KSt',
    rates: { standard: 8.0, bavaria_bw: 9.0 },
    calculation: 'Prozentsatz * Lohnsteuer',
    pap_page: 17,
    law: '§ 51a EStG',
  },

  special_cases: {
    minijob: {
      grenze: 52000,
      lohnsteuer_pauschal_percent: 2.0,
      rv_pauschal_percent: 3.6,
      alv_pauschal_percent: 1.3,
    },
    gleitzone: {
      lower: 52000,
      upper: 150000,
      rv_abgestuft: true,
      alv_vollbeitrag: true,
    },
    altersentlastung: {
      minimum_alter: 64,
      law: '§ 24a EStG',
      staffelung_nach_geburtsjahr: true,
    },
    abfindung: {
      regelung: 'Fünftel-Regelung',
      law: '§ 34 EStG',
    },
    sonderzahlungen: {
      behandlung: 'Zum Bruttoeinkommen addieren',
      law: '§ 39 Abs. 1 Nr. 2 EStG',
    },
  },

  child_allowance: {
    betrag_pro_kind_jaehrlich: 552000,
    betrag_pro_kind_monatlich: 46000,
    law: '§ 32 Abs. 6 EStG',
    pap_page: 10,
  },

  validation_test_cases: [],
  metadata: {
    erstellt_am: '2026-01-01',
    version_status: 'Test',
    letzte_aenderung: '2026-01-01',
    geaendert_von: 'Test',
    validiert_gegen: 'Test',
    validierungs_status: 'Test',
  },
}

describe('TaxCalculator', () => {
  let calculator: TaxCalculator

  beforeAll(() => {
    calculator = new TaxCalculator(testParameters)
  })

  describe('Tarifberechnung § 32a EStG', () => {
    it('should exempt basic income (Grundfreibetrag)', () => {
      const inputs: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 1000000, // 10.000 EUR < 11.600 EUR
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

      const result = calculator.calculateTaxes(inputs)
      expect(result.lstlzz).toBe(0)
    })

    it('should calculate tax for moderate income (Zone B)', () => {
      const inputs: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 3000000, // 30.000 EUR - in Zone B
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

      const result = calculator.calculateTaxes(inputs)
      expect(result.lstlzz).toBeGreaterThan(0)
      expect(result.lstlzz).toBeLessThan(1000000) // Less than 10.000 EUR
    })

    it('should apply Kinderfreibetrag deduction', () => {
      const inputsOhneKinder: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 3000000,
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

      const inputsMitKindern: LohnsteuerInputs = {
        ...inputsOhneKinder,
        anzahlKinderfreibetraege: 2,
      }

      const result1 = calculator.calculateTaxes(inputsOhneKinder)
      const result2 = calculator.calculateTaxes(inputsMitKindern)

      expect(result2.lstlzz).toBeLessThan(result1.lstlzz)
    })

    it('should calculate Solidaritätszuschlag (5,5%)', () => {
      const inputs: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 5000000, // 50.000 EUR
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

      const result = calculator.calculateTaxes(inputs)
      expect(result.solzlzz).toBeGreaterThan(0)

      // SZ should be ~5.5% of LSt
      const expectedSZ = Math.round(result.lstlzz * 0.055)
      expect(Math.abs(result.solzlzz - expectedSZ)).toBeLessThan(50) // Within 0,50 EUR
    })
  })

  describe('Kirchensteuer (8% vs 9%)', () => {
    it('should calculate church tax at 8% or 9%', () => {
      const inputs: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 3000000,
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

      const result = calculator.calculateTaxes(inputs)
      expect(result.kist8lzz).toBeGreaterThan(0)
      expect(result.kist9lzz).toBeGreaterThan(0)

      // kist8 should be ~8% of LSt
      const expectedKst8 = Math.round(result.lstlzz * 0.08)
      expect(Math.abs(result.kist8lzz - expectedKst8)).toBeLessThan(50)

      // kist9 should be ~9% of LSt
      const expectedKst9 = Math.round(result.lstlzz * 0.09)
      expect(Math.abs(result.kist9lzz - expectedKst9)).toBeLessThan(50)
    })
  })

  describe('Audit Trail', () => {
    it('should record all calculation steps', () => {
      const inputs: LohnsteuerInputs = {
        lohnZZ: 2,
        stkl: 1,
        bruttolohn: 3000000,
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

      calculator.calculateTaxes(inputs)
      const auditTrail = calculator.getAuditTrail()

      expect(auditTrail.length).toBeGreaterThan(0)
      expect(auditTrail[0].name).toContain('Bruttolohn')
    })
  })
})
