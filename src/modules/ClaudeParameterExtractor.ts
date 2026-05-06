/**
 * ClaudeParameterExtractor-Modul
 * Nutzt Claude API für intelligente Extraktion von PAP-Parametern
 *
 * Zweck:
 * - Intelligente Extraktion komplexer PAP-Inhalte
 * - Natürlichsprachliche Verarbeitung von PDF-Text
 * - Automatische Erkennung neuer Parameter
 * - Selbstkorrigierender Analyse-Prozess
 * - Änderungserkennung mit Kontext-Verständnis
 */

export interface ParameterExtractionRequest {
  pap_text: string
  pap_version: string
  pap_publication_date: string
  known_parameters?: Record<string, any>
  extraction_focus?: 'all' | 'changes' | 'specific'
  specific_parameters?: string[]
}

export interface ParameterExtractionResult {
  status: 'success' | 'partial' | 'error'
  extracted_parameters: Record<string, ExtractedParam>
  identified_changes: ParameterChange[]
  confidence_assessment: {
    overall_confidence: number
    parameter_confidences: Record<string, number>
    uncertain_extractions: string[]
  }
  analysis_notes: string[]
  retry_recommendations?: string[]
}

export interface ExtractedParam {
  value: any
  raw_value: string
  context_snippet: string
  page_reference: string
  law_reference: string
  confidence: number
  extraction_method: 'claude_api' | 'regex_fallback'
  notes?: string
}

export interface ParameterChange {
  parameter: string
  old_value: any
  new_value: any
  change_magnitude: number // percentage change
  impact_level: 'high' | 'medium' | 'low'
  affected_calculations: string[]
  law_references: string[]
  change_rationale?: string
}

