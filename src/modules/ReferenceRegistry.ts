/**
 * ReferenceRegistry-Modul
 * Zentrale Verwaltung von PAP-Quellenangaben
 *
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf
 * Ziel: Transparenz und Nachvollziehbarkeit jeder Berechnung
 */

import type { PAPReference } from '../types/index.js'

export class ReferenceRegistry {
  private references: Map<string, PAPReference> = new Map()

  constructor() {
    this.initializeReferences()
  }

  /**
   * Initialisiert alle Quellenangaben für Lohnsteuerberechnung 2026
   */
  private initializeReferences(): void {
    // === TARIFBERECHNUNG ===
    this.register('calculateTariff', {
      function: 'calculateTariff',
      description: 'Einkommensteuertarif 2026 nach § 32a EStG',
      pap_page: 12,
      pap_steps: '6.1-6.3',
      law: '§ 32a EStG',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Zone A: 0 EUR bis 11.600 EUR - Befreit',
        'Zone B: 11.600 bis 62.810 EUR - Progressive Besteuerung (Formel: (889,75*y + 18,90)*y)',
        'Zone C: 62.810 bis 186.000 EUR - 42% + konstanter Abzug',
        'Zone D: ab 186.000 EUR - 45% + konstanter Abzug',
      ],
      note: 'Tarifwerte aktualisiert für Steuerjahr 2026',
    })

    // === KINDERFREIBETRAG ===
    this.register('applyChildAllowance', {
      function: 'applyChildAllowance',
      description: 'Abzug Kinderfreibeträge (2 x 230 EUR/Monat = 5.520 EUR/Jahr)',
      pap_page: 10,
      pap_steps: '4.1',
      law: '§ 32 Abs. 6 EStG (Kinderfreibetrag)',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: ['KFB pro Kind = 5.520 EUR/Jahr = 460 EUR/Monat'],
    })

