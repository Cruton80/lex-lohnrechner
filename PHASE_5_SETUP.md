# Phase 5 Setup Guide
## Konfiguration und Integrationsschritte

---

## Voraussetzungen

### Node.js & npm
```bash
node --version  # v18+
npm --version   # v9+
```

### Abhängigkeiten (bereits vorhanden)
```json
{
  "devDependencies": {
    "typescript": "^5.0",
    "vite": "^4.0",
    "vitest": "^0.0"
  }
}
```

### Neue Abhängigkeiten (optional)

Für fortgeschrittene PDF-Verarbeitung (nicht erforderlich für Phase 5):

```bash
# PDF-Text-Extraktion (falls nicht über externe Tools)
npm install pdfjs-dist

# HTTP-Requests (falls nicht in Browser-Umgebung)
npm install node-fetch
```

---

## Dateistruktur nach Phase 5

```
src/
├── modules/
│   ├── index.ts (NEU - Central Export)
│   ├── TaxCalculator.ts (Phase 1)
│   ├── SocialSecurityCalculator.ts (Phase 1)
│   ├── InputValidator.ts (Phase 2)
│   ├── AuditLogger.ts (Phase 3)
│   ├── ResultsFormatter.ts (Phase 3)
│   ├── ReferenceRegistry.ts (Phase 4)
│   ├── VersionManager.ts (Phase 4)
│   ├── PAPAnalyzer.ts (Phase 5)
│   ├── PDFExporter.ts (Phase 5 - NEU)
│   ├── ClaudeParameterExtractor.ts (Phase 5 - NEU)
│   └── PDFUploadManager.ts (Phase 5 - NEU)
├── types/
│   └── index.ts
├── data/
│   ├── parameters-2025.json
│   ├── parameters-2026.json
│   └── parameters-2027.json
└── ui/
    ├── index.html
    └── app.ts

├── PHASE_5_SUMMARY.md (NEU)
├── PHASE_5_INTEGRATION_GUIDE.md (NEU)
├── PHASE_5_SETUP.md (Dieses Dokument)
├── BENUTZERHANDBUCH.md
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## TypeScript Konfiguration

### tsconfig.json (überprüfen/anpassen)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "moduleResolution": "bundler"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Vite Konfiguration

### vite.config.ts (überprüfen/anpassen)

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'ES2020',
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/modules/index.ts'),
      name: 'LexLohnRechner',
      formats: ['es', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'index.js' : `index.${format}.js`,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@modules': resolve(__dirname, './src/modules'),
      '@types': resolve(__dirname, './src/types'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
})
```

---

## Umgebungsvariablen

### .env (neu erstellen, in .gitignore eintragen)

```bash
# Claude API Key (für intelligente Parameterextraktion)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Für Webhook-Integration (Phase 6)
PAP_DOWNLOAD_URL=https://www.bmf-steuerrechner.de/...
ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

### .env.example (öffentlich, ohne Secrets)

```bash
# Copy to .env and add your actual API key
ANTHROPIC_API_KEY=your-key-here

# Optional configuration
# PAP_DOWNLOAD_URL=
# ADMIN_NOTIFICATION_EMAIL=
```

### .gitignore (aktualisieren)

```
.env
.env.local
.env.*.local
```

---

## Integration in app.ts

### Beispiel: app.ts mit Phase 5 Modulen

```typescript
import {
  TaxCalculator,
  SocialSecurityCalculator,
  InputValidator,
  AuditLogger,
  ResultsFormatter,
  VersionManager,
  PDFExporter,
  PDFUploadManager,
  PAPAnalyzer,
  ClaudeParameterExtractor,
} from './modules/index'

// Globale Instanzen
const versionManager = new VersionManager()
const taxCalculator = new TaxCalculator(versionManager)
const socialSecurityCalc = new SocialSecurityCalculator(versionManager)
const inputValidator = new InputValidator()
const auditLogger = new AuditLogger()
const resultsFormatter = new ResultsFormatter(versionManager)
const pdfExporter = new PDFExporter('de')
const papAnalyzer = new PAPAnalyzer()

