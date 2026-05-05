/**
 * Hauptanwendung für Lohnsteuer-Webtool
 * Phase 1: Eingabeform mit Validierung
 */

import { InputValidator } from '../modules/InputValidator.js'
import { ReferenceRegistry } from '../modules/ReferenceRegistry.js'
import { TaxCalculator } from '../modules/TaxCalculator.js'
import { SocialSecurityCalculator } from '../modules/SocialSecurityCalculator.js'
import { AuditLogger } from '../modules/AuditLogger.js'
import { ResultsFormatter } from '../modules/ResultsFormatter.js'
import { VersionManager } from '../modules/VersionManager.js'
import type { LohnsteuerInputs, ValidationError, ParameterSet } from '../types/index.js'
import parameters2025 from '../data/parameters-2025.json'
import parameters2026 from '../data/parameters-2026.json'
import parameters2027 from '../data/parameters-2027.json'

// ============================================================================
// INITIALISIERUNG
// ============================================================================

const validator = new InputValidator(2026)
const references = new ReferenceRegistry()

// VersionManager für mehrjähriges Support
const versionManager = new VersionManager()
versionManager.registerVersion(parameters2025 as ParameterSet)
versionManager.registerVersion(parameters2026 as ParameterSet)
versionManager.registerVersion(parameters2027 as ParameterSet)

let currentYear = 2026
let currentParameters = parameters2026 as ParameterSet
let taxCalculator = new TaxCalculator(currentParameters)
let socialCalculator = new SocialSecurityCalculator(currentParameters)
const auditLogger = new AuditLogger()

// DOM Elements
const form = document.getElementById('taxForm') as HTMLFormElement
const calculateBtn = document.getElementById('calculateBtn') as HTMLButtonElement
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement
const resultsDiv = document.getElementById('results') as HTMLDivElement
const validationDiv = document.getElementById('validationErrors') as HTMLDivElement
const loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement

