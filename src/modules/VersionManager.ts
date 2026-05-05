/**
 * VersionManager-Modul
 * Verwaltung mehrerer Parameter-Sets für verschiedene Steuerjahre
 * Ermöglicht Vergleiche und Changelog-Tracking
 *
 * Zweck:
 * - Mehrjährige Parameter-Verwaltung
 * - Vergleiche zwischen Jahren
 * - Automatische Changelog-Generierung
 * - Identifikation von Änderungen
 */

import type { ParameterSet } from '../types/index.js'

export interface ParameterDifference {
  path: string // z.B. "tariff.grundfreibetrag"
  field_name: string // Lesbare Beschreibung
  old_value: any
  new_value: any
  change_type: 'added' | 'removed' | 'changed'
  law_reference?: string
  impact: 'high' | 'medium' | 'low'
}

export interface VersionChangeLog {
  from_year: number
  to_year: number
  published_date: string
  differences: ParameterDifference[]
  summary: {
    total_changes: number
    high_impact_changes: number
    affected_areas: string[]
  }
}

export class VersionManager {
  private versions: Map<number, ParameterSet> = new Map()
  private changelogs: Map<string, VersionChangeLog> = new Map()

  /**
   * Registriert einen Parametersatz für ein Jahr
   */
  registerVersion(parameters: ParameterSet): void {
    this.versions.set(parameters.jahr, parameters)
  }

  /**
   * Holt einen Parametersatz für ein Jahr
   */
  getVersion(year: number): ParameterSet | undefined {
    return this.versions.get(year)
  }

  /**
   * Gibt alle registrierten Jahre in aufsteigender Reihenfolge aus
   */
  getAvailableYears(): number[] {
    return Array.from(this.versions.keys()).sort((a, b) => a - b)
  }

  /**
   * Erstellt einen neuen Parametersatz als Kopie eines bestehenden
   * (Vorlage für neues Jahr)
   */
  createNewVersionFromTemplate(
    sourceYear: number,
    newYear: number
  ): ParameterSet {
    const source = this.getVersion(sourceYear)
    if (!source) {
      throw new Error(`Quell-Version für Jahr ${sourceYear} nicht gefunden`)
    }

    // Deep copy
    const newVersion: ParameterSet = JSON.parse(JSON.stringify(source))
    newVersion.jahr = newYear
    newVersion.version = `${newYear}.0.0`
    newVersion.valid_from = `${newYear}-01-01`
    newVersion.valid_to = `${newYear}-12-31`
    newVersion.pap_publication_date = new Date().toISOString().split('T')[0]

    return newVersion
  }

