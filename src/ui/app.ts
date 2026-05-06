import {
  berechneLohnsteuer,
  findeKonflikte,
  formatEUR,
  formatProzent,
  aufJahr,
  lzzName,
  PAP_2025,
  PAP_2026,
  PAP_2027,
  type LohnsteuerEingabe,
  type LohnsteuerErgebnis,
  type SonsteBezuegErgebnis,
  type ParameterJahr,
  type LohnZZ,
  type Steuerklasse,
  type Konflikt,
} from '../modules/LohnsteuerEngine'

import analyseMd from '../../ANALYSE_Lohnsteuer_Excel.md?raw'
import mappingMd from '../../EXCEL_BERECHNUNG_MAPPING.md?raw'
import technischMd from '../../TECHNISCHE_DETAILS_Anhang.md?raw'
import konzeptMd from '../../ENTWICKLUNGSKONZEPT_Prototype_v1.md?raw'
import uebersichtMd from '../../PROJEKT_UEBERSICHT.md?raw'
import handbuchMd from '../../BENUTZERHANDBUCH.md?raw'
import readmeMd from '../../README.md?raw'
import readmeAnalyseMd from '../../README_ANALYSE.md?raw'
import indexMd from '../../INDEX.md?raw'
import quickstartMd from '../../QUICK_START.md?raw'
import roadmapMd from '../../IMPROVEMENTS_ROADMAP.md?raw'
import phase5SummaryMd from '../../PHASE_5_SUMMARY.md?raw'
import phase5GuideMd from '../../PHASE_5_INTEGRATION_GUIDE.md?raw'
import phase5SetupMd from '../../PHASE_5_SETUP.md?raw'
import phase5CompleteMd from '../../PHASE_5_COMPLETE.md?raw'
import phase5RefMd from '../../PHASE_5_QUICK_REFERENCE.md?raw'

// ============================================================================
// STATE
// ============================================================================

const PARAMETER: Record<number, ParameterJahr> = {
  2025: PAP_2025,
  2026: PAP_2026,
  2027: PAP_2027,
}

let currentYear: number = 2026
let currentParams: ParameterJahr = PAP_2026
let lastResult: LohnsteuerErgebnis | null = null
const auditHistory: Array<{ id: string; timestamp: Date; eingabe: LohnsteuerEingabe; ergebnis: LohnsteuerErgebnis }> = []

// ============================================================================
// PAP-INFO (für Modal)
// ============================================================================

