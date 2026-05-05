/**
 * Hauptanwendung für Lohnsteuer-Webtool
 * Phase 1: Eingabeform mit Validierung
 */

import { InputValidator } from '../modules/InputValidator.js'
import { ReferenceRegistry } from '../modules/ReferenceRegistry.js'
import type { LohnsteuerInputs, ValidationError } from '../types/index.js'
import parametersData from '../data/parameters-2026.json'

// ============================================================================
// INITIALISIERUNG
// ============================================================================

const validator = new InputValidator(2026)
const references = new ReferenceRegistry()

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
  // Phase 1: Zeige nur die Eingaben an
  // Phase 2: Hier kommt die echte TaxCalculator-Berechnung

  const brutto = (inputs.bruttolohn || 0) / 100

  // Dummy-Berechnung für Phase 1
  const lst = Math.round(brutto * 0.15)
  const solz = Math.round(lst * 0.055)
  const rv = Math.round(brutto * 0.093)
  const alv = Math.round(brutto * 0.026)
  const kv = Math.round(brutto * 0.07)
  const pv = Math.round(brutto * 0.018)
  const total = lst + solz + rv + alv + kv + pv
  const netto = Math.round(brutto - total)
  const quote = ((total / brutto) * 100).toFixed(2)

  // Update Results
  displayResults({
    brutto,
    lst,
    solz,
    kv8: Math.round(lst * 0.08),
    kv9: Math.round(lst * 0.09),
    rv,
    alv,
    kv,
    pv,
    total,
    netto,
    quote: parseFloat(quote),
  })
}

interface CalculationResults {
  brutto: number
  lst: number
  solz: number
  kv8: number
  kv9: number
  rv: number
  alv: number
  kv: number
  pv: number
  total: number
  netto: number
  quote: number
}

function displayResults(results: CalculationResults): void {
  const format = (value: number) => `${(value / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`

  ;(document.getElementById('result-brutto') as HTMLElement).textContent = format(results.brutto * 100)
  ;(document.getElementById('result-lst') as HTMLElement).textContent = format(results.lst * 100)
  ;(document.getElementById('result-solz') as HTMLElement).textContent = format(results.solz * 100)
  ;(document.getElementById('result-kst8') as HTMLElement).textContent = format(results.kv8 * 100)
  ;(document.getElementById('result-kst9') as HTMLElement).textContent = format(results.kv9 * 100)
  ;(document.getElementById('result-rv') as HTMLElement).textContent = format(results.rv * 100)
  ;(document.getElementById('result-alv') as HTMLElement).textContent = format(results.alv * 100)
  ;(document.getElementById('result-kv') as HTMLElement).textContent = format(results.kv * 100)
  ;(document.getElementById('result-pv') as HTMLElement).textContent = format(results.pv * 100)
  ;(document.getElementById('result-total') as HTMLElement).textContent = format(results.total * 100)
  ;(document.getElementById('result-netto') as HTMLElement).textContent = format(results.netto * 100)
  ;(document.getElementById('result-quote') as HTMLElement).textContent = `${results.quote.toFixed(1)}%`

  resultsDiv.classList.add('show')
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('✅ LexLohnRechner v1.0 - Phase 1 loaded')
console.log('📦 Parameters loaded:', parametersData.version)
console.log('🔗 References registered:', references.getAllReferences().size)
