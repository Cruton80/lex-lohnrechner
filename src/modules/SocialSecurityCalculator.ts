/**
 * SocialSecurityCalculator-Modul
 * Berechnung der Sozialversicherungsbeiträge 2026
 *
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf, S. 7-9
 * Rechtliche Grundlagen:
 * - RV: § 168 SGB VI
 * - ALV: § 341 SGB III
 * - KV: § 242 SGB V, § 242a SGB V (Zusatzbeitrag)
 * - PV: § 55 SGB XI
 */

import type { LohnsteuerInputs, ParameterSet } from '../types/index.js'

export interface SocialSecurityResult {
  rvBeitrag: number // Rentenversicherung
  alvBeitrag: number // Arbeitslosenversicherung
  kvBeitrag: number // Krankenversicherung
  pvBeitrag: number // Pflegeversicherung
  gesamtBeitrag: number

  // Details für Nachvollziehbarkeit
  details: {
    rv: {
      rate: number
      bemessungsgrenze: number
      beitrag: number
    }
    alv: {
      rate: number
      bemessungsgrenze: number
      beitrag: number
    }
    kv: {
      rate: number
      zusatzbeitrag: number
      bemessungsgrenze: number
      beitrag: number
    }
    pv: {
      rate: number
      zuschlag_kinderlos?: number
      abschlag_kinder?: number
      sachsen_zuschlag?: number
      bemessungsgrenze?: number
      beitrag: number
    }
  }
}

export class SocialSecurityCalculator {
  private parameters: ParameterSet

  constructor(parameters: ParameterSet) {
    this.parameters = parameters
  }

  /**
   * Berechnet alle Sozialversicherungsbeiträge
   * PAP-Referenz: S. 7-9 (Schritte 3.1-3.4)
   */
  calculateContributions(inputs: LohnsteuerInputs): SocialSecurityResult {
    const bruttolohn = inputs.bruttolohn || 0

    // Prüfe Minijob (≤520 EUR/Monat)
    const istMinijob =
      inputs.lohnZZ === 2 && inputs.geringfuegig === 1 && bruttolohn <= 52000

    // Prüfe Gleitzone (520-1500 EUR/Monat)
    const istGleitzone =
      inputs.lohnZZ === 2 &&
      inputs.gleitzone === 1 &&
      bruttolohn > 52000 &&
      bruttolohn <= 150000

    let rvBeitrag = 0
    let alvBeitrag = 0
    let kvBeitrag = 0
    let pvBeitrag = 0

    // === RENTENVERSICHERUNG ===
    const rv = this.calculateRV(bruttolohn, inputs.rvStatus, inputs.westOst, istMinijob)
    rvBeitrag = rv.beitrag

    // === ARBEITSLOSENVERSICHERUNG ===
    const alv = this.calculateALV(bruttolohn, istMinijob)
    alvBeitrag = alv.beitrag

    // === KRANKENVERSICHERUNG ===
    const kv = this.calculateKV(
      bruttolohn,
      inputs.kvStatus,
      inputs.kvZusatzbeitragSatz,
      istMinijob
    )
    kvBeitrag = kv.beitrag

    // === PFLEGEVERSICHERUNG ===
    const pv = this.calculatePV(
      bruttolohn,
      inputs.pvStatus,
      inputs.pvSachsenZuschlag,
      inputs.anzahlKinderfreibetraege,
      istMinijob
    )
    pvBeitrag = pv.beitrag

    const gesamtBeitrag = rvBeitrag + alvBeitrag + kvBeitrag + pvBeitrag

    return {
      rvBeitrag,
      alvBeitrag,
      kvBeitrag,
      pvBeitrag,
      gesamtBeitrag,
      details: {
        rv,
        alv,
        kv,
        pv,
      },
    }
  }