const PAP_INFO: Record<string, { titel: string; paragraf: string; beschreibung: string; beispiel?: string }> = {
  lst: {
    titel: 'Lohnsteuer (PAP S. 12-13)',
    paragraf: '§ 32a EStG - Einkommensteuertarif',
    beschreibung: `Die Lohnsteuer wird nach dem progressiven Tarif § 32a EStG berechnet.

Der Tarif hat 4 Zonen:
• Zone A (0 - 11.600 EUR): Befreit
• Zone B (11.601 - 17.005 EUR): Eingangstarif 14%
• Zone C (17.006 - 66.760 EUR): Progressiv 24% - 42%
• Zone D (66.761 - 277.825 EUR): 42%
• Zone E (> 277.825 EUR): 45%

Die Steuerklasse modifiziert die Berechnung:
• STKL III: Splittingtarif (verheiratet)
• STKL II: + 4.260 EUR Alleinerziehenden-Entlastung
• STKL VI: Kein Grundfreibetrag (Zweitjob)`,
  },
  solz: {
    titel: 'Solidaritätszuschlag (PAP S. 16)',
    paragraf: '§ 5 SolzG',
    beschreibung: `5,5% auf die Lohnsteuer, aber nur wenn die Lohnsteuer die Freigrenze überschreitet.

Freigrenze 2026: 20.350 EUR Jahres-LSt
(in STKL III: doppelte Freigrenze 40.700 EUR)

Milderungszone:
Statt voller 5,5% gilt 11,9% des Differenzbetrags zwischen LSt und Freigrenze - der niedrigere Wert wird angewandt.`,
    beispiel: 'LSt = 22.000 EUR → SolZ = min(0,055 × 22.000; 0,119 × (22.000 - 20.350)) = 196,35 EUR',
  },
  kirch: {
    titel: 'Kirchensteuer (PAP S. 17)',
    paragraf: '§ 51a EStG',
    beschreibung: `8% (Bayern, Baden-Württemberg) oder 9% (übrige Bundesländer) auf die Lohnsteuer.

Kinderfreibeträge werden bei der Berechnungsgrundlage berücksichtigt (fiktive LSt mit Kinderfreibetrag).

Wird nur erhoben bei Religionszugehörigkeit zu einer der berechtigten Religionsgemeinschaften.`,
  },
  rv: {
    titel: 'Rentenversicherung (PAP S. 7)',
    paragraf: '§ 168 SGB VI',
    beschreibung: `Beitragssatz 2026: 18,6% gesamt
• Arbeitnehmer: 9,3%
• Arbeitgeber: 9,3%

Beitragsbemessungsgrenze 2026:
• West: 101.400 EUR/Jahr (8.450 EUR/Monat)
• Ost: 107.100 EUR/Jahr (8.925 EUR/Monat)

Berechnung: min(Brutto, BBG) × 9,3%`,
  },
  alv: {
    titel: 'Arbeitslosenversicherung (PAP S. 7)',
    paragraf: '§ 341 SGB III',
    beschreibung: `Beitragssatz 2026: 2,6% gesamt
• Arbeitnehmer: 1,3%
• Arbeitgeber: 1,3%

Beitragsbemessungsgrenze 2026: 101.400 EUR/Jahr (wie RV West)

Berechnung: min(Brutto, BBG) × 1,3%`,
  },
  kv: {
    titel: 'Krankenversicherung (PAP S. 8)',
    paragraf: '§ 242 SGB V',
    beschreibung: `Beitragssatz 2026:
• Allgemeiner Beitrag: 14,0% (7,0% AN, 7,0% AG)
• Zusatzbeitrag: kassenindividuell (durchschn. 2,5%, hälftig getragen)

Beitragsbemessungsgrenze 2026: 69.750 EUR/Jahr (5.812,50 EUR/Monat)

Berechnung AN: min(Brutto, BBG) × (7,0% + Zusatzbeitrag/2)`,
  },
  pv: {
    titel: 'Pflegeversicherung (PAP S. 8)',
    paragraf: '§ 55 SGB XI',
    beschreibung: `Beitragssatz 2026: 3,6% gesamt
• Arbeitnehmer: 1,8%
• Arbeitgeber: 1,8%

Zuschläge/Abschläge AN:
• Kinderlos (ab 23 J.): +0,6%
• Pro Kind ab 2. Kind: -0,25% (max. -1,00%)
• Sachsen: +0,5% (statt Buß- und Bettag)

BBG = wie KV (69.750 EUR/Jahr)`,
  },
  faktor4: {
    titel: 'Faktorverfahren STKL IV (PAP S. 13)',
    paragraf: '§ 39f EStG – Faktorverfahren bei Steuerklasse IV',
    beschreibung: `Das Faktorverfahren gilt für Ehegatten/Lebenspartner in STKL IV, die ihre Steuerbelastung gleichmäßiger verteilen möchten.

Berechnung:
• Faktor F = ESt auf Gesamteinkommen (Splitting) / Summe der Einzeleinkommenssteuern
• Lohnsteuer = LSt STKL IV × F
• 0 < F ≤ 1,0 (in der Regel 0,6 – 0,9)

Der Faktor wird vom Finanzamt auf der Lohnsteuerkarte eingetragen und gilt für ein Kalenderjahr.`,
    beispiel: 'F = 0,750: LSt 1.000 EUR × 0,750 = 750 EUR tatsächliche Lohnsteuer',
  },
  pkvmonat: {
    titel: 'PKV-Monatsbeitrag (PAP S. 11)',
    paragraf: '§ 10 EStG – Vorsorgepauschale bei privater KV (VKV)',
    beschreibung: `Bei privater Kranken- und Pflegeversicherung (PKPV=1) wird der tatsächliche Monatsbeitrag (VKV) in der Vorsorgepauschale berücksichtigt.

PAP-Variable: VKV (Monatsbeitrag KV+PV)
Jahresbetrag: VKV × 12

Die Vorsorgepauschale vermindert das zu versteuernde Einkommen. Bei privater KV wird der tatsächliche Beitrag angesetzt, nicht ein GKV-Pauschalwert.

Hinweis: Der PKV-Beitrag selbst erscheint NICHT als Lohnabzug (er wird privat bezahlt), reduziert aber die Steuerlast.`,
    beispiel: 'Monatsbeitrag 450 EUR → Vorsorgepauschale + 5.400 EUR/Jahr → ca. 1.800 EUR weniger Lohnsteuer',
  },
  minijob: {
    titel: 'Minijob – Geringfügige Beschäftigung',
    paragraf: '§ 8 SGB IV, § 40a EStG – Geringfügigkeitsgrenze',
    beschreibung: `Geringfügige Beschäftigung wenn Monatsentgelt ≤ 556 EUR (2025/2026).

Steuerliche Behandlung:
• AN zahlt keine Lohnsteuer
• AG zahlt Pauschalsteuer 2 % auf Bruttolohn

Sozialversicherung:
• AN zahlt keine regulären SV-Beiträge
• AG zahlt Pauschalbeiträge: RV 15 %, KV 13 %
• Keine ALV (weder AG noch AN)
• Keine PV-Pauschale für AG

Sonderfall RV:
• AN kann auf die RV-Befreiung verzichten und den Differenzbeitrag (3,6 %) selbst zahlen, um Rentenansprüche zu erwerben.

Excel-Variable: gering (E34)`,
    beispiel: 'Brutto 400 EUR/Monat: AG-Pauschalsteuer = 400 × 2% = 8 EUR; AG-RV = 400 × 15% = 60 EUR; AN-Netto = 400 EUR',
  },
  midijob: {
    titel: 'Midijob / Übergangsbereich',
    paragraf: '§ 20 Abs. 2 SGB IV – Übergangsbereichsregelung',
    beschreibung: `Midijob wenn: 556 EUR < Monatsentgelt ≤ 2.000 EUR (seit 10/2022).

Berechnung reduzierte AN-SV:
• Beitragspflichtige Einnahme (BPE_AN):
  BPE = F × G1 + (G2/(G2−G1)) × (AE−G1)
  mit F ≈ 0,6846, G1 = 556 EUR, G2 = 2.000 EUR

• AN zahlt SV-Beiträge nur auf BPE (nicht auf vollen Brutto)
• AG zahlt weiterhin auf den vollen Bruttolohn
• LSt wird weiterhin auf vollen Brutto berechnet!

Vorteil: AN-SV schrittweise reduziert, von fast 0 % bei 556 EUR bis voller AN-Satz bei 2.000 EUR.

Excel-Variable: gleit (E35)`,
    beispiel: 'Brutto 1.000 EUR/Monat, F=0,6846: BPE = 0,6846×556 + (2000/1444)×(1000−556) = 380,24 + 615,91 = 996,15 EUR/Monat → minimal reduzierte SV',
  },
  abfindung: {
    titel: 'Fünftelregelung – Abfindungen (§ 34 EStG)',
    paragraf: '§ 34 Abs. 1 EStG, § 24 Nr. 1 EStG – Außerordentliche Einkünfte',
    beschreibung: `Abfindungen und Entschädigungen (SONSTENT) werden nach der Fünftelregelung besteuert, um die Progressionswirkung abzumildern.

Algorithmus:
1. LSt_basis   = Tarif auf JRE4 (Jahresbrutto ohne Abfindung)
2. LSt_fuenftel = Tarif auf JRE4 + Abfindung/5
3. LSt_Abfindung = (LSt_fuenftel − LSt_basis) × 5

JRE4: voraussichtliches Jahresbrutto (Feld "Voraussichtl. Jahresbrutto")

Excel-Variable: Abfindg (E20) = SONSTENT`,
    beispiel: 'Jahresbrutto 60.000 EUR, Abfindung 30.000 EUR, STKL I:\n  LSt(60.000) ≈ 15.200 EUR\n  LSt(60.000 + 6.000) ≈ 16.580 EUR\n  LSt-Abfindung = (16.580 − 15.200) × 5 = 6.900 EUR → eff. 23%',
  },
  mehrjbez: {
    titel: 'Mehrjährige Bezüge (§ 34 Abs. 2 EStG)',
    paragraf: '§ 34 Abs. 2 Nr. 4 EStG – Vergütungen für mehrjährige Tätigkeiten',
    beschreibung: `Mehrjährige Bezüge (Vergütungen für eine Tätigkeit, die sich über mehr als 12 Monate erstreckt) werden ebenfalls nach der Fünftelregelung begünstigt besteuert.

Bedingung (§ 34 Abs. 2 Nr. 4 EStG):
• Tätigkeit dauerte mehr als 12 Monate
• Vergütung wurde zusammengeballt in einem Jahr ausgezahlt

Berechnung:
Wie bei Abfindung – Fünftelregelung angewandt.
Kombinierter SONSTENT = Abfindung + Mehrjährige Bezüge.

Excel-Variable: mehrjBez (E19)`,
  },
  grenzsteuersatz: {
    titel: 'Grenzsteuersatz (Marginalbelastung)',
    paragraf: 'Analog AMLohnAbgabenLast() – Excel E46 (Zuwachs E32)',
    beschreibung: `Der Grenzsteuersatz zeigt, wie viel Prozent vom nächsten Euro Bruttolohn als Steuern und Abgaben fließen.

Berechnung:
• LSt-Grenzsteuersatz: (LSt(Brutto + 100) − LSt(Brutto)) / 100 × 100%
• SV-Grenzbelastung: (SV(Brutto + 100) − SV(Brutto)) / 100 × 100%
• Gesamt: Summe beider

Der Grenzsteuersatz ist stets ≥ Durchschnittsbelastung (Progression).
In der SV gibt es Sprünge an Beitragsbemessungsgrenzen.

Excel-Variable: Zuwachs (E32), AMLohnAbgabenLast() (E46)`,
    beispiel: 'Brutto 60.000 EUR/Jahr, STKL I: LSt-Grenzsteuersatz ≈ 42 %, SV-Grenzbelastung ≈ 0 % (über BBG), Gesamt ≈ 42 %',
  },
  sonstbez: {
    titel: 'Sonstige Bezüge (PAP S. 14-15)',
    paragraf: '§ 39b Abs. 3 EStG – Vergleichsrechnung',
    beschreibung: `Einmalzahlungen wie Weihnachtsgeld, Urlaubsgeld und Prämien (SONSTB) werden nach der Vergleichsrechnung besteuert.

Algorithmus:
1. Basis-LSt  = Tarif auf JRE4 (Jahresbrutto ohne SONSTB)
2. Erhöhte LSt = Tarif auf JRE4 + SONSTB
3. SONSTB-LSt  = Erhöhte LSt − Basis-LSt

JRE4 (voraussichtliches Jahresbrutto):
• Eingabe: Feld "Voraussichtl. Jahresbrutto"
• Fallback: hochgerechnetes LZZ-Brutto (z.B. Monatsbrutto × 12)

Vorsorgepauschale (RV + KV + PV) wird nur auf JRE4 berechnet, nicht auf SONSTB. Das Ergebnis ist der einmalige Steuerabzug für die gesamte Einmalzahlung.`,
    beispiel: 'Monatsbrutto 5.000 EUR, Weihnachtsgeld 5.000 EUR, STKL I:\n  Basis-LSt auf 60.000 EUR, dann Erhöhung um 5.000 EUR → Differenz = LSt auf Weihnachtsgeld',
  },
}

