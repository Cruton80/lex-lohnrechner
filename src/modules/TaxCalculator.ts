/**
 * TaxCalculator-Modul
 * Lohnsteuerberechnung nach PAP 2026 und § 32a EStG
 *
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf, S. 10-17
 * Rechtliche Grundlage: § 39b EStG (Lohnsteuerabzug), § 32a EStG (Tarif)
 *
 * KRITISCH: Diese Berechnung muss zu 100% korrekt sein!
 * Alle Werte in EUR-Cent (z.B. 200000 = 2.000,00 EUR)
 */

import type {
  LohnsteuerInputs,
  TaxResult,
  ParameterSet,
  AuditEntry,
} from '../types/index.js'

export interface TaxCalculationStep {
  name: string
  value: number
  pap_page: number
  pap_step: string
  formula?: string
}

export class TaxCalculator {
  private parameters: ParameterSet
  private auditSteps: TaxCalculationStep[] = []

  constructor(parameters: ParameterSet) {
    this.parameters = parameters
  }

  /**
   * Hauptmethode: Berechnet Lohnsteuer für ein Einkommen
   * PAP-Referenz: S. 10-17 (Schritte 1-8)
   *
   * @returns Lohnsteuer in EUR-Cent (gerundet)
   */
  calculateTaxes(inputs: LohnsteuerInputs): TaxResult {
    this.auditSteps = [] // Reset für neue Berechnung

    // Schritt 1: Bruttolohn normalisieren
    let bruttolohn = inputs.bruttolohn || 0
    this.logStep('Bruttolohn (RE4)', bruttolohn, 1, '1.0', 'Eingabewert')

    // Schritt 2: Freibetrag abziehen
    const freibetrag = inputs.freibetrag || 0
    bruttolohn = Math.max(0, bruttolohn - freibetrag)
    if (freibetrag > 0) {
      this.logStep(
        'Nach Freibetrag-Abzug',
        bruttolohn,
        1,
        '1.1',
        'RE4 - LZZFREIB'
      )
    }

    // Schritt 3: Kinderfreibetrag (einmalig pro Jahr, für LZZ ggf. anteilig)
    let zuVersteuerndesEinkommen = bruttolohn
    const kfbAbzug = this.calculateChildAllowanceDeduction(
      inputs.anzahlKinderfreibetraege || 0,
      inputs.lohnZZ
    )
    zuVersteuerndesEinkommen = Math.max(0, zuVersteuerndesEinkommen - kfbAbzug)
    if (kfbAbzug > 0) {
      this.logStep(
        'Nach Kinderfreibetrag',
        zuVersteuerndesEinkommen,
        10,
        '4.1',
        'KFB-Abzug für ZKF'
      )
    }

    // Schritt 4: Sonstige Bezüge (Sonderzahlungen)
    const sonstBez = inputs.sonstigeBezuege || 0
    zuVersteuerndesEinkommen += sonstBez
    if (sonstBez > 0) {
      this.logStep(
        'Nach Sonderzahlungen',
        zuVersteuerndesEinkommen,
        10,
        '4.2',
        'SONSTB addiert'
      )
    }

    // Schritt 5: Abfindungen (Fünftel-Regelung § 34 EStG)
    let lstAufAbfindung = 0
    if ((inputs.abfindung || 0) > 0) {
      lstAufAbfindung = this.calculateAbfindungsTax(
        zuVersteuerndesEinkommen,
        inputs.abfindung!,
        inputs.stkl
      )
      this.logStep(
        'Lohnsteuer auf Abfindung (Fünftel-Regelung)',
        lstAufAbfindung,
        10,
        '4.3',
        '§ 34 EStG'
      )
    }

    // Schritt 6: Altersentlastung (§ 24a EStG)
    let altersentlastung = 0
    if (inputs.geburtsjahr) {
      altersentlastung = this.calculateAltersEntlastung(
        zuVersteuerndesEinkommen,
        inputs.geburtsjahr
      )
      if (altersentlastung > 0) {
        zuVersteuerndesEinkommen = Math.max(
          0,
          zuVersteuerndesEinkommen - altersentlastung
        )
        this.logStep(
          'Nach Altersentlastung (§ 24a EStG)',
          zuVersteuerndesEinkommen,
          11,
          '5.1',
          'AJAHR-basiert'
        )
      }
    }

    // Schritt 7: Tarifberechnung (Kernberechnung!)
    const lstZuVersteuer = this.calculateTariff(
      zuVersteuerndesEinkommen,
      inputs.stkl,
      inputs.faktor || 1
    )
    this.logStep(
      'Lohnsteuer aus Tarif (§ 32a EStG)',
      lstZuVersteuer,
      12,
      '6.0',
      'Tarifberechnung'
    )

    // Schritt 8: Solidaritätszuschlag (5,5% mit Freigrenze)
    const solz = this.calculateSolidarity(lstZuVersteuer)
    this.logStep('Solidaritätszuschlag (5,5%)', solz, 16, '7.0', '§ 5 SolzG')

    // Schritt 9: Kirchensteuer (8% oder 9%)
    const kist8 = this.calculateChurchTax(lstZuVersteuer, 0.08)
    const kist9 = this.calculateChurchTax(lstZuVersteuer, 0.09)
    if (kist8 > 0) {
      this.logStep('Kirchensteuer 8%', kist8, 17, '8.1', '§ 51a EStG')
    }

    // Finales Ergebnis zusammenfassen
    const result: TaxResult = {
      lstlzz: lstZuVersteuer,
      solzlzz: solz,
      kist8lzz: kist8,
      kist9lzz: kist9,
      durchschnittsbelastung: {
        lst: bruttolohn > 0 ? (lstZuVersteuer / bruttolohn) * 100 : 0,
        lstMitSolz:
          bruttolohn > 0 ? ((lstZuVersteuer + solz) / bruttolohn) * 100 : 0,
        lstMitKst8:
          bruttolohn > 0
            ? ((lstZuVersteuer + solz + kist8) / bruttolohn) * 100
            : 0,
        lstMitKst9:
          bruttolohn > 0
            ? ((lstZuVersteuer + solz + kist9) / bruttolohn) * 100
            : 0,
      },
      rvBeitrag: 0, // Wird von SocialSecurityCalculator berechnet
      alvBeitrag: 0,
      kvBeitrag: 0,
      pvBeitrag: 0,
      auditTraceId: this.generateAuditId(),
      calculatedAt: new Date(),
    }

    this.logStep(
      'Finale Lohnsteuer',
      result.lstlzz,
      17,
      '9.0',
      'Ergebnis'
    )

    return result
  }

