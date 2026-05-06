# Phase 5 Integration Guide
## Anleitung für Entwickler zur Nutzung der neuen Module

---

## Übersicht

Phase 5 fügt vier neue Module hinzu, die es dem Tool ermöglichen, automatisch Parameter aus PAP-PDFs zu extrahieren und Benutzer bei der Genehmigung von Updates zu unterstützen:

1. **PAPAnalyzer** - Regex-basierte Parameterextraktion
2. **PDFExporter** - Export von Berechnungen in PDF/HTML/JSON
3. **ClaudeParameterExtractor** - Intelligente Extraktion mittels Claude API
4. **PDFUploadManager** - Kompletter PDF-Upload und Genehmigungsworkflow

---

## 1. PAPAnalyzer - Einfache Parameter-Extraktion

### Import
```typescript
import { PAPAnalyzer } from './modules/PAPAnalyzer'
```

### Basic Usage
```typescript
const analyzer = new PAPAnalyzer()

// PAP-Text laden (z.B. aus PDF extrahiert)
const papText = `
  Grundfreibetrag: EUR 11.600
  Beitragsbemessungsgrenze RV: EUR 101.400
  ...
`

// Analysieren
const result = analyzer.analyzePAPText(papText)

console.log(result.extracted_parameters)
// [{
//   name: 'grundfreibetrag',
//   value: 1160000,    // in EUR-Cent
//   page: 12,
//   context: 'Tarifberechnung § 32a EStG',
//   confidence: 0.9,
//   pap_reference: 'S. 12, Zone A'
// }]

// Identifizierte Änderungen
console.log(result.identified_changes)
// [{
//   parameter: 'grundfreibetrag',
//   old_value: 1146000,
//   new_value: 1160000,
//   page: 12,
//   law_reference: 'S. 12, Zone A'
// }]

// Update-Vorschläge generieren
const suggestions = analyzer.generateUpdateSuggestions(result)
// [{
//   parameter: 'grundfreibetrag',
//   current_value: 1146000,
//   suggested_value: 1160000,
//   impact: 'high',
//   action: 'Update grundfreibetrag von 11.460,00 zu 11.600,00 EUR'
// }]

// Validierungsregeln generieren
const rules = analyzer.generateValidationRules(result)
// {
//   grundfreibetrag_min: 1160000,
//   grundfreibetrag_max: 1160000,
//   rv_bbg_max: 10140000,
//   ...
// }

// Markdown-Report generieren
const report = analyzer.generateAnalysisReport(result)
console.log(report)
// # PAP-Analyse Report
// **PAP Version:** 2026
// **Publikationsdatum:** 2025-11-12
// ...
```

---

## 2. PDFExporter - Berechnung exportieren

### Import
```typescript
import { PDFExporter, PDFExportOptions } from './modules/PDFExporter'
```

### Deutsch (Standard)
```typescript
const exporter = new PDFExporter('de')

const options: PDFExportOptions = {
  title: 'Lohnsteuerberechnung Dezember 2026',
  includeAuditTrail: true,
  includeReferences: true,
  locale: 'de'
}

// HTML für Browser-Druck generieren
const htmlContent = exporter.exportAsHTML(
  taxResult,
  auditTrail,
  options
)

// Browser öffnen oder speichern
window.location.href = `data:text/html,${encodeURIComponent(htmlContent)}`

// Oder als JSON für maschinelle Verarbeitung
const jsonContent = exporter.exportAsJSON(
  taxResult,
  auditTrail,
  options
)

const data = JSON.parse(jsonContent)
console.log(data.sections) // Array of sections
```

### English
```typescript
const exporter = new PDFExporter('en')

const htmlContent = exporter.exportAsHTML(
  taxResult,
  auditTrail,
  { locale: 'en' }
)
```

### Mit Audit-Trail (Optional)
```typescript
// Mit vollständiger Berechnung protokollieren
const options: PDFExportOptions = {
  includeAuditTrail: true,
  includeCalculationSteps: true,
  includeReferences: true
}

const html = exporter.exportAsHTML(taxResult, auditTrail, options)
```

---

## 3. ClaudeParameterExtractor - Intelligente Extraktion

### Voraussetzungen
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

### Import
```typescript
import { ClaudeParameterExtractor } from './modules/ClaudeParameterExtractor'
```

### Parameter-Extraktion
```typescript
const extractor = new ClaudeParameterExtractor(process.env.ANTHROPIC_API_KEY)

// Anfrage vorbereiten
const request = {
  pap_text: longPAPTextFromPDF,
  pap_version: '2027',
  pap_publication_date: '2026-11-15',
  extraction_focus: 'changes', // 'all' | 'changes' | 'specific'
  known_parameters: {
    grundfreibetrag: 1160000,
    rv_bbg: 10140000,
    // ...
  }
}

// Extrahieren (async!)
const result = await extractor.extractParameters(request)

console.log(result.status) // 'success' | 'partial' | 'error'
console.log(result.extracted_parameters)
console.log(result.identified_changes)
console.log(result.confidence_assessment)
```

