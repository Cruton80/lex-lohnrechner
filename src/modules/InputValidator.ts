/**
 * InputValidator-Modul
 * Validiert alle Eingabeparameter gegen Vorgaben und PAP-Anforderungen
 *
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf, Seite 1-5
 * Rechtliche Grundlage: § 39b EStG (Lohnsteuerabzug)
 */

import type {
  LohnsteuerInputs,
  ValidationError,
  ValidationResult,
  LohnzahlungsZeitraum,
  Steuerklasse,
  RVStatus,
  KVStatus,
  PVStatus,
} from '../types/index.js'

export class InputValidator {
  private year: number = 2026

  constructor(year: number = 2026) {
    this.year = year
  }

  /**
   * Validiert alle Eingabeparameter
   * PAP-Referenz: S. 1-5 (Eingabeparameter-Definition)
   */
  validateAllInputs(inputs: Partial<LohnsteuerInputs>): ValidationResult {
    const errors: ValidationError[] = []

    // Erforderliche Felder prüfen
    if (inputs.lohnZZ === undefined) {
      errors.push({
        field: 'lohnZZ',
        message: 'Lohnzahlungszeitraum ist erforderlich',
        pap_reference: 'PAP S. 1',
        severity: 'error',
      })
    } else {
      const lzzError = this.validateLohnZZ(inputs.lohnZZ)
      if (!lzzError.valid) errors.push(...lzzError.errors)
    }

    if (inputs.stkl === undefined) {
      errors.push({
        field: 'stkl',
        message: 'Lohnsteuerklasse ist erforderlich',
        pap_reference: 'PAP S. 1, STKL',
        severity: 'error',
      })
    } else {
      const stklError = this.validateSteuerklasse(inputs.stkl)
      if (!stklError.valid) errors.push(...stklError.errors)
    }

    if (inputs.bruttolohn === undefined || inputs.bruttolohn === null) {
      errors.push({
        field: 'bruttolohn',
        message: 'Bruttolohn ist erforderlich',
        pap_reference: 'PAP S. 1, RE4',
        severity: 'error',
      })
    } else {
      const brError = this.validateBruttolohn(inputs.bruttolohn)
      if (!brError.valid) errors.push(...brError.errors)
    }

    // Optionale Felder mit Validierung
    if (inputs.stkl === 4 && inputs.faktor !== undefined) {
      const fError = this.validateFaktor(inputs.faktor)
      if (!fError.valid) errors.push(...fError.errors)
    }

    if (inputs.rvStatus !== undefined) {
      const rvError = this.validateRVStatus(inputs.rvStatus)
      if (!rvError.valid) errors.push(...rvError.errors)
    }

    if (inputs.kvStatus !== undefined) {
      const kvError = this.validateKVStatus(inputs.kvStatus)
      if (!kvError.valid) errors.push(...kvError.errors)
    }

    if (inputs.pvStatus !== undefined) {
      const pvError = this.validatePVStatus(inputs.pvStatus)
      if (!pvError.valid) errors.push(...pvError.errors)
    }

    if (inputs.anzahlKinderfreibetraege !== undefined) {
      const kfbError = this.validateKinderfreibetraege(
        inputs.anzahlKinderfreibetraege,
        inputs.stkl
      )
      if (!kfbError.valid) errors.push(...kfbError.errors)
    }

    if (inputs.geburtsjahr !== undefined) {
      const gjError = this.validateGeburtsjahr(inputs.geburtsjahr)
      if (!gjError.valid) errors.push(...gjError.errors)
    }

    if (inputs.westOst !== undefined) {
      const woError = this.validateWestOst(inputs.westOst)
      if (!woError.valid) errors.push(...woError.errors)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validiert Lohnzahlungszeitraum (LZZ)
   * PAP-Referenz: S. 1, Variable LZZ
   * Werte: 1=Jahr, 2=Monat, 3=Woche, 4=Tag
   */
  validateLohnZZ(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'lohnZZ',
        message: 'LZZ muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    const validValues: LohnzahlungsZeitraum[] = [1, 2, 3, 4]
    if (!validValues.includes(value as LohnzahlungsZeitraum)) {
      errors.push({
        field: 'lohnZZ',
        message: `LZZ muss 1 (Jahr), 2 (Monat), 3 (Woche) oder 4 (Tag) sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 1',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Lohnsteuerklasse
   * PAP-Referenz: S. 1, Variable STKL
   */
  validateSteuerklasse(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'stkl',
        message: 'Steuerklasse muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    const validValues: Steuerklasse[] = [1, 2, 3, 4, 5, 6]
    if (!validValues.includes(value as Steuerklasse)) {
      errors.push({
        field: 'stkl',
        message: `Steuerklasse muss zwischen 1 und 6 liegen. Eingabe: ${value}`,
        pap_reference: 'PAP S. 1, § 38b EStG',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Bruttolohn
   * PAP-Referenz: S. 1, Variable RE4
   */
  validateBruttolohn(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'bruttolohn',
        message: 'Bruttolohn muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    if (value < 0) {
      errors.push({
        field: 'bruttolohn',
        message: `Bruttolohn kann nicht negativ sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 1, RE4',
        severity: 'error',
      })
    }

    if (value > 999999900) {
      // 9.999.999,00 EUR
      errors.push({
        field: 'bruttolohn',
        message: `Bruttolohn übersteigt realistische Obergrenze: ${(value / 100).toFixed(2)} EUR`,
        severity: 'warning',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Faktor für Steuerklasse IV
   * PAP-Referenz: S. 1, Variable F
   */
  validateFaktor(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'faktor',
        message: 'Faktor muss eine Dezimalzahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    if (value < 0 || value > 2) {
      errors.push({
        field: 'faktor',
        message: `Faktor sollte zwischen 0 und 2 liegen (meist 1,0). Eingabe: ${value}`,
        pap_reference: 'PAP S. 14, Faktor bei STKL IV',
        severity: 'warning',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Rentenversicherungsstatus
   * PAP-Referenz: S. 2, Variable KRV
   */
  validateRVStatus(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'rvStatus',
        message: 'RV-Status muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    const validValues: RVStatus[] = [0, 9]
    if (!validValues.includes(value as RVStatus)) {
      errors.push({
        field: 'rvStatus',
        message: `RV-Status muss 0 (Gesetzlich) oder 9 (Beamte/Freiberufler) sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 2, KRV',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Krankenversicherungsstatus
   * PAP-Referenz: S. 2, Variable PKPV
   */
  validateKVStatus(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'kvStatus',
        message: 'KV-Status muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    const validValues: KVStatus[] = [0, 1]
    if (!validValues.includes(value as KVStatus)) {
      errors.push({
        field: 'kvStatus',
        message: `KV-Status muss 0 (Gesetzlich) oder 1 (Privat) sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 2, PKPV',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Pflegeversicherungsstatus
   * PAP-Referenz: S. 2, Variable PVZ
   */
  validatePVStatus(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'pvStatus',
        message: 'PV-Status muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    const validValues: PVStatus[] = [0, 1]
    if (!validValues.includes(value as PVStatus)) {
      errors.push({
        field: 'pvStatus',
        message: `PV-Status muss 0 (Mit Zuschlag) oder 1 (Ohne Zuschlag) sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 2, PVZ',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Kinderfreibeträge
   * PAP-Referenz: S. 2, Variable ZKF
   */
  validateKinderfreibetraege(
    value: any,
    stkl?: Steuerklasse
  ): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'anzahlKinderfreibetraege',
        message: 'Anzahl Kinderfreibeträge muss eine ganze Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    if (!Number.isInteger(value) || value < 0) {
      errors.push({
        field: 'anzahlKinderfreibetraege',
        message: `Anzahl Kinderfreibeträge muss >= 0 sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 2, ZKF',
        severity: 'error',
      })
    }

    if (value > 0 && stkl === 2) {
      // Warnung für Steuerklasse II ohne Angabe von Kindern (aber das ist eher User-Info)
    }

    if (value > 14) {
      errors.push({
        field: 'anzahlKinderfreibetraege',
        message: `Anzahl unrealistisch hoch: ${value} Kinderfreibeträge`,
        severity: 'warning',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert Geburtsjahr für Altersentlastung
   * PAP-Referenz: S. 3, Variable AJAHR, § 24a EStG
   */
  validateGeburtsjahr(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push({
        field: 'geburtsjahr',
        message: 'Geburtsjahr muss eine ganze Zahl (z.B. 1960) sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    if (value < 1900 || value > new Date().getFullYear()) {
      errors.push({
        field: 'geburtsjahr',
        message: `Geburtsjahr muss zwischen 1900 und ${new Date().getFullYear()} liegen. Eingabe: ${value}`,
        pap_reference: 'PAP S. 3, AJAHR',
        severity: 'error',
      })
    }

    const alter = new Date().getFullYear() - value
    if (alter < 18) {
      errors.push({
        field: 'geburtsjahr',
        message: `Alter kann nicht unter 18 Jahren liegen (${alter} Jahre berechnet)`,
        severity: 'warning',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validiert West/Ost Kennung
   * PAP-Referenz: S. 2, Beitragsbemessungsgrenzen unterschiedlich
   */
  validateWestOst(value: any): ValidationResult {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'westOst',
        message: 'West/Ost-Kennung muss eine Zahl sein',
        severity: 'error',
      })
      return { valid: false, errors }
    }

    if (value !== 1 && value !== 2) {
      errors.push({
        field: 'westOst',
        message: `West/Ost muss 1 (West) oder 2 (Ost) sein. Eingabe: ${value}`,
        pap_reference: 'PAP S. 2, BBG',
        severity: 'error',
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Formatiert EUR-Wert von Cent zu lesbarem Format
   * @param cent EUR in Cent (z.B. 200000 = 2.000,00 EUR)
   */
  static formatEUR(cent: number): string {
    const eur = cent / 100
    return `${eur.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} EUR`
  }

  /**
   * Konvertiert EUR-String zu Cent
   * @param value String wie "2.000,50 EUR" oder "2000.50"
   */
  static parseEUR(value: string): number {
    const cleaned = value
      .replace(' EUR', '')
      .replace(/\./g, '') // Punkte (Tausender)
      .replace(',', '.') // Komma zu Punkt

    const parsed = parseFloat(cleaned)
    if (isNaN(parsed)) {
      throw new Error(`Invalid EUR format: ${value}`)
    }

    return Math.round(parsed * 100)
  }
}
