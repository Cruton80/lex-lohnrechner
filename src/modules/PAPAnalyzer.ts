/**
 * PAPAnalyzer-Modul
 * Analysiert PAP-PDF-Dateien und extrahiert Änderungen in Parametern
 *
 * Zweck:
 * - Automatische Extraktion von Parametern aus PAP-PDFs
 * - Änderungserkennung
 * - Validierungsregeln auto-generieren
 * - Vorbereitung für Claude AI-gestützte Analyse
 *
 * PAP-Referenz: 2025-11-12-PAP-2026-anlage-1.pdf
 */

export interface ExtractedParameter {
  name: string
  value: any
  page: number
  context: string
  confidence: number // 0-1
  pap_reference: string
}

export interface PAPAnalysisResult {
  pap_version: number
  publication_date: string
  extracted_parameters: ExtractedParameter[]
  identified_changes: Array<{
    parameter: string
    old_value: any
    new_value: any
    page: number
    law_reference: string
  }>
  summary: {
    total_parameters: number
    new_parameters: number
    changed_parameters: number
    analysis_confidence: number
  }
}

export class PAPAnalyzer {
  /**
   * Analysiert PAP-PDF-Text und extrahiert Parameter
   * (Dies ist eine vereinfachte Version - in Produktion würde
   * Claude API für intelligente Extraktion verwendet)
   */
  analyzePAPText(pap_text: string): PAPAnalysisResult {
    const result: PAPAnalysisResult = {
      pap_version: 2026,
      publication_date: '2025-11-12',
      extracted_parameters: [],
      identified_changes: [],
      summary: {
        total_parameters: 0,
        new_parameters: 0,
        changed_parameters: 0,
        analysis_confidence: 0.7,
      },
    }

    // Vereinfachte Extraktion von bekannten Parametern
    const parameters = this.extractKnownParameters(pap_text)
    result.extracted_parameters = parameters

    // Vergleich mit bekannten Werten durchführen
    const changes = this.identifyChanges(parameters)
    result.identified_changes = changes

    // Summary aktualisieren
    result.summary.total_parameters = parameters.length
    result.summary.changed_parameters = changes.length

    return result
  }

  /**
   * Extrahiert bekannte Parameter aus PAP-Text
   */
  private extractKnownParameters(text: string): ExtractedParameter[] {
    const parameters: ExtractedParameter[] = []

    // Grundfreibetrag suchen (Pattern: "11.600" oder "11600")
    const grundfreibetrag_match = text.match(
      /Grundfreibetrag[:\s]*(?:EUR\s+)?(\d+(?:\.\d{3})*(?:,\d{2})?)/i
    )
    if (grundfreibetrag_match) {
      parameters.push({
        name: 'grundfreibetrag',
        value: this.parseEUR(grundfreibetrag_match[1]),
        page: 12,
        context: 'Tarifberechnung § 32a EStG',
        confidence: 0.9,
        pap_reference: 'S. 12, Zone A',
      })
    }

    // RV-Beitragsbemessungsgrenze suchen
    const rv_bbg_match = text.match(
      /Beitragsbemessungsgrenze.*RV[:\s]*(?:EUR\s+)?(\d+(?:\.\d{3})*)/i
    )
    if (rv_bbg_match) {
      parameters.push({
        name: 'rv_bbg',
        value: this.parseEUR(rv_bbg_match[1]),
        page: 7,
        context: 'Rentenversicherung',
        confidence: 0.85,
        pap_reference: 'S. 7, § 168 SGB VI',
      })
    }

    // KV-Beitragsbemessungsgrenze suchen
    const kv_bbg_match = text.match(
      /Beitragsbemessungsgrenze.*KV[:\s]*(?:EUR\s+)?(\d+(?:\.\d{3})*)/i
    )
    if (kv_bbg_match) {
      parameters.push({
        name: 'kv_bbg',
        value: this.parseEUR(kv_bbg_match[1]),
        page: 8,
        context: 'Krankenversicherung',
        confidence: 0.85,
        pap_reference: 'S. 8, § 242 SGB V',
      })
    }

    // Solidaritätszuschlag Freigrenze
    const solz_match = text.match(
      /Solidaritätszuschlag[:\s]*Freigrenze[:\s]*(?:EUR\s+)?(\d+(?:\.\d{3})*)/i
    )
    if (solz_match) {
      parameters.push({
        name: 'solz_freigrenze',
        value: this.parseEUR(solz_match[1]),
        page: 16,
        context: 'Solidaritätszuschlag § 5 SolzG',
        confidence: 0.9,
        pap_reference: 'S. 16, § 5 SolzG',
      })
    }

    // Kinderfreibetrag
    const kfb_match = text.match(
      /Kinderfreibetrag[:\s]*(?:EUR\s+)?(\d+(?:\.\d{3})*)/i
    )
    if (kfb_match) {
      parameters.push({
        name: 'kinderfreibetrag',
        value: this.parseEUR(kfb_match[1]),
        page: 10,
        context: 'Familienleistungen',
        confidence: 0.85,
        pap_reference: 'S. 10, § 32 EStG',
      })
    }

    return parameters
  }