  /**
   * Berechnet Tarifsteuer nach § 32a EStG (Einkommensteuertarif 2026)
   * PAP-Referenz: S. 12-13, Schritte 6.1-6.3
   *
   * Zone A: 0 bis 11.600 EUR - Befreit
   * Zone B: 11.600 bis 62.810 EUR - Progressive Besteuerung
   * Zone C: 62.810 bis 186.000 EUR - 42%
   * Zone D: > 186.000 EUR - 45%
   */
  private calculateTariff(
    zu_versteuerndes_einkommen: number,
    stkl: number,
    faktor: number = 1
  ): number {
    const t = this.parameters.tariff

    // Umrechnung in EUR für Tarifberechnung
    const eink_eur = zu_versteuerndes_einkommen / 100

    let lst_eur = 0

    // Zone A: Grundfreibetrag
    if (eink_eur <= t.grundfreibetrag / 100) {
      lst_eur = 0
    }
    // Zone B: Progressive Besteuerung
    else if (eink_eur <= t.spitzensteuersatz_ab / 100) {
      // Formel B: (889,75 * y + 18,90) * y
      // wobei y = (zu_versteuerndes_einkommen - Grundfreibetrag) / 10000
      const y = (eink_eur - t.grundfreibetrag / 100) / 100
      lst_eur = (889.75 * y + 18.9) * y
    }
    // Zone C: 42% + Abzug
    else if (eink_eur <= 186000) {
      // Formel C: 0,42 * zu_versteuerndes_einkommen - 9972,96
      lst_eur = 0.42 * eink_eur - 9972.96
    }
    // Zone D: 45% + Abzug
    else {
      // Formel D: 0,45 * zu_versteuerndes_einkommen - 17602,60
      lst_eur = 0.45 * eink_eur - 17602.6
    }

    // STKL-Besonderheiten
    switch (stkl) {
      case 2: // Alleinerziehend
        lst_eur -= 220 // Entlastungsbetrag § 24b EStG
        break
      case 3: // Verheiratet (zusammen)
        // Verfahren: Mit Ehegatten-Einkommen, hier nur zur Info
        break
      case 4: // Verheiratet (einzeln)
        // Faktor-Anwendung
        lst_eur = lst_eur * faktor
        break
    }

    // Auf Cent runden
    const lst_cent = Math.round(lst_eur * 100)

    // Steuer kann nie negativ sein
    return Math.max(0, lst_cent)
  }

  /**
   * Berechnet Kinderfreibetrag-Abzug
   * PAP-Referenz: S. 10, Schritt 4.1
   * 2026: 2 x 230 EUR/Monat = 5.520 EUR/Jahr = 460 EUR/Monat
   */
  private calculateChildAllowanceDeduction(
    anzahlKinder: number,
    lohnZZ: number
  ): number {
    if (anzahlKinder === 0) return 0

    const KFB_PRO_KIND_MONATLICH = 46000 // EUR in Cent
    const KFB_PRO_KIND_JÄHRLICH = 552000

    switch (lohnZZ) {
      case 1: // Jährlich
        return anzahlKinder * KFB_PRO_KIND_JÄHRLICH
      case 2: // Monatlich
        return anzahlKinder * KFB_PRO_KIND_MONATLICH
      case 3: // Wöchentlich
        return Math.round((anzahlKinder * KFB_PRO_KIND_JÄHRLICH) / 52)
      case 4: // Täglich
        return Math.round((anzahlKinder * KFB_PRO_KIND_JÄHRLICH) / 365)
      default:
        return 0
    }
  }

