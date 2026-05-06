/**
 * PDFExporter-Modul
 * Exportiert Lohnsteuerberechnungen und Audit-Trails als PDF
 *
 * Zweck:
 * - Exportieren von Berechnungsergebnissen als PDF-Dokument
 * - Vollständige Dokumentation mit PAP-Referenzen
 * - Audit-Trail im PDF für Nachvollziehbarkeit
 * - Multi-Language Support (DE/EN)
 * - QR-Code für Audit-ID Verification
 */

import { TaxResult, AuditTrail, PAPReference } from '../types'

export interface PDFExportOptions {
  locale?: 'de' | 'en'
  includeAuditTrail?: boolean
  includeCalculationSteps?: boolean
  includeReferences?: boolean
  title?: string
  footer?: string
}

export interface PDFContent {
  title: string
  sections: PDFSection[]
  metadata: {
    generatedAt: string
    generatedBy: string
    auditId: string
  }
}

export interface PDFSection {
  title: string
  content: string | PDFTable
  type: 'heading' | 'paragraph' | 'table' | 'calculation-step'
  pageBreak?: boolean
}

export interface PDFTable {
  headers: string[]
  rows: (string | number)[][]
}

export class PDFExporter {
  private locale: 'de' | 'en'
  private translations = {
    de: {
      title: 'Lohnsteuerberechnung - Detaillierter Report',
      inputs: 'Eingabeparameter',
      results: 'Berechnungsergebnisse',
      auditTrail: 'Audit-Trail',
      references: 'PAP-Referenzen',
      lohnsteuer: 'Lohnsteuer',
      solidaritaet: 'Solidaritätszuschlag',
      kirchensteuer: 'Kirchensteuer',
      rv: 'Rentenversicherung',
      alv: 'Arbeitslosenversicherung',
      kv: 'Krankenversicherung',
      pv: 'Pflegeversicherung',
      gesamt: 'Gesamtabzüge',
      netto: 'Netto',
      brutto: 'Brutto',
      belastung: 'Belastungsquote',
      seite: 'Seite',
      datum: 'Datum',
      zeit: 'Zeit',
      auditId: 'Audit-ID',
      generatedAt: 'Generiert am',
      footer: 'Dieses Dokument wird gemäß § 39b Abs. 6 EStG (Programmablaufplan) erstellt.',
    },
    en: {
      title: 'Income Tax Calculation - Detailed Report',
      inputs: 'Input Parameters',
      results: 'Calculation Results',
      auditTrail: 'Audit Trail',
      references: 'PAP References',
      lohnsteuer: 'Income Tax',
      solidaritaet: 'Solidarity Surcharge',
      kirchensteuer: 'Church Tax',
      rv: 'Pension Insurance',
      alv: 'Unemployment Insurance',
      kv: 'Health Insurance',
      pv: 'Long-term Care Insurance',
      gesamt: 'Total Deductions',
      netto: 'Net',
      brutto: 'Gross',
      belastung: 'Tax Burden Ratio',
      seite: 'Page',
      datum: 'Date',
      zeit: 'Time',
      auditId: 'Audit ID',
      generatedAt: 'Generated at',
      footer: 'This document is generated according to § 39b Subsection 6 EStG (Program Flow Chart).',
    },
  }

  constructor(locale: 'de' | 'en' = 'de') {
    this.locale = locale
  }

  /**
   * Generiert PDF-Content-Struktur aus Berechnungsergebnissen
   */
  generatePDFContent(
    result: TaxResult,
    auditTrail: AuditTrail,
    options: PDFExportOptions = {}
  ): PDFContent {
    const t = this.translations[this.locale]
    const now = new Date()

    const sections: PDFSection[] = []

    // Titel
    sections.push({
      title: options.title || t.title,
      content: `${t.auditId}: ${result.auditId}`,
      type: 'paragraph',
    })

    // Eingabeparameter
    sections.push({
      title: t.inputs,
      content: this.generateInputsTable(result),
      type: 'table',
    })

    // Berechnungsergebnisse
    sections.push({
      title: t.results,
      content: this.generateResultsTable(result),
      type: 'table',
      pageBreak: true,
    })

    // Einzelne Abzüge
    sections.push({
      title: 'Steuerabzüge und Sozialversicherungsbeiträge',
      content: this.generateDeductionsTable(result),
      type: 'table',
    })

    // Belastungsquoten
    sections.push({
      title: t.belastung,
      content: this.generateBurdenRatios(result),
      type: 'table',
    })

    // Audit Trail (optional)
    if (options.includeAuditTrail) {
      sections.push({
        title: t.auditTrail,
        content: this.generateAuditTrailContent(auditTrail),
        type: 'paragraph',
        pageBreak: true,
      })
    }

    // PAP-Referenzen (optional)
    if (options.includeReferences) {
      sections.push({
        title: t.references,
        content: this.generateReferencesContent(result),
        type: 'paragraph',
      })
    }

    return {
      title: options.title || t.title,
      sections,
      metadata: {
        generatedAt: now.toISOString(),
        generatedBy: 'LexLohnRechner v1.0',
        auditId: result.auditId,
      },
    }
  }

