/**
 * PDFUploadManager-Modul
 * Verwaltet PDF-Upload, Parameter-Extraktion und Update-Workflow
 *
 * Zweck:
 * - Benutzerfreundlicher PDF-Upload für PAP-Dokumente
 * - Integration mit PAPAnalyzer und ClaudeParameterExtractor
 * - Visualisierung von Parameter-Änderungen
 * - Benutzer-Genehmigungsworkflow für Parameter-Updates
 * - Versionsverwaltung nach genehmigter Änderung
 */

import { ParameterChange } from './ClaudeParameterExtractor'
import { VersionManager } from './VersionManager'

export interface PDFUploadProgress {
  status: 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error'
  progress: number // 0-100
  currentStep: string
  error?: string
}

export interface UpdateSuggestion {
  id: string
  parameter: string
  currentValue: any
  suggestedValue: any
  changePercent: number
  impactLevel: 'high' | 'medium' | 'low'
  reason: string
  affectedCalculations: string[]
  approved: boolean | null
  createdAt: Date
  papReference: string
}

export interface UpdateProposal {
  id: string
  pap_version: string
  pap_publication_date: string
  suggestions: UpdateSuggestion[]
  approvalStatus: 'pending' | 'partial' | 'complete' | 'rejected'
  createdAt: Date
  approvedAt?: Date
  approvedBy?: string
  notes?: string
}

export class PDFUploadManager {
  private uploadProgress: PDFUploadProgress = {
    status: 'idle',
    progress: 0,
    currentStep: '',
  }

  private currentProposal: UpdateProposal | null = null
  private updateCallbacks: {
    onProgressUpdate?: (progress: PDFUploadProgress) => void
    onSuggestionsReady?: (suggestions: UpdateSuggestion[]) => void
    onError?: (error: string) => void
  } = {}

  constructor(
    private versionManager: VersionManager,
    callbacks?: typeof PDFUploadManager.prototype.updateCallbacks
  ) {
    if (callbacks) {
      this.updateCallbacks = callbacks
    }
  }

  /**
   * Registriert Progress-Callback
   */
  registerProgressCallback(callback: (progress: PDFUploadProgress) => void): void {
    this.updateCallbacks.onProgressUpdate = callback
  }

  /**
   * Registriert Suggestions-Ready-Callback
   */
  registerSuggestionsCallback(callback: (suggestions: UpdateSuggestion[]) => void): void {
    this.updateCallbacks.onSuggestionsReady = callback
  }

  /**
   * Registriert Error-Callback
   */
  registerErrorCallback(callback: (error: string) => void): void {
    this.updateCallbacks.onError = callback
  }

  /**
   * Verarbeitet hochgeladene PDF-Datei
   */
  async processPDFUpload(
    file: File,
    papVersion: string,
    papPublicationDate: string
  ): Promise<UpdateProposal | null> {
    try {
      this.updateProgress('uploading', 10, 'PDF wird hochgeladen...')

      // Simuliert Datei-Verarbeitung
      // In Produktivumgebung würde hier PDF-Text extrahiert
      const pdfText = await this.extractTextFromPDF(file)

      this.updateProgress('extracting', 30, 'Text wird extrahiert...')

      // Import hier wegen zirkulärer Abhängigkeiten
      const { PAPAnalyzer } = require('./PAPAnalyzer')
      const papAnalyzer = new PAPAnalyzer()

      // Basis-Analyse mit Regex
      const basicAnalysis = papAnalyzer.analyzePAPText(pdfText)

      this.updateProgress('analyzing', 60, 'Parameter werden analysiert...')

      // Optional: Claude API Integration
      // const { ClaudeParameterExtractor } = require('./ClaudeParameterExtractor')
      // const extractor = new ClaudeParameterExtractor()
      // const claudeAnalysis = await extractor.extractParameters({ ... })

      this.updateProgress('analyzing', 80, 'Änderungen werden erkannt...')

      // Konvertiere Analyse-Ergebnisse zu Update-Suggestions
      const suggestions = this.generateUpdateSuggestions(
        basicAnalysis.identified_changes,
        basicAnalysis.extracted_parameters
      )

      // Erstelle UpdateProposal
      const proposal: UpdateProposal = {
        id: this.generateProposalId(),
        pap_version: papVersion,
        pap_publication_date: papPublicationDate,
        suggestions,
        approvalStatus: 'pending',
        createdAt: new Date(),
      }

      this.currentProposal = proposal
      this.updateProgress('complete', 100, 'Analyse abgeschlossen')

      this.updateCallbacks.onSuggestionsReady?.(suggestions)

      return proposal
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler'
      this.updateProgress('error', 0, errorMsg, errorMsg)
      this.updateCallbacks.onError?.(errorMsg)
      return null
    }
  }

