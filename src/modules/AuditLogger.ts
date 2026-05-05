/**
 * AuditLogger-Modul
 * Vollständige Nachverfolgung aller Berechnungen für Audit & Compliance
 *
 * Zweck:
 * - Jeden Berechnungsschritt dokumentieren
 * - Vollständige Nachvollziehbarkeit für Revision
 * - Reproduzierbarkeit der Ergebnisse
 * - Compliance mit § 90 AStG (Dokumentation)
 */

import type {
  LohnsteuerInputs,
  AuditTrail,
  AuditEntry,
  TaxResult,
} from '../types/index.js'

export interface DetailedAuditLog {
  calculation_id: string
  timestamp: Date
  user_inputs: LohnsteuerInputs
  calculation_steps: Array<{
    step_number: number
    step_name: string
    inputs: Record<string, any>
    output: number | Record<string, any>
    pap_reference: string
    formula?: string
    timestamp: Date
  }>
  final_result: TaxResult
  duration_ms: number
}

export class AuditLogger {
  private logs: Map<string, DetailedAuditLog> = new Map()
  private currentLog: DetailedAuditLog | null = null

  /**
   * Startet eine neue Audit-Sitzung
   */
  startCalculation(inputs: LohnsteuerInputs): string {
    const calculation_id = this.generateId()
    const now = new Date()

    this.currentLog = {
      calculation_id,
      timestamp: now,
      user_inputs: { ...inputs },
      calculation_steps: [],
      final_result: {
        lstlzz: 0,
        solzlzz: 0,
        kist8lzz: 0,
        kist9lzz: 0,
        durchschnittsbelastung: {
          lst: 0,
          lstMitSolz: 0,
          lstMitKst8: 0,
          lstMitKst9: 0,
        },
        rvBeitrag: 0,
        alvBeitrag: 0,
        kvBeitrag: 0,
        pvBeitrag: 0,
        auditTraceId: calculation_id,
        calculatedAt: now,
      },
      duration_ms: 0,
    }

    return calculation_id
  }

  /**
   * Loggt einen Berechnungsschritt
   */
  logStep(
    step_number: number,
    step_name: string,
    inputs: Record<string, any>,
    output: number | Record<string, any>,
    pap_reference: string,
    formula?: string
  ): void {
    if (!this.currentLog) {
      console.warn('AuditLogger: Keine aktive Berechnung. Rufen Sie startCalculation() auf.')
      return
    }

    this.currentLog.calculation_steps.push({
      step_number,
      step_name,
      inputs: { ...inputs },
      output,
      pap_reference,
      formula,
      timestamp: new Date(),
    })
  }

  /**
   * Beendet die Berechnung und speichert das Ergebnis
   */
  finishCalculation(result: TaxResult): string {
    if (!this.currentLog) {
      throw new Error('AuditLogger: Keine aktive Berechnung')
    }

    const endTime = new Date()
    this.currentLog.final_result = result
    this.currentLog.duration_ms =
      endTime.getTime() - this.currentLog.timestamp.getTime()

    const id = this.currentLog.calculation_id
    this.logs.set(id, this.currentLog)
    this.currentLog = null

    return id
  }

  /**
   * Holt das komplette Audit-Log für eine Berechnung
   */
  getLog(calculation_id: string): DetailedAuditLog | undefined {
    return this.logs.get(calculation_id)
  }

  /**
   * Exportiert das Log als JSON
   */
  exportAsJSON(calculation_id: string): string {
    const log = this.logs.get(calculation_id)
    if (!log) {
      throw new Error(`Audit-Log nicht gefunden: ${calculation_id}`)
    }

    return JSON.stringify(log, null, 2)
  }