// ============================================================================
// DOM
// ============================================================================

function $(id: string): HTMLElement {
  return document.getElementById(id)!
}

function $i(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement
}

function $s(id: string): HTMLSelectElement {
  return document.getElementById(id) as HTMLSelectElement
}

// ============================================================================
// EINGABE LESEN
// ============================================================================

function getEingabe(): LohnsteuerEingabe {
  const kvGesetzlich = $s('kvGesetzlich').value === '1'
  const kirchSatz = parseInt($s('kirchensteuer').value || '0')

  const vJBruttoVal = parseFloat($i('vJBrutto').value)
  const sonsteBezVal = parseFloat($i('sonsteBezuege').value)
  const faktor4Val = parseFloat($i('faktor4').value)
  const pkvMonatVal = parseFloat($i('kvMonatPKV').value)
  const abfindungVal = parseFloat($i('abfindung').value)
  const mehrjBezVal = parseFloat($i('mehrjBezuege').value)
  const bform = $s('beschaeftigungsform').value

  return {
    bruttolohn: parseFloat($i('bruttolohn').value) || 0,
    lohnZZ: parseInt($s('lohnZZ').value) as LohnZZ,
    steuerklasse: parseInt($s('stkl').value) as Steuerklasse,
    freibetrag: parseFloat($i('freibetrag').value) || 0,
    kinderfreibetraege: parseFloat($i('kinder').value) || 0,
    geburtsjahr: $i('geburtsjahr').value ? parseInt($i('geburtsjahr').value) : undefined,
    rvVersichert: $s('rvVersichert').value === '1',
    kvGesetzlich,
    kvZusatzbeitragProzent: parseFloat($i('kvZusatz').value) || 0,
    pvKinderlos: $s('pvKinderlos').value === '1',
    pvSachsenZuschlag: $s('pvSachsen').value === '1',
    westOst: $s('westOst').value as 'west' | 'ost',
    kirchensteuer: kirchSatz > 0,
    kirchensteuerSatz: kirchSatz > 0 ? kirchSatz : undefined,
    vJBrutto: !isNaN(vJBruttoVal) && vJBruttoVal > 0 ? vJBruttoVal : undefined,
    sonsteBezuege: !isNaN(sonsteBezVal) && sonsteBezVal > 0 ? sonsteBezVal : undefined,
    faktor4: !isNaN(faktor4Val) && faktor4Val > 0 && faktor4Val < 1 ? faktor4Val : undefined,
    kvMonatsbeitragPKV: !isNaN(pkvMonatVal) && pkvMonatVal > 0 && !kvGesetzlich ? pkvMonatVal : undefined,
    minijob: bform === 'minijob' ? true : undefined,
    gleitzone: bform === 'midijob' ? true : undefined,
    abfindung: !isNaN(abfindungVal) && abfindungVal > 0 ? abfindungVal : undefined,
    mehrjBezuege: !isNaN(mehrjBezVal) && mehrjBezVal > 0 ? mehrjBezVal : undefined,
  }
}