export class ClaudeParameterExtractor {
  private apiKey: string
  private model: string = 'claude-opus-4-7'
  private maxRetries: number = 2

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    if (!this.apiKey) {
      console.warn('ClaudeParameterExtractor: No API key provided')
    }
  }

  /**
   * Extrahiert Parameter aus PAP-Text mittels Claude API
   */
  async extractParameters(
    request: ParameterExtractionRequest
  ): Promise<ParameterExtractionResult> {
    if (!this.apiKey) {
      return {
        status: 'error',
        extracted_parameters: {},
        identified_changes: [],
        confidence_assessment: {
          overall_confidence: 0,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: ['API-Schlüssel nicht verfügbar - verwende Regex-Fallback'],
      }
    }

    const prompt = this.buildExtractionPrompt(request)

    try {
      const response = await this.callClaudeAPI(prompt)
      return this.parseExtractionResponse(response, request)
    } catch (error) {
      return {
        status: 'error',
        extracted_parameters: {},
        identified_changes: [],
        confidence_assessment: {
          overall_confidence: 0,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: [`API-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`],
      }
    }
  }

  /**
   * Analysiert Änderungen zwischen zwei PAP-Versionen
   */
  async analyzeChanges(
    oldPAPText: string,
    newPAPText: string,
    oldVersion: string,
    newVersion: string
  ): Promise<ParameterExtractionResult> {
    const prompt = `
Du bist ein Experte für deutsches Steuerrecht und den Programmablaufplan (PAP).

Analysiere die Unterschiede zwischen diesen zwei PAP-Versionen und identifiziere alle Parameter-Änderungen:

## Alte Version (${oldVersion}):
${oldPAPText.substring(0, 5000)}

## Neue Version (${newVersion}):
${newPAPText.substring(0, 5000)}

Für jede identifizierte Änderung, gebe folgende Informationen aus:
1. Parametername
2. Alter Wert
3. Neuer Wert
4. Prozentuale Änderung
5. Impact-Level (hoch/mittel/niedrig)
6. Betroffene Berechnungen (z.B. Lohnsteuer, Solidaritätszuschlag, etc.)
7. Rechtliche Grundlagen (Paragraph, Gesetze)
8. Begründung der Änderung

Antworte in JSON-Format mit folgender Struktur:
{
  "identified_changes": [
    {
      "parameter": "...",
      "old_value": ...,
      "new_value": ...,
      "change_magnitude": ...,
      "impact_level": "high|medium|low",
      "affected_calculations": [...],
      "law_references": [...],
      "change_rationale": "..."
    }
  ],
  "analysis_notes": [...]
}
`

    try {
      const response = await this.callClaudeAPI(prompt)
      const parsed = this.parseChangeAnalysisResponse(response)
      return {
        status: parsed.identified_changes?.length > 0 ? 'success' : 'partial',
        extracted_parameters: {},
        identified_changes: parsed.identified_changes || [],
        confidence_assessment: {
          overall_confidence: 0.85,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: parsed.analysis_notes || [],
      }
    } catch (error) {
      return {
        status: 'error',
        extracted_parameters: {},
        identified_changes: [],
        confidence_assessment: {
          overall_confidence: 0,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: [`Änderungsanalyse fehlgeschlagen: ${error instanceof Error ? error.message : 'Fehler'}`],
      }
    }
  }

  /**
   * Validiert und korrigiert extrahierte Parameter
   */
  async validateAndCorrectParameters(
    extractedParams: Record<string, any>,
    pap_text: string,
    known_valid_ranges: Record<string, { min: number; max: number }>
  ): Promise<Record<string, any>> {
    const outOfRangeParams = Object.entries(extractedParams)
      .filter(([key, value]) => {
        const range = known_valid_ranges[key]
        if (!range || typeof value !== 'number') return false
        return value < range.min || value > range.max
      })
      .map(([key]) => key)

    if (outOfRangeParams.length === 0) {
      return extractedParams
    }

    const prompt = `
Du bist ein Experte für den deutschen Programmablaufplan (PAP).

Die folgenden Parameter wurden aus einem PAP-Dokument extrahiert, fallen aber außerhalb der erwarteten Bereiche:

${outOfRangeParams.map((param) => `- ${param}: ${extractedParams[param]} (gültig: ${known_valid_ranges[param]?.min}-${known_valid_ranges[param]?.max})`).join('\n')}

Hier ist der relevante PAP-Text:
${pap_text.substring(0, 3000)}

Bitte überprüfe die Extraktion und gebe die korrigierten Werte an. Antworte in JSON-Format:
{
  "corrected_parameters": {
    "parameter_name": value,
    ...
  },
  "corrections": [
    {
      "parameter": "...",
      "original_value": ...,
      "corrected_value": ...,
      "reason": "..."
    }
  ],
  "confidence": 0.0-1.0
}
`

    try {
      const response = await this.callClaudeAPI(prompt)
      const parsed = JSON.parse(response)
      return {
        ...extractedParams,
        ...parsed.corrected_parameters,
      }
    } catch {
      return extractedParams
    }
  }

  /**
   * Erstellt automatische Validierungsregeln aus PAP
   */
  async generateValidationRules(pap_text: string): Promise<Record<string, any>> {
    const prompt = `
Du bist ein Experte für Validierungsregeln im deutschen Steuerrecht.

Basierend auf diesem PAP-Text, generiere automatische Validierungsregeln für Eingabeparameter:

${pap_text.substring(0, 5000)}

Gebe die Regeln in JSON-Format an:
{
  "rules": {
    "parameter_name": {
      "type": "number|string|boolean",
      "min": ...,
      "max": ...,
      "description": "...",
      "law_reference": "..."
    }
  }
}
`

    try {
      const response = await this.callClaudeAPI(prompt)
      const parsed = JSON.parse(response)
      return parsed.rules || {}
    } catch {
      return {}
    }
  }

  /**
   * Erstellt einen Änderungsbericht für Benutzer
   */
  async generateChangeReport(
    changes: ParameterChange[],
    locale: 'de' | 'en' = 'de'
  ): Promise<string> {
    const prompt = `
Du bist ein technischer Schreiber für deutsche Steuersoftware.

Erstelle einen Änderungsbericht für diese PAP-Änderungen in ${locale === 'de' ? 'Deutsch' : 'Englisch'}:

${JSON.stringify(changes, null, 2)}

Der Bericht sollte:
1. Alle Parameter-Änderungen aufzählen
2. Die Auswirkungen auf Berechnungen erklären
3. Die rechtliche Grundlage zitieren
4. In verständlicher Sprache geschrieben sein

Antworte nur mit dem Bericht-Text.
`

    try {
      return await this.callClaudeAPI(prompt)
    } catch {
      return 'Bericht konnte nicht generiert werden.'
    }
  }

  /**
   * Ruft Claude API auf
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API-Fehler: ${response.statusText} - ${error}`)
    }

    const data = (await response.json()) as { content: Array<{ text: string }> }
    return data.content[0]?.text || ''
  }

  /**
   * Erstellt Extraction-Prompt
   */
  private buildExtractionPrompt(request: ParameterExtractionRequest): string {
    const focusText =
      request.extraction_focus === 'changes'
        ? 'Konzentriere dich auf Änderungen zu den bekannten Parametern.'
        : request.extraction_focus === 'specific'
          ? `Extrahiere nur diese Parameter: ${request.specific_parameters?.join(', ')}`
          : 'Extrahiere alle verfügbaren Parameter.'

    return `
Du bist ein Experte für den deutschen Programmablaufplan (PAP) und Lohnsteuerberechnung.

Analysiere diesen PAP-Text (Version ${request.pap_version}, veröffentlicht ${request.pap_publication_date}):

${request.pap_text.substring(0, 8000)}

${focusText}

Extrahiere folgende Parameter mit hoher Genauigkeit:
- Grundfreibetrag
- Beitragsbemessungsgrenzen (RV, ALV, KV)
- Solidaritätszuschlag Freigrenze
- Kinderfreibetrag
- Steuersätze und Formeln
- Alle anderen relevanten numerischen Parameter

Für jeden Parameter gebe an:
1. Name
2. Wert (als Zahl, in EUR-Cent)
3. Roher Wert aus dem Text
4. Kontext-Snippet
5. Seite/Referenz
6. Rechtliche Grundlage
7. Konfidenz (0-1)

${request.known_parameters ? `\nBekannte Parameter aus vorheriger Version:\n${JSON.stringify(request.known_parameters, null, 2)}` : ''}

Antworte in JSON-Format:
{
  "extracted_parameters": {
    "parameter_name": {
      "value": ...,
      "raw_value": "...",
      "context_snippet": "...",
      "page_reference": "S. X",
      "law_reference": "§ X ...",
      "confidence": 0.0-1.0,
      "notes": "..."
    }
  },
  "identified_changes": [
    {
      "parameter": "...",
      "old_value": ...,
      "new_value": ...,
      "change_magnitude": ...,
      "impact_level": "high|medium|low",
      "affected_calculations": [...],
      "law_references": [...]
    }
  ],
  "confidence_assessment": {
    "overall_confidence": 0.0-1.0,
    "uncertain_extractions": [...]
  },
  "analysis_notes": [...]
}
`
  }

  /**
   * Parsed API-Response
   */
  private parseExtractionResponse(
    response: string,
    request: ParameterExtractionRequest
  ): ParameterExtractionResult {
    try {
      const parsed = JSON.parse(response)
      const extractedParams: Record<string, ExtractedParam> = {}

      for (const [key, val] of Object.entries(parsed.extracted_parameters || {})) {
        const param = val as any
        extractedParams[key] = {
          value: param.value,
          raw_value: param.raw_value || '',
          context_snippet: param.context_snippet || '',
          page_reference: param.page_reference || '',
          law_reference: param.law_reference || '',
          confidence: param.confidence || 0.5,
          extraction_method: 'claude_api',
          notes: param.notes,
        }
      }

      return {
        status: parsed.identified_changes?.length > 0 ? 'success' : 'partial',
        extracted_parameters: extractedParams,
        identified_changes: parsed.identified_changes || [],
        confidence_assessment: parsed.confidence_assessment || {
          overall_confidence: 0.7,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: parsed.analysis_notes || [],
      }
    } catch {
      return {
        status: 'error',
        extracted_parameters: {},
        identified_changes: [],
        confidence_assessment: {
          overall_confidence: 0,
          parameter_confidences: {},
          uncertain_extractions: [],
        },
        analysis_notes: ['Fehler beim Parsen der API-Response'],
      }
    }
  }

  /**
   * Parsed Change-Analysis-Response
   */
  private parseChangeAnalysisResponse(response: string): {
    identified_changes: ParameterChange[]
    analysis_notes: string[]
  } {
    try {
      const parsed = JSON.parse(response)
      return {
        identified_changes: parsed.identified_changes || [],
        analysis_notes: parsed.analysis_notes || [],
      }
    } catch {
      return {
        identified_changes: [],
        analysis_notes: ['Fehler beim Parsen der Änderungsanalyse'],
      }
    }
  }
}