  /**
   * Rentenversicherung (RV)
   * PAP-Referenz: S. 7, Schritt 3.1
   * Rechtliche Grundlage: § 168 SGB VI
   *
   * 2026:
   * - Satz: 18,6% (9,3% AN)
   * - BBG West: 101.400 EUR
   * - BBG Ost: 107.100 EUR
   */
  private calculateRV(
    bruttolohn: number,
    rvStatus: number,
    westOst: 1 | 2,
    istMinijob: boolean
  ): any {
    const rate = this.parameters.contributions.rv.employee_percent / 100

    // Beamte/Freiberufler: Keine RV
    if (rvStatus === 9) {
      return {
        rate: 0,
        bemessungsgrenze: 0,
        beitrag: 0,
      }
    }

    // Beitragsbemessungsgrenze je nach Region
    let bbg =
      westOst === 1
        ? this.parameters.contributions.rv.bemessungsgrenzleWest
        : this.parameters.contributions.rv.bemessungsgrenzleOst

    // Minijob: Pauschal 3,6%
    if (istMinijob) {
      return {
        rate: 0.036,
        bemessungsgrenze: bruttolohn,
        beitrag: Math.round(bruttolohn * 0.036),
      }
    }

    // Normaler Beitrag: AN-Satz auf begrenzte Beiträge
    const beitragspflichtiges_einkommen = Math.min(bruttolohn, bbg)
    const beitrag = Math.round(beitragspflichtiges_einkommen * rate)

    return {
      rate: this.parameters.contributions.rv.employee_percent,
      bemessungsgrenze: bbg,
      beitrag,
    }
  }

  /**
   * Arbeitslosenversicherung (ALV)
   * PAP-Referenz: S. 7, Schritt 3.2
   * Rechtliche Grundlage: § 341 SGB III
   *
   * 2026:
   * - Satz: 2,6% (Arbeitnehmer)
   * - BBG: 101.400 EUR
   */
  private calculateALV(bruttolohn: number, istMinijob: boolean): any {
    const rate = 0.026
    const bbg = this.parameters.contributions.alv.bemessungsgrenze

    // Minijob: Pauschal 1,3%
    if (istMinijob) {
      return {
        rate: 0.013,
        bemessungsgrenze: bruttolohn,
        beitrag: Math.round(bruttolohn * 0.013),
      }
    }

    // Normaler Beitrag
    const beitragspflichtiges_einkommen = Math.min(bruttolohn, bbg)
    const beitrag = Math.round(beitragspflichtiges_einkommen * rate)

    return {
      rate: this.parameters.contributions.alv.rate_percent,
      bemessungsgrenze: bbg,
      beitrag,
    }
  }

  /**
   * Krankenversicherung (KV)
   * PAP-Referenz: S. 8, Schritt 3.3
   * Rechtliche Grundlagen: § 242 SGB V, § 242a SGB V
   *
   * 2026:
   * - Basisbeitrag: 14,0% (7,0% AN)
   * - Zusatzbeitrag: Kassenindividuell, durchschn. ~2,5%
   * - BBG: 69.750 EUR
   * - Private KV: Wird nicht berechnet (Arbeitgeber zahlt nicht)
   */
  private calculateKV(
    bruttolohn: number,
    kvStatus: number,
    zusatzbeitragSatz: number,
    istMinijob: boolean
  ): any {
    const basisbeitrag_rate =
      this.parameters.contributions.kv.employee_percent / 100
    const zusatzbeitrag_rate = zusatzbeitragSatz / 100
    const bbg = this.parameters.contributions.kv.bemessungsgrenze

    // Private KV: Keine Beiträge in dieser Berechnung
    if (kvStatus === 1) {
      return {
        rate: 0,
        zusatzbeitrag: 0,
        bemessungsgrenze: 0,
        beitrag: 0,
      }
    }

    // Minijob: Pauschal 5% (oder Befreiung, je nach Wahl)
    if (istMinijob) {
      return {
        rate: 0.05,
        zusatzbeitrag: 0,
        bemessungsgrenze: bruttolohn,
        beitrag: Math.round(bruttolohn * 0.05),
      }
    }

    // Normaler Beitrag: Basis + Zusatzbeitrag
    const beitragspflichtiges_einkommen = Math.min(bruttolohn, bbg)
    const basisbeitrag = Math.round(beitragspflichtiges_einkommen * basisbeitrag_rate)
    const zusatzbeitrag = Math.round(beitragspflichtiges_einkommen * zusatzbeitrag_rate)
    const gesamtbeitrag = basisbeitrag + zusatzbeitrag

    return {
      rate: this.parameters.contributions.kv.employee_percent + zusatzbeitragSatz,
      zusatzbeitrag: zusatzbeitragSatz,
      bemessungsgrenze: bbg,
      beitrag: gesamtbeitrag,
    }
  }