  /**
   * Vergleicht zwei Parameter-Sets und gibt alle Unterschiede zurück
   */
  compareVersions(year1: number, year2: number): VersionChangeLog {
    const cacheKey = `${year1}-${year2}`

    if (this.changelogs.has(cacheKey)) {
      return this.changelogs.get(cacheKey)!
    }

    const v1 = this.getVersion(year1)
    const v2 = this.getVersion(year2)

    if (!v1 || !v2) {
      throw new Error(
        `Versionen für Vergleich ${year1}/${year2} nicht gefunden`
      )
    }

    const differences: ParameterDifference[] = []

    // Tarifvergleich
    if (
      JSON.stringify(v1.tariff.formeln) !==
      JSON.stringify(v2.tariff.formeln)
    ) {
      differences.push({
        path: 'tariff.formeln',
        field_name: 'Tarifformeln (§ 32a EStG)',
        old_value: v1.tariff.formeln,
        new_value: v2.tariff.formeln,
        change_type: 'changed',
        law_reference: '§ 32a EStG',
        impact: 'high',
      })
    }

    if (v1.tariff.grundfreibetrag !== v2.tariff.grundfreibetrag) {
      differences.push({
        path: 'tariff.grundfreibetrag',
        field_name: 'Grundfreibetrag',
        old_value: v1.tariff.grundfreibetrag,
        new_value: v2.tariff.grundfreibetrag,
        change_type: 'changed',
        law_reference: '§ 32a EStG',
        impact: 'high',
      })
    }

    // Beitragssätze vergleichen
    if (
      v1.contributions.rv.rate_percent !==
      v2.contributions.rv.rate_percent
    ) {
      differences.push({
        path: 'contributions.rv.rate_percent',
        field_name: 'Rentenversicherung Satz',
        old_value: v1.contributions.rv.rate_percent,
        new_value: v2.contributions.rv.rate_percent,
        change_type: 'changed',
        law_reference: '§ 168 SGB VI',
        impact: 'high',
      })
    }

    if (
      v1.contributions.rv.bemessungsgrenzleWest !==
      v2.contributions.rv.bemessungsgrenzleWest
    ) {
      differences.push({
        path: 'contributions.rv.bemessungsgrenzleWest',
        field_name: 'RV Beitragsbemessungsgrenze (West)',
        old_value: v1.contributions.rv.bemessungsgrenzleWest,
        new_value: v2.contributions.rv.bemessungsgrenzleWest,
        change_type: 'changed',
        law_reference: '§ 168 SGB VI',
        impact: 'medium',
      })
    }

    if (
      v1.contributions.alv.rate_percent !==
      v2.contributions.alv.rate_percent
    ) {
      differences.push({
        path: 'contributions.alv.rate_percent',
        field_name: 'Arbeitslosenversicherung Satz',
        old_value: v1.contributions.alv.rate_percent,
        new_value: v2.contributions.alv.rate_percent,
        change_type: 'changed',
        law_reference: '§ 341 SGB III',
        impact: 'medium',
      })
    }

    if (
      v1.contributions.kv.basis_rate_percent !==
      v2.contributions.kv.basis_rate_percent
    ) {
      differences.push({
        path: 'contributions.kv.basis_rate_percent',
        field_name: 'Krankenversicherung Basisbeitrag',
        old_value: v1.contributions.kv.basis_rate_percent,
        new_value: v2.contributions.kv.basis_rate_percent,
        change_type: 'changed',
        law_reference: '§ 242 SGB V',
        impact: 'medium',
      })
    }

    if (
      v1.contributions.kv.beitragsbemessungsgrenze !==
      v2.contributions.kv.beitragsbemessungsgrenze
    ) {
      differences.push({
        path: 'contributions.kv.beitragsbemessungsgrenze',
        field_name: 'KV Beitragsbemessungsgrenze',
        old_value: v1.contributions.kv.beitragsbemessungsgrenze,
        new_value: v2.contributions.kv.beitragsbemessungsgrenze,
        change_type: 'changed',
        law_reference: '§ 242 SGB V',
        impact: 'medium',
      })
    }

    if (v1.solidarity.freigrenze !== v2.solidarity.freigrenze) {
      differences.push({
        path: 'solidarity.freigrenze',
        field_name: 'Solidaritätszuschlag Freigrenze',
        old_value: v1.solidarity.freigrenze,
        new_value: v2.solidarity.freigrenze,
        change_type: 'changed',
        law_reference: '§ 5 SolzG',
        impact: 'high',
      })
    }

    // Changelog erstellen
    const changelog: VersionChangeLog = {
      from_year: year1,
      to_year: year2,
      published_date: v2.pap_publication_date,
      differences,
      summary: {
        total_changes: differences.length,
        high_impact_changes: differences.filter(
          (d) => d.impact === 'high'
        ).length,
        affected_areas: [
          ...new Set(differences.map((d) => d.path.split('.')[0])),
        ],
      },
    }

    this.changelogs.set(cacheKey, changelog)
    return changelog
  }