// ============================================================================
// KONFLIKT-ANZEIGE
// ============================================================================

function zeigeKonflikte(konflikte: Konflikt[]): void {
  // Reset
  document.querySelectorAll('.form-row').forEach(row => {
    row.classList.remove('error', 'warning', 'info')
    const c = row.querySelector('.conflict')
    if (c) c.remove()
  })

  for (const konflikt of konflikte) {
    const row = document.querySelector(`.form-row[data-field="${konflikt.feld}"]`) as HTMLElement
    if (row) {
      const klasse = konflikt.schwere === 'fehler' ? 'error' : konflikt.schwere === 'warnung' ? 'warning' : 'info'
      row.classList.add(klasse)
      const div = document.createElement('div')
      div.className = `conflict ${konflikt.schwere}`
      div.innerHTML = `<strong>${konflikt.meldung}</strong>${konflikt.hinweis ? '<br>' + konflikt.hinweis : ''}`
      row.appendChild(div)
    }
  }
}

// ============================================================================
// BERECHNUNG & ANZEIGE
// ============================================================================

function berechne(): void {
  try {
    const eingabe = getEingabe()
    const konflikte = findeKonflikte(eingabe)

    zeigeKonflikte(konflikte)

    // Bei Fehlern nicht berechnen
    if (konflikte.some(k => k.schwere === 'fehler')) {
      return
    }

    const ergebnis = berechneLohnsteuer(eingabe, currentParams)
    lastResult = ergebnis

    // Audit-Eintrag
    const auditId = `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    auditHistory.push({
      id: auditId,
      timestamp: new Date(),
      eingabe,
      ergebnis,
    })

    zeigeErgebnis(ergebnis, eingabe, auditId)
  } catch (error) {
    console.error('Berechnungsfehler:', error)
  }
}

function berechneFormelTexte(
  erg: LohnsteuerErgebnis,
  eingabe: LohnsteuerEingabe,
): Record<string, string> {
  const lzz = eingabe.lohnZZ
  const brutto = erg.bruttolohn
  const lst = erg.lohnsteuer
  const params = currentParams

  const lzzFaktorMap: Record<number, number> = { 1: 1, 2: 12, 3: 52, 4: 360 }
  const f = lzzFaktorMap[lzz] ?? 12
  const bruttoJahr = brutto * f

  const bbgRV = (eingabe.westOst === 'ost' ? params.rvBbgOst : params.rvBbgWest) / f
  const bbgAlv = params.alvBbg / f
  const bbgKV = params.kvBbg / f
  const lstJahr = aufJahr(lst, lzz)

  const effLstRate = brutto > 0 ? (lst / brutto) * 100 : 0
  const kvZusatz = eingabe.kvZusatzbeitragProzent ?? 0
  const rvSatzAN = params.rvSatzGesamt / 2
  const alvSatzAN = params.alvSatzGesamt / 2
  const kvSatzAN = params.kvBasisSatzGesamt / 2 + kvZusatz / 2

  const fmt = formatEUR

  return {
    brutto: f !== 1
      ? `${fmt(brutto)} × ${f} = ${fmt(bruttoJahr)} EUR/J`
      : `${fmt(brutto)} EUR (Jahresbetrag direkt eingegeben)`,
    lst: `§ 32a EStG · STKL ${eingabe.steuerklasse} · Eff. ${formatProzent(effLstRate)}`,
    solz: `${fmt(lstJahr)} EUR/J × 5,5 % · Freigrenze/J: ${fmt(params.solzFreigrenze)} EUR`,
    kirch: `${fmt(lstJahr)} EUR/J × ${eingabe.kirchensteuerSatz ?? 9} % · § 51a EStG`,
    rv: `min(${fmt(brutto)}; ${fmt(bbgRV)}) × ${rvSatzAN.toFixed(1)} % AN-Anteil`,
    alv: `min(${fmt(brutto)}; ${fmt(bbgAlv)}) × ${alvSatzAN.toFixed(1)} % AN-Anteil`,
    kv: `min(${fmt(brutto)}; ${fmt(bbgKV)}) × ${kvSatzAN.toFixed(2)} % AN-Anteil`,
    pv: `min(${fmt(brutto)}; ${fmt(bbgKV)}) × PV-Satz · § 55 SGB XI`,
    total: `Σ LSt + SolZ${eingabe.kirchensteuer ? ' + KiSt' : ''} + RV + ALV + KV + PV`,
    netto: `${fmt(brutto)} − ${fmt(erg.gesamtAbzuege)} = ${fmt(erg.netto)} EUR netto`,
  }
}

function zeigeErgebnis(erg: LohnsteuerErgebnis, eingabe: LohnsteuerEingabe, auditId: string): void {
  const lzz = eingabe.lohnZZ

  // Header
  $('result-period').textContent = lzzName(lzz)

  // Formeln berechnen
  const formeln = berechneFormelTexte(erg, eingabe)

  // Brutto
  $('r-brutto').textContent = formatEUR(erg.bruttolohn) + ' EUR'
  $('r-brutto-formula').textContent = formeln.brutto

  // Steuern
  $('r-lst').textContent = formatEUR(erg.lohnsteuer) + ' EUR'
  $('r-lst-formula').textContent = formeln.lst

  $('r-solz').textContent = formatEUR(erg.solidaritaetszuschlag) + ' EUR'
  $('r-solz-formula').textContent = formeln.solz

  // Kirchensteuer (nur wenn aktiv)
  if (eingabe.kirchensteuer) {
    $('row-kirch').style.display = ''
    $('r-kirch').textContent = formatEUR(erg.kirchensteuer) + ' EUR'
    $('r-kirch-formula').textContent = formeln.kirch
  } else {
    $('row-kirch').style.display = 'none'
  }

  // Sozialversicherung
  $('r-rv').textContent = formatEUR(erg.rentenversicherung) + ' EUR'
  $('r-rv-formula').textContent = formeln.rv

  $('r-alv').textContent = formatEUR(erg.arbeitslosenversicherung) + ' EUR'
  $('r-alv-formula').textContent = formeln.alv

  $('r-kv').textContent = formatEUR(erg.krankenversicherung) + ' EUR'
  $('r-kv-formula').textContent = formeln.kv

  $('r-pv').textContent = formatEUR(erg.pflegeversicherung) + ' EUR'
  $('r-pv-formula').textContent = formeln.pv

  // Summen
  $('r-total').textContent = formatEUR(erg.gesamtAbzuege) + ' EUR'
  $('r-total-formula').textContent = formeln.total

  $('r-netto').textContent = formatEUR(erg.netto) + ' EUR'
  $('r-netto-formula').textContent = formeln.netto

  $('r-quote').textContent = formatProzent(erg.belastungsquote)

  // Sonstige Bezüge (Einmalzahlungen)
  const rowSonstb = document.getElementById('section-sonstbez') as HTMLElement | null
  if (rowSonstb) {
    if (erg.sonsteBezuege) {
      const sb = erg.sonsteBezuege
      rowSonstb.style.display = ''
      const setCell = (id: string, val: string) => {
        const el = document.getElementById(id)
        if (el) el.textContent = val
      }
      setCell('r-sonstb-betrag', formatEUR(sb.betrag) + ' EUR')
      setCell('r-sonstb-jre4', formatEUR(sb.jre4) + ' EUR')
      setCell('r-sonstb-lst', formatEUR(sb.lohnsteuer) + ' EUR')
      setCell('r-sonstb-solz', formatEUR(sb.solz) + ' EUR')
      setCell('r-sonstb-kirch', formatEUR(sb.kirchensteuer) + ' EUR')
      setCell('r-sonstb-gesamt', formatEUR(sb.gesamtAbzuege) + ' EUR')
      setCell('r-sonstb-netto', formatEUR(sb.betrag - sb.gesamtAbzuege) + ' EUR')
    } else {
      rowSonstb.style.display = 'none'
    }
  }

  // Grenzsteuersatz
  const gs = erg.grenzsteuersatz
  const rowGrenz = document.getElementById('row-grenzsteuersatz') as HTMLElement | null
  if (rowGrenz) {
    $('r-grenz-lst').textContent = `LSt ${formatProzent(gs.grenzsteuersatzLst)}`
    $('r-grenz-gesamt').textContent = `Gesamt ${formatProzent(gs.grenzsteuersatzGesamt)}`
  }

  // Minijob
  const secMinijob = document.getElementById('section-minijob') as HTMLElement | null
  if (secMinijob) {
    if (erg.isMinijob) {
      secMinijob.style.display = ''
      const brutto = eingabe.bruttolohn
      const setMini = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }
      setMini('r-minijob-lst-eur', `${formatEUR(brutto * 0.02)} EUR`)
      setMini('r-minijob-rv-eur', `${formatEUR(brutto * 0.15)} EUR`)
      setMini('r-minijob-kv-eur', `${formatEUR(brutto * 0.13)} EUR`)
    } else {
      secMinijob.style.display = 'none'
    }
  }

  // Midijob
  const secMidijob = document.getElementById('section-midijob') as HTMLElement | null
  if (secMidijob) {
    if (erg.isMidijob && erg.midijobInfo) {
      secMidijob.style.display = ''
      const mi = erg.midijobInfo
      const setMi = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }
      setMi('r-midijob-brutto', `${formatEUR(mi.bruttolohnMt)} EUR/Monat`)
      setMi('r-midijob-bpe', `${formatEUR(mi.bpeJahr)} EUR/Jahr`)
      setMi('r-midijob-ersparnis', `${formatEUR(mi.svReduktionJahr)} EUR/Jahr`)
    } else {
      secMidijob.style.display = 'none'
    }
  }

  // Abfindung
  const secAbf = document.getElementById('section-abfindung') as HTMLElement | null
  if (secAbf) {
    if (erg.abfindung) {
      const af = erg.abfindung
      secAbf.style.display = ''
      const setAbf = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val }
      setAbf('r-abf-betrag', `${formatEUR(af.betrag)} EUR`)
      setAbf('r-abf-jre4', `JRE4: ${formatEUR(af.jre4)} EUR`)
      setAbf('r-abf-lst-basis', `${formatEUR(af.lstBasis)} EUR`)
      setAbf('r-abf-lst-fuenftel', `${formatEUR(af.lstFuenftelzusatz)} EUR`)
      setAbf('r-abf-lst', `${formatEUR(af.lstAbfindung)} EUR`)
      setAbf('r-abf-solz', `${formatEUR(af.solz)} EUR`)
      setAbf('r-abf-kirch', `${formatEUR(af.kirchensteuer)} EUR`)
      setAbf('r-abf-gesamt', `${formatEUR(af.gesamtAbzuege)} EUR`)
      setAbf('r-abf-effektiv', `effektiv: ${formatProzent(af.effektiverSteuersatz)}`)
      setAbf('r-abf-netto', `${formatEUR(af.betrag - af.gesamtAbzuege)} EUR`)
    } else {
      secAbf.style.display = 'none'
    }
  }

  // Audit-ID
  $('audit-id').textContent = auditId

  console.log('✅ Berechnung:', {
    brutto: erg.bruttolohn,
    lst: erg.lohnsteuer,
    netto: erg.netto,
    quote: erg.belastungsquote.toFixed(2) + '%',
  })
}

// ============================================================================
// MODAL
// ============================================================================

function showModal(title: string, body: string): void {
  $('modal-title').textContent = title
  $('modal-body').innerHTML = body
  $('modal').classList.add('show')
}

function closeModal(): void {
  $('modal').classList.remove('show')
}

(window as any).closeModal = closeModal

function showPAPInfo(papKey: string): void {
  const info = PAP_INFO[papKey]
  if (!info) return

  let html = `
    <div style="margin-bottom: 12px">
      <strong>Rechtsgrundlage:</strong> ${info.paragraf}
    </div>
    <div style="white-space: pre-wrap; line-height: 1.7">${info.beschreibung}</div>
  `

  if (info.beispiel) {
    html += `
      <div class="info-box" style="margin-top: 12px">
        <strong>Beispiel:</strong><br>${info.beispiel}
      </div>
    `
  }

  showModal(info.titel, html)
}

// Audit-Trail Modal
function showAuditTrail(): void {
  if (!lastResult) {
    showModal('Audit-Trail', '<p>Noch keine Berechnung durchgeführt.</p>')
    return
  }

  let html = `
    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px">
      Vollständige Berechnungsschritte für Nachvollziehbarkeit
    </p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Schritt</th>
          <th>Eingabe</th>
          <th>Ergebnis</th>
          <th>PAP-Ref.</th>
        </tr>
      </thead>
      <tbody>
  `

  for (const s of lastResult.schritte) {
    html += `
      <tr>
        <td>${s.nr}</td>
        <td>
          <strong>${s.titel}</strong><br>
          <span style="font-size: 11px; color: var(--text-muted)">${s.beschreibung}</span>
          ${s.formel ? `<br><code>${s.formel}</code>` : ''}
        </td>
        <td style="font-size: 11px">${s.eingabe}</td>
        <td style="font-size: 11px"><strong>${s.ergebnis}</strong></td>
        <td style="font-size: 10px"><code>${s.papReferenz}</code></td>
      </tr>
    `
  }

  html += '</tbody></table>'
  showModal('Audit-Trail', html)
}

(window as any).showAuditTrail = showAuditTrail

// ============================================================================
// PARAMETER-PANEL
// ============================================================================

function rendereParameter(): void {
  const p = currentParams
  $('params-year').textContent = String(p.jahr)

  let html = `
    <h3>Tarif (Jahreswerte)</h3>
    <table class="params-table">
      <tr><th>Parameter</th><th style="text-align: right">Wert</th><th>Quelle</th></tr>
      <tr><td>Grundfreibetrag (Zone A)</td><td class="value">${formatEUR(p.grundfreibetrag)} EUR</td><td>§ 32a EStG</td></tr>
      <tr><td>1. Progressionszone (Zone B bis)</td><td class="value">${formatEUR(p.zoneB_max)} EUR</td><td>PAP S. 12</td></tr>
      <tr><td>2. Progressionszone (Zone C bis)</td><td class="value">${formatEUR(p.zoneC_max)} EUR</td><td>PAP S. 12</td></tr>
      <tr><td>Linearzone 42% (Zone D bis)</td><td class="value">277.825 EUR</td><td>PAP S. 12</td></tr>
      <tr><td>Solidaritätszuschlag-Freigrenze</td><td class="value">${formatEUR(p.solzFreigrenze)} EUR</td><td>§ 5 SolzG</td></tr>
      <tr><td>Kinderfreibetrag (pro Kind)</td><td class="value">${formatEUR(p.kinderfreibetragJahr)} EUR</td><td>§ 32 EStG</td></tr>
    </table>

    <h3>Sozialversicherung (Sätze in %)</h3>
    <table class="params-table">
      <tr><th>Versicherung</th><th style="text-align: right">Gesamt-Satz</th><th style="text-align: right">AN-Satz</th><th>BBG (Jahr)</th></tr>
      <tr><td>Rentenversicherung West</td><td class="value">${p.rvSatzGesamt}%</td><td class="value">${(p.rvSatzGesamt / 2).toFixed(2)}%</td><td class="value">${formatEUR(p.rvBbgWest)}</td></tr>
      <tr><td>Rentenversicherung Ost</td><td class="value">${p.rvSatzGesamt}%</td><td class="value">${(p.rvSatzGesamt / 2).toFixed(2)}%</td><td class="value">${formatEUR(p.rvBbgOst)}</td></tr>
      <tr><td>Arbeitslosenversicherung</td><td class="value">${p.alvSatzGesamt}%</td><td class="value">${(p.alvSatzGesamt / 2).toFixed(2)}%</td><td class="value">${formatEUR(p.alvBbg)}</td></tr>
      <tr><td>Krankenversicherung (Basis)</td><td class="value">${p.kvBasisSatzGesamt}%</td><td class="value">${(p.kvBasisSatzGesamt / 2).toFixed(2)}%</td><td class="value">${formatEUR(p.kvBbg)}</td></tr>
      <tr><td>Pflegeversicherung (Basis)</td><td class="value">${p.pvBasisSatzGesamt}%</td><td class="value">${(p.pvBasisSatzGesamt / 2).toFixed(2)}%</td><td class="value">${formatEUR(p.kvBbg)}</td></tr>
    </table>

    <h3>Pflegeversicherung-Modifikatoren</h3>
    <table class="params-table">
      <tr><th>Modifikator</th><th style="text-align: right">Wert</th><th>Bedingung</th></tr>
      <tr><td>Zuschlag Kinderlose</td><td class="value">+${p.pvZuschlagKinderlos}%</td><td>Ab 23 Jahren ohne Kinder</td></tr>
      <tr><td>Abschlag pro Kind</td><td class="value">-${p.pvAbschlagProKind}%</td><td>Ab 2. Kind, max. -1,00%</td></tr>
      <tr><td>Sachsen-Zuschlag</td><td class="value">+${p.pvSachsenZuschlag}%</td><td>Wohnsitz Sachsen</td></tr>
    </table>

    <div class="info-box" style="margin-top: 16px">
      <strong>Hinweis:</strong> Werte sind aus PAP ${p.jahr} (offizielle Veröffentlichung BMF) übernommen.
      Edit-Funktionalität wird in einer späteren Version implementiert.
    </div>
  `

  $('params-content').innerHTML = html
}

// ============================================================================
// AUDIT-TAB
// ============================================================================

function rendereAudit(): void {
  if (auditHistory.length === 0) {
    $('audit-list').innerHTML = '<p style="color: var(--text-muted); padding: 12px">Noch keine Berechnungen durchgeführt.</p>'
    return
  }

  let html = `
    <table class="results">
      <thead>
        <tr>
          <th>Audit-ID</th>
          <th>Zeit</th>
          <th>Brutto</th>
          <th>STKL</th>
          <th>Netto</th>
          <th>Quote</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
  `

  for (let i = auditHistory.length - 1; i >= 0; i--) {
    const e = auditHistory[i]
    html += `
      <tr>
        <td><code style="font-size: 10px">${e.id}</code></td>
        <td>${e.timestamp.toLocaleTimeString('de-DE')}</td>
        <td class="value">${formatEUR(e.eingabe.bruttolohn)} EUR</td>
        <td>${e.eingabe.steuerklasse}</td>
        <td class="value">${formatEUR(e.ergebnis.netto)} EUR</td>
        <td class="value">${formatProzent(e.ergebnis.belastungsquote)}</td>
        <td><button class="small-button outline" onclick="zeigeAuditDetails(${i})">Details</button></td>
      </tr>
    `
  }

  html += '</tbody></table>'
  $('audit-list').innerHTML = html
}

(window as any).zeigeAuditDetails = (index: number) => {
  const e = auditHistory[index]
  if (!e) return

  let html = `
    <h3>Eingabe</h3>
    <table>
      <tr><td>Bruttolohn</td><td>${formatEUR(e.eingabe.bruttolohn)} EUR (${lzzName(e.eingabe.lohnZZ)})</td></tr>
      <tr><td>Steuerklasse</td><td>${e.eingabe.steuerklasse}</td></tr>
      <tr><td>Kinderfreibeträge</td><td>${e.eingabe.kinderfreibetraege}</td></tr>
      <tr><td>Region</td><td>${e.eingabe.westOst}</td></tr>
    </table>

    <h3 style="margin-top: 14px">Berechnungsschritte</h3>
    <table>
      <thead>
        <tr><th>#</th><th>Schritt</th><th>Eingabe</th><th>Ergebnis</th><th>Ref.</th></tr>
      </thead>
      <tbody>
  `

  for (const s of e.ergebnis.schritte) {
    html += `
      <tr>
        <td>${s.nr}</td>
        <td><strong>${s.titel}</strong><br><span style="font-size: 10px; color: var(--text-muted)">${s.beschreibung}</span>${s.formel ? `<br><code>${s.formel}</code>` : ''}</td>
        <td style="font-size: 11px">${s.eingabe}</td>
        <td style="font-size: 11px"><strong>${s.ergebnis}</strong></td>
        <td style="font-size: 10px"><code>${s.papReferenz}</code></td>
      </tr>
    `
  }

  html += '</tbody></table>'
  showModal(`Audit-Trail · ${e.id}`, html)
}

// ============================================================================
// PAP-IMPORT
// ============================================================================

function setupPAPImport(): void {
  const fileInput = $i('pap-file')
  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const text = await file.text()

    // Vereinfachte Regex-Extraktion
    const grundfreibetragMatch = text.match(/Grundfreibetrag[:\s]*(?:EUR\s+)?(\d+(?:[.\s]\d{3})*(?:,\d{2})?)/i)
    const rvBbgMatch = text.match(/Rentenversicherung[\s\S]{0,200}?Beitragsbemessungsgrenze[\s\S]{0,100}?(\d+(?:[.\s]\d{3})*)/i)
    const kvBbgMatch = text.match(/Krankenversicherung[\s\S]{0,200}?Beitragsbemessungsgrenze[\s\S]{0,100}?(\d+(?:[.\s]\d{3})*)/i)
    const solzMatch = text.match(/Solidaritätszuschlag[\s\S]{0,200}?Freigrenze[\s\S]{0,100}?(\d+(?:[.\s]\d{3})*)/i)

    const parseGermanNumber = (s: string): number => {
      return parseFloat(s.replace(/[.\s]/g, '').replace(',', '.'))
    }

    let html = `
      <h3>Erkannte Parameter aus "${file.name}"</h3>
      <table class="params-table">
        <thead>
          <tr><th>Parameter</th><th style="text-align: right">Aktuell (${currentYear})</th><th style="text-align: right">Erkannt</th><th>Status</th></tr>
        </thead>
        <tbody>
    `

    const checks = [
      { label: 'Grundfreibetrag', match: grundfreibetragMatch, current: currentParams.grundfreibetrag },
      { label: 'RV-BBG', match: rvBbgMatch, current: currentParams.rvBbgWest },
      { label: 'KV-BBG', match: kvBbgMatch, current: currentParams.kvBbg },
      { label: 'SolZ-Freigrenze', match: solzMatch, current: currentParams.solzFreigrenze },
    ]

    let foundCount = 0
    for (const check of checks) {
      const val = check.match ? parseGermanNumber(check.match[1]) : null
      const status = val === null ? '✗ nicht gefunden' : val === check.current ? '✓ unverändert' : '🔄 abweichend'
      const color = val === null ? 'var(--text-faded)' : val === check.current ? 'var(--success)' : 'var(--warning)'

      if (val !== null) foundCount++

      html += `
        <tr>
          <td>${check.label}</td>
          <td class="value">${formatEUR(check.current)}</td>
          <td class="value">${val !== null ? formatEUR(val) : '—'}</td>
          <td style="color: ${color}; font-weight: 600">${status}</td>
        </tr>
      `
    }

    html += `
        </tbody>
      </table>
      <div class="info-box" style="margin-top: 14px">
        <strong>${foundCount} von ${checks.length}</strong> Parametern gefunden.
        ${foundCount < checks.length ? 'Für intelligentere Extraktion bitte Claude API einrichten (siehe PHASE_5_INTEGRATION_GUIDE.md).' : ''}
      </div>
    `

    $('pap-results').innerHTML = html
  })
}

// ============================================================================
// DOKUMENTATION – MD-ANLAGEN
// ============================================================================

const MD_MAP: Record<string, string> = {
  analyse: analyseMd,
  mapping: mappingMd,
  technisch: technischMd,
  konzept: konzeptMd,
  uebersicht: uebersichtMd,
  handbuch: handbuchMd,
  readme: readmeMd,
  'readme-analyse': readmeAnalyseMd,
  index: indexMd,
  quickstart: quickstartMd,
  roadmap: roadmapMd,
  'phase5-summary': phase5SummaryMd,
  'phase5-guide': phase5GuideMd,
  'phase5-setup': phase5SetupMd,
  'phase5-complete': phase5CompleteMd,
  'phase5-ref': phase5RefMd,
}

function oeffneDokument(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    // Fallback: show in modal
    showModal(filename, `<pre style="white-space:pre-wrap;font-size:12px;font-family:monospace">${content.replace(/</g, '&lt;')}</pre>`)
  }
}

function setupDokumentationLinks(): void {
  document.querySelectorAll('a[data-md]').forEach(el => {
    const key = (el as HTMLElement).dataset.md ?? ''
    const content = MD_MAP[key]
    if (content) {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        oeffneDokument(content, key + '.md')
      })
    }
  })
}

// ============================================================================
// TAB-NAVIGATION
// ============================================================================

function setupTabs(): void {
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab!
      // Tab-Button aktiv setzen
      document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      // Tab-Inhalt anzeigen
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
      $(`tab-${tab}`).classList.remove('hidden')

      // Tab-spezifische Aktion
      if (tab === 'parameter') rendereParameter()
      if (tab === 'audit') rendereAudit()
    })
  })
}

// ============================================================================
// INIT
// ============================================================================

function updateDynamicFields(): void {
  const stkl = parseInt($s('stkl').value)
  const kvGesl = $s('kvGesetzlich').value === '1'

  // Faktor4: nur bei STKL IV
  const rowFaktor4 = document.getElementById('row-faktor4') as HTMLElement | null
  if (rowFaktor4) rowFaktor4.style.display = stkl === 4 ? '' : 'none'

  // GKV-Felder: nur bei gesetzlicher KV
  const rowKvZusatz = document.getElementById('row-kv-zusatz') as HTMLElement | null
  if (rowKvZusatz) rowKvZusatz.style.display = kvGesl ? '' : 'none'

  // PKV-Monatsbeitrag: nur bei privater KV
  const rowPkvMonat = document.getElementById('row-pkv-monat') as HTMLElement | null
  if (rowPkvMonat) rowPkvMonat.style.display = !kvGesl ? '' : 'none'
}

function setupEventListeners(): void {
  const fields = [
    'lohnZZ', 'stkl', 'bruttolohn', 'freibetrag', 'kinder', 'geburtsjahr',
    'rvVersichert', 'kvGesetzlich', 'kvZusatz', 'pvKinderlos', 'pvSachsen',
    'westOst', 'kirchensteuer',
    'vJBrutto', 'sonsteBezuege', 'faktor4', 'kvMonatPKV',
    'beschaeftigungsform', 'abfindung', 'mehrjBezuege',
  ]

  for (const id of fields) {
    const el = document.getElementById(id)
    if (el) {
      el.addEventListener('input', berechne)
      el.addEventListener('change', berechne)
    }
  }

  // Dynamische Feldanzeige bei STKL- und KV-Wechsel
  $s('stkl').addEventListener('change', updateDynamicFields)
  $s('kvGesetzlich').addEventListener('change', updateDynamicFields)

  // Year-Wechsel
  $s('yearSelect').addEventListener('change', () => {
    currentYear = parseInt($s('yearSelect').value)
    currentParams = PARAMETER[currentYear]
    berechne()
  })

  // PAP-Badges Click → Modal
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('pap-badge')) {
      const key = target.dataset.pap
      if (key) showPAPInfo(key)
    }
  })
}

(window as any).resetForm = () => {
  $i('bruttolohn').value = '5000'
  $s('lohnZZ').value = '2'
  $s('stkl').value = '1'
  $i('freibetrag').value = '0'
  $i('kinder').value = '0'
  $i('geburtsjahr').value = ''
  $s('rvVersichert').value = '1'
  $s('kvGesetzlich').value = '1'
  $i('kvZusatz').value = '2.5'
  $s('pvKinderlos').value = '0'
  $s('pvSachsen').value = '0'
  $s('westOst').value = 'west'
  $s('kirchensteuer').value = '0'
  $s('beschaeftigungsform').value = 'normal'
  $i('abfindung').value = ''
  $i('mehrjBezuege').value = ''
  berechne()
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs()
  setupEventListeners()
  updateDynamicFields()
  setupPAPImport()
  setupDokumentationLinks()
  berechne()
  console.log('✅ LexLohnRechner v2.0 geladen')
})

// Auch sofort init falls DOM bereits ready
if (document.readyState !== 'loading') {
  setupTabs()
  setupEventListeners()
  setupPAPImport()
  setupDokumentationLinks()
  berechne()
  console.log('✅ LexLohnRechner v2.0 geladen (sofort)')
}