  /**
   * Identifiziert Änderungen zu bekannten Werten
   */
  private identifyChanges(
    extracted: ExtractedParameter[]
  ): Array<{
    parameter: string
    old_value: any
    new_value: any
    page: number
    law_reference: string
  }> {
    const knownValues: Record<string, any> = {
      grundfreibetrag: 1160000, // 2026
      rv_bbg: 10140000, // 2026
      kv_bbg: 6975000, // 2026
      solz_freigrenze: 2035000, // 2026
      kinderfreibetrag: 552000, // 2026
    }

    const changes = []

    for (const param of extracted) {
      const known = knownValues[param.name]
      if (known && known !== param.value) {
        changes.push({
          parameter: param.name,
          old_value: known,
          new_value: param.value,
          page: param.page,
          law_reference: param.pap_reference,
        })
      }
    }

    return changes
  }

  /**
   * Parsed EUR-String zu Cent-Wert
   */
  private parseEUR(value: string): number {
    const cleaned = value
      .replace(/\./g, '') // Punkte entfernen
      .replace(',', '.') // Komma zu Punkt

    return Math.round(parseFloat(cleaned) * 100)
  }

  /**
   * Generiert Parameter-Update-Vorschläge
   */
  generateUpdateSuggestions(
    analysis: PAPAnalysisResult
  ): Array<{
    parameter: string
    current_value: any
    suggested_value: any
    impact: 'high' | 'medium' | 'low'
    action: string
  }> {
    const suggestions = []

    for (const change of analysis.identified_changes) {
      let impact: 'high' | 'medium' | 'low' = 'medium'

      // Bestimme Impact basierend auf Parametertyp
      if (change.parameter.includes('freigrenze')) impact = 'high'
      if (change.parameter.includes('grundfreibetrag')) impact = 'high'
      if (change.parameter.includes('bbg')) impact = 'medium'

      suggestions.push({
        parameter: change.parameter,
        current_value: change.old_value,
        suggested_value: change.new_value,
        impact,
        action: `Update ${change.parameter} von ${this.formatEUR(change.old_value)} zu ${this.formatEUR(change.new_value)}`,
      })
    }

    return suggestions
  }

  /**
   * Formatiert EUR-Wert
   */
  private formatEUR(cent: number): string {
    return (cent / 100).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  /**
   * Generiert Validierungsregeln basierend auf PAP
   */
  generateValidationRules(analysis: PAPAnalysisResult): Record<string, any> {
    const rules: Record<string, any> = {}

    for (const param of analysis.extracted_parameters) {
      if (param.name === 'grundfreibetrag') {
        rules.grundfreibetrag_min = param.value
        rules.grundfreibetrag_max = param.value
      }

      if (param.name.includes('bbg')) {
        rules[`${param.name}_max`] = param.value
      }
    }

    return rules
  }

  /**
   * Exportiert Analyse-Ergebnisse als JSON
   */
  exportAnalysisAsJSON(analysis: PAPAnalysisResult): string {
    return JSON.stringify(analysis, null, 2)
  }

  /**
   * Generiert Analyse-Report als Markdown
   */
  generateAnalysisReport(analysis: PAPAnalysisResult): string {
    let report = `# PAP-Analyse Report\n\n`
    report += `**PAP Version:** ${analysis.pap_version}\n`
    report += `**Publikationsdatum:** ${analysis.publication_date}\n`
    report += `**Analyse-Konfidenz:** ${(analysis.summary.analysis_confidence * 100).toFixed(0)}%\n\n`

    report += `## Extrahierte Parameter\n\n`
    report += `Gesamt: ${analysis.summary.total_parameters}\n`
    report += `Geändert: ${analysis.summary.changed_parameters}\n\n`

    if (analysis.identified_changes.length > 0) {
      report += `## Identifizierte Änderungen\n\n`
      for (const change of analysis.identified_changes) {
        report += `### ${change.parameter}\n`
        report += `- **Alt:** ${this.formatEUR(change.old_value)}\n`
        report += `- **Neu:** ${this.formatEUR(change.new_value)}\n`
        report += `- **Seite:** ${change.page}\n`
        report += `- **Referenz:** ${change.law_reference}\n\n`
      }
    }

    return report
  }
}