  /**
   * Generiert Update-Suggestions aus PAP-Analyse-Ergebnissen
   */
  private generateUpdateSuggestions(
    changes: Array<{
      parameter: string
      old_value: any
      new_value: any
      page: number
      law_reference: string
    }>,
    extractedParameters: any[]
  ): UpdateSuggestion[] {
    const suggestions: UpdateSuggestion[] = []
    const impactMap: Record<string, 'high' | 'medium' | 'low'> = {
      grundfreibetrag: 'high',
      solz_freigrenze: 'high',
      rv_bbg: 'medium',
      alv_bbg: 'medium',
      kv_bbg: 'medium',
      kinderfreibetrag: 'high',
    }

    for (const change of changes) {
      const changePercent = this.calculateChangePercent(change.old_value, change.new_value)
      const impact = impactMap[change.parameter] || 'medium'

      const affectedCalculations = this.determineAffectedCalculations(change.parameter)

      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        parameter: change.parameter,
        currentValue: change.old_value,
        suggestedValue: change.new_value,
        changePercent,
        impactLevel: impact,
        reason: this.generateChangeReason(change.parameter, changePercent),
        affectedCalculations,
        approved: null,
        createdAt: new Date(),
        papReference: `S. ${change.page}`,
      })
    }

    return suggestions
  }

  /**
   * Genehmigt eine Suggestion
   */
  approveSuggestion(suggestionId: string, approved: boolean): void {
    if (!this.currentProposal) return

    const suggestion = this.currentProposal.suggestions.find((s) => s.id === suggestionId)
    if (suggestion) {
      suggestion.approved = approved
      this.updateApprovalStatus()
    }
  }

  /**
   * Genehmigt alle Suggestions
   */
  approveAllSuggestions(): void {
    if (!this.currentProposal) return

    for (const suggestion of this.currentProposal.suggestions) {
      suggestion.approved = true
    }
    this.updateApprovalStatus()
  }

  /**
   * Lehnt alle Suggestions ab
   */
  rejectAllSuggestions(): void {
    if (!this.currentProposal) return

    for (const suggestion of this.currentProposal.suggestions) {
      suggestion.approved = false
    }
    this.updateApprovalStatus()
  }

  /**
   * Wendet genehmigte Parameter-Updates an
   */
  async applyApprovedUpdates(approvedBy?: string): Promise<boolean> {
    if (!this.currentProposal) return false

    const approvedSuggestions = this.currentProposal.suggestions.filter((s) => s.approved === true)

    if (approvedSuggestions.length === 0) {
      this.updateCallbacks.onError?.('Keine Änderungen zur Anwendung genehmigt.')
      return false
    }

    try {
      // Konvertiere Suggestions zu Parameter-Updates
      const parameterUpdates: Record<string, any> = {}
      for (const suggestion of approvedSuggestions) {
        parameterUpdates[suggestion.parameter] = suggestion.suggestedValue
      }

      // Bestimme Ziel-Jahr aus PAP-Version
      const papYear = this.extractYearFromPAPVersion(this.currentProposal.pap_version)

      // Aktualisiere Parameter in VersionManager
      const success = await this.versionManager.updateParametersForYear(papYear, parameterUpdates)

      if (success) {
        this.currentProposal.approvalStatus = 'complete'
        this.currentProposal.approvedAt = new Date()
        if (approvedBy) {
          this.currentProposal.approvedBy = approvedBy
        }

        return true
      } else {
        throw new Error('Parameter-Update fehlgeschlagen')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Fehler beim Anwenden der Updates'
      this.updateCallbacks.onError?.(errorMsg)
      return false
    }
  }

  /**
   * Gibt aktuelle Proposal zurück
   */
  getCurrentProposal(): UpdateProposal | null {
    return this.currentProposal
  }

  /**
   * Generiert HTML-Visualisierung der Suggestions
   */
  generateSuggestionsHTML(): string {
    if (!this.currentProposal) return '<p>Keine Suggestions vorhanden</p>'

    const suggestions = this.currentProposal.suggestions
    const highImpact = suggestions.filter((s) => s.impactLevel === 'high').length
    const mediumImpact = suggestions.filter((s) => s.impactLevel === 'medium').length
    const lowImpact = suggestions.filter((s) => s.impactLevel === 'low').length

    let html = `
<div class="suggestion-summary">
  <h3>Parameter-Update-Suggestions</h3>
  <p><strong>PAP Version:</strong> ${this.currentProposal.pap_version}</p>
  <p><strong>Publikationsdatum:</strong> ${this.currentProposal.pap_publication_date}</p>
  <p><strong>Gesamt Suggestions:</strong> ${suggestions.length}</p>

  <div class="impact-summary">
    <span class="impact-high">Hohes Impact: ${highImpact}</span>
    <span class="impact-medium">Mittleres Impact: ${mediumImpact}</span>
    <span class="impact-low">Niedriges Impact: ${lowImpact}</span>
  </div>
</div>

<div class="suggestions-list">
`

    for (const suggestion of suggestions) {
      const checked = suggestion.approved === true ? 'checked' : ''
      const disabled = suggestion.approved === null ? '' : 'disabled'
      const changeSign = suggestion.changePercent >= 0 ? '+' : ''

      html += `
<div class="suggestion-item impact-${suggestion.impactLevel}">
  <div class="suggestion-header">
    <input type="checkbox" id="suggestion-${suggestion.id}" ${checked} ${disabled}>
    <label for="suggestion-${suggestion.id}">
      <strong>${suggestion.parameter}</strong>
      <span class="change-percent">${changeSign}${suggestion.changePercent.toFixed(2)}%</span>
    </label>
  </div>

  <div class="suggestion-details">
    <div class="value-comparison">
      <div class="current">
        <label>Aktueller Wert:</label>
        <code>${this.formatValue(suggestion.currentValue)}</code>
      </div>
      <div class="arrow">→</div>
      <div class="suggested">
        <label>Vorgeschlagener Wert:</label>
        <code>${this.formatValue(suggestion.suggestedValue)}</code>
      </div>
    </div>

    <div class="reason">${suggestion.reason}</div>

    <div class="metadata">
      <span class="pap-ref">Referenz: ${suggestion.papReference}</span>
      <span class="impact impact-${suggestion.impactLevel}">${suggestion.impactLevel.toUpperCase()}</span>
    </div>

    <div class="affected">
      <strong>Betroffene Berechnungen:</strong>
      <ul>
        ${suggestion.affectedCalculations.map((calc) => `<li>${calc}</li>`).join('')}
      </ul>
    </div>
  </div>
</div>
`
    }

    html += `
</div>

<div class="action-buttons">
  <button id="approve-all-btn" onclick="window.pdfManager.approveAllSuggestions()">
    Alle genehmigen
  </button>
  <button id="reject-all-btn" onclick="window.pdfManager.rejectAllSuggestions()">
    Alle ablehnen
  </button>
  <button id="apply-btn" onclick="window.pdfManager.applyApprovedUpdates()">
    Genehmigte Updates anwenden
  </button>
</div>
`

    return html
  }

  /**
   * Extrahiert Text aus PDF-Datei
   * (Simplified - in production würde pdfjs oder ähnliches verwendet)
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    // Placeholder - in Produktion würde pdfjs-dist verwendet
    // Für Testing: Liest als UTF-8 Text
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        resolve(text)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  /**
   * Aktualisiert Progress-Status
   */
  private updateProgress(
    status: PDFUploadProgress['status'],
    progress: number,
    currentStep: string,
    error?: string
  ): void {
    this.uploadProgress = {
      status,
      progress,
      currentStep,
      error,
    }
    this.updateCallbacks.onProgressUpdate?.(this.uploadProgress)
  }

  /**
   * Berechnet prozentuale Änderung
   */
  private calculateChangePercent(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return ((newValue - oldValue) / oldValue) * 100
  }

  /**
   * Bestimmt betroffene Berechnungen
   */
  private determineAffectedCalculations(parameter: string): string[] {
    const affectedMap: Record<string, string[]> = {
      grundfreibetrag: ['Einkommensteuer', 'Tarifzone A-D'],
      solz_freigrenze: ['Solidaritätszuschlag'],
      rv_bbg: ['Rentenversicherung', 'Gleitzone'],
      alv_bbg: ['Arbeitslosenversicherung', 'Gleitzone'],
      kv_bbg: ['Krankenversicherung'],
      pv_bbg: ['Pflegeversicherung'],
      kinderfreibetrag: ['Einkommensteuer', 'Kindergeld'],
      minijob_grenze: ['Minijob-Pauschalierung'],
      gleitzone_lower: ['Gleitzone'],
      gleitzone_upper: ['Gleitzone'],
    }
    return affectedMap[parameter] || ['Lohnsteuerberechnung']
  }

  /**
   * Generiert Begründungstext
   */
  private generateChangeReason(parameter: string, changePercent: number): string {
    const direction = changePercent > 0 ? 'erhöht' : 'verringert'
    const absCent = Math.abs(changePercent)

    return `Parameter wurde um ${absCent.toFixed(2)}% ${direction} (Änderung gemäß neuer PAP-Regelung)`
  }

  /**
   * Aktualisiert Approval-Status
   */
  private updateApprovalStatus(): void {
    if (!this.currentProposal) return

    const total = this.currentProposal.suggestions.length
    const approved = this.currentProposal.suggestions.filter((s) => s.approved === true).length
    const rejected = this.currentProposal.suggestions.filter((s) => s.approved === false).length

    if (approved === total) {
      this.currentProposal.approvalStatus = 'complete'
    } else if (rejected === total) {
      this.currentProposal.approvalStatus = 'rejected'
    } else if (approved > 0 || rejected > 0) {
      this.currentProposal.approvalStatus = 'partial'
    } else {
      this.currentProposal.approvalStatus = 'pending'
    }
  }

  /**
   * Generiert eindeutige Proposal-ID
   */
  private generateProposalId(): string {
    return `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Extrahiert Jahr aus PAP-Version-String
   */
  private extractYearFromPAPVersion(version: string): number {
    const match = version.match(/(\d{4})/)
    return match ? parseInt(match[1]) : new Date().getFullYear() + 1
  }

  /**
   * Formatiert Wert für Anzeige
   */
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      // Annahme: Werte sind in EUR-Cent
      return (value / 100).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
    return String(value)
  }
}