  /**
   * Exportiert das Log als CSV (für Tabellenkalkulationen)
   */
  exportAsCSV(calculation_id: string): string {
    const log = this.logs.get(calculation_id)
    if (!log) {
      throw new Error(`Audit-Log nicht gefunden: ${calculation_id}`)
    }

    let csv =
      'Schritt-Nr,Beschreibung,Eingabe,Ausgabe,PAP-Referenz,Formel,Zeitstempel\n'

    for (const step of log.calculation_steps) {
      const inputs = JSON.stringify(step.inputs).replace(/"/g, '""')
      const output = JSON.stringify(step.output).replace(/"/g, '""')
      const pap = step.pap_reference.replace(/"/g, '""')
      const formula = (step.formula || '').replace(/"/g, '""')

      csv += `${step.step_number},"${step.step_name}","${inputs}","${output}","${pap}","${formula}","${step.timestamp.toISOString()}"\n`
    }

    return csv
  }

  /**
   * Exportiert das Log als HTML für Anzeige im Browser
   */
  exportAsHTML(calculation_id: string): string {
    const log = this.logs.get(calculation_id)
    if (!log) {
      throw new Error(`Audit-Log nicht gefunden: ${calculation_id}`)
    }

    let html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Audit-Report ${calculation_id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #667eea; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { background: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .result { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <h1>📋 Audit-Report</h1>
  <p>Berechnung ID: <code>${calculation_id}</code></p>
  <p>Zeitstempel: ${log.timestamp.toLocaleString('de-DE')}</p>
  <p>Dauer: ${log.duration_ms}ms</p>

  <div class="summary">
    <h2>Zusammenfassung</h2>
    <p><strong>Lohnsteuer:</strong> <span class="result">${(log.final_result.lstlzz / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} EUR</span></p>
    <p><strong>Solidaritätszuschlag:</strong> <span class="result">${(log.final_result.solzlzz / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} EUR</span></p>
  </div>

  <h2>Berechnungsschritte</h2>
  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Schritt</th>
        <th>Ausgabe</th>
        <th>PAP-Referenz</th>
        <th>Formel</th>
      </tr>
    </thead>
    <tbody>
`

    for (const step of log.calculation_steps) {
      const output =
        typeof step.output === 'number'
          ? (step.output / 100).toLocaleString('de-DE', {
              maximumFractionDigits: 2,
            })
          : JSON.stringify(step.output)

      html += `
      <tr>
        <td>${step.step_number}</td>
        <td>${step.step_name}</td>
        <td>${output}</td>
        <td>${step.pap_reference}</td>
        <td>${step.formula || '-'}</td>
      </tr>
`
    }

    html += `
    </tbody>
  </table>

  <p style="margin-top: 30px; font-size: 0.9em; color: #999;">
    Dieses Dokument wurde von LexLohnRechner v1.0 generiert.
    Für offizielle Lohnsteuerberechnungen verwenden Sie behördlich zugelassene Systeme.
  </p>
</body>
</html>
`

    return html
  }

  /**
   * Generiert einen Audit-Report mit Vergleich
   */
  compareWithExpected(
    calculation_id: string,
    expected: TaxResult
  ): {
    matches: boolean
    differences: string[]
  } {
    const log = this.logs.get(calculation_id)
    if (!log) {
      throw new Error(`Audit-Log nicht gefunden: ${calculation_id}`)
    }

    const actual = log.final_result
    const differences: string[] = []

    const tolerance = 1 // ±0,01 EUR

    if (Math.abs(actual.lstlzz - expected.lstlzz) > tolerance) {
      differences.push(
        `Lohnsteuer: ${(actual.lstlzz / 100).toFixed(2)} EUR vs. erwartet ${(expected.lstlzz / 100).toFixed(2)} EUR`
      )
    }

    if (Math.abs(actual.solzlzz - expected.solzlzz) > tolerance) {
      differences.push(
        `Solidaritätszuschlag: ${(actual.solzlzz / 100).toFixed(2)} EUR vs. erwartet ${(expected.solzlzz / 100).toFixed(2)} EUR`
      )
    }

    return {
      matches: differences.length === 0,
      differences,
    }
  }

  /**
   * Listet alle gespeicherten Logs auf
   */
  listAllLogs(): Array<{
    calculation_id: string
    timestamp: Date
    bruttolohn: number
    lstlzz: number
  }> {
    const list: Array<{
      calculation_id: string
      timestamp: Date
      bruttolohn: number
      lstlzz: number
    }> = []

    for (const log of this.logs.values()) {
      list.push({
        calculation_id: log.calculation_id,
        timestamp: log.timestamp,
        bruttolohn: log.user_inputs.bruttolohn || 0,
        lstlzz: log.final_result.lstlzz,
      })
    }

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Exportiert alle Logs als Batch-JSON
   */
  exportAllAsJSON(): string {
    const allLogs = Array.from(this.logs.values())
    return JSON.stringify(allLogs, null, 2)
  }

  /**
   * Löscht ein Log
   */
  deleteLog(calculation_id: string): boolean {
    return this.logs.delete(calculation_id)
  }

  /**
   * Gibt die Anzahl der gespeicherten Logs zurück
   */
  getLogCount(): number {
    return this.logs.size
  }

  /**
   * Generiert eine eindeutige ID
   */
  private generateId(): string {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