  /**
   * Generiert einen Changelog als lesbar formatierte Text
   */
  generateChangelogText(changelog: VersionChangeLog): string {
    let text = `# Änderungen von ${changelog.from_year} zu ${changelog.to_year}\n\n`
    text += `**Veröffentlichung:** ${changelog.published_date}\n`
    text += `**Gesamte Änderungen:** ${changelog.summary.total_changes}\n`
    text += `**Kritische Änderungen:** ${changelog.summary.high_impact_changes}\n\n`

    if (changelog.differences.length === 0) {
      text += '**Keine Änderungen in Parametern.**\n'
      return text
    }

    // Gruppiere nach Impact
    const highImpact = changelog.differences.filter((d) => d.impact === 'high')
    const mediumImpact = changelog.differences.filter(
      (d) => d.impact === 'medium'
    )
    const lowImpact = changelog.differences.filter((d) => d.impact === 'low')

    if (highImpact.length > 0) {
      text += '## ⚠️ KRITISCHE ÄNDERUNGEN\n\n'
      for (const diff of highImpact) {
        text += `### ${diff.field_name} (${diff.law_reference})\n`
        text += `- **Vorher:** ${this.formatValue(diff.old_value)}\n`
        text += `- **Nachher:** ${this.formatValue(diff.new_value)}\n\n`
      }
    }

    if (mediumImpact.length > 0) {
      text += '## ⚡ WICHTIGE ÄNDERUNGEN\n\n'
      for (const diff of mediumImpact) {
        text += `### ${diff.field_name} (${diff.law_reference})\n`
        text += `- **Vorher:** ${this.formatValue(diff.old_value)}\n`
        text += `- **Nachher:** ${this.formatValue(diff.new_value)}\n\n`
      }
    }

    if (lowImpact.length > 0) {
      text += '## 📝 KLEINE ÄNDERUNGEN\n\n'
      for (const diff of lowImpact) {
        text += `- ${diff.field_name}: ${this.formatValue(diff.old_value)} → ${this.formatValue(diff.new_value)}\n`
      }
      text += '\n'
    }

    return text
  }

  /**
   * Generiert Changelog als HTML
   */
  generateChangelogHTML(changelog: VersionChangeLog): string {
    let html = `
<div class="changelog">
  <h2>Änderungen ${changelog.from_year} → ${changelog.to_year}</h2>
  <p><strong>Veröffentlichung:</strong> ${changelog.published_date}</p>
  <p><strong>Gesamt-Änderungen:</strong> ${changelog.summary.total_changes}</p>
  <p><strong>Kritische Änderungen:</strong> ${changelog.summary.high_impact_changes}</p>
  <p><strong>Betroffene Bereiche:</strong> ${changelog.summary.affected_areas.join(', ')}</p>
`

    if (changelog.differences.length === 0) {
      html += '<p>Keine Änderungen in Parametern.</p>'
    } else {
      const highImpact = changelog.differences.filter(
        (d) => d.impact === 'high'
      )
      const mediumImpact = changelog.differences.filter(
        (d) => d.impact === 'medium'
      )

      if (highImpact.length > 0) {
        html += '<h3>⚠️ Kritische Änderungen</h3><ul>'
        for (const diff of highImpact) {
          html += `<li><strong>${diff.field_name}:</strong> ${this.formatValue(diff.old_value)} → ${this.formatValue(diff.new_value)} (${diff.law_reference})</li>`
        }
        html += '</ul>'
      }

      if (mediumImpact.length > 0) {
        html += '<h3>⚡ Wichtige Änderungen</h3><ul>'
        for (const diff of mediumImpact) {
          html += `<li><strong>${diff.field_name}:</strong> ${this.formatValue(diff.old_value)} → ${this.formatValue(diff.new_value)}</li>`
        }
        html += '</ul>'
      }
    }

    html += '</div>'
    return html
  }

  /**
   * Formatiert einen Wert für lesbare Ausgabe
   */
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      // Prozentsätze formatieren
      if (value < 1 && value > 0) {
        return `${(value * 100).toFixed(2)}%`
      }
      // EUR in Cent formatieren
      if (value > 100000) {
        return `${(value / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} EUR`
      }
      return value.toString()
    }
    if (typeof value === 'object') {
      return '[Komplex]'
    }
    return String(value)
  }

  /**
   * Exportiert alle Versionen als JSON
   */
  exportAllVersions(): Record<number, ParameterSet> {
    const result: Record<number, ParameterSet> = {}
    for (const [year, params] of this.versions.entries()) {
      result[year] = params
    }
    return result
  }

  /**
   * Gibt Zusammenfassung aller registrierten Versionen
   */
  getSummary(): {
    years: number[]
    count: number
    oldest: number | null
    newest: number | null
  } {
    const years = this.getAvailableYears()
    return {
      years,
      count: years.length,
      oldest: years.length > 0 ? years[0] : null,
      newest: years.length > 0 ? years[years.length - 1] : null,
    }
  }
}
