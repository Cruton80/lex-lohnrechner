/**
 * Zentrale Type-Definitionen für Lohnsteuerberechnung
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Lohnzahlungszeitraum (Zeitraum)
 * PAP: LZZ - Lohnzahlungszeitraum
 * 1 = Jahr, 2 = Monat, 3 = Woche, 4 = Tag
 */
export type LohnzahlungsZeitraum = 1 | 2 | 3 | 4

/**
 * Lohnsteuerklasse
 * PAP: STKL - Lohnsteuerklasse nach § 38b EStG
 */
export type Steuerklasse = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Rentenversicherungsstatus
 * 0 = Gesetzlich versichert
 * 9 = Beamte/Freiberufler (keine RV-Pflicht)
 */
export type RVStatus = 0 | 9

/**
 * Krankenversicherungsstatus
 * 0 = Gesetzlich, 1 = Privat
 */
export type KVStatus = 0 | 1

/**
 * Pflegeversicherungsstatus
 * 0 = Mit Zuschlag, 1 = Ohne Zuschlag (kinderlos/über 23 ohne Kinder)
 */
export type PVStatus = 0 | 1

/**
 * Vollständige Eingabe für Lohnsteuerberechnung
 * Entspricht PAP-Eingabeparametern
 */
export interface LohnsteuerInputs {
  // Zeitraum & Steuerklasse
  lohnZZ: LohnzahlungsZeitraum
  stkl: Steuerklasse
  faktor?: number  // Nur bei STKL IV

  // Einkommen
  bruttolohn: number  // EUR in Cent (z.B. 200000 = 2.000,00 EUR)
  freibetrag?: number  // Optional Freibetrag

  // Versicherungen
  rvStatus: RVStatus
  kvStatus: KVStatus
  kvMonatsbeitrag?: number  // Monatsbeitrag in Cent
  kvZusatzbeitragSatz: number  // Prozentsatz (z.B. 2.5)
  pvStatus: PVStatus
  pvSachsenZuschlag: 0 | 1

  // Familie
  anzahlKinderfreibetraege: number

  // Zusätzliche Einkünfte
  sonstigeBezuege?: number  // EUR Cent
  mehrjahrigeBezuege?: number
  abfindung?: number

  // Prognose
  voraussichtlichesJahresbrutto?: number

  // Konfiguration
  westOst: 1 | 2  // 1 = West, 2 = Ost
  geringfuegig: 0 | 1  // Minijob
  gleitzone: 0 | 1

  // Geburtsjahr für Altersentlastung (§ 24a EStG)
  geburtsjahr?: number
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Berechnungsergebnis für Lohnsteuer
 */
export interface TaxResult {
  lstlzz: number  // Lohnsteuer für LZZ in EUR Cent
  solzlzz: number  // Solidaritätszuschlag in EUR Cent
  kist8lzz: number  // Kirchensteuer 8% in EUR Cent
  kist9lzz: number  // Kirchensteuer 9% in EUR Cent

  // Abgeleitete Werte
  durchschnittsbelastung: {
    lst: number  // Prozentsatz
    lstMitSolz: number
    lstMitKst8: number
    lstMitKst9: number
  }

  // Sozialversicherung
  rvBeitrag: number
  alvBeitrag: number
  kvBeitrag: number
  pvBeitrag: number

  // Audit-Info
  auditTraceId?: string
  calculatedAt: Date
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validierungsergebnis für Input
 */
export interface ValidationError {
  field: keyof LohnsteuerInputs
  message: string
  pap_reference?: string  // PAP-Quellenangabe
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ============================================================================
// PARAMETER TYPES
// ============================================================================

/**
 * Tarifparameter für ein Steuerjahr
 */
export interface TarifParameter {
  jahr: number
  grundfreibetrag: number
  spitzensteuersatzGrenze: number
  spitzensteuersatzProzent: number
  formeln: {
    zoneA: { min: number; max: number }
    zoneB: { min: number; max: number }
    zoneC: { min: number; max: number }
    zoneD: { min: number }
  }
  pap_pages: string
}

/**
 * Beitragssatz-Parameter
 */
export interface ContributionParameters {
  rv: {
    rate_percent: number
    employee_percent: number
    bemessungsgrenzleWest: number
    bemessungsgrenzleOst: number
  }
  alv: {
    rate_percent: number
    bemessungsgrenze: number
  }
  kv: {
    basis_rate_percent: number
    employee_percent: number
    bemessungsgrenze: number
    zusatzbeitrag_avg: number
  }
  pv: {
    basis_rate_percent: number
    zuschlag_kinderlos: number
    abschlag_pro_kind: number
    sachsen_zuschlag: number
  }
}

/**
 * Vollständiger Parametersatz für ein Jahr
 */
export interface ParameterSet {
  version: string
  jahr: number
  valid_from: string
  valid_to: string
  pap_reference: string
  pap_publication_date: string
  tariff: TarifParameter
  contributions: ContributionParameters
  solidarity: {
    rate_percent: number
    freigrenze: number
  }
  special_cases: {
    minijob_limit: number
    gleitzone_lower: number
    gleitzone_upper: number
  }
}

// ============================================================================
// REFERENCE TYPES
// ============================================================================

/**
 * PAP-Quellenangabe für eine Berechnung
 */
export interface PAPReference {
  function: string
  description: string
  pap_page: number
  pap_steps?: string
  law: string
  source_file: string
  key_formulas?: string[]
  note?: string
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * Audit-Log Eintrag für eine Berechnung
 */
export interface AuditEntry {
  timestamp: Date
  step: string
  inputs: Record<string, any>
  output: number | Record<string, number>
  pap_reference: string
  calculation_id: string
}

/**
 * Vollständiges Audit-Trail
 */
export interface AuditTrail {
  calculation_id: string
  user_inputs: LohnsteuerInputs
  started_at: Date
  completed_at: Date
  entries: AuditEntry[]
}
