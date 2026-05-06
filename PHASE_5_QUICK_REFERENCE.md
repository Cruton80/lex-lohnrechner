# Phase 5 Quick Reference
## Schnelle Übersicht für Entwickler

---

## Module auf einen Blick

### PDFExporter
```typescript
import { PDFExporter } from './modules'

const exporter = new PDFExporter('de')
const html = exporter.exportAsHTML(result, auditTrail, options)
const json = exporter.exportAsJSON(result, auditTrail, options)
```

**Sprachen:** `'de'` | `'en'`  
**Optionen:** `includeAuditTrail`, `includeReferences`

---

### ClaudeParameterExtractor
```typescript
import { ClaudeParameterExtractor } from './modules'

const extractor = new ClaudeParameterExtractor(apiKey)

// Parameter extrahieren
const result = await extractor.extractParameters({
  pap_text: '...',
  pap_version: '2027',
  pap_publication_date: '2026-11-15'
})

// Änderungen analysieren
const changes = await extractor.analyzeChanges(
  oldText, newText, '2026', '2027'
)

// Validierungsregeln generieren
const rules = await extractor.generateValidationRules(papText)

// Änderungsbericht für Benutzer
const report = await extractor.generateChangeReport(changes, 'de')
```

**Status:** `'success'` | `'partial'` | `'error'`  
**Impact:** `'high'` | `'medium'` | `'low'`

---

### PDFUploadManager
```typescript
import { PDFUploadManager } from './modules'

const uploadManager = new PDFUploadManager(versionManager, {
  onProgressUpdate: (p) => console.log(p.progress),
  onSuggestionsReady: (s) => console.log(s.length),
  onError: (e) => console.error(e)
})

// PDF verarbeiten
const proposal = await uploadManager.processPDFUpload(file, '2027', date)

// Suggestions genehmigen
uploadManager.approveSuggestion(suggestionId, true)
uploadManager.approveAllSuggestions()
uploadManager.rejectAllSuggestions()

// Updates anwenden
await uploadManager.applyApprovedUpdates('admin@example.com')

// HTML generieren
const html = uploadManager.generateSuggestionsHTML()

// Status abrufen
const current = uploadManager.getCurrentProposal()
```

---

## Datenstructuren

### UpdateSuggestion
```typescript
{
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
```

### ParameterChange
```typescript
{
  parameter: string
  old_value: any
  new_value: any
  change_magnitude: number
  impact_level: 'high' | 'medium' | 'low'
  affected_calculations: string[]
  law_references: string[]
  change_rationale?: string
}
```

### UpdateProposal
```typescript
{
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
```

---

## Häufige Aufgaben

### Task: Jahres-PAP aktualisieren
```typescript
// 1. PDF hochladen
const file = userSelectedFile

// 2. Verarbeiten
const proposal = await uploadManager.processPDFUpload(file, '2027', '2026-11-15')

// 3. Benutzer genehmigt (über UI)
// → checkboxes klicken → "Apply" button

// 4. Fertig!
// → VersionManager aktualisiert
// → Changelog generiert
// → TaxCalculator nutzt neue Werte
```

### Task: Parameter exportieren
```typescript
const exporter = new PDFExporter('de')

// Als HTML für Druck
const html = exporter.exportAsHTML(result, auditTrail, {
  includeAuditTrail: true,
  includeReferences: true
})

// Speichern/Drucken
window.open(`data:text/html,${encodeURIComponent(html)}`)
```

### Task: Änderungen analysieren
```typescript
const oldPAP = await fetch('pap-2025.pdf').then(r => r.text())
const newPAP = await fetch('pap-2026.pdf').then(r => r.text())

const changes = await extractor.analyzeChanges(
  oldPAP, newPAP, '2025', '2026'
)

// Ergebnisse filtern
const highImpact = changes.identified_changes
  .filter(c => c.impact_level === 'high')
```

### Task: Validierungsregeln auto-generieren
```typescript
// Aus PAP-Text generieren
const rules = await extractor.generateValidationRules(papText)

// In InputValidator integrieren
inputValidator.setCustomRules(rules)

// Jetzt werden Eingaben gegen PAP-Regeln validiert
const errors = inputValidator.validateAll(inputs)
```

