/**
 * LohnsteuerEngine - Komplette, korrekte Lohnsteuerberechnung
 *
 * KONVENTION: ALLE Werte intern in EUR (nicht Cent!)
 * Eingabe: EUR, Ausgabe: EUR
 *
 * PAP 2026 - Stand 12.11.2025
 * Rechtsgrundlagen: § 32a EStG, § 39b EStG, SGB V/VI/XI/III
 */

export type LohnZZ = 1 | 2 | 3 | 4 // 1=jährlich, 2=monatlich, 3=wöchentlich, 4=täglich
export type Steuerklasse = 1 | 2 | 3 | 4 | 5 | 6
export type Region = 'west' | 'ost'

export interface LohnsteuerEingabe {
  bruttolohn: number       // EUR im jeweiligen LZZ
  lohnZZ: LohnZZ
  steuerklasse: Steuerklasse
  freibetrag?: number      // EUR im jeweiligen LZZ
  kinderfreibetraege: number
  geburtsjahr?: number
  rvVersichert: boolean
  kvGesetzlich: boolean
  kvZusatzbeitragProzent: number  // z.B. 2.5
  pvKinderlos: boolean     // Zuschlag für Kinderlose ab 23 J.
  pvSachsenZuschlag: boolean
  westOst: Region
  kirchensteuer: boolean
  kirchensteuerSatz?: number  // 8 oder 9 Prozent (default: 9)
  // PAP § 39b: Erweiterte Parameter
  vJBrutto?: number        // Voraussichtliches Jahresbrutto (JRE4) – wenn abweichend vom hochgerechneten LZZ
  sonsteBezuege?: number   // Sonstige Bezüge Jahresbetrag (SONSTB): Weihnachtsgeld, Prämien etc.
  // Stage 2: zusätzliche PAP-Parameter
  faktor4?: number         // Faktor STKL IV (F, 0 < F ≤ 1,0 — nur relevant bei Steuerklasse IV)
  kvMonatsbeitragPKV?: number  // KV+PV Monatsbeitrag (VKV) bei privater Krankenversicherung
  // Stage 3: Beschäftigungsform (Excel E34/E35)
  minijob?: boolean            // Geringfügige Beschäftigung § 40a EStG (gering E34)
  gleitzone?: boolean          // Übergangsbereich/Midijob § 20 SGB IV (gleit E35)
  // Stage 3: Außerordentliche Einkünfte § 34 EStG (Excel E19/E20)
  abfindung?: number           // Abfindung/Entschädigung § 24 Nr. 1 EStG (SONSTENT E20)
  mehrjBezuege?: number        // Mehrjährige Bezüge § 34 Abs. 2 Nr. 4 EStG (mehrjBez E19)
}

// Fünftelregelung § 34 EStG (Abfindung / Mehrjährige Bezüge)
export interface AbfindungErgebnis {
  betrag: number              // Gesamtbetrag Abfindung + MehrjBez
  jre4: number                // JRE4 Basis
  lstBasis: number            // LSt auf JRE4 allein
  lstFuenftelzusatz: number   // LSt-Zuwachs durch + 1/5 Abfindung
  lstAbfindung: number        // lstFuenftelzusatz × 5
  solz: number
  kirchensteuer: number
  gesamtAbzuege: number
  effektiverSteuersatz: number // % (gesamtAbzuege / betrag)
}

// Midijob/Übergangsbereich § 20 SGB IV
export interface MidijobInfo {
  bruttolohnMt: number        // Tatsächliches Monatsentgelt
  g1: number                  // Minijob-Grenze
  g2: number                  // Midijob-Obergrenze
  faktorF: number             // Übergangsbereich-Faktor
  bpeJahr: number             // Beitragspflichtige Einnahme AN (Jahr)
  svReduktionJahr: number     // Ersparnis gegenüber voller SV (Jahr)
}

// Grenzsteuersatz (analog AMLohnAbgabenLast() in Excel)
export interface GrenzsteuersatzInfo {
  delta: number               // Zuwachsbetrag (100 EUR/Jahr)
  grenzsteuersatzLst: number  // % Lohnsteuer auf nächste 100 EUR
  grenzsteuersatzSV: number   // % Sozialversicherung auf nächste 100 EUR
  grenzsteuersatzGesamt: number // % Gesamtbelastung auf nächste 100 EUR
}

export interface SonsteBezuegErgebnis {
  betrag: number            // SONSTB Betrag (Jahreswert)
  jre4: number              // JRE4 Basis (Jahresbrutto ohne SONSTB)
  lstBasis: number          // LSt auf JRE4 allein (Vergleichsbasis)
  lstMitSonstb: number      // LSt auf JRE4 + SONSTB
  lohnsteuer: number        // Differenz = LSt auf SONSTB
  solz: number              // SolZ auf SONSTB
  kirchensteuer: number     // KiSt auf SONSTB
  gesamtAbzuege: number     // Summe Steuer-Abzüge auf SONSTB
}

export interface LohnsteuerErgebnis {
  // Eingabe (zum Vergleich)
  bruttolohn: number
  lohnZZ: LohnZZ
  zeitraum: string

  // Steuern (laufendes Gehalt)
  lohnsteuer: number
  solidaritaetszuschlag: number
  kirchensteuer: number

  // Sozialversicherung (Arbeitnehmeranteil)
  rentenversicherung: number
  arbeitslosenversicherung: number
  krankenversicherung: number
  pflegeversicherung: number

  // Summen
  gesamtAbzuege: number
  netto: number
  belastungsquote: number  // %

  // Detailinformationen (alles im aktuellen LZZ)
  details: {
    zuVersteuerndesEinkommen: number
    grundfreibetrag: number
    kinderfreibetragGesamt: number
    rvBemessungsgrenze: number
    kvBemessungsgrenze: number
    solzFreigrenze: number
    pvSatzAN: number     // %
    kvSatzAN: number     // % inkl. Zusatzbeitrag
    rvSatzAN: number     // %
    alvSatzAN: number    // %
    tarifZone: 'A' | 'B' | 'C' | 'D'
    altersentlastungsbetrag: number   // 0 wenn nicht zutreffend
    pkvVorsorgepauschale: number      // 0 bei gesetzlicher KV
    faktor4Angewandt: number          // 1.0 wenn kein Faktor
  }

  // Sonstige Bezüge (Einmalzahlungen, nur wenn eingegeben)
  sonsteBezuege?: SonsteBezuegErgebnis
  // Stage 3
  abfindung?: AbfindungErgebnis
  isMinijob: boolean
  isMidijob: boolean
  midijobInfo?: MidijobInfo
  grenzsteuersatz: GrenzsteuersatzInfo

  // Audit-Schritte
  schritte: BerechnungsSchritt[]
}

export interface BerechnungsSchritt {
  nr: number
  titel: string
  beschreibung: string
  formel?: string
  eingabe: string
  ergebnis: string
  papReferenz: string
}

// ============================================================================
// PAP 2026 PARAMETER (Jahres-Werte in EUR!)
// ============================================================================