// Optional: Claude API Integration
const claudeApiKey = process.env.ANTHROPIC_API_KEY
const claudeExtractor = claudeApiKey
  ? new ClaudeParameterExtractor(claudeApiKey)
  : null

// PDF Upload Manager mit Callbacks
const uploadManager = new PDFUploadManager(versionManager, {
  onProgressUpdate: (progress) => {
    console.log(`[${progress.status}] ${progress.progress}% - ${progress.currentStep}`)
    // UI aktualisieren
  },
  onSuggestionsReady: (suggestions) => {
    console.log(`${suggestions.length} Suggestions verfügbar`)
    // Suggestions anzeigen
  },
  onError: (error) => {
    console.error('Upload-Fehler:', error)
    // Fehler anzeigen
  },
})

// Berechnung durchführen
function performCalculation() {
  const inputs = getFormInputs()
  const validationErrors = inputValidator.validateAll(inputs)

  if (validationErrors.length > 0) {
    showErrors(validationErrors)
    return
  }

  const tariff = taxCalculator.calculate(inputs)
  const socialSecurity = socialSecurityCalc.calculate(inputs)

  const result = {
    ...tariff,
    ...socialSecurity,
    auditId: auditLogger.startAudit(inputs),
  }

  // Formatieren und anzeigen
  const formatted = resultsFormatter.format(result)
  displayResults(formatted)

  // Export-Optionen anzeigen
  const htmlExport = pdfExporter.exportAsHTML(
    result,
    auditLogger.getAuditTrail(),
    {
      includeAuditTrail: true,
      locale: 'de',
    }
  )

  // PDF-Export Button aktivieren
  setupExportButton(htmlExport)
}

// PDF-Upload Handling
async function setupPDFUpload() {
  const uploadInput = document.getElementById('pap-upload') as HTMLInputElement

  uploadInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const proposal = await uploadManager.processPDFUpload(
      file,
      '2027',
      new Date().toISOString().split('T')[0]
    )

    if (proposal) {
      const suggestionsHTML = uploadManager.generateSuggestionsHTML()
      document.getElementById('suggestions-container')!.innerHTML = suggestionsHTML
    }
  })
}

// Initialization
export function init() {
  setupPDFUpload()
  setupCalculationForm()
  setupExports()
}
```

---

## Build & Deploy

### Build für Production

```bash
# Clean build
npm run build

# Output in dist/
# - index.js (ES Module)
# - index.umd.js (UMD Bundle)
# - index.js.map (Source Maps)
```

### Development Server

```bash
# Hot Module Reloading
npm run dev

# Öffne http://localhost:5173
```

### Testing

```bash
# Unit Tests durchführen
npm run test

# Mit Coverage
npm run test:coverage
```

---

## Browser Compatibility

### Phase 5 Module kompatibel mit:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Nicht kompatibel mit:
- ❌ IE 11 (ältere Syntax)

---

## API Key Management

### Produktiv: API-Schlüssel sicher speichern

```typescript
// ❌ FALSCH: API-Schlüssel in Code
const extractor = new ClaudeParameterExtractor('sk-ant-...')

// ✅ RICHTIG: Aus Umgebung laden
const apiKey = process.env.ANTHROPIC_API_KEY
const extractor = claudeApiKey
  ? new ClaudeParameterExtractor(apiKey)
  : null
```

### Backend-Integration (Node.js)

```typescript
// server.ts - Backend lädt API-Schlüssel sicher
import { ClaudeParameterExtractor } from './modules/ClaudeParameterExtractor'

const extractor = new ClaudeParameterExtractor(process.env.ANTHROPIC_API_KEY)