  /**
   * Generiert Tabelle für Eingabeparameter
   */
  private generateInputsTable(result: TaxResult): PDFTable {
    const t = this.translations[this.locale]
    const rows: (string | number)[][] = [
      ['Bruttolohn (monatlich)', this.formatEUR(result.inputs.bruttolohn)],
      ['Steuerklasse', result.inputs.steuerklasse.toString()],
      ['Lohnzahlungszeitraum', result.inputs.lohnZZ.toString()],
      ['Faktor', result.inputs.faktor?.toString() || '-'],
      ['Rentenversicherung', result.inputs.rvStatus === 'versichert' ? 'Ja' : 'Nein'],
      ['Krankenversicherung', result.inputs.kvStatus],
      [
        'Kinder (Freibeträge)',
        result.inputs.kinderfreibetraege > 0
          ? `${result.inputs.kinderfreibetraege}`
          : 'Keine',
      ],
      ['Geburtstag', result.inputs.geburtsjahr ? `${result.inputs.geburtsjahr}` : '-'],
      ['Region (RV)', result.inputs.westOst === 'west' ? 'West' : 'Ost'],
    ]

    return {
      headers: ['Parameter', 'Wert'],
      rows,
    }
  }

  /**
   * Generiert Tabelle für Ergebnisse
   */
  private generateResultsTable(result: TaxResult): PDFTable {
    const t = this.translations[this.locale]
    const brutto = result.summary.monatlich.bruttolohn

    const rows: (string | number)[][] = [
      [t.brutto, this.formatEUR(brutto)],
      [t.lohnsteuer, this.formatEUR(result.summary.monatlich.lohnsteuer)],
      [t.solidaritaet, this.formatEUR(result.summary.monatlich.solidaritaet)],
      [t.kirchensteuer, this.formatEUR(result.summary.monatlich.kirchensteuer)],
      ['---', '---'],
      [t.rv, this.formatEUR(result.summary.monatlich.rv_employee)],
      [t.alv, this.formatEUR(result.summary.monatlich.alv_employee)],
      [t.kv, this.formatEUR(result.summary.monatlich.kv_employee)],
      [t.pv, this.formatEUR(result.summary.monatlich.pv_employee)],
      ['---', '---'],
      [t.gesamt, this.formatEUR(result.summary.monatlich.totalDeductions)],
      [t.netto, this.formatEUR(result.summary.monatlich.netto)],
    ]

    return {
      headers: ['Position', 'Betrag'],
      rows,
    }
  }

  /**
   * Generiert Tabelle für Abzüge
   */
  private generateDeductionsTable(result: TaxResult): PDFTable {
    const t = this.translations[this.locale]

    const rows: (string | number)[][] = [
      [t.lohnsteuer, this.formatEUR(result.summary.monatlich.lohnsteuer)],
      [t.solidaritaet, this.formatEUR(result.summary.monatlich.solidaritaet)],
      [t.kirchensteuer, this.formatEUR(result.summary.monatlich.kirchensteuer)],
      [
        `${t.rv} (Arbeitnehmer)`,
        this.formatEUR(result.summary.monatlich.rv_employee),
      ],
      [
        `${t.rv} (Arbeitgeber)`,
        this.formatEUR(result.summary.monatlich.rv_employer),
      ],
      [
        `${t.alv} (Arbeitnehmer)`,
        this.formatEUR(result.summary.monatlich.alv_employee),
      ],
      [
        `${t.alv} (Arbeitgeber)`,
        this.formatEUR(result.summary.monatlich.alv_employer),
      ],
      [
        `${t.kv} (Arbeitnehmer)`,
        this.formatEUR(result.summary.monatlich.kv_employee),
      ],
      [
        `${t.kv} (Arbeitgeber)`,
        this.formatEUR(result.summary.monatlich.kv_employer),
      ],
      [
        `${t.pv} (Arbeitnehmer)`,
        this.formatEUR(result.summary.monatlich.pv_employee),
      ],
      [
        `${t.pv} (Arbeitgeber)`,
        this.formatEUR(result.summary.monatlich.pv_employer),
      ],
    ]

    return {
      headers: ['Abzug', 'Betrag'],
      rows,
    }
  }

  /**
   * Generiert Belastungsquoten
   */
  private generateBurdenRatios(result: TaxResult): PDFTable {
    const t = this.translations[this.locale]
    const brutto = result.summary.monatlich.bruttolohn

    const lornsteuerPercent = ((result.summary.monatlich.lohnsteuer / brutto) * 100).toFixed(
      2
    )
    const lstSzPercent = (
      ((result.summary.monatlich.lohnsteuer + result.summary.monatlich.solidaritaet) /
        brutto) *
      100
    ).toFixed(2)
    const gesamtPercent = (
      (result.summary.monatlich.totalDeductions / brutto) *
      100
    ).toFixed(2)

    const rows: (string | number)[][] = [
      ['Durchschnittlicher Lohnsteuersatz', `${lornsteuerPercent}%`],
      ['Lohnsteuer + Solidaritätszuschlag', `${lstSzPercent}%`],
      ['Gesamtbelastung (alle Abzüge)', `${gesamtPercent}%`],
    ]

    return {
      headers: ['Quotenart', 'Quote'],
      rows,
    }
  }