export interface ParameterJahr {
  jahr: number
  // Tarif (Jahreswerte in EUR)
  grundfreibetrag: number
  zoneB_max: number
  zoneC_max: number
  // Solidaritätszuschlag (Jahreswert in EUR)
  solzFreigrenze: number
  // Kinderfreibetrag (Jahreswert in EUR pro Kind)
  kinderfreibetragJahr: number
  // Sozialversicherung (Sätze in %)
  rvSatzGesamt: number
  alvSatzGesamt: number
  kvBasisSatzGesamt: number
  pvBasisSatzGesamt: number
  pvZuschlagKinderlos: number   // Zusatz für AN
  pvAbschlagProKind: number     // Abzug pro Kind ab 2. Kind, max 4 Kinder
  pvSachsenZuschlag: number     // AN-Zuschlag in Sachsen
  // Beitragsbemessungsgrenzen (Jahreswerte in EUR)
  rvBbgWest: number
  rvBbgOst: number
  alvBbg: number
  kvBbg: number
  // Pauschbeträge (Jahreswerte EUR)
  werbungskostenPauschale: number
  sonderausgabenPauschale: number
  // Stage 3: Minijob / Übergangsbereich (§ 8 / § 20 SGB IV)
  minijobGrenzeMt: number    // Monatsgrenze geringfügige Beschäftigung (EUR)
  midijobGrenzeMt: number    // Obere Grenze Übergangsbereich (EUR)
  midijobFaktorF: number     // AN-SV-Reduktionsfaktor im Übergangsbereich
}

export const PAP_2026: ParameterJahr = {
  jahr: 2026,
  grundfreibetrag: 11600,
  zoneB_max: 17005,   // Ende 1. Progressionszone (PAP 2026, Anlage 1)
  zoneC_max: 66760,   // Ende 2. Progressionszone / Beginn Linear-42%
  solzFreigrenze: 20350,    // ab dieser Lohnsteuer SolZ fällig
  kinderfreibetragJahr: 5520,
  rvSatzGesamt: 18.6,
  alvSatzGesamt: 2.6,
  kvBasisSatzGesamt: 14.0,
  pvBasisSatzGesamt: 3.6,
  pvZuschlagKinderlos: 0.6,
  pvAbschlagProKind: 0.25,
  pvSachsenZuschlag: 0.5,   // Sachsen: AN trägt 0,5% mehr (Bundesfeiertag)
  rvBbgWest: 101400,
  rvBbgOst: 107100,
  alvBbg: 101400,
  kvBbg: 69750,
  werbungskostenPauschale: 1230,  // § 9a EStG (Arbeitnehmer-Pauschbetrag)
  sonderausgabenPauschale: 36,    // § 10c EStG
  minijobGrenzeMt: 556,
  midijobGrenzeMt: 2000,
  midijobFaktorF: 0.6846,
}

export const PAP_2025: ParameterJahr = {
  jahr: 2025,
  grundfreibetrag: 11460,
  zoneB_max: 16305,   // Ende 1. Progressionszone 2025 (annähernd)
  zoneC_max: 62810,   // Ende 2. Progressionszone 2025
  solzFreigrenze: 16956,
  kinderfreibetragJahr: 5480,
  rvSatzGesamt: 18.6,
  alvSatzGesamt: 2.6,
  kvBasisSatzGesamt: 14.6,
  pvBasisSatzGesamt: 3.6,
  pvZuschlagKinderlos: 0.6,
  pvAbschlagProKind: 0.25,
  pvSachsenZuschlag: 0.5,
  rvBbgWest: 96600,
  rvBbgOst: 96600,
  alvBbg: 96600,
  kvBbg: 66150,
  werbungskostenPauschale: 1230,
  sonderausgabenPauschale: 36,
  minijobGrenzeMt: 556,
  midijobGrenzeMt: 2000,
  midijobFaktorF: 0.6846,
}

export const PAP_2027: ParameterJahr = {
  ...PAP_2026,
  jahr: 2027,
  grundfreibetrag: 11604, // Vorlage
}

// ============================================================================
// ALTERSENTLASTUNGSBETRAG (§ 24a EStG)
// ============================================================================

// Anlage 2 PAP: Prozentsatz und Höchstbetrag je Kohorte (Jahr des 64. Geburtstags)
const ALT_ENTLASTUNG: Record<number, { prozent: number; max: number }> = {
  2005: { prozent: 40.0, max: 1900 },
  2006: { prozent: 38.4, max: 1824 },
  2007: { prozent: 36.8, max: 1748 },
  2008: { prozent: 35.2, max: 1672 },
  2009: { prozent: 33.6, max: 1596 },
  2010: { prozent: 32.0, max: 1520 },
  2011: { prozent: 30.4, max: 1444 },
  2012: { prozent: 28.8, max: 1368 },
  2013: { prozent: 27.2, max: 1292 },
  2014: { prozent: 25.6, max: 1216 },
  2015: { prozent: 24.0, max: 1140 },
  2016: { prozent: 22.4, max: 1064 },
  2017: { prozent: 20.8, max:  988 },
  2018: { prozent: 19.2, max:  912 },
  2019: { prozent: 17.6, max:  836 },
  2020: { prozent: 16.0, max:  760 },
  2021: { prozent: 15.2, max:  722 },
  2022: { prozent: 14.4, max:  684 },
  2023: { prozent: 13.6, max:  646 },
  2024: { prozent: 12.8, max:  608 },
  2025: { prozent: 12.0, max:  570 },
  2026: { prozent: 11.2, max:  532 },
  2027: { prozent: 10.4, max:  494 },
  2028: { prozent:  9.6, max:  456 },
  2029: { prozent:  8.8, max:  418 },
  2030: { prozent:  8.0, max:  380 },
  2031: { prozent:  7.2, max:  342 },
  2032: { prozent:  6.4, max:  304 },
  2033: { prozent:  5.6, max:  266 },
  2034: { prozent:  4.8, max:  228 },
  2035: { prozent:  4.0, max:  190 },
  2036: { prozent:  3.2, max:  152 },
  2037: { prozent:  2.4, max:  114 },
  2038: { prozent:  1.6, max:   76 },
  2039: { prozent:  0.8, max:   38 },
  2040: { prozent:  0.0, max:    0 },
}

/**
 * Berechnet den Altersentlastungsbetrag (§ 24a EStG, PAP Anlage 2).
 * Basis: Bruttolohn (Jahreswert). Qualifikation: Alter ≥ 64 im Steuerjahr.
 */
export function altersentlastungsbetragJahr(
  bruttoJahr: number,
  geburtsjahr: number,
  steuerjahr: number
): { betrag: number; prozent: number; max: number } {
  if (steuerjahr - geburtsjahr < 64) return { betrag: 0, prozent: 0, max: 0 }

  const year64 = geburtsjahr + 64
  // Kohortenjahr: frühestens 2005 (max. Satz), spätestens 2040 (dann 0%)
  const cohortYear = Math.min(Math.max(year64, 2005), 2040)
  const e = ALT_ENTLASTUNG[cohortYear] ?? { prozent: 0, max: 0 }

  const betrag = Math.min(Math.floor(bruttoJahr * e.prozent / 100), e.max)
  return { betrag, prozent: e.prozent, max: e.max }
}

// ============================================================================
// HELPER: Lohnzahlungszeitraum-Konvertierung
// ============================================================================

const LZZ_FAKTOREN: Record<LohnZZ, number> = {
  1: 1,        // jährlich
  2: 12,       // monatlich
  3: 52,       // wöchentlich (52,18 streng genommen)
  4: 360,      // täglich (PAP rechnet mit 360 Tagen)
}

const LZZ_NAMEN: Record<LohnZZ, string> = {
  1: 'jährlich',
  2: 'monatlich',
  3: 'wöchentlich',
  4: 'täglich',
}

/** Konvertiert einen Wert im LZZ in einen Jahreswert */
export function aufJahr(wert: number, lzz: LohnZZ): number {
  return wert * LZZ_FAKTOREN[lzz]
}

/** Konvertiert einen Jahreswert in den LZZ */
export function vonJahr(wert: number, lzz: LohnZZ): number {
  return wert / LZZ_FAKTOREN[lzz]
}