// API-Endpoint
app.post('/api/analyze-pap', async (req, res) => {
  const { pap_text, pap_version } = req.body

  const result = await extractor.extractParameters({
    pap_text,
    pap_version,
    pap_publication_date: new Date().toISOString().split('T')[0],
  })

  res.json(result)
})
```

---

## Troubleshooting

### Problem: Module nicht gefunden

```
error TS2307: Cannot find module './PDFExporter'
```

**Lösung:**
1. Stelle sicher dass Datei existiert: `src/modules/PDFExporter.ts`
2. TypeScript Cache löschen: `rm -rf node_modules/.vite`
3. Dev-Server neu starten

### Problem: Claude API Fehler

```
Error: API-Fehler: 401 Unauthorized
```

**Lösung:**
1. Überprüfe `ANTHROPIC_API_KEY` in `.env`
2. Überprüfe dass API-Key gültig ist
3. Fallback zu Regex-Extraktion funktioniert auch ohne API

### Problem: PDF-Text unlesbar

```
Error: PDF Text extraction failed
```

**Lösung:**
1. Nutze Regex-basierte PAPAnalyzer (funktioniert mit Text)
2. Für PDFs: Text vor Übergabe extrahieren (externe Tool)
3. Oder: pdfjs-dist Bibliothek installieren

### Problem: Speicher-Auslastung

Wenn große PDFs zu Speicher-Problemen führen:

```typescript
// Große PDFs in Chunks verarbeiten
const chunkSize = 5000
for (let i = 0; i < papText.length; i += chunkSize) {
  const chunk = papText.substring(i, i + chunkSize)
  const result = analyzer.analyzePAPText(chunk)
  // Aggregiere Ergebnisse
}
```

---

## Performance Optimization

### Tree-Shaking für kleinere Bundles

```typescript
// ❌ FALSCH: Importiert alles
import * as modules from './modules'

// ✅ RICHTIG: Tree-shaking freundlich
import { TaxCalculator, PDFExporter } from './modules'
```

### Lazy Loading für große Module

```typescript
// Laden nur wenn nötig
const PDFExporter = await import('./modules/PDFExporter')

// Oder mit dynamic imports
const { ClaudeParameterExtractor } = await import(
  './modules/ClaudeParameterExtractor'
)
```

---

## Continuous Integration (CI/CD)

### GitHub Actions Beispiel

```yaml
name: Test & Build Phase 5

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

      - name: Upload to S3
        if: github.ref == 'refs/heads/main'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          aws s3 cp dist/ s3://lexlohnrechner/ --recursive
```

---

## Migrations von Phase 4 zu Phase 5

### Wenn Sie Phase 4 bereits nutzen:

1. **Neue Module hinzufügen** (kein Breaking Change)
   ```bash
   # Phase 5 Module sind optional
   # Phase 1-4 funktionieren weiterhin unverändert
   ```

2. **app.ts aktualisieren**
   ```typescript
   // Alt (Phase 4)
   import { TaxCalculator } from './modules/TaxCalculator'

   // Neu (Phase 5+)
   import { TaxCalculator, PDFExporter } from './modules'
   ```

3. **Keine Daten-Migration nötig**
   - parameters-*.json kompatibel
   - Bestehende Berechnungen unverändert

---

## Checkliste für Deployment

- [ ] `.env` mit `ANTHROPIC_API_KEY` angelegt
- [ ] `npm install` durchgeführt
- [ ] `npm run build` erfolgreich
- [ ] `npm run test` alle Tests grün
- [ ] TypeScript-Fehler behoben
- [ ] `.env` in `.gitignore` eintragen
- [ ] `PHASE_5_SUMMARY.md` und `PHASE_5_INTEGRATION_GUIDE.md` gelesen
- [ ] Phase 5 Module in `src/modules/` vorhanden
- [ ] `vite.config.ts` konfiguriert
- [ ] UI-Komponenten für PDF-Upload implementiert (optional)
- [ ] Tests für neue Module geschrieben
- [ ] Deploy zu Production

---

## Zusätzliche Ressourcen

- **Vite Dokumentation:** https://vitejs.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Claude API Docs:** https://docs.anthropic.com/
- **PAP Dokumentation:** https://www.bmf-steuerrechner.de/

---

## Support

Bei Fragen oder Problemen:

1. Überprüfe `PHASE_5_INTEGRATION_GUIDE.md` für Beispiele
2. Siehe `PHASE_5_SUMMARY.md` für technische Details
3. Überprüfe Fehler-Output und Logs
4. Erstelle ein Issue mit detaillierter Beschreibung

---

**Letzte Aktualisierung:** 2026-05-05
**Version:** Phase 5 Complete