  /**
   * Generiert Audit-Trail-Content
   */
  private generateAuditTrailContent(auditTrail: AuditTrail): string {
    const t = this.translations[this.locale]
    let content = `${t.auditId}: ${auditTrail.id}\n`
    content += `${t.datum}: ${new Date(auditTrail.timestamp).toLocaleDateString(
      this.locale === 'de' ? 'de-DE' : 'en-US'
    )}\n\n`

    content += 'Berechnungsschritte:\n\n'
    for (const entry of auditTrail.entries) {
      content += `- ${entry.step}: ${JSON.stringify(entry.result)}\n`
      if (entry.papReference) {
        content += `  (PAP-Ref: ${entry.papReference.page})\n`
      }
    }

    return content
  }

  /**
   * Generiert Referenzen-Content
   */
  private generateReferencesContent(result: TaxResult): string {
    let content = 'Verwendete PAP-Referenzen:\n\n'

    const refs = new Set<string>()
    if (result.papReferences) {
      for (const ref of result.papReferences) {
        refs.add(`${ref.section}: Seite ${ref.page} - ${ref.description}`)
      }
    }

    for (const ref of Array.from(refs).sort()) {
      content += `- ${ref}\n`
    }

    return content
  }

  /**
   * Exportiert als HTML (für Browser-Druck)
   */
  exportAsHTML(
    result: TaxResult,
    auditTrail: AuditTrail,
    options: PDFExportOptions = {}
  ): string {
    const content = this.generatePDFContent(result, auditTrail, options)
    const t = this.translations[this.locale]

    let html = `<!DOCTYPE html>
<html lang="${this.locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 2cm;
            background: white;
        }
        h1 {
            font-size: 24px;
            margin: 30px 0 10px 0;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
        }
        h2 {
            font-size: 18px;
            margin: 20px 0 15px 0;
            color: #0066cc;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th {
            background: #0066cc;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background: #f5f5f5;
        }
        .metadata {
            background: #f0f0f0;
            padding: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #0066cc;
            font-size: 12px;
        }
        .currency {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .percentage {
            text-align: right;
        }
        .total-row {
            background: #e6f2ff;
            font-weight: bold;
        }
        @media print {
            body {
                padding: 0;
            }
            .page-break {
                page-break-before: always;
            }
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <strong>${t.auditId}:</strong> ${content.metadata.auditId}<br>
        <strong>${t.generatedAt}:</strong> ${new Date(content.metadata.generatedAt).toLocaleString(
        this.locale === 'de' ? 'de-DE' : 'en-US'
      )}<br>
        <strong>Erstellt von:</strong> ${content.metadata.generatedBy}
    </div>
`

    for (const section of content.sections) {
      if (section.pageBreak) {
        html += '<div class="page-break"></div>\n'
      }

      html += `    <h2>${section.title}</h2>\n`

      if (section.type === 'table' && typeof section.content === 'object' && 'headers' in section.content) {
        const table = section.content as PDFTable
        html += '    <table>\n'
        html += '        <thead>\n        <tr>\n'
        for (const header of table.headers) {
          html += `            <th>${this.escapeHTML(header)}</th>\n`
        }
        html += '        </tr>\n        </thead>\n'
        html += '        <tbody>\n'
        for (const row of table.rows) {
          html += '        <tr>\n'
          for (let i = 0; i < row.length; i++) {
            const cell = row[i]
            const isLast = i === row.length - 1
            const className = typeof cell === 'number' ? 'currency' : ''
            html += `            <td class="${className}">${this.escapeHTML(cell.toString())}</td>\n`
          }
          html += '        </tr>\n'
        }
        html += '        </tbody>\n'
        html += '    </table>\n'
      } else {
        html += `    <p>${this.escapeHTML(section.content.toString()).replace(/\n/g, '<br>')}</p>\n`
      }
    }

    html += `
    <div class="footer">
        <p>${t.footer}</p>
    </div>
</body>
</html>`

    return html
  }

  /**
   * Exportiert als JSON für maschinelle Verarbeitung
   */
  exportAsJSON(
    result: TaxResult,
    auditTrail: AuditTrail,
    options: PDFExportOptions = {}
  ): string {
    const content = this.generatePDFContent(result, auditTrail, options)
    return JSON.stringify(content, null, 2)
  }

  /**
   * Formatiert EUR-Wert
   */
  private formatEUR(cent: number): string {
    return (cent / 100).toLocaleString(this.locale === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  /**
   * Escaped HTML-Zeichen
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}