### Änderungen zwischen Versionen vergleichen
```typescript
const oldPAPText = readFileSync('pap-2025.txt', 'utf-8')
const newPAPText = readFileSync('pap-2026.txt', 'utf-8')

const changeAnalysis = await extractor.analyzeChanges(
  oldPAPText,
  newPAPText,
  '2025',
  '2026'
)

console.log(changeAnalysis.identified_changes)
// [{
//   parameter: 'grundfreibetrag',
//   old_value: 1146000,
//   new_value: 1160000,
//   change_magnitude: 1.22,
//   impact_level: 'high',
//   affected_calculations: ['Lohnsteuer', 'Tarifzone A-D'],
//   law_references: ['§ 32a EStG'],
//   change_rationale: 'Inflationsausgleich'
// }]
```

### Validierung fehlerhafter Extraktion
```typescript
const knownRanges = {
  grundfreibetrag: { min: 1000000, max: 1300000 },
  rv_bbg: { min: 9000000, max: 12000000 }
}

const corrected = await extractor.validateAndCorrectParameters(
  extractedParams,
  papText,
  knownRanges
)

console.log(corrected) // Korrigierte Parameter
```

### Auto-Validierungsregeln generieren
```typescript
const rules = await extractor.generateValidationRules(papText)

console.log(rules)
// {
//   grundfreibetrag: {
//     type: 'number',
//     min: 1000000,
//     max: 1300000,
//     description: 'Persönlicher Grundfreibetrag',
//     law_reference: '§ 32a EStG'
//   },
//   ...
// }
```

### Änderungsbericht für Benutzer
```typescript
const reportDE = await extractor.generateChangeReport(
  changes,
  'de'
)

const reportEN = await extractor.generateChangeReport(
  changes,
  'en'
)

console.log(reportDE)
// "Im Jahr 2026 wurde der Grundfreibetrag um EUR 140 erhöht.
//  Dies hat eine Auswirkung auf die Berechnung der Einkommensteuer..."
```

---

## 4. PDFUploadManager - Kompletter Workflow

### Import
```typescript
import { PDFUploadManager } from './modules/PDFUploadManager'
import { VersionManager } from './modules/VersionManager'
```

### Initialisierung
```typescript
const versionManager = new VersionManager()

const uploadManager = new PDFUploadManager(versionManager, {
  onProgressUpdate: (progress) => {
    console.log(`${progress.progress}% - ${progress.currentStep}`)
  },
  onSuggestionsReady: (suggestions) => {
    console.log(`${suggestions.length} Update-Suggestions verfügbar`)
    // UI aktualisieren
  },
  onError: (error) => {
    console.error('Upload-Fehler:', error)
  }
})
```

### PDF-Upload und Analyse
```typescript
// File Input Handler
document.getElementById('pap-upload')?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const proposal = await uploadManager.processPDFUpload(
    file,
    '2027',           // PAP Version
    '2026-11-15'      // Publication Date
  )

  if (proposal) {
    // Suggestions zur UI rendern
    const html = uploadManager.generateSuggestionsHTML()
    document.getElementById('suggestions-container')!.innerHTML = html
  }
})
```

### Benutzer-Genehmigung
```typescript
// Einzelne Suggestion genehmigen/ablehnen
function handleSuggestionToggle(suggestionId: string, approved: boolean) {
  uploadManager.approveSuggestion(suggestionId, approved)
}

// Alle genehmigen
function approveAll() {
  uploadManager.approveAllSuggestions()
}

// Alle ablehnen
function rejectAll() {
  uploadManager.rejectAllSuggestions()
}

// Genehmigte Updates anwenden
async function applyUpdates() {
  const success = await uploadManager.applyApprovedUpdates(
    'admin@example.com'  // approvedBy (optional)
  )

  if (success) {
    alert('Parameter erfolgreich aktualisiert!')
    location.reload()
  }
}
```

### Aktuellen Proposal abrufen
```typescript
const proposal = uploadManager.getCurrentProposal()

if (proposal) {
  console.log(`PAP Version: ${proposal.pap_version}`)
  console.log(`Approval Status: ${proposal.approvalStatus}`)
  console.log(`Suggestions: ${proposal.suggestions.length}`)

  const approved = proposal.suggestions.filter(s => s.approved === true)
  console.log(`Approved: ${approved.length}`)
}
```

---

## Integration in UI (HTML-Beispiel)

```html
<!-- PDF Upload -->
<div class="pdf-upload-section">
  <h3>PAP-Datei hochladen</h3>
  <input 
    type="file" 
    id="pap-upload" 
    accept=".pdf,.txt"
    class="upload-input"
  >
  <div id="upload-progress" class="progress">
    <div id="upload-bar" class="progress-bar"></div>
    <span id="upload-status">Bereit</span>
  </div>
</div>

<!-- Suggestions anzeigen -->
<div id="suggestions-container" class="suggestions-section">
  <!-- Wird dynamisch gefüllt -->
</div>

<style>
  .suggestion-item {
    border: 1px solid #ccc;
    padding: 15px;
    margin: 10px 0;
    border-radius: 5px;
  }

  .impact-high {
    border-left: 5px solid #d32f2f;
    background: #ffebee;
  }

  .impact-medium {
    border-left: 5px solid #f57c00;
    background: #fff3e0;
  }

  .impact-low {
    border-left: 5px solid #388e3c;
    background: #f1f8e9;
  }

  .value-comparison {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 10px 0;
    font-family: monospace;
  }

  .change-percent {
    margin-left: 10px;
    font-weight: bold;
    color: #0066cc;
  }
</style>
```