  /**
   * Altersentlastung nach § 24a EStG
   * PAP-Referenz: S. 11, Schritt 5.1
   *
   * Staffelung nach Geburtsjahr:
   * - <= 1962: 40% (max 76.200 EUR)
   * - 1963-1972: Abnehmend 38% bis 5%
   * - >= 1973: 0%
   */
  private calculateAltersEntlastung(
    einkommen: number,
    geburtsjahr: number
  ): number {
    const currentYear = new Date().getFullYear()
    const alter = currentYear - geburtsjahr

    // Altersentlastung nur ab 64 Jahren
    if (alter < 64) return 0

    let prozentsatz = 0

    if (geburtsjahr <= 1962) {
      prozentsatz = 0.4 // 40%
    } else if (geburtsjahr === 1963) {
      prozentsatz = 0.38
    } else if (geburtsjahr === 1964) {
      prozentsatz = 0.36
    } else if (geburtsjahr === 1965) {
      prozentsatz = 0.34
    } else if (geburtsjahr === 1966) {
      prozentsatz = 0.32
    } else if (geburtsjahr === 1967) {
      prozentsatz = 0.30
    } else if (geburtsjahr === 1968) {
      prozentsatz = 0.28
    } else if (geburtsjahr === 1969) {
      prozentsatz = 0.26
    } else if (geburtsjahr === 1970) {
      prozentsatz = 0.24
    } else if (geburtsjahr === 1971) {
      prozentsatz = 0.22
    } else if (geburtsjahr === 1972) {
      prozentsatz = 0.2
    }
    // 1973 und später: 0%

    // Höchstbetrag: 40% von 190.500 EUR = 76.200 EUR (2026)
    const maxBetrag = 7620000 // EUR in Cent
    const berechneterBetrag = Math.round(einkommen * prozentsatz)

    return Math.min(berechneterBetrag, maxBetrag)
  }

  /**
   * Abfindungen mit Fünftel-Regelung
   * PAP-Referenz: S. 10, Schritt 4.3
   * Rechtliche Grundlage: § 34 EStG
   *
   * Methode:
   * 1. Steuer auf (RE4 + 1/5 Entschädigung)
   * 2. Minus 4x Steuer auf RE4
   * 3. = Steuer auf Entschädigung
   */
  private calculateAbfindungsTax(
    einkommen: number,
    abfindung: number,
    stkl: number
  ): number {
    const einkommen_plus_ein_fuentel = einkommen + abfindung / 5

    const steuer_mit_abfindung = this.calculateTariff(
      einkommen_plus_ein_fuentel,
      stkl
    )
    const steuer_ohne_abfindung = this.calculateTariff(einkommen, stkl)

    // Differenz = Steuer auf 1/5 Abfindung
    const steuer_ein_fuentel = steuer_mit_abfindung - steuer_ohne_abfindung

    // Gesamtsteuer auf Abfindung = 5x Steuer auf 1/5
    return steuer_ein_fuentel * 5
  }

  /**
   * Solidaritätszuschlag (5,5%)
   * PAP-Referenz: S. 16, Schritt 7.1
   * Rechtliche Grundlage: § 5 SolzG
   *
   * 2026: Freigrenze 20.350 EUR (erhöht durch SteFeG)
   * SZ = 5,5% auf LSt wenn LSt > Freigrenze, sonst 0
   */
  private calculateSolidarity(lstBetrag: number): number {
    const freigrenze = this.parameters.solidarity.freigrenze
    const rate = this.parameters.solidarity.rate_percent / 100

    if (lstBetrag <= freigrenze) {
      return 0
    }

    return Math.round(lstBetrag * rate)
  }

  /**
   * Kirchensteuer
   * PAP-Referenz: S. 17, Schritte 8.1-8.2
   * Rechtliche Grundlage: § 51a EStG
   *
   * Wird nur berechnet, wenn Religionszugehörigkeit erfasst
   * 8% in den meisten Bundesländern, 9% in Baden-Württemberg & Bayern
   */
  private calculateChurchTax(lstBetrag: number, rate: number): number {
    if (lstBetrag === 0) return 0
    return Math.round(lstBetrag * rate)
  }

  /**
   * Hilfsfunktion: Loggt einen Berechnungsschritt
   */
  private logStep(
    name: string,
    value: number,
    pap_page: number,
    pap_step: string,
    formula?: string
  ): void {
    this.auditSteps.push({
      name,
      value,
      pap_page,
      pap_step,
      formula,
    })
  }

  /**
   * Gibt den Audit-Trail aus
   */
  getAuditTrail(): TaxCalculationStep[] {
    return [...this.auditSteps]
  }

  /**
   * Generiert eindeutige ID für Audit-Nachverfolgung
   */
  private generateAuditId(): string {
    return `TAX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