/** Gibt den Namen des Lohnzahlungszeitraums zurück */
export function lzzName(lzz: LohnZZ): string {
  return LZZ_NAMEN[lzz]
}

/** Gibt den nächst höheren LZZ zurück (z.B. monatlich → jährlich) */
export function naechsterLzz(lzz: LohnZZ): LohnZZ | null {
  if (lzz === 4) return 3  // täglich → wöchentlich
  if (lzz === 3) return 2  // wöchentlich → monatlich
  if (lzz === 2) return 1  // monatlich → jährlich
  return null              // jährlich hat keinen höheren
}

// ============================================================================
// CORE: Tarifberechnung nach § 32a EStG (immer auf Jahresbasis!)
// ============================================================================

/**
 * Berechnet die Einkommensteuer (Jahreswert) nach § 32a EStG für 2026
 * Eingabe: zu_versteuerndes_einkommen (Jahres-EUR)
 * Ausgabe: Einkommensteuer (Jahres-EUR)
 *
 * Zone A: 0 - 11.600 EUR        → 0 EUR
 * Zone B: 11.600 - 17.005 EUR   → progressiv ab 14%
 * Zone C: 17.005 - 66.760 EUR   → progressiv 24-42%
 * Zone D: 66.760 - 277.825 EUR  → 42%
 * Zone E: > 277.825 EUR         → 45%
 *
 * Vereinfachte Formel für Zone B/C aus PAP 2026:
 * Zone B (11.600 - 62.810): LSt = (922,98 * y + 1400) * y; y = (zvE - 11.600) / 10.000
 * Zone C (62.810 - 277.825): LSt = 0,42 * zvE - 10.911,92
 * Zone D (> 277.826): LSt = 0,45 * zvE - 19.246,67
 */
export function einkommensteuerJahr2026(zvE: number, params: ParameterJahr): { steuer: number; zone: 'A' | 'B' | 'C' | 'D' } {
  if (zvE <= 0) return { steuer: 0, zone: 'A' }

  const gfb = params.grundfreibetrag
  if (zvE <= gfb) return { steuer: 0, zone: 'A' }

  // Vereinfachte PAP-2026-Formeln (offiziell aus Anlage 1)
  // Zone B: 11.601 - 17.005 EUR
  if (zvE <= 17005) {
    const y = (zvE - gfb) / 10000
    const steuer = Math.floor((922.98 * y + 1400) * y)
    return { steuer, zone: 'B' }
  }

  // Zone C: 17.006 - 66.760 EUR
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000
    const steuer = Math.floor((181.19 * z + 2397) * z + 1025.38)
    return { steuer, zone: 'C' }
  }

  // Zone D: 66.761 - 277.825 EUR (42%)
  if (zvE <= 277825) {
    const steuer = Math.floor(0.42 * zvE - 10602.13)
    return { steuer, zone: 'D' }
  }

  // Zone E: > 277.825 EUR (45%)
  const steuer = Math.floor(0.45 * zvE - 18936.88)
  return { steuer, zone: 'D' }
}

/**
 * Berechnet die Einkommensteuer (Jahreswert) nach § 32a EStG für 2025
 * Koeffizienten aus Stetigkeitsbedingungen abgeleitet (PAP_2025: GFB=11460, zoneB_max=16305, zoneC_max=62810)
 *
 * Zone A: 0 – 11.460 EUR        → 0 EUR
 * Zone B: 11.461 – 16.305 EUR   → progressiv ab 14%  y = (zvE − 11460) / 10000
 * Zone C: 16.306 – 62.810 EUR   → progressiv 23–42%  z = (zvE − 16305) / 10000
 * Zone D: 62.811 – 277.825 EUR  → 42%
 * Zone E: > 277.825 EUR         → 45%
 *
 * Herleitung Zone-C-Koeffizienten:
 *   y_Bmax = (16305 − 11460) / 10000 = 0,4845
 *   K = floor((922,98 × 0,4845 + 1400) × 0,4845) = 894   (Steuer am Ende Zone B)
 *   d = 2 × 922,98 × 0,4845 + 1400 = 2294,37             (Grenzsteuersatz-Koeff.)
 *   z_max = (62810 − 16305) / 10000 = 4,6505
 *   c = (4200 − 2294,37) / (2 × 4,6505) = 204,88         (Progressionskoeff.)
 */
export function einkommensteuerJahr2025(zvE: number, params: ParameterJahr): { steuer: number; zone: 'A' | 'B' | 'C' | 'D' } {
  if (zvE <= 0 || zvE <= params.grundfreibetrag) return { steuer: 0, zone: 'A' }

  // Zone B: GFB+1 – 16.305 EUR
  if (zvE <= params.zoneB_max) {
    const y = (zvE - params.grundfreibetrag) / 10000
    return { steuer: Math.floor((922.98 * y + 1400) * y), zone: 'B' }
  }

  // Zone C: 16.306 – 62.810 EUR
  if (zvE <= params.zoneC_max) {
    const z = (zvE - params.zoneB_max) / 10000
    return { steuer: Math.floor((204.88 * z + 2294.37) * z + 894), zone: 'C' }
  }

  // Zone D: 62.811 – 277.825 EUR (42%)
  // B = 0,42 × 62810 − 15995 = 10385,2
  if (zvE <= 277825) {
    return { steuer: Math.floor(0.42 * zvE - 10385.2), zone: 'D' }
  }

  // Zone E: > 277.825 EUR (45%)
  // C = 0,45 × 277826 − 106301 = 18720,7
  return { steuer: Math.floor(0.45 * zvE - 18720.7), zone: 'D' }
}

/**
 * Jahresdispatcher: Wählt die korrekte Tarifformel anhand params.jahr.
 * Fällt bei unbekanntem Jahr auf 2026 zurück.
 */
export function berechneTarif(zvE: number, params: ParameterJahr): { steuer: number; zone: 'A' | 'B' | 'C' | 'D' } {
  if (params.jahr === 2025) return einkommensteuerJahr2025(zvE, params)
  return einkommensteuerJahr2026(zvE, params)
}

/**
 * Steuerklassen-Faktor (vereinfacht):
 * STKL I: Standard
 * STKL II: Standard + Alleinerziehend-Entlastung 4.260 EUR/Jahr
 * STKL III: Verheiratet, Verdoppelung GFB (Splittingtarif)
 * STKL IV: Wie I, Verheiratet einzeln
 * STKL V: Hoher Steuersatz (Spiegelbild zu III)
 * STKL VI: Höchster Steuersatz für Zweitjob
 */
export function steuerklasseAnpassung(zvE: number, stkl: Steuerklasse, params: ParameterJahr): number {
  switch (stkl) {
    case 1:
    case 4:
      return berechneTarif(zvE, params).steuer

    case 2:
      // Alleinerziehend: 4.260 EUR Entlastungsbetrag
      return berechneTarif(Math.max(0, zvE - 4260), params).steuer

    case 3: {
      // Splitting-Tarif: Steuer auf zvE/2, dann × 2
      const halbeSteuer = berechneTarif(zvE / 2, params).steuer
      return Math.floor(halbeSteuer * 2)
    }

    case 5:
    case 6:
      // STKL V/VI: kein Grundfreibetrag (GFB "gehört" dem STKL-III-Partner bzw. entfällt)
      return berechneTarif(zvE + params.grundfreibetrag, params).steuer

    default:
      return berechneTarif(zvE, params).steuer
  }
}

// ============================================================================
// SOLIDARITÄTSZUSCHLAG (§ 5 SolzG)
// ============================================================================