    // === SOLIDARITÄTSZUSCHLAG ===
    this.register('calculateSolidarity', {
      function: 'calculateSolidarity',
      description: 'Solidaritätszuschlag 5,5% mit erhöhter Freigrenze',
      pap_page: 16,
      pap_steps: '7.1',
      law: '§ 5 SolzG (Solidaritätszuschlaggesetz)',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Freigrenze 2026: 20.350 EUR (neu erhöht durch SteFeG)',
        'SZ = LSt * 0,055 wenn LSt > Freigrenze, sonst 0',
      ],
      note: 'Freigrenze erhöht von 16.956 EUR (2025) auf 20.350 EUR (2026)',
    })

    // === KIRCHENSTEUER ===
    this.register('calculateChurchTax', {
      function: 'calculateChurchTax',
      description: 'Kirchensteuer 8% oder 9% auf Lohnsteuer',
      pap_page: 17,
      pap_steps: '8.1-8.2',
      law: '§ 51a EStG',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'KiSt (8%) = LSt * 0,08',
        'KiSt (9%) = LSt * 0,09',
        'KiSt wird nur berechnet wenn Religionszugehörigkeit erfasst',
      ],
    })

    // === RENTENVERSICHERUNG ===
    this.register('calculateRV', {
      function: 'calculateRV',
      description: 'Rentenversicherungsbeitrag (18,6%)',
      pap_page: 7,
      pap_steps: '3.1',
      law: '§ 168 SGB VI',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'RV-Satz 2026: 18,6% (9,3% Arbeitnehmer)',
        'Beitragsbemessungsgrenze West: 101.400 EUR',
        'Beitragsbemessungsgrenze Ost: 107.100 EUR',
      ],
    })

    // === ARBEITSLOSENVERSICHERUNG ===
    this.register('calculateALV', {
      function: 'calculateALV',
      description: 'Arbeitslosenversicherungsbeitrag (2,6%)',
      pap_page: 7,
      pap_steps: '3.2',
      law: '§ 341 SGB III',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'ALV-Satz 2026: 2,6% (Arbeitnehmer)',
        'Beitragsbemessungsgrenze: 101.400 EUR',
      ],
    })

    // === KRANKENVERSICHERUNG ===
    this.register('calculateKV', {
      function: 'calculateKV',
      description: 'Krankenversicherungsbeitrag (7,0% Basis + Zusatzbeitrag)',
      pap_page: 8,
      pap_steps: '3.3',
      law: '§ 242 SGB V, § 242a SGB V (Zusatzbeitrag)',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'KV-Basisbeitrag 2026: 14,0% (7,0% AN)',
        'Zusatzbeitrag kassenindividuell: durchschnittlich ~2,5%',
        'Beitragsbemessungsgrenze: 69.750 EUR',
      ],
      note: 'Zusatzbeitrag variiert je Krankenkasse',
    })

    // === PFLEGEVERSICHERUNG ===
    this.register('calculatePV', {
      function: 'calculatePV',
      description: 'Pflegeversicherungsbeitrag (3,6% Basis)',
      pap_page: 8,
      pap_steps: '3.4',
      law: '§ 55 SGB XI',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'PV-Basisbeitrag 2026: 3,60% (1,8% AN)',
        'Zuschlag kinderlos (ab 23): +0,6%',
        'Abschlag pro Kind: -0,25%',
        'Sachsen-Zuschlag: +0,75%',
      ],
    })

    // === ALTERSENTLASTUNG ===
    this.register('applyAltersEntlastung', {
      function: 'applyAltersEntlastung',
      description:
        'Altersentlastungsbetrag (§ 24a EStG) - Reduktion ab Alter 64',
      pap_page: 11,
      pap_steps: '5.1',
      law: '§ 24a EStG',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Geburtsjahr <= 1962: 40% des Arbeitslohns (bis 76.200 EUR im Jahr)',
        'Geburtsjahr 1963-1972: staffelweise Reduktion 38% bis 5%',
        'Geburtsjahr >= 1973: kein Altersentlastungsbetrag',
      ],
      note: 'Komplexe Berechnung mit Staffelung je Geburtsjahr',
    })

    // === GRENZBELASTUNG ===
    this.register('calculateMarginalRate', {
      function: 'calculateMarginalRate',
      description: 'Grenzbelastung (marginal rate) für EUR-Zuwachs',
      pap_page: 19,
      pap_steps: '9.1',
      law: '§ 32a EStG',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: ['Grenzbelastung = (LSt(E+Zuwachs) - LSt(E)) / Zuwachs'],
      note: 'Wichtig für Investitionsentscheidungen',
    })

    // === SONDERZAHLUNGEN ===
    this.register('applySonderEinkuenfte', {
      function: 'applySonderEinkuenfte',
      description: 'Sonderzahlungen und Gratifikationen',
      pap_page: 10,
      pap_steps: '4.2',
      law: '§ 39 Abs. 1 Nr. 2 EStG',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: ['SONSTB = Sonderzahlungen werden zum Bruttolohn addiert'],
    })

    // === ABFINDUNGEN ===
    this.register('applyAbfindung', {
      function: 'applyAbfindung',
      description: 'Abfindungen mit Fünftel-Regelung',
      pap_page: 10,
      pap_steps: '4.3',
      law: '§ 34 EStG (Fünftel-Regelung)',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Tariferm. = 5 * Steuer auf (Einkommen + 1/5 Entschädigung)',
        'minus 4-facher Steuer auf Einkommen = Steuer auf Entschädigung',
      ],
      note: 'Begünstigte Besteuerung für Abfindungen und Entschädigungen',
    })

    // === MINIJOB ===
    this.register('applyMinijobLogic', {
      function: 'applyMinijobLogic',
      description: 'Minijob-Regelung (≤520 EUR/Monat)',
      pap_page: 8,
      pap_steps: '2.5',
      law: '§ 8 SGB IV, § 428 SGB III',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Grenze 2026: 520 EUR/Monat',
        'Lohnsteuer: 2% pauschal (wenn gewählt)',
        'RV: 3,6% pauschal, ALV: 1,3% pauschal',
        'KV: abhängig von Lohnsteuerbefreiung',
      ],
    })

    // === GLEITZONE ===
    this.register('applyGleitzoneLogic', {
      function: 'applyGleitzoneLogic',
      description: 'Gleitzone (520-1.500 EUR/Monat)',
      pap_page: 9,
      pap_steps: '2.6',
      law: '§ 163 SGB VI, § 20 SGB IV',
      source_file: '2025-11-12-PAP-2026-anlage-1.pdf',
      key_formulas: [
        'Grenzen 2026: 520 EUR - 1.500 EUR/Monat',
        'Abgestufte RV-Beiträge (Beitragszuschuss Arbeitgeber)',
        'ALV: voller Beitrag',
        'KV: regulärer Beitrag',
      ],
      note: 'Reduzierte Beitragslast für Arbeitnehmer in Gleitzone',
    })
  }

  /**
   * Registriert einen neuen Quellenangabe
   */
  register(key: string, reference: PAPReference): void {
    this.references.set(key, reference)
  }

  /**
   * Holt eine Quellenangabe
   */
  getReference(key: string): PAPReference | undefined {
    return this.references.get(key)
  }

  /**
   * Gibt alle Quellenangaben zurück
   */
  getAllReferences(): Map<string, PAPReference> {
    return new Map(this.references)
  }

  /**
   * Exportiert alle Referenzen als Objekt (für UI/Export)
   */
  exportAsObject(): Record<string, PAPReference> {
    const result: Record<string, PAPReference> = {}
    for (const [key, value] of this.references.entries()) {
      result[key] = value
    }
    return result
  }

  /**
   * Gibt Referenz als Markdown-String formatiert
   */
  formatAsMarkdown(key: string): string {
    const ref = this.references.get(key)
    if (!ref) return `Reference "${key}" not found`

    let md = `### ${ref.function}\n\n`
    md += `**${ref.description}**\n\n`
    md += `- **PAP Seite:** ${ref.pap_page}`
    if (ref.pap_steps) md += `, Schritte: ${ref.pap_steps}`
    md += `\n`
    md += `- **Rechtliche Grundlage:** ${ref.law}\n`
    if (ref.key_formulas && ref.key_formulas.length > 0) {
      md += `- **Formeln:**\n`
      for (const formula of ref.key_formulas) {
        md += `  - ${formula}\n`
      }
    }
    if (ref.note) {
      md += `- **Hinweis:** ${ref.note}\n`
    }

    return md
  }

  /**
   * Holt alle Referenzen für eine bestimmte PAP-Seite
   */
  getByPage(page: number): PAPReference[] {
    const results: PAPReference[] = []
    for (const ref of this.references.values()) {
      if (ref.pap_page === page) {
        results.push(ref)
      }
    }
    return results
  }

  /**
   * Sucht Referenzen nach Stichwort
   */
  searchByKeyword(keyword: string): PAPReference[] {
    const lower = keyword.toLowerCase()
    const results: PAPReference[] = []

    for (const ref of this.references.values()) {
      if (
        ref.description.toLowerCase().includes(lower) ||
        ref.law.toLowerCase().includes(lower) ||
        (ref.note && ref.note.toLowerCase().includes(lower))
      ) {
        results.push(ref)
      }
    }

    return results
  }

  /**
   * Generiert HTML-Snippet für UI-Integration
   */
  generateHTMLBadge(key: string): string {
    const ref = this.references.get(key)
    if (!ref) return ''

    return `<span class="pap-reference" title="${ref.description}">
      <span class="pap-icon">ℹ</span>
      <span class="pap-text">PAP S. ${ref.pap_page}</span>
    </span>`
  }

  /**
   * Gibt eine Zusammenfassung aller Referenzen
   */
  generateSummary(): string {
    let summary = '# PAP-Referenz-Zusammenfassung\n\n'
    summary += `**Quelle:** 2025-11-12-PAP-2026-anlage-1.pdf\n`
    summary += `**Gültig für:** Lohnzahlungszeiträume nach 31.12.2025\n\n`
    summary += `**Dokumentierte Funktionen:** ${this.references.size}\n\n`

    const byPage = new Map<number, string[]>()
    for (const [key, ref] of this.references.entries()) {
      if (!byPage.has(ref.pap_page)) {
        byPage.set(ref.pap_page, [])
      }
      byPage.get(ref.pap_page)!.push(key)
    }

    for (const [page, keys] of Array.from(byPage.entries()).sort(
      (a, b) => a[0] - b[0]
    )) {
      summary += `\n## PAP Seite ${page}\n`
      for (const key of keys) {
        const ref = this.references.get(key)!
        summary += `- **${ref.function}**: ${ref.description}\n`
      }
    }

    return summary
  }
}
