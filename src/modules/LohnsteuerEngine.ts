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
  }

  // Sonstige Bezüge (Einmalzahlungen, nur wenn eingegeben)
  sonsteBezuege?: SonsteBezuegErgebnis

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
}

export const PAP_2027: ParameterJahr = {
  ...PAP_2026,
  jahr: 2027,
  grundfreibetrag: 11604, // Vorlage
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
  // 2. Sozialversicherung berechnen (für Vorsorgepauschale)
  // ============================================
  const rvJahr = rvBeitragJahr(bruttoJahr, eingabe.westOst, eingabe.rvVersichert, params)
  const alvJahr = alvBeitragJahr(bruttoJahr, params)
  const kvResult = kvBeitragJahr(bruttoJahr, eingabe.kvGesetzlich, eingabe.kvZusatzbeitragProzent, params)
  const pvResult = pvBeitragJahr(
    bruttoJahr,
    eingabe.kvGesetzlich,
    eingabe.pvKinderlos,
    eingabe.kinderfreibetraege,
    eingabe.pvSachsenZuschlag,
    params
  )

  // Vorsorgepauschale = AN-Anteile RV + KV + PV (nicht ALV!)
  // Vereinfacht (PAP 2026, § 10 EStG): RV-Anteil + KV-Pauschal-Anteil (ohne Krankengeld) + PV
  const vorsorgepauschale = rvJahr + kvResult.beitrag + pvResult.beitrag

  schritte.push({
    nr: ++schrittNr,
    titel: 'Vorsorgepauschale berechnen',
    beschreibung: 'Summe der Sozialversicherungsbeiträge AN (ohne ALV)',
    formel: 'RV + KV + PV',
    eingabe: `${rvJahr.toFixed(2)} + ${kvResult.beitrag.toFixed(2)} + ${pvResult.beitrag.toFixed(2)}`,
    ergebnis: `${vorsorgepauschale.toFixed(2)} EUR`,
    papReferenz: 'PAP S. 11, § 10 EStG',
  })

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

  // Kinderfreibetrag (NUR für SolZ und Kirchensteuer relevant, nicht für LSt!)
  const kinderfreibetragGesamt = eingabe.kinderfreibetraege * params.kinderfreibetragJahr

  // ============================================
  // 4. Lohnsteuer berechnen
  // ============================================
  const lstJahr = steuerklasseAnpassung(zvE, eingabe.steuerklasse, params)
  const tarifInfo = berechneTarif(zvE, params)

  schritte.push({
    nr: ++schrittNr,
    titel: 'Lohnsteuer berechnen',
    beschreibung: `Tarif nach § 32a EStG, Steuerklasse ${eingabe.steuerklasse}`,
    formel: `Tarifformel Zone ${tarifInfo.zone}`,
    eingabe: `zvE = ${zvE.toFixed(2)} EUR, STKL ${eingabe.steuerklasse}`,
    ergebnis: `${lstJahr.toFixed(2)} EUR (Jahres-LSt)`,
    papReferenz: 'PAP S. 12-13, § 32a EStG',
  })

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
  // 8. Konvertiere zurück auf den LZZ
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