/**
 * Berechnet Solidaritätszuschlag (Jahreswert)
 * 5,5% auf Lohnsteuer, aber nur wenn LSt > Freigrenze
 * Mit gleitendem Übergang von 0% auf 5,5%
 */
export function solidaritaetszuschlagJahr(
  lohnsteuerJahr: number,
  stkl: Steuerklasse,
  params: ParameterJahr
): number {
  // Bei STKL III/IV: Doppelte Freigrenze
  const freigrenze = (stkl === 3) ? params.solzFreigrenze * 2 : params.solzFreigrenze

  if (lohnsteuerJahr <= freigrenze) return 0

  // Voller SolZ-Satz: 5.5%
  const vollSolz = lohnsteuerJahr * 0.055

  // Gleitender Übergang (Milderungszone): 11,9% des Differenz statt voller SolZ
  // Vereinfacht: SolZ = min(0.119 * (LSt - Freigrenze), 0.055 * LSt)
  const milderungSolz = (lohnsteuerJahr - freigrenze) * 0.119

  return Math.floor(Math.min(milderungSolz, vollSolz))
}

// ============================================================================
// KIRCHENSTEUER (§ 51a EStG)
// ============================================================================

export function kirchensteuerJahr(lohnsteuerJahr: number, satzProzent: number): number {
  if (lohnsteuerJahr <= 0) return 0
  return Math.floor(lohnsteuerJahr * satzProzent / 100)
}

// ============================================================================
// SOZIALVERSICHERUNG (alle Berechnungen auf Jahresbasis)
// ============================================================================

export function rvBeitragJahr(
  bruttoJahr: number,
  region: Region,
  versichert: boolean,
  params: ParameterJahr
): number {
  if (!versichert) return 0
  const bbg = region === 'west' ? params.rvBbgWest : params.rvBbgOst
  const bemessung = Math.min(bruttoJahr, bbg)
  // AN-Anteil: halber Gesamtsatz (paritätisch)
  return Math.floor(bemessung * (params.rvSatzGesamt / 2) / 100)
}

export function alvBeitragJahr(bruttoJahr: number, params: ParameterJahr): number {
  const bemessung = Math.min(bruttoJahr, params.alvBbg)
  return Math.floor(bemessung * (params.alvSatzGesamt / 2) / 100)
}

export function kvBeitragJahr(
  bruttoJahr: number,
  gesetzlich: boolean,
  zusatzbeitragProzent: number,
  params: ParameterJahr
): { beitrag: number; satzAN: number } {
  if (!gesetzlich) return { beitrag: 0, satzAN: 0 }
  const bemessung = Math.min(bruttoJahr, params.kvBbg)
  // AN-Anteil: halber Basissatz + halber Zusatzbeitrag
  const satzAN = (params.kvBasisSatzGesamt / 2) + (zusatzbeitragProzent / 2)
  const beitrag = Math.floor(bemessung * satzAN / 100)
  return { beitrag, satzAN }
}

export function pvBeitragJahr(
  bruttoJahr: number,
  kvGesetzlich: boolean,
  kinderlos: boolean,
  anzahlKinder: number,
  sachsen: boolean,
  params: ParameterJahr
): { beitrag: number; satzAN: number } {
  if (!kvGesetzlich) return { beitrag: 0, satzAN: 0 }

  const bemessung = Math.min(bruttoJahr, params.kvBbg)

  // AN-Basis: halber Gesamtsatz (1,8%)
  let satzAN = params.pvBasisSatzGesamt / 2

  // Kinderlos-Zuschlag (komplett AN)
  if (kinderlos) {
    satzAN += params.pvZuschlagKinderlos
  }

  // Abschlag pro Kind (ab 2. Kind, max 5 Kinder)
  if (anzahlKinder >= 2) {
    const wirksameKinder = Math.min(anzahlKinder, 5) - 1  // ab 2. Kind
    satzAN -= wirksameKinder * params.pvAbschlagProKind
  }

  // Sachsen-Zuschlag (AN zahlt mehr, weil ein Feiertag in Sachsen ist)
  if (sachsen) {
    satzAN += params.pvSachsenZuschlag
  }

  satzAN = Math.max(0, satzAN)
  const beitrag = Math.floor(bemessung * satzAN / 100)
  return { beitrag, satzAN }
}

// ============================================================================
// HAUPTBERECHNUNG
// ============================================================================