  /**
   * Pflegeversicherung (PV)
   * PAP-Referenz: S. 8, Schritt 3.4
   * Rechtliche Grundlage: § 55 SGB XI
   *
   * 2026:
   * - Basisbeitrag: 3,6% (1,8% AN)
   * - Zuschlag kinderlos (ab 23, ohne Kinder): +0,6%
   * - Abschlag pro Kind: -0,25% je Kind
   * - Sachsen-Zuschlag: +0,75%
   * - Kein Minijob-Special (regulärer Beitrag)
   */
  private calculatePV(
    bruttolohn: number,
    pvStatus: number,
    sachsenZuschlag: 0 | 1,
    anzahlKinder: number,
    istMinijob: boolean
  ): any {
    let basis_rate = this.parameters.contributions.pv.basis_rate_percent / 100

    // Zuschlag für kinderlos (PVStatus = 0: Mit Zuschlag)
    let zuschlag_kinderlos = 0
    if (pvStatus === 0) {
      // Zuschlag nur ab bestimmtem Alter (vereinfacht: immer wenn kinderlos)
      zuschlag_kinderlos =
        this.parameters.contributions.pv.zuschlag_kinderlos / 100
    }

    // Abschlag pro Kind
    const abschlag_kinder =
      (anzahlKinder *
        this.parameters.contributions.pv.abschlag_pro_kind) /
      100

    // Sachsen-Zuschlag
    const sachsen_extra =
      sachsenZuschlag === 1
        ? this.parameters.contributions.pv.sachsen_zuschlag / 100
        : 0

    // Gesamtrate
    const gesamt_rate = basis_rate + zuschlag_kinderlos - abschlag_kinder + sachsen_extra

    // Minijob: Regulärer Beitrag (nicht pauschal wie RV/ALV)
    const beitragspflichtiges_einkommen = bruttolohn // Kein BBG für PV

    // Aber: Minijob kann von KV befreit sein -> dann auch KV-frei
    const beitrag = istMinijob
      ? 0 // Wenn Minijob mit KV-Befreiung
      : Math.round(beitragspflichtiges_einkommen * gesamt_rate)

    return {
      rate: gesamt_rate * 100,
      zuschlag_kinderlos: zuschlag_kinderlos * 100,
      abschlag_kinder: abschlag_kinder * 100,
      sachsen_zuschlag: sachsen_extra * 100,
      bemessungsgrenze: null, // Keine BBG für PV
      beitrag,
    }
  }

  /**
   * Gibt die Kontributionslimits für ein Jahr
   */
  getContributionLimits(): {
    rv_west: number
    rv_ost: number
    alv: number
    kv: number
  } {
    return {
      rv_west: this.parameters.contributions.rv.bemessungsgrenzleWest,
      rv_ost: this.parameters.contributions.rv.bemessungsgrenzleOst,
      alv: this.parameters.contributions.alv.bemessungsgrenze,
      kv: this.parameters.contributions.kv.bemessungsgrenze,
    }
  }

  /**
   * Formatiert EUR-Wert zum Anzeigen
   */
  static formatEUR(cent: number): string {
    const eur = cent / 100
    return eur.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}