---

## Error Handling

### Keine API verfügbar
```typescript
// ClaudeExtractor
const extractor = new ClaudeParameterExtractor()
// Falls kein API-Key: result.status === 'error'

// Fallback zu PAPAnalyzer
const analyzer = new PAPAnalyzer()
const basicResult = analyzer.analyzePAPText(pdfText)
```

### PDF unlesbar
```typescript
try {
  const proposal = await uploadManager.processPDFUpload(file, '2027', date)
  if (!proposal) {
    console.log('Keine Parameter extrahiert')
  }
} catch (error) {
  console.error('Fehler:', error.message)
}
```

### Validierungsfehler
```typescript
const proposal = uploadManager.getCurrentProposal()

if (!proposal || proposal.suggestions.length === 0) {
  console.log('Keine Suggestions vorhanden')
} else if (proposal.approvalStatus === 'pending') {
  console.log('Benutzer muss genehmigen')
}
```

---

## Configuration

### .env
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Import
```typescript
// Zentral
import { TaxCalculator, PDFExporter, PDFUploadManager } from './modules'

// Oder direkt
import { PDFExporter } from './modules/PDFExporter'
```

---

## Browser API Integration

### HTML Input Handler
```html
<input type="file" id="pap-upload" accept=".pdf,.txt">
<div id="suggestions"></div>

<script>
  document.getElementById('pap-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    const proposal = await uploadManager.processPDFUpload(file, '2027', date)
    
    const html = uploadManager.generateSuggestionsHTML()
    document.getElementById('suggestions').innerHTML = html
  })
</script>
```

---

## Performance Tips

| Task | Tipp |
|------|------|
| Große PDFs | Chunks verarbeiten (5000 Zeichen) |
| API-Calls | Fallback zu Regex-Extraktion |
| UI-Responsiveness | Async/await, nicht blocking |
| Speicher | StreamProcessing für >10MB PDFs |

---

## Testing

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest'
import { PDFExporter } from './modules/PDFExporter'

describe('PDFExporter', () => {
  it('exportiert als HTML', () => {
    const exporter = new PDFExporter('de')
    const html = exporter.exportAsHTML(result, auditTrail, {})
    
    expect(html).toContain('<html')
    expect(html).toContain('Lohnsteuer')
  })
})
```

---

## Debugging

### Verbose Logging
```typescript
// Progress tracken
uploadManager.registerProgressCallback((p) => {
  console.log(`[${p.status}] ${p.currentStep}: ${p.progress}%`)
})

// Suggestions detailliert anschauen
uploadManager.registerSuggestionsCallback((suggestions) => {
  suggestions.forEach(s => {
    console.table({
      Parameter: s.parameter,
      Aktuell: s.currentValue,
      Neu: s.suggestedValue,
      Änderung: `${s.changePercent.toFixed(2)}%`,
      Impact: s.impactLevel
    })
  })
})

// Errors detailliert anschauen
uploadManager.registerErrorCallback((error) => {
  console.error('Fehlerdetails:', error)
})
```

---

## Roadmap

- [ ] UI-Komponenten für PDF-Upload (Drag & Drop)
- [ ] Diff-Visualisierung (alt vs. neu nebeneinander)
- [ ] Automatische PAP-Download
- [ ] Webhook für neue Versionen
- [ ] Regression-Testing nach Update

---

## Dokumentation

| Dokument | Zweck |
|----------|--------|
| **PHASE_5_SUMMARY.md** | Technische Tiefgang |
| **PHASE_5_INTEGRATION_GUIDE.md** | Code-Beispiele |
| **PHASE_5_SETUP.md** | Deployment & Config |
| **PHASE_5_QUICK_REFERENCE.md** | Dieses Dokument |
| **BENUTZERHANDBUCH.md** | Für End-User |

---

**Version:** 1.0  
**Letzte Aktualisierung:** 2026-05-05  
**Phase 5:** Complete ✅