export function berechneLohnsteuer(
  eingabe: LohnsteuerEingabe,
  params: ParameterJahr = PAP_2026
): LohnsteuerErgebnis {
  const schritte: BerechnungsSchritt[] = []
  let schrittNr = 0

  // ============================================
  // 1. Konvertiere alles auf Jahresbasis
  // ============================================
  const bruttoJahr = aufJahr(eingabe.bruttolohn, eingabe.lohnZZ)
  const freibetragJahr = aufJahr(eingabe.freibetrag || 0, eingabe.lohnZZ)

  schritte.push({
    nr: ++schrittNr,
    titel: 'Bruttolohn auf Jahresbasis',
    beschreibung: `Konvertierung des ${lzzName(eingabe.lohnZZ)}en Bruttolohns in Jahreswert`,
    formel: `${eingabe.bruttolohn} × ${LZZ_FAKTOREN[eingabe.lohnZZ]}`,
    eingabe: `${eingabe.bruttolohn.toFixed(2)} EUR (${lzzName(eingabe.lohnZZ)})`,
    ergebnis: `${bruttoJahr.toFixed(2)} EUR (jährlich)`,
    papReferenz: 'PAP S. 1, RE4',
  })

  // ============================================
  // 1b. Beschäftigungsform: Minijob / Midijob (§ 8 / § 20 SGB IV)
  // ============================================
  const bruttoMt = bruttoJahr / 12
  const isMinijob = eingabe.minijob === true || bruttoMt <= params.minijobGrenzeMt
  const isMidijob = !isMinijob && (
    eingabe.gleitzone === true ||
    (bruttoMt > params.minijobGrenzeMt && bruttoMt <= params.midijobGrenzeMt)
  )

  // AN-SV-Basis: bei Midijob reduziert gemäß § 20 Abs. 2 SGB IV
  let svBasisJahr = bruttoJahr
  let midijobInfoObj: MidijobInfo | undefined

  if (isMinijob) {
    svBasisJahr = 0  // AN zahlt keine SV-Beiträge im Minijob
    schritte.push({
      nr: ++schrittNr,
      titel: 'Minijob erkannt',
      beschreibung: `Brutto ≤ ${params.minijobGrenzeMt} EUR/Monat → Pauschalsteuer 2% (AG-Last, § 40a EStG)`,
      formel: 'AN-LSt = 0, AN-SV = 0',
      eingabe: `Monatliches Brutto: ${bruttoMt.toFixed(2)} EUR`,
      ergebnis: 'Steuer- und SV-Abzüge für AN: 0 EUR',
      papReferenz: '§ 40a EStG, § 8 SGB IV (E34: gering)',
    })
  } else if (isMidijob) {
    const G1j = params.minijobGrenzeMt * 12
    const G2j = params.midijobGrenzeMt * 12
    const F = params.midijobFaktorF
    const bpeJahr = F * G1j + (G2j / (G2j - G1j)) * (bruttoJahr - G1j)
    svBasisJahr = Math.max(0, Math.min(bpeJahr, bruttoJahr))
    midijobInfoObj = { bruttolohnMt: bruttoMt, g1: params.minijobGrenzeMt, g2: params.midijobGrenzeMt, faktorF: F, bpeJahr, svReduktionJahr: 0 }
    schritte.push({
      nr: ++schrittNr,
      titel: 'Midijob / Übergangsbereich',
      beschreibung: `Brutto im Übergangsbereich (${params.minijobGrenzeMt}–${params.midijobGrenzeMt} EUR/Mt) → reduzierte AN-SV gemäß § 20 SGB IV`,
      formel: `BPE = F×G1 + G2/(G2−G1)×(AE−G1) = ${F}×${G1j} + ${(G2j/(G2j-G1j)).toFixed(3)}×(${bruttoJahr.toFixed(0)}−${G1j})`,
      eingabe: `Monatliches Brutto: ${bruttoMt.toFixed(2)} EUR, F = ${F}`,
      ergebnis: `BPE = ${bpeJahr.toFixed(2)} EUR/Jahr (statt ${bruttoJahr.toFixed(2)})`,
      papReferenz: '§ 20 Abs. 2 SGB IV (E35: gleit)',
    })
  }

  // ============================================
  // 2. Sozialversicherung berechnen (für Vorsorgepauschale)
  // ============================================
  const rvJahr = rvBeitragJahr(svBasisJahr, eingabe.westOst, eingabe.rvVersichert, params)
  const alvJahr = alvBeitragJahr(svBasisJahr, params)
  const kvResult = kvBeitragJahr(svBasisJahr, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
  const pvResult = pvBeitragJahr(
    svBasisJahr,
    eingabe.kvGesetzlich,
    eingabe.pvKinderlos,
    eingabe.kinderfreibetraege,
    eingabe.pvSachsenZuschlag,
    params
  )

  // Midijob: Ersparnis gegenüber voller SV ermitteln
  if (midijobInfoObj) {
    const rvFull = rvBeitragJahr(bruttoJahr, eingabe.westOst, eingabe.rvVersichert, params)
    const alvFull = alvBeitragJahr(bruttoJahr, params)
    const kvFull = kvBeitragJahr(bruttoJahr, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
    const pvFull = pvBeitragJahr(bruttoJahr, eingabe.kvGesetzlich, eingabe.pvKinderlos, eingabe.kinderfreibetraege, eingabe.pvSachsenZuschlag, params)
    midijobInfoObj.svReduktionJahr = Math.max(0, (rvFull + alvFull + kvFull.beitrag + pvFull.beitrag) - (rvJahr + alvJahr + kvResult.beitrag + pvResult.beitrag))
  }

  // Vorsorgepauschale = AN-Anteile RV + KV + PV (nicht ALV!)
  // Bei privater KV: VKV × 12 (PAP VKV-Parameter) statt GKV-Anteil
  const pkvVorsorge = (!eingabe.kvGesetzlich && eingabe.kvMonatsbeitragPKV && eingabe.kvMonatsbeitragPKV > 0)
    ? eingabe.kvMonatsbeitragPKV * 12
    : 0
  const vorsorgepauschale = rvJahr + kvResult.beitrag + pvResult.beitrag + pkvVorsorge

  {
    const gkvTeil = kvResult.beitrag + pvResult.beitrag
    const vorsorgeBeschreibung = pkvVorsorge > 0
      ? `RV + PKV/PPV-Monatsbeitrag × 12 (VKV)`
      : `RV + GKV-KV + GKV-PV`
    const vorsorgeFörmel = pkvVorsorge > 0
      ? `${rvJahr.toFixed(2)} + ${pkvVorsorge.toFixed(2)}`
      : `${rvJahr.toFixed(2)} + ${kvResult.beitrag.toFixed(2)} + ${pvResult.beitrag.toFixed(2)}`
    schritte.push({
      nr: ++schrittNr,
      titel: 'Vorsorgepauschale berechnen',
      beschreibung: vorsorgeBeschreibung,
      formel: vorsorgeFörmel,
      eingabe: pkvVorsorge > 0
        ? `RV = ${rvJahr.toFixed(2)}, PKV-Monat = ${eingabe.kvMonatsbeitragPKV?.toFixed(2)}`
        : `RV = ${rvJahr.toFixed(2)}, KV = ${kvResult.beitrag.toFixed(2)}, PV = ${pvResult.beitrag.toFixed(2)}`,
      ergebnis: `${vorsorgepauschale.toFixed(2)} EUR`,
      papReferenz: 'PAP S. 11, § 10 EStG (VKV/VKVges)',
    })
  }

  // ============================================
  // 3. Zu versteuerndes Einkommen ermitteln
  // ============================================
  // Brutto - Werbungskostenpauschale - Sonderausgabenpauschale - Vorsorgepauschale - Freibetrag
  const wp = params.werbungskostenPauschale
  const sp = params.sonderausgabenPauschale

  let zvE = bruttoJahr - wp - sp - vorsorgepauschale - freibetragJahr

  // STKL III: Werbungskostenpauschale verdoppelt (vereinfacht)
  if (eingabe.steuerklasse === 3) {
    zvE -= wp  // 2. Werbungskostenpauschale für Ehepartner
  }

  zvE = Math.max(0, zvE)

  schritte.push({
    nr: ++schrittNr,
    titel: 'Zu versteuerndes Einkommen',
    beschreibung: 'Brutto minus Pauschbeträge und Vorsorgepauschale',
    formel: 'Brutto - WP - SP - Vorsorge - Freibetrag',
    eingabe: `${bruttoJahr.toFixed(2)} - ${wp} - ${sp} - ${vorsorgepauschale.toFixed(2)} - ${freibetragJahr}`,
    ergebnis: `${zvE.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 11, § 9a EStG (WP), § 10c EStG (SP)',
  })

  // ============================================
  // 3b. Altersentlastungsbetrag (§ 24a EStG, PAP Anlage 2)
  // ============================================
  let altBetrag = 0
  let altProzent = 0
  let altMax = 0
  if (eingabe.geburtsjahr) {
    const altResult = altersentlastungsbetragJahr(bruttoJahr, eingabe.geburtsjahr, params.jahr)
    altBetrag = altResult.betrag
    altProzent = altResult.prozent
    altMax = altResult.max

    if (altBetrag > 0) {
      zvE = Math.max(0, zvE - altBetrag)
      schritte.push({
        nr: ++schrittNr,
        titel: 'Altersentlastungsbetrag',
        beschreibung: `${altProzent}% des Bruttoarbeitslohns, max. ${altMax} EUR (Kohorte ${eingabe.geburtsjahr + 64})`,
        formel: `min(${bruttoJahr.toFixed(2)} × ${altProzent}%, ${altMax})`,
        eingabe: `Geburtsjahr ${eingabe.geburtsjahr}, Alter ${params.jahr - eingabe.geburtsjahr}`,
        ergebnis: `−${altBetrag.toFixed(2)} EUR → zvE = ${zvE.toFixed(2)} EUR`,
        papReferenz: 'PAP Anlage 2, § 24a EStG',
      })
    }
  }

  // Kinderfreibetrag (NUR für SolZ und Kirchensteuer relevant, nicht für LSt!)
  const kinderfreibetragGesamt = eingabe.kinderfreibetraege * params.kinderfreibetragJahr

  // ============================================
  // 4. Lohnsteuer berechnen
  // ============================================
  let lstJahr = steuerklasseAnpassung(zvE, eingabe.steuerklasse, params)
  const tarifInfo = berechneTarif(zvE, params)

  // Faktor STKL IV (§ 39f EStG): Lohnsteuer × Faktor F
  const faktor4 = (eingabe.steuerklasse === 4 && eingabe.faktor4 && eingabe.faktor4 > 0 && eingabe.faktor4 < 1)
    ? eingabe.faktor4
    : 1.0
  if (faktor4 < 1.0) {
    const lstVorFaktor = lstJahr
    lstJahr = Math.floor(lstJahr * faktor4)
    schritte.push({
      nr: ++schrittNr,
      titel: 'Faktorverfahren STKL IV',
      beschreibung: `Lohnsteuer × Faktor F (§ 39f EStG)`,
      formel: `${lstVorFaktor.toFixed(2)} × ${faktor4.toFixed(3)}`,
      eingabe: `LSt vor Faktor = ${lstVorFaktor.toFixed(2)} EUR, F = ${faktor4.toFixed(3)}`,
      ergebnis: `${lstJahr.toFixed(2)} EUR`,
      papReferenz: 'PAP S. 13, § 39f EStG',
    })
  }

  schritte.push({
    nr: ++schrittNr,
    titel: 'Lohnsteuer berechnen',
    beschreibung: `Tarif nach § 32a EStG, Steuerklasse ${eingabe.steuerklasse}${faktor4 < 1.0 ? ` × Faktor ${faktor4.toFixed(3)}` : ''}`,
    formel: `Tarifformel Zone ${tarifInfo.zone}`,
    eingabe: `zvE = ${zvE.toFixed(2)} EUR, STKL ${eingabe.steuerklasse}`,
    ergebnis: `${lstJahr.toFixed(2)} EUR (Jahres-LSt)`,
    papReferenz: 'PAP S. 12-13, § 32a EStG',
  })

  // Minijob: AN-Lohnsteuer = 0 (Pauschalsteuer 2% ist AG-Last § 40a EStG)
  if (isMinijob) lstJahr = 0

  // Kinderfreibetrag-Effekt für SolZ/KiSt: fiktive LSt mit Kinderfreibetrag
  const zvE_mitKfb = Math.max(0, zvE - kinderfreibetragGesamt)
  const lstJahr_fiktiv = steuerklasseAnpassung(zvE_mitKfb, eingabe.steuerklasse, params)

  // ============================================
  // 4. Solidaritätszuschlag
  // ============================================
  const solzJahr = solidaritaetszuschlagJahr(lstJahr_fiktiv, eingabe.steuerklasse, params)

  schritte.push({
    nr: ++schrittNr,
    titel: 'Solidaritätszuschlag',
    beschreibung: `5,5% auf fiktive LSt (mit Kinderfreibetrag), wenn über Freigrenze ${(eingabe.steuerklasse === 3 ? 2 : 1) * params.solzFreigrenze} EUR`,
    formel: `5,5% × ${lstJahr_fiktiv.toFixed(2)}`,
    eingabe: `Fiktive LSt = ${lstJahr_fiktiv.toFixed(2)} EUR`,
    ergebnis: `${solzJahr.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 16, § 5 SolzG',
  })

  // ============================================
  // 5. Kirchensteuer
  // ============================================
  const kirchSatz = eingabe.kirchensteuer ? (eingabe.kirchensteuerSatz ?? 9) : 0
  const kirchJahr = kirchensteuerJahr(lstJahr_fiktiv, kirchSatz)

  if (eingabe.kirchensteuer) {
    schritte.push({
      nr: ++schrittNr,
      titel: 'Kirchensteuer',
      beschreibung: `${kirchSatz}% auf fiktive Lohnsteuer`,
      formel: `${kirchSatz}% × ${lstJahr_fiktiv.toFixed(2)}`,
      eingabe: `LSt = ${lstJahr_fiktiv.toFixed(2)}`,
      ergebnis: `${kirchJahr.toFixed(2)} EUR`,
      papReferenz: 'PAP S. 17, § 51a EStG',
    })
  }

  // ============================================
  // 6. Sozialversicherung-Schritte ins Audit-Log eintragen (Werte schon oben berechnet)
  // ============================================
  schritte.push({
    nr: ++schrittNr,
    titel: 'Rentenversicherung',
    beschreibung: `${(params.rvSatzGesamt / 2).toFixed(2)}% AN-Anteil bis zur BBG`,
    formel: `min(Brutto, ${eingabe.westOst === 'west' ? params.rvBbgWest : params.rvBbgOst}) × ${(params.rvSatzGesamt / 2)}%`,
    eingabe: `Brutto = ${bruttoJahr.toFixed(2)}, BBG ${eingabe.westOst}`,
    ergebnis: `${rvJahr.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 7, § 168 SGB VI',
  })

  schritte.push({
    nr: ++schrittNr,
    titel: 'Arbeitslosenversicherung',
    beschreibung: `${(params.alvSatzGesamt / 2).toFixed(2)}% AN-Anteil bis zur BBG`,
    formel: `min(Brutto, ${params.alvBbg}) × ${(params.alvSatzGesamt / 2)}%`,
    eingabe: `Brutto = ${bruttoJahr.toFixed(2)}`,
    ergebnis: `${alvJahr.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 7, § 341 SGB III',
  })

  schritte.push({
    nr: ++schrittNr,
    titel: 'Krankenversicherung',
    beschreibung: `${kvResult.satzAN.toFixed(2)}% AN-Anteil (Basis + Zusatz) bis BBG`,
    formel: `min(Brutto, ${params.kvBbg}) × ${kvResult.satzAN.toFixed(2)}%`,
    eingabe: `Brutto = ${bruttoJahr.toFixed(2)}, Zusatz = ${eingabe.kvZusatzbeitragProzent}%`,
    ergebnis: `${kvResult.beitrag.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 8, § 242 SGB V',
  })

  schritte.push({
    nr: ++schrittNr,
    titel: 'Pflegeversicherung',
    beschreibung: `${pvResult.satzAN.toFixed(2)}% AN-Anteil (inkl. Zuschläge/Abschläge)`,
    formel: `min(Brutto, ${params.kvBbg}) × ${pvResult.satzAN.toFixed(2)}%`,
    eingabe: `Brutto = ${bruttoJahr.toFixed(2)}, Kinder = ${eingabe.kinderfreibetraege}, Sachsen = ${eingabe.pvSachsenZuschlag}`,
    ergebnis: `${pvResult.beitrag.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 8, § 55 SGB XI',
  })

  // ============================================
  // 7. Sonstige Bezüge (Vergleichsrechnung § 39b Abs. 3 EStG)
  // ============================================
  let sonsteBezuegErg: SonsteBezuegErgebnis | undefined

  if (eingabe.sonsteBezuege && eingabe.sonsteBezuege > 0) {
    // JRE4: voraussichtliches Jahresbrutto (ohne SONSTB). Fällt auf hochgerechnetes LZZ-Brutto zurück.
    const jre4 = eingabe.vJBrutto ?? bruttoJahr

    // Vorsorgepauschale auf JRE4-Basis (SONSTB erhöht die SV-Beiträge nicht, da BBG-Begrenzung beachtet)
    const rvJre4 = rvBeitragJahr(jre4, eingabe.westOst, eingabe.rvVersichert, params)
    const kvJre4 = kvBeitragJahr(jre4, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
    const pvJre4 = pvBeitragJahr(jre4, eingabe.kvGesetzlich, eingabe.pvKinderlos, eingabe.kinderfreibetraege, eingabe.pvSachsenZuschlag, params)
    const vorsorge_jre4 = rvJre4 + kvJre4.beitrag + pvJre4.beitrag

    // zvE ohne SONSTB (Vergleichsbasis)
    const zvE_basis = Math.max(0, jre4 - wp - sp - vorsorge_jre4 - freibetragJahr)
    const lst_basis = steuerklasseAnpassung(zvE_basis, eingabe.steuerklasse, params)

    // zvE mit SONSTB (gleiche Vorsorge — SONSTB ändert die SV-Beiträge nicht)
    const zvE_mitSonstb = Math.max(0, jre4 + eingabe.sonsteBezuege - wp - sp - vorsorge_jre4 - freibetragJahr)
    const lst_mitSonstb = steuerklasseAnpassung(zvE_mitSonstb, eingabe.steuerklasse, params)

    const lstSonstb = Math.max(0, lst_mitSonstb - lst_basis)
    const solzSonstb = solidaritaetszuschlagJahr(lstSonstb, eingabe.steuerklasse, params)
    const kirchSonstb = kirchensteuerJahr(lstSonstb, kirchSatz)

    sonsteBezuegErg = {
      betrag: eingabe.sonsteBezuege,
      jre4,
      lstBasis: lst_basis,
      lstMitSonstb: lst_mitSonstb,
      lohnsteuer: lstSonstb,
      solz: solzSonstb,
      kirchensteuer: kirchSonstb,
      gesamtAbzuege: lstSonstb + solzSonstb + kirchSonstb,
    }

    schritte.push({
      nr: ++schrittNr,
      titel: 'Sonstige Bezüge – Vergleichsrechnung',
      beschreibung: `Differenzsteuer auf SONSTB ${eingabe.sonsteBezuege.toFixed(2)} EUR nach § 39b Abs. 3 EStG`,
      formel: `LSt(JRE4 + SONSTB) − LSt(JRE4) = ${lst_mitSonstb.toFixed(0)} − ${lst_basis.toFixed(0)}`,
      eingabe: `JRE4 = ${jre4.toFixed(2)}, SONSTB = ${eingabe.sonsteBezuege.toFixed(2)} EUR`,
      ergebnis: `${lstSonstb.toFixed(2)} EUR LSt + ${solzSonstb.toFixed(2)} EUR SolZ`,
      papReferenz: 'PAP S. 14-15, § 39b Abs. 3 EStG',
    })
  }

  // ============================================
  // 8. Abfindung / Fünftelregelung (§ 34 EStG, Excel SONSTENT + mehrjBez)
  // ============================================
  let abfindungErg: AbfindungErgebnis | undefined
  const gesamtSonstEnt = (eingabe.abfindung ?? 0) + (eingabe.mehrjBezuege ?? 0)

  if (gesamtSonstEnt > 0) {
    const jre4a = eingabe.vJBrutto ?? bruttoJahr
    const rvJre4a = rvBeitragJahr(jre4a, eingabe.westOst, eingabe.rvVersichert, params)
    const kvJre4a = kvBeitragJahr(jre4a, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
    const pvJre4a = pvBeitragJahr(jre4a, eingabe.kvGesetzlich, eingabe.pvKinderlos, eingabe.kinderfreibetraege, eingabe.pvSachsenZuschlag, params)
    const vorsorgeA = rvJre4a + kvJre4a.beitrag + pvJre4a.beitrag + pkvVorsorge

    const zvEBasisA = Math.max(0, jre4a - wp - sp - vorsorgeA - freibetragJahr - altBetrag)
    const lstBasisA = steuerklasseAnpassung(zvEBasisA, eingabe.steuerklasse, params)

    const fuenftel = gesamtSonstEnt / 5
    const zvEFuenftelA = Math.max(0, zvEBasisA + fuenftel)
    const lstFuenftelA = steuerklasseAnpassung(zvEFuenftelA, eingabe.steuerklasse, params)

    const lstAbfindung = Math.max(0, lstFuenftelA - lstBasisA) * 5
    const solzAbfindung = solidaritaetszuschlagJahr(lstAbfindung, eingabe.steuerklasse, params)
    const kirchAbfindung = kirchensteuerJahr(lstAbfindung, kirchSatz)
    const gesamtAbzA = lstAbfindung + solzAbfindung + kirchAbfindung

    abfindungErg = {
      betrag: gesamtSonstEnt,
      jre4: jre4a,
      lstBasis: lstBasisA,
      lstFuenftelzusatz: Math.max(0, lstFuenftelA - lstBasisA),
      lstAbfindung,
      solz: solzAbfindung,
      kirchensteuer: kirchAbfindung,
      gesamtAbzuege: gesamtAbzA,
      effektiverSteuersatz: gesamtSonstEnt > 0 ? gesamtAbzA / gesamtSonstEnt * 100 : 0,
    }

    schritte.push({
      nr: ++schrittNr,
      titel: 'Fünftelregelung – Abfindung / Mehrjährige Bezüge',
      beschreibung: `§ 34 EStG: LSt(JRE4 + SONSTENT/5) − LSt(JRE4), dann × 5`,
      formel: `(LSt(${zvEBasisA.toFixed(0)} + ${fuenftel.toFixed(0)}) − LSt(${zvEBasisA.toFixed(0)})) × 5 = (${lstFuenftelA.toFixed(0)} − ${lstBasisA.toFixed(0)}) × 5`,
      eingabe: `SONSTENT = ${gesamtSonstEnt.toFixed(2)} EUR, JRE4 = ${jre4a.toFixed(2)} EUR`,
      ergebnis: `${lstAbfindung.toFixed(2)} EUR LSt + ${solzAbfindung.toFixed(2)} EUR SolZ`,
      papReferenz: '§ 34 EStG, § 24 Nr. 1 EStG (E19/E20: mehrjBez/Abfindg)',
    })
  }

  // ============================================
  // 9. Grenzsteuersatz (analog AMLohnAbgabenLast() in Excel E46)
  // ============================================
  const gsDelta = 100 // EUR/Jahr (analog Zuwachs E32)
  const bruttoPlus = bruttoJahr + gsDelta
  const bruttoMtPlus = bruttoPlus / 12
  let svBasisPlus = bruttoPlus
  if (isMinijob || bruttoMtPlus <= params.minijobGrenzeMt) {
    svBasisPlus = 0
  } else if (isMidijob || (bruttoMtPlus > params.minijobGrenzeMt && bruttoMtPlus <= params.midijobGrenzeMt)) {
    const G1j = params.minijobGrenzeMt * 12
    const G2j = params.midijobGrenzeMt * 12
    svBasisPlus = Math.max(0, params.midijobFaktorF * G1j + (G2j / (G2j - G1j)) * (bruttoPlus - G1j))
  }

  const rvPlus = rvBeitragJahr(svBasisPlus, eingabe.westOst, eingabe.rvVersichert, params)
  const alvPlus = alvBeitragJahr(svBasisPlus, params)
  const kvPlus = kvBeitragJahr(svBasisPlus, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
  const pvPlus = pvBeitragJahr(svBasisPlus, eingabe.kvGesetzlich, eingabe.pvKinderlos, eingabe.kinderfreibetraege, eingabe.pvSachsenZuschlag, params)
  const vorsorge_plus = rvPlus + kvPlus.beitrag + pvPlus.beitrag + pkvVorsorge

  let zvE_plus = bruttoPlus - wp - sp - vorsorge_plus - freibetragJahr
  if (eingabe.steuerklasse === 3) zvE_plus -= wp
  if (altBetrag > 0) zvE_plus = Math.max(0, zvE_plus - altBetrag)
  zvE_plus = Math.max(0, zvE_plus)

  let lstPlus = steuerklasseAnpassung(zvE_plus, eingabe.steuerklasse, params)
  if (faktor4 < 1.0) lstPlus = Math.floor(lstPlus * faktor4)
  if (isMinijob) lstPlus = 0

  const svBase = rvJahr + alvJahr + kvResult.beitrag + pvResult.beitrag
  const svPlusTotal = rvPlus + alvPlus + kvPlus.beitrag + pvPlus.beitrag

  const grenzsteuersatzInfo: GrenzsteuersatzInfo = {
    delta: gsDelta,
    grenzsteuersatzLst: Math.max(0, Math.min(100, (lstPlus - lstJahr) / gsDelta * 100)),
    grenzsteuersatzSV: Math.max(0, Math.min(100, (svPlusTotal - svBase) / gsDelta * 100)),
    grenzsteuersatzGesamt: Math.max(0, Math.min(100, (lstPlus - lstJahr + svPlusTotal - svBase) / gsDelta * 100)),
  }

  // ============================================
  // 10. Konvertiere zurück auf den LZZ
  // ============================================
  const lst = vonJahr(lstJahr, eingabe.lohnZZ)
  const solz = vonJahr(solzJahr, eingabe.lohnZZ)
  const kirch = vonJahr(kirchJahr, eingabe.lohnZZ)
  const rv = vonJahr(rvJahr, eingabe.lohnZZ)
  const alv = vonJahr(alvJahr, eingabe.lohnZZ)
  const kv = vonJahr(kvResult.beitrag, eingabe.lohnZZ)
  const pv = vonJahr(pvResult.beitrag, eingabe.lohnZZ)

  const gesamtAbzuege = lst + solz + kirch + rv + alv + kv + pv
  const netto = eingabe.bruttolohn - gesamtAbzuege
  const belastungsquote = eingabe.bruttolohn > 0 ? (gesamtAbzuege / eingabe.bruttolohn) * 100 : 0

  return {
    bruttolohn: eingabe.bruttolohn,
    lohnZZ: eingabe.lohnZZ,
    zeitraum: lzzName(eingabe.lohnZZ),
    lohnsteuer: lst,
    solidaritaetszuschlag: solz,
    kirchensteuer: kirch,
    rentenversicherung: rv,
    arbeitslosenversicherung: alv,
    krankenversicherung: kv,
    pflegeversicherung: pv,
    gesamtAbzuege,
    netto,
    belastungsquote,
    sonsteBezuege: sonsteBezuegErg,
    abfindung: abfindungErg,
    isMinijob,
    isMidijob,
    midijobInfo: midijobInfoObj,
    grenzsteuersatz: grenzsteuersatzInfo,
    details: {
      zuVersteuerndesEinkommen: vonJahr(zvE, eingabe.lohnZZ),
      grundfreibetrag: vonJahr(params.grundfreibetrag, eingabe.lohnZZ),
      kinderfreibetragGesamt: vonJahr(kinderfreibetragGesamt, eingabe.lohnZZ),
      rvBemessungsgrenze: vonJahr(eingabe.westOst === 'west' ? params.rvBbgWest : params.rvBbgOst, eingabe.lohnZZ),
      kvBemessungsgrenze: vonJahr(params.kvBbg, eingabe.lohnZZ),
      solzFreigrenze: vonJahr(eingabe.steuerklasse === 3 ? params.solzFreigrenze * 2 : params.solzFreigrenze, eingabe.lohnZZ),
      pvSatzAN: pvResult.satzAN,
      kvSatzAN: kvResult.satzAN,
      rvSatzAN: params.rvSatzGesamt / 2,
      alvSatzAN: params.alvSatzGesamt / 2,
      tarifZone: tarifInfo.zone,
      altersentlastungsbetrag: vonJahr(altBetrag, eingabe.lohnZZ),
      pkvVorsorgepauschale: vonJahr(pkvVorsorge, eingabe.lohnZZ),
      faktor4Angewandt: faktor4,
    },
    schritte,
  }
}

// ============================================================================
// KONFLIKT-ERKENNUNG
// ============================================================================

export interface Konflikt {
  feld: string
  schwere: 'fehler' | 'warnung' | 'info'
  meldung: string
  hinweis?: string
}

export function findeKonflikte(eingabe: LohnsteuerEingabe): Konflikt[] {
  const konflikte: Konflikt[] = []

  // 1. Bruttolohn
  if (eingabe.bruttolohn <= 0) {
    konflikte.push({
      feld: 'bruttolohn',
      schwere: 'fehler',
      meldung: 'Bruttolohn muss größer als 0 sein',
    })
  }

  // 2. Privat versichert + Zusatzbeitrag
  if (!eingabe.kvGesetzlich && eingabe.kvZusatzbeitragProzent > 0) {
    konflikte.push({
      feld: 'kvZusatzbeitragProzent',
      schwere: 'warnung',
      meldung: 'KV-Zusatzbeitrag wird ignoriert (private KV)',
      hinweis: 'Bei privater KV gibt es keinen Zusatzbeitrag wie in der GKV',
    })
  }

  // 3. Privat versichert + Pflegeversicherung
  if (!eingabe.kvGesetzlich && (eingabe.pvKinderlos || eingabe.pvSachsenZuschlag)) {
    konflikte.push({
      feld: 'pvKinderlos',
      schwere: 'info',
      meldung: 'Bei privater KV separate private PV nötig',
      hinweis: 'PV-Beitrag wird hier nicht berechnet (private Pflegeversicherung individuell)',
    })
  }

  // 4. Geburtsjahr Plausibilität
  if (eingabe.geburtsjahr) {
    const heute = new Date().getFullYear()
    const alter = heute - eingabe.geburtsjahr
    if (alter < 16) {
      konflikte.push({
        feld: 'geburtsjahr',
        schwere: 'warnung',
        meldung: `Alter zu jung (${alter} Jahre)`,
      })
    }
    if (alter > 100) {
      konflikte.push({
        feld: 'geburtsjahr',
        schwere: 'warnung',
        meldung: `Alter unrealistisch hoch (${alter} Jahre)`,
      })
    }
  }

  // 5. Kinderlos-Zuschlag bei jungen Personen
  if (eingabe.pvKinderlos && eingabe.geburtsjahr) {
    const alter = new Date().getFullYear() - eingabe.geburtsjahr
    if (alter < 23) {
      konflikte.push({
        feld: 'pvKinderlos',
        schwere: 'warnung',
        meldung: 'Kinderlos-Zuschlag erst ab 23 Jahren',
        hinweis: 'Dieser Beitrag fällt erst ab dem vollendeten 23. Lebensjahr an',
      })
    }
  }

  // 6. Kinder + Pflegeversicherung Kinderlos
  if (eingabe.pvKinderlos && eingabe.kinderfreibetraege > 0) {
    konflikte.push({
      feld: 'pvKinderlos',
      schwere: 'fehler',
      meldung: 'Widerspruch: Kinder vorhanden, aber "kinderlos" markiert',
      hinweis: 'Wenn Sie Kinder haben, sollten Sie "Mit Zuschlag" deaktivieren',
    })
  }

  // 7. Steuerklasse III ohne Ehepartner
  // (würde Personal Daten brauchen, aber wir geben einen Hinweis)

  // 8. Sehr hoher Bruttolohn
  if (eingabe.lohnZZ === 2 && eingabe.bruttolohn > 50000) {
    konflikte.push({
      feld: 'bruttolohn',
      schwere: 'info',
      meldung: 'Sehr hoher Monatslohn',
      hinweis: 'Bitte prüfen, ob der Lohnzahlungszeitraum korrekt eingestellt ist',
    })
  }

  return konflikte
}

// ============================================================================
// FORMATIERUNG
// ============================================================================

export function formatEUR(wert: number): string {
  if (wert === null || wert === undefined || isNaN(wert)) return '0,00'
  return wert.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatProzent(wert: number): string {
  if (wert === null || wert === undefined || isNaN(wert)) return '0,00%'
  return wert.toFixed(2) + '%'
}