---

## Workflow-Beispiel: Jährliche PAP-Aktualisierung

```typescript
async function updateToolForNewPAPYear() {
  // 1. PAP-Datei erhalten
  const pdfFile = await downloadPAPFile('2027')

  // 2. Upload verarbeiten
  const proposal = await uploadManager.processPDFUpload(
    pdfFile,
    '2027',
    new Date().toISOString().split('T')[0]
  )

  if (!proposal) {
    console.error('Analyse fehlgeschlagen')
    return
  }

  // 3. Suggestions überprüfen
  console.log(`Gefundene Änderungen: ${proposal.suggestions.length}`)
  proposal.suggestions.forEach(s => {
    console.log(`${s.parameter}: ${s.currentValue} → ${s.suggestedValue} (${s.impact})`)
  })

  // 4. High-Impact Änderungen genehmigen
  for (const suggestion of proposal.suggestions) {
    if (suggestion.impactLevel === 'high') {
      uploadManager.approveSuggestion(suggestion.id, true)
    }
  }

  // 5. Updates anwenden
  const success = await uploadManager.applyApprovedUpdates('automation')

  if (success) {
    // 6. Tests durchführen
    const testResults = await runValidationTests()
    
    if (testResults.allPassed) {
      // 7. Deployen
      await deployNewVersion()
      console.log('PAP 2027 erfolgreich deployed!')
    } else {
      console.error('Validierungstests fehlgeschlagen')
    }
  }
}
```

---

## Error Handling

### API nicht verfügbar
```typescript
const extractor = new ClaudeParameterExtractor()
// Ohne API-Schlüssel: Fallback zu Regex

const result = await extractor.extractParameters(request)
if (result.status === 'error') {
  console.log('Claude API nicht verfügbar, verwende Regex-Fallback')
  // Nutze PAPAnalyzer stattdessen
}
```

### PDF-Text nicht lesbar
```typescript
try {
  const proposal = await uploadManager.processPDFUpload(file, '2027', date)
  
  if (!proposal) {
    throw new Error('Keine Parameter extrahiert')
  }
} catch (error) {
  console.error('PDF-Verarbeitung fehlgeschlagen:', error)
  // Fallback: Manueller Upload?
}
```

### Validierungsfehler
```typescript
const proposal = uploadManager.getCurrentProposal()

if (proposal?.approvalStatus === 'pending') {
  console.warn('Keine Suggestions genehmigt')
  // Benutzer muss mindestens eine genehmigen
}
```

---

## Performance-Tipps

1. **Große PDFs**
   - Text vor Übergabe an API kürzen (erste 8000 Zeichen)
   - Einzelne Pages separieren

2. **Claude API Calls**
   - Batch-Prozess bei mehreren PDFs
   - Error-Retry implementiert (2 Versuche)

3. **UI-Responsiveness**
   - Progress-Updates in separate Worker-Threads
   - HTML-Rendering nach Suggestions verfügbar

---

## Testing

```typescript
// Unit-Test Beispiel
import { describe, it, expect } from 'vitest'
import { PAPAnalyzer } from './modules/PAPAnalyzer'

describe('PAPAnalyzer', () => {
  it('extrahiert Grundfreibetrag korrekt', () => {
    const analyzer = new PAPAnalyzer()
    const result = analyzer.analyzePAPText(
      'Grundfreibetrag: EUR 11.600'
    )
    
    expect(result.extracted_parameters[0].value).toBe(1160000)
    expect(result.extracted_parameters[0].confidence).toBe(0.9)
  })
})
```

---

## Häufige Fragen

**F: Was wenn PDF-Text schlecht erkannt wird?**
A: Nutze ClaudeParameterExtractor mit validateAndCorrectParameters()

**F: Kann ich offline arbeiten?**
A: Ja, PAPAnalyzer funktioniert auch ohne API-Schlüssel (Regex-basiert)

**F: Wie oft kann ich Parameter aktualisieren?**
A: Beliebig oft - VersionManager verwaltet alle Versionen mit Changelog

**F: Können Benutzer Updates selbst genehmigen?**
A: Ja - PDFUploadManager mit entsprechenden Berechtigungen

---

## Roadmap

- [ ] UI-Komponenten für PDF-Drag&Drop
- [ ] Automatische PAP-Download von offiziellem Portal
- [ ] Diff-Visualisierung mit Grafiken
- [ ] Webhook für neue PAP-Versionen
- [ ] Mehrsprachige PDF-Reports

---

Für weitere Fragen oder Issues: Siehe `PHASE_5_SUMMARY.md`