// Form Fields
const fields = {
  lohnZZ: document.getElementById('lohnZZ') as HTMLSelectElement,
  stkl: document.getElementById('stkl') as HTMLSelectElement,
  bruttolohn: document.getElementById('bruttolohn') as HTMLInputElement,
  freibetrag: document.getElementById('freibetrag') as HTMLInputElement,
  rvStatus: document.getElementById('rvStatus') as HTMLSelectElement,
  kvStatus: document.getElementById('kvStatus') as HTMLSelectElement,
  kvZusatzSatz: document.getElementById('kvZusatzSatz') as HTMLInputElement,
  pvStatus: document.getElementById('pvStatus') as HTMLSelectElement,
  pvSachsen: document.getElementById('pvSachsen') as HTMLSelectElement,
  kinderfreibetraege: document.getElementById('kinderfreibetraege') as HTMLInputElement,
  geburtsjahr: document.getElementById('geburtsjahr') as HTMLInputElement,
  westOst: document.getElementById('westOst') as HTMLSelectElement,
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

calculateBtn.addEventListener('click', handleCalculate)
resetBtn.addEventListener('click', handleReset)

// Year selection
const yearSelect = document.getElementById('yearSelect') as HTMLSelectElement
yearSelect.addEventListener('change', (e) => {
  const year = parseInt((e.target as HTMLSelectElement).value)
  switchYear(year)
})

// Comparison button
const compareBtn = document.getElementById('compareBtn') as HTMLButtonElement
compareBtn.addEventListener('click', showComparison)

// Back button
const backBtn = document.getElementById('backToCalcBtn') as HTMLButtonElement
backBtn.addEventListener('click', hideComparison)

// Real-time validation
Object.values(fields).forEach((field) => {
  field.addEventListener('change', () => validateField(field))
  field.addEventListener('blur', () => validateField(field))
})

// ============================================================================
// FORM HANDLING
// ============================================================================

function handleCalculate(): void {
  const inputs = getFormInputs()
  const validation = validator.validateAllInputs(inputs)

  if (!validation.valid) {
    displayValidationErrors(validation.errors)
    resultsDiv.classList.remove('show')
    return
  }

  validationDiv.classList.remove('show')
  loadingSpinner.style.display = 'block'

  // Simulate calculation delay (Phase 2 wird echte Berechnung sein)
  setTimeout(() => {
    performCalculation(inputs)
    loadingSpinner.style.display = 'none'
  }, 500)
}

function handleReset(): void {
  form.reset()
  resultsDiv.classList.remove('show')
  validationDiv.classList.remove('show')
  Object.values(fields).forEach((field) => {
    const group = field.closest('.form-group')
    if (group) {
      group.classList.remove('error', 'warning')
      const errorMsg = group.querySelector('.error-message')
      const warningMsg = group.querySelector('.warning-message')
      if (errorMsg) errorMsg.classList.remove('show')
      if (warningMsg) warningMsg.classList.remove('show')
    }
  })
}

function getFormInputs(): Partial<LohnsteuerInputs> {
  return {
    lohnZZ: parseInt(fields.lohnZZ.value) as any,
    stkl: parseInt(fields.stkl.value) as any,
    bruttolohn: Math.round(parseFloat(fields.bruttolohn.value) * 100),
    freibetrag: fields.freibetrag.value ? Math.round(parseFloat(fields.freibetrag.value) * 100) : undefined,
    rvStatus: parseInt(fields.rvStatus.value) as any,
    kvStatus: parseInt(fields.kvStatus.value) as any,
    kvZusatzbeitragSatz: parseFloat(fields.kvZusatzSatz.value),
    pvStatus: parseInt(fields.pvStatus.value) as any,
    pvSachsenZuschlag: parseInt(fields.pvSachsen.value) as any,
    anzahlKinderfreibetraege: parseInt(fields.kinderfreibetraege.value),
    geburtsjahr: fields.geburtsjahr.value ? parseInt(fields.geburtsjahr.value) : undefined,
    westOst: parseInt(fields.westOst.value) as any,
    geringfuegig: 0,
    gleitzone: 0,
  }
}

// ============================================================================
// VALIDIERUNG
// ============================================================================

function validateField(field: HTMLElement): void {
  const fieldName = field.id as keyof typeof fields

  if (fieldName === 'bruttolohn') {
    const result = validator.validateBruttolohn(parseFloat((field as HTMLInputElement).value))
    updateFieldValidation(field as HTMLInputElement, result.errors)
  }

  if (fieldName === 'geburtsjahr') {
    const value = (field as HTMLInputElement).value
    if (value) {
      const result = validator.validateGeburtsjahr(parseInt(value))
      updateFieldValidation(field as HTMLInputElement, result.errors)
    }
  }

  if (fieldName === 'kinderfreibetraege') {
    const result = validator.validateKinderfreibetraege(
      parseInt((field as HTMLInputElement).value),
      parseInt(fields.stkl.value) as any
    )
    updateFieldValidation(field as HTMLInputElement, result.errors)
  }
}

function updateFieldValidation(field: HTMLInputElement, errors: ValidationError[]): void {
  const group = field.closest('.form-group') as HTMLElement
  if (!group) return

  // Clear previous states
  group.classList.remove('error', 'warning')

  const errorMessages = errors.filter((e) => e.severity === 'error')
  const warningMessages = errors.filter((e) => e.severity === 'warning')

  if (errorMessages.length > 0) {
    group.classList.add('error')
    const errorMsg = group.querySelector('.error-message') as HTMLElement
    if (errorMsg) {
      errorMsg.textContent = errorMessages[0].message
      errorMsg.classList.add('show')
    }
  }

  if (warningMessages.length > 0 && errorMessages.length === 0) {
    group.classList.add('warning')
    const warningMsg = group.querySelector('.warning-message') as HTMLElement
    if (warningMsg) {
      warningMsg.textContent = warningMessages[0].message
      warningMsg.classList.add('show')
    }
  }
}

function displayValidationErrors(errors: ValidationError[]): void {
  validationDiv.innerHTML = ''
  validationDiv.classList.add('show')

  const errorCount = errors.filter((e) => e.severity === 'error').length
  const warningCount = errors.filter((e) => e.severity === 'warning').length

  if (errorCount > 0) {
    const errorSection = document.createElement('div')
    errorSection.className = 'validation-summary errors show'

    const title = document.createElement('h3')
    title.textContent = `❌ ${errorCount} Fehler gefunden`
    errorSection.appendChild(title)

    const ul = document.createElement('ul')
    errors
      .filter((e) => e.severity === 'error')
      .forEach((err) => {
        const li = document.createElement('li')
        let text = err.message
        if (err.pap_reference) text += ` (${err.pap_reference})`
        li.textContent = text
        ul.appendChild(li)
      })

    errorSection.appendChild(ul)
    validationDiv.appendChild(errorSection)

    // Mark fields with errors
    errors
      .filter((e) => e.severity === 'error')
      .forEach((err) => {
        const field = document.getElementById(err.field) as HTMLInputElement
        if (field) {
          const group = field.closest('.form-group') as HTMLElement
          if (group) {
            group.classList.add('error')
            const errorMsg = group.querySelector('.error-message') as HTMLElement
            if (errorMsg) {
              errorMsg.textContent = err.message
              errorMsg.classList.add('show')
            }
          }
        }
      })
  }

  if (warningCount > 0) {
    const warningSection = document.createElement('div')
    warningSection.className = 'validation-summary warnings show'

    const title = document.createElement('h3')
    title.textContent = `⚠️ ${warningCount} Warnungen`
    warningSection.appendChild(title)

    const ul = document.createElement('ul')
    errors
      .filter((e) => e.severity === 'warning')
      .forEach((warn) => {
        const li = document.createElement('li')
        let text = warn.message
        if (warn.pap_reference) text += ` (${warn.pap_reference})`
        li.textContent = text
        ul.appendChild(li)
      })

    warningSection.appendChild(ul)
    validationDiv.appendChild(warningSection)
  }
}

// ============================================================================
// BERECHNUNG (Phase 1: Nur Eingabe-Anzeige)
// ============================================================================

function performCalculation(inputs: Partial<LohnsteuerInputs>): void {
  try {
    // Phase 2: Echte Berechnungen mit vollständiger Nachverfolgung
    const auditId = auditLogger.startCalculation(inputs as LohnsteuerInputs)

    // Lohnsteuer berechnen
    const taxResult = taxCalculator.calculateTaxes(inputs as LohnsteuerInputs)

    // Sozialversicherung berechnen
    const svResult = socialCalculator.calculateContributions(inputs as LohnsteuerInputs)

    // Ergebnisse kombinieren
    const completeResult = {
      ...taxResult,
      rvBeitrag: svResult.rvBeitrag,
      alvBeitrag: svResult.alvBeitrag,
      kvBeitrag: svResult.kvBeitrag,
      pvBeitrag: svResult.pvBeitrag,
      auditTraceId: auditId,
      calculatedAt: new Date(),
    }

    // Audit-Log beenden
    auditLogger.finishCalculation(completeResult)

    // Ergebnisse anzeigen
    const brutto = (inputs.bruttolohn || 0) / 100
    const total = (completeResult.lstlzz +
                  completeResult.solzlzz +
                  completeResult.rvBeitrag +
                  completeResult.alvBeitrag +
                  completeResult.kvBeitrag +
                  completeResult.pvBeitrag)
    const netto = (inputs.bruttolohn || 0) - total
    const quote = brutto > 0 ? ((total / (inputs.bruttolohn || 0)) * 100) : 0

    displayResults({
      brutto,
      lst: completeResult.lstlzz,
      solz: completeResult.solzlzz,
      kv8: completeResult.kist8lzz,
      kv9: completeResult.kist9lzz,
      rv: completeResult.rvBeitrag,
      alv: completeResult.alvBeitrag,
      kv: completeResult.kvBeitrag,
      pv: completeResult.pvBeitrag,
      total,
      netto,
      quote,
      auditId: completeResult.auditTraceId,
    })

    console.log('✅ Berechnung erfolgreich', {
      auditId,
      brutto: brutto.toFixed(2),
      netto: (netto / 100).toFixed(2),
    })
  } catch (error) {
    console.error('❌ Berechnungsfehler:', error)
    validationDiv.innerHTML = `
      <div class="validation-summary errors show">
        <h3>❌ Fehler bei Berechnung</h3>
        <ul>
          <li>${error instanceof Error ? error.message : 'Unbekannter Fehler'}</li>
        </ul>
      </div>
    `
    validationDiv.classList.add('show')
  }
}

interface CalculationResults {
  brutto: number // EUR (nicht Cent!)
  lst: number // EUR in Cent
  solz: number
  kv8: number
  kv9: number
  rv: number
  alv: number
  kv: number
  pv: number
  total: number // EUR in Cent
  netto: number // EUR in Cent
  quote: number // Prozentsatz
  auditId?: string
}

function displayResults(results: CalculationResults): void {
  const format = (centWert: number) => {
    const eur = centWert / 100
    return eur.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const percent = (centWert: number, brutto: number) => {
    if (brutto === 0) return '0,00%'
    return `${((centWert / (brutto * 100)) * 100).toFixed(2)}%`
  }

  // Bruttolohn
  ;(document.getElementById('result-brutto') as HTMLElement).textContent = `${results.brutto.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`

  // Lohnsteuer & Zuschläge
  ;(document.getElementById('result-lst') as HTMLElement).textContent = `${format(results.lst)} EUR`
  ;(document.getElementById('result-lst-percent') as HTMLElement).textContent = percent(results.lst, results.brutto)

  ;(document.getElementById('result-solz') as HTMLElement).textContent = `${format(results.solz)} EUR`
  ;(document.getElementById('result-solz-percent') as HTMLElement).textContent = percent(results.solz, results.brutto)
  ;(document.getElementById('result-solz-hint') as HTMLElement).textContent =
    results.solz === 0 ? 'Unter Freigrenze (20.350 EUR)' : 'Solidaritätszuschlag fällig'

  ;(document.getElementById('result-kst8') as HTMLElement).textContent = `${format(results.kv8)} EUR`
  ;(document.getElementById('result-kst8-percent') as HTMLElement).textContent = percent(results.kv8, results.brutto)

  ;(document.getElementById('result-kst9') as HTMLElement).textContent = `${format(results.kv9)} EUR`
  ;(document.getElementById('result-kst9-percent') as HTMLElement).textContent = percent(results.kv9, results.brutto)

  // Sozialversicherung
  ;(document.getElementById('result-rv') as HTMLElement).textContent = `${format(results.rv)} EUR`
  ;(document.getElementById('result-rv-percent') as HTMLElement).textContent = percent(results.rv, results.brutto)

  ;(document.getElementById('result-alv') as HTMLElement).textContent = `${format(results.alv)} EUR`
  ;(document.getElementById('result-alv-percent') as HTMLElement).textContent = percent(results.alv, results.brutto)

  ;(document.getElementById('result-kv') as HTMLElement).textContent = `${format(results.kv)} EUR`
  ;(document.getElementById('result-kv-percent') as HTMLElement).textContent = percent(results.kv, results.brutto)

  ;(document.getElementById('result-pv') as HTMLElement).textContent = `${format(results.pv)} EUR`
  ;(document.getElementById('result-pv-percent') as HTMLElement).textContent = percent(results.pv, results.brutto)

  // Belastungsquoten
  const lstQuote = percent(results.lst, results.brutto)
  const lstSolzQuote = percent(results.lst + results.solz, results.brutto)
  const totalQuote = percent(results.total, results.brutto)

  ;(document.getElementById('result-avg-lst') as HTMLElement).textContent = lstQuote
  ;(document.getElementById('result-avg-lst-solz') as HTMLElement).textContent = lstSolzQuote
  ;(document.getElementById('result-avg-total') as HTMLElement).textContent = totalQuote

  // Zusammenfassung
  ;(document.getElementById('result-total') as HTMLElement).textContent = `${format(results.total)} EUR`
  ;(document.getElementById('result-netto') as HTMLElement).textContent = `${format(results.netto)} EUR`
  ;(document.getElementById('result-quote') as HTMLElement).textContent = `${results.quote.toFixed(1)}%`

  // Audit-ID
  if (results.auditId) {
    ;(document.getElementById('audit-id') as HTMLElement).textContent = results.auditId
  }

  // Audit-Button
  const auditBtn = document.getElementById('showAuditBtn') as HTMLButtonElement
  if (auditBtn && results.auditId) {
    auditBtn.onclick = () => {
      const log = auditLogger.getLog(results.auditId!)
      if (log) {
        console.log('📋 Audit-Trail:', log)
        alert(`Audit-Trail ${results.auditId}:\n\n${JSON.stringify(log.calculation_steps, null, 2)}`)
      }
    }
  }

  resultsDiv.classList.add('show')
}

// ============================================================================
// JAHRES-AUSWAHL & VERGLEICH
// ============================================================================

function switchYear(year: number): void {
  const params = versionManager.getVersion(year)
  if (!params) {
    alert(`Parameter für Jahr ${year} nicht gefunden`)
    return
  }

  currentYear = year
  currentParameters = params
  taxCalculator = new TaxCalculator(currentParameters)
  socialCalculator = new SocialSecurityCalculator(currentParameters)

  console.log(`✅ Gewechselt zu Jahr ${year}`)

  // Reset results
  ;(document.getElementById('results') as HTMLElement).classList.remove('show')
}

function showComparison(): void {
  const availableYears = versionManager.getAvailableYears()

  if (availableYears.length < 2) {
    alert('Mindestens 2 Jahre erforderlich für Vergleich')
    return
  }

  // Vergleich mit Vorjahr
  const previousYear = availableYears.filter((y) => y < currentYear).pop()
  if (!previousYear) {
    alert('Kein Vorjahr für Vergleich verfügbar')
    return
  }

  const changelog = versionManager.compareVersions(previousYear, currentYear)

  // HTML generieren
  let html = `
    <h3>Änderungen ${previousYear} → ${currentYear}</h3>
    <p><strong>Veröffentlichung PAP:</strong> ${changelog.published_date}</p>
    <p><strong>Gesamte Änderungen:</strong> ${changelog.summary.total_changes}</p>
    <p><strong>Kritische Änderungen:</strong> ${changelog.summary.high_impact_changes}</p>

    <div class="comparison-grid">
  `

  for (const diff of changelog.differences) {
    const impactClass = diff.impact
    const changeType = diff.change_type

    html += `
      <div class="comparison-item ${changeType}">
        <div class="change-label">${diff.field_name}</div>
        <div class="change-values">
          <strong>${previousYear}:</strong> ${formatComparisonValue(diff.old_value)}<br>
          <strong>${currentYear}:</strong> ${formatComparisonValue(diff.new_value)}
        </div>
        <div class="change-impact ${impactClass}">${impactClass.toUpperCase()}</div>
      </div>
    `
  }

  html += '</div>'

  const comparisonContent = document.getElementById('comparisonContent') as HTMLElement
  comparisonContent.innerHTML = html

  // Zeige Vergleichs-Sektion
  ;(document.getElementById('comparisonSection') as HTMLElement).classList.add('show')
  ;(document.querySelector('.content') as HTMLElement).style.display = 'none'

  console.log('📊 Vergleich angezeigt')
}

function hideComparison(): void {
  ;(document.getElementById('comparisonSection') as HTMLElement).classList.remove('show')
  ;(document.querySelector('.content') as HTMLElement).style.display = 'grid'
}

function formatComparisonValue(value: any): string {
  if (typeof value === 'number') {
    if (value > 100000) {
      return `${(value / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} EUR`
    }
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(2)}%`
    }
    return value.toFixed(2)
  }
  if (typeof value === 'object') {
    return '[Komplexe Struktur]'
  }
  return String(value)
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('✅ LexLohnRechner v1.0 (Phase 4) - VersionManager aktiviert')
console.log('📦 Available years:', versionManager.getAvailableYears())
console.log('🔗 References registered:', references.getAllReferences().size)
