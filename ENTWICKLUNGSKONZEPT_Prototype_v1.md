# ENTWICKLUNGSKONZEPT: Lohnsteuer-Webtool Prototyp v1.0
**Datum:** 5. Mai 2026  
**Status:** Konzept  
**Ziel:** Transformation der Excel-Datei AM_Lohnsteuer252.xlsm in ein dokumentiertes, versionskontrolliertes HTML-Webtool

---

## 1. VISION UND ZIELE

### 1.1 Primäre Ziele
1. **Transparenz:** Alle Berechnungsschritte nachvollziehbar dokumentieren
2. **Wartbarkeit:** Jährliche PAP-Updates einfach integrierbar
3. **Korrektheit:** 100% Übereinstimmung mit offiziellen Vorgaben
4. **Vergleichbarkeit:** Ergebnisse verschiedener Steuerjahre gegenüberstellen
5. **Quellennachweise:** Jede Berechnungsfunktion mit PAP-Referenz

### 1.2 Kritische Anforderungen
- ✓ Exakte Lohnsteuerberechnung (keine Abweichungen erlaubt)
- ✓ Vollständige Dokumentation der Berechnung im Code und UI
- ✓ Versionskontrolle für Parameter-Sets (2025, 2026, 2027, ...)
- ✓ Transparent gekennzeichnete "Black Box"-Funktionen (VBA-Makro)
- ✓ Automatische Fehlerbehandlung mit aussagekräftigen Meldungen
- ✓ Auditierbarkeit (vollständige Nachvollziehbarkeit)

---

## 2. ARCHITEKTUR-ÜBERSICHT

### 2.1 High-Level Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB-INTERFACE LAYER                       │
│  HTML/CSS/JavaScript - Benutzeroberfläche mit Dokumentation │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                        │
│  TypeScript/JavaScript - Alle Berechnungsschritte dokumentiert│
├─────────────────────────────────────────────────────────────┤
│ Module:                                                      │
│ • InputValidator (Eingabevalidierung)                       │
│ • TaxCalculator (Lohnsteuerberechnung - 2026)               │
│ • SocialSecurityCalculator (Sozialversicherung)             │
│ • ReferenceRegistry (PAP-Quellennachweise)                  │
│ • VersionManager (Mehrjahres-Parametersätze)                │
│ • AuditLogger (Nachvollziehbarkeit)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                 │
│  JSON-basierte Parametersätze mit Versionierung             │
├─────────────────────────────────────────────────────────────┤
│ Files:                                                       │
│ • parameters-2025.json (Tarif, Schwellwerte, Beitragssätze) │
│ • parameters-2026.json (Aktualisiert mit PAP)               │
│ • parameters-2027.json (Vorlage für nächstes Jahr)          │
│ • pap-references.json (PAP-Quellenangaben)                  │
│ • calculations-log.json (Audit-Trail)                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tech-Stack

| Layer | Komponente | Begründung |
|-------|-----------|-----------|
| **Frontend** | HTML5 / CSS3 / ES6+ | Standard Web, keine Runtime-Dependencies |
| **Berechnungen** | TypeScript (->JavaScript) | Typsicherheit, bessere Wartbarkeit |
| **Parameter** | JSON | Versionierbar, einfach zu updaten |
| **Persistierung** | IndexedDB (lokal) + JSON-Export | Browser-lokal speicherbar |
| **Dokumentation** | JSDoc + Inline-Comments | Direkt im Code, immer aktuell |
| **Versionskontrolle** | Git (Datei-basiert) | Alle Änderungen nachverfolgbar |
| **Testing** | Jest/Vitest + Test-Cases | Sicherstellen von Genauigkeit |
| **Build** | Vite/esbuild | Schnell, minimal |

---

## 3. KERNKOMPONENTEN (PHASE 1-2)

### 3.1 Modul: InputValidator

**Zweck:** Validierung aller Eingabeparameter gegen Vorgaben

**Hauptfunktionen:**
```typescript
validateLohnZZ(value: number): { valid: boolean; error?: string }
validateSteuerklasse(value: number): { valid: boolean; error?: string }
validateBruttolohn(value: number): { valid: boolean; error?: string }
validateRVStatus(value: number): { valid: boolean; error?: string }
validateKinderfreibetraege(wert: number, stKl: number): { valid: boolean; error?: string }
validateGeburtsjahr(value: number): { valid: boolean; error?: string }
validateAllInputs(inputs: LohnsteuerInputs): ValidationResult
```

**Quellennachweise:**
- PAP S. 1-5 (Eingabeparameter-Definition)
- § 39b EStG (Lohnsteuerabzug)

### 3.2 Modul: TaxCalculator

**Zweck:** Kern-Lohnsteuerberechnung (entspricht Excel-Makro `LohnSt25()`)

**Struktur (nach PAP-Schritte):**

```typescript
class TaxCalculator {
  private parameters: TaxParameters;
  private auditLog: AuditEntry[];

  // Hauptmethode
  calculateLohnsteuer(input: LohnsteuerInputs): TaxResult {
    // Schritt 1: Bruttolohn Normalisierung
    // Schritt 2: Kinderfreibetragsabzug
    // Schritt 3: Sonstige Bezüge (Sonderzahlungen)
    // Schritt 4: Abfindungen (§ 24 EStG)
    // Schritt 5: Altersentlastung (§ 24a EStG)
    // Schritt 6: Tarifberechnung § 32a EStG
    // Schritt 7: Solidaritätszuschlag (5,5%)
    // Schritt 8: Kirchensteuer (8% oder 9%)
    // Schritt 9: Grenzbelastung
    // Schritt 10: Audit-Logging
  }

  private calculateNetIncome(gross: number, ...): number
  private applyChildAllowance(income: number, count: number): number
  private applySonderEinkuenfte(income: number, ...): number
  private applyAbfindung(income: number, ...): number
  private applyAltersEntlastung(income: number, gebJahr: number): number
  private calculateTariff(income: number, stkl: number, faktor: number): number
  private calculateSolidarity(lstBetrag: number): number
  private calculateChurchTax(lstBetrag: number): number
  private calculateMarginalRate(...): number
}
```

**Kritische PAP-Referenzen:**
- PAP S. 10-15: Schritt 1-6 (Lohnsteuerberechnung)
- PAP S. 16-18: Schritt 7-8 (Solidarität, Kirchensteuer)
- PAP S. 19-25: Schritt 9+ (Grenzbelastung)

### 3.3 Modul: SocialSecurityCalculator

**Zweck:** Beitragssatzberechnungen für Sozialversicherungen

```typescript
class SocialSecurityCalculator {
  calculateRV(brutto: number, status: RVStatus, westOst: 1|2): RVResult
  calculateALV(brutto: number): ALVResult
  calculateKV(brutto: number, satz: number, monatsStatus: 0|1): KVResult
  calculatePV(brutto: number, sachsenZuschlag: 0|1): PVResult
  
  // Beitragsbemessungsgrenzen
  getContributionLimits(jahr: number, westOst: 1|2): ContributionLimits
}
```

**Parameter 2026:**
- RV-BBG West: 101.400 EUR | Ost: 107.100 EUR
- KV-BBG: 69.750 EUR
- ALV-BBG: 101.400 EUR
- RV-Satz: 18,6% (9,3% AN, 9,3% AG)
- ALV-Satz: 2,6% (Arbeitnehmer)

### 3.4 Modul: VersionManager

**Zweck:** Verwaltung mehrerer Parametersätze für verschiedene Jahre

```typescript
class VersionManager {
  private versions: Map<number, ParameterSet>;
  
  loadParameterSet(jahr: number): ParameterSet
  createNewVersion(sourceJahr: number, newJahr: number): ParameterSet
  updateParameter(jahr: number, paramName: string, newValue: any): void
  
  // Vergleich
  compareVersions(jahr1: number, jahr2: number): ParameterDifferences
  exportChangelog(): Changelog
}
```

**Initialisierung:**
- 2025: Aus Excel-Datei extrahiert
- 2026: Mit PAP-Updates
- 2027: Vorlage (bereit für nächste PAP)

### 3.5 Modul: ReferenceRegistry

**Zweck:** Quellenverweis für jede Berechnung

```typescript
class ReferenceRegistry {
  register(functionName: string, pap_page: number, pap_step: number, law: string)
  
  // Beispiel:
  registry.register('calculateTariff', 12, 6, '§ 32a EStG')
  registry.register('calculateSolidarity', 16, 7, '§ 5 SolzG')
  
  getReference(functionName: string): Reference | undefined
  exportAllReferences(): ReferenceReport
}
```

### 3.6 Modul: AuditLogger

**Zweck:** Nachvollziehbarkeit aller Berechnungen

```typescript
class AuditLogger {
  logCalculation(step: string, inputs: any, output: any, pap_ref: string): void
  
  // Automatisches Logging jeder Berechnung
  getAuditTrail(calculationId: string): AuditTrail
  exportAuditReport(): AuditReport
  
  // Für Audit/Revision
  verifyCalculation(id: string, expectedResult: number): boolean
}
```

---

## 4. BENUTZEROBERFLÄCHE DESIGN

### 4.1 Hauptlayout (Single Page Application)

```
┌────────────────────────────────────────────────────────────┐
│  Lohnsteuer-Rechner 2026 (HTML-Webtool)                    │
├────────────────────────────────────────────────────────────┤
│ [Version Manager: 2025 | 2026 | 2027 ↓]                    │
├────────────────────────────────────────────────────────────┤
│ EINGABE-PANEL (Spalte 1)   │ ERGEBNIS-PANEL (Spalte 2)     │
│                            │                               │
│ ☐ Lohnzahlungszeitraum    │ LOHNSTEUER-ERGEBNISSE         │
│   [Monat ↓]                │ ────────────────────────      │
│                            │ Bruttolohn:     EUR 2.000,00  │
│ ☐ Lohnsteuerklasse         │ Lohnsteuer:     EUR   376,00  │
│   [Klasse I ↓]             │   (Quelle: PAP S.12)          │
│                            │                               │
│ ☐ Bruttolohn              │ Solidarzuschlag: EUR 20,68    │
│   [2000 EUR]               │   (Quelle: § 5 SolzG)         │
│                            │                               │
│ ☐ Geburtsjahr             │ Kirchensteuer 8%: EUR 30,08   │
│   [1980]                   │ Kirchensteuer 9%: EUR 33,84   │
│                            │                               │
│ ☐ Rentenvers.             │ ────────────────────────      │
│   [Gesetzlich ↓]           │ SOZIALVERSICHERUNG            │
│                            │ RV-Beitrag: EUR 186,00 (9,3%) │
│ ☐ Krankenvers.             │ ALV-Beitrag: EUR 52,00 (2,6%) │
│   [Gesetzlich ↓]           │ KV-Beitrag: EUR 140,00        │
│   Zusatzbeitrag: [2.5%]    │                               │
│                            │ ────────────────────────      │
│ ☐ Kinderfreibeträge        │ BELASTUNGSQUOTEN              │
│   [0]                      │ Durchschn. (LSt): 18,8%       │
│                            │ Grenzbelastung: 42,0%         │
│ ☐ Sonstige Bezüge          │                               │
│   [0 EUR]                  │ ────────────────────────      │
│                            │ [AUDIT-TRAIL ANZEIGEN]        │
│ [BERECHNEN]                │ [PDF EXPORTIEREN]             │
│ [RESET]                    │ [VERGLEICH 2025 ↓]            │
│                            │                               │
│ [⚙️ EINSTELLUNGEN]          │                               │
│                            │                               │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Interaktive Elemente

**Eingabe-Validierung in Echtzeit:**
- Bei ungültigen Werten: Warnung mit Regeltext + PAP-Referenz
- Z.B.: "Geburtsjahr 1920: Altersentlastung berechnet nach § 24a EStG"

**Quellennachweise direkt in der UI:**
- Jedes Ergebnis hat ein (i)-Icon mit PAP-Referenz
- Auf Hover: "Berechnet nach PAP S. 12, Schritt 6 - Tarifberechnung § 32a EStG"

**Vergleichsmodus:**
- Dropdown: Jahr 1 [2025] vs. Jahr 2 [2026]
- Zeigt: "Unterschiede seit 2025: RV-BBG +4.800 EUR, KV-BBG +3.600 EUR"

---

## 5. ENTWICKLUNGS-ROADMAP (PHASEN)

### Phase 1: Grundstruktur (1-2 Wochen)
- [ ] Projekt-Setup (Vite, TypeScript, Testing)
- [ ] Basis-HTML mit Eingabe-Feldern
- [ ] InputValidator-Modul
- [ ] ReferenceRegistry initialisieren
- [ ] parameters-2026.json aus Excel-Daten
- [ ] Git-Repo mit Initial Commit

**Deliverable:** Funktionsfähige Eingabeform mit Validierung

### Phase 2: Kern-Berechnung (2-3 Wochen)
- [ ] TaxCalculator implementieren (Tarifberechnung)
- [ ] SocialSecurityCalculator implementieren
- [ ] Alle Formeln aus Excel in TypeScript überführen
- [ ] Audit-Logging einbauen
- [ ] Unit-Tests für jeden Berechnungsschritt
- [ ] Validierung gegen Excel-Ergebnisse

**Deliverable:** Funktionstüchtiger Rechner mit Test-Coverage >85%

### Phase 3: UI & Dokumentation (1-2 Wochen)
- [ ] HTML-UI Styling (CSS Grid)
- [ ] Ergebnis-Anzeige mit Quellennachweisen
- [ ] Inline-Dokumentation für jede Funktion
- [ ] Audit-Trail anzeigen
- [ ] PDF-Export-Funktion
- [ ] Benutzer-Handbuch

**Deliverable:** Vollständiges Webtool mit Dokumentation

### Phase 4: Versionierung & PAP-Integration (1 Woche)
- [ ] VersionManager implementieren
- [ ] parameters-2025.json einspielen
- [ ] parameters-2027.json Vorlage erstellen
- [ ] Vergleichsmodus (Jahr zu Jahr)
- [ ] Changelog-Generator
- [ ] PDF-Upload für PAP (Vorbereitung für Phase 5)

**Deliverable:** Multi-Year Support mit Vergleichsfunktion

### Phase 5: KI-Automation (2-3 Wochen, optional)
- [ ] PDF-Parser für PAP-Dateien
- [ ] Claude API Integration für Änderungserkennung
- [ ] Automatische Parameter-Update-Vorschläge
- [ ] Diff-Visualisierung (alte vs. neue Parameter)
- [ ] Validierungsregeln auto-generieren

**Deliverable:** Semi-automatische jährliche PAP-Updates

---

## 6. TESTING & VALIDIERUNG

### 6.1 Test-Strategie

**Unit-Tests (pro Modul):**
```javascript
describe('TaxCalculator', () => {
  it('calculates correct tax for standard case', () => {
    const input = { bruttolohn: 2000, stkl: 1, ... }
    const result = calculator.calculateLohnsteuer(input)
    expect(result.lstlzz).toBe(376)  // Aus Excel validiert
  })
  
  it('matches Excel result for all 75 test cases', () => {
    // Test gegen alle 75 Testfälle aus "prüft PAP"
  })
})
```

**Integration-Tests:**
- Gesamtberechnungen gegen Excel-Ausgaben
- Grenzfälle (Minijob, Beamte, Altersentlastung)
- Alle 6 Lohnsteuerklassen

**Audit-Tests:**
- Jede Berechnung ist nachvollziehbar
- Alle Zwischenergebnisse werden geloggt
- Prüfung gegen offizielle Lohnsteuer-Tabellen (BMF)

### 6.2 Validierungskriterien

**Finale Abnahme benötigt:**
1. ✓ 100% Genauigkeit bei Standard-Fällen (Abweichung max. 0,01 EUR)
2. ✓ Alle 75 Test-Cases aus Excel Pass
3. ✓ Audit-Trail für jeden Berechnungsschritt
4. ✓ Alle PAP-Referenzen im Code/UI dokumentiert
5. ✓ Mindestens 3 externe Validierungen (z.B. gegen Lohnsteuer-Tabellen)

---

## 7. EXCEL → WEBTOOL MIGRATIONSMAPPING

### 7.1 Kritische "Black Box" - VBA-Makro LohnSt25()

**Problem:** Die zentrale Berechnung ist im VBA-Code, nicht einsehbar.

**Lösungsansatz für Prototyp:**
1. **Reverse-Engineering:** Die Excel-Datei mit 75 Testfällen nutzen als "Spezifikation"
2. **Schrittweise Reimplementierung:** 
   - Schritt 1-3: Eingabeverarbeitung (Brutto, Freibeträge, KFB)
   - Schritt 4-5: Sonderregeln (Abfindungen, Altersentlastung)
   - Schritt 6: Tarifberechnung aus § 32a EStG
   - Schritt 7-8: Solidarität + Kirchensteuer
3. **Validierung:** Jeder Schritt gegen Testfall-Ergebnisse vergleichen
4. **Dokumentation:** Jede Abweichung dokumentieren und kommentieren

**Pseudo-Code für Schritt 6 (Tarifberechnung):**
```javascript
// PAP S. 12-13, Schritt 6: Tarifberechnung
// Rechtliche Grundlage: § 32a EStG (Einkommensteuertarif 2026)

function calculateTariff(zu_versteuerndesEinkommen, stkl, faktor) {
  // Schwellwerte 2026 (§ 32a EStG)
  const grundfreibetrag = 11600  // Aktualisiert jährlich
  const spitzensatz_grenze = 62810
  
  // STKL-Abzüge
  let lst = 0
  switch(stkl) {
    case 1: // Ledig
      // Tarifformel A: 0 bis 11.600 EUR
      if (zu_versteuerndesEinkommen <= grundfreibetrag) {
        lst = 0
      }
      // Tarifformel B: 11.600 bis 62.810 EUR (linearer Anstieg)
      else if (zu_versteuerndesEinkommen <= spitzensatz_grenze) {
        const y = (zu_versteuerndesEinkommen - grundfreibetrag) / 10000
        lst = (889.75 * y + 18.90) * y
      }
      // Tarifformel C: 62.810 bis 186.000 EUR (45% + 42%)
      else if (zu_versteuerndesEinkommen <= 186000) {
        lst = (0.42 * zu_versteuerndesEinkommen) - 9972.96
      }
      // Tarifformel D: > 186.000 EUR (45%)
      else {
        lst = (0.45 * zu_versteuerndesEinkommen) - 17602.60
      }
      break
    // ... weitere Steuerklassen
  }
  
  // PAP S. 14: Faktor bei STKL IV anwenden
  if (stkl === 4) {
    lst = lst * faktor
  }
  
  return Math.round(lst * 100) / 100  // Runden auf Cent
}
```

### 7.2 Bedingte Logiken aus Excel

| Bedingung | Excel-Zelle | Umsetzung | PAP-Ref |
|-----------|-------------|----------|---------|
| Mini-Job (≤520 EUR) | gering=1 | KV/RV pauschal | PAP S. 8 |
| Gleitzone (520-1500 EUR) | gleit=1 | Abgestufte Beitragssätze | PAP S. 9 |
| Beamte/Freiberufler | RVStatus=9 | Keine RV-Beiträge | PAP S. 7 |
| Altersentlastung | GebJahr | Zusätzlicher Abzug | § 24a EStG |
| Abfindung | Abfindg > 0 | Fünftel-Regelung | § 34 EStG |
| Sachsen-Zuschlag | PVSachsen=1 | +0,75% PV-Satz | SGB V |

---

## 8. DATA STRUCTURE: JSON-PARAMETER-SETS

### 8.1 Beispiel: parameters-2026.json

```json
{
  "version": "2026",
  "valid_from": "2026-01-01",
  "valid_to": "2026-12-31",
  "pap_reference": "2025-11-12-PAP-2026-anlage-1.pdf",
  "pap_publication_date": "2025-11-12",
  
  "tariff": {
    "grundfreibetrag": 11600,
    "spitzensteuersatz_ab": 62810,
    "spitzensteuersatz_prozent": 0.45,
    "formeln": {
      "zone_A": { "min": 0, "max": 11600, "text": "Befreit" },
      "zone_B": { "min": 11600, "max": 62810, "formula": "Progressionszone" },
      "zone_C": { "min": 62810, "max": 186000, "rate": 0.42 },
      "zone_D": { "min": 186000, "rate": 0.45 }
    },
    "pap_pages": "12-13"
  },
  
  "contributions": {
    "RV": {
      "rate_percent": 18.6,
      "employee_percent": 9.3,
      "beitragsbemessungsgrenze_west": 101400,
      "beitragsbemessungsgrenze_ost": 107100,
      "pap_page": 7
    },
    "ALV": {
      "rate_percent": 2.6,
      "beitragsbemessungsgrenze": 101400,
      "pap_page": 7
    },
    "KV": {
      "basis_rate_percent": 14.0,
      "employee_percent": 7.0,
      "beitragsbemessungsgrenze": 69750,
      "zusatzbeitrag_avg": 2.5,
      "pap_page": 8
    },
    "PV": {
      "basis_rate_percent": 3.60,
      "zuschlag_kinderlos": 0.6,
      "abschlag_pro_kind": 0.25,
      "sachsen_zuschlag": 0.75,
      "pap_page": 8
    }
  },
  
  "solidarity": {
    "rate_percent": 5.5,
    "freigrenze": 20350,
    "freigrenze_soli_factor": 1.0,
    "law_reference": "§ 5 SolzG",
    "law_change_2024": "Erhöhung Freigrenze von 16956 EUR auf 20350 EUR",
    "pap_page": 16
  },
  
  "special_cases": {
    "minijob_limit": 520,
    "minijob_rate_rv": 0.14,
    "gleitzone_lower": 520,
    "gleitzone_upper": 1500,
    "altersentlastung_mindestalter": 64,
    "abfindung_regelung": "Fünftel-Regelung § 34 EStG"
  },
  
  "validation_test_cases": [
    {
      "testcase_id": 1,
      "brutto": 5000,
      "stkl": 1,
      "expected_lst": 789,
      "source": "Blatt 'prüft PAP' Zeile 15"
    }
  ]
}
```

### 8.2 Beispiel: pap-references.json

```json
{
  "references": [
    {
      "function": "calculateTariff",
      "description": "Einkommensteuertarif 2026",
      "pap_page": 12,
      "pap_steps": "6.1-6.3",
      "law": "§ 32a EStG",
      "source_file": "2025-11-12-PAP-2026-anlage-1.pdf",
      "key_formulas": [
        "Zone A: 0 EUR bis 11.600 EUR",
        "Zone B: 11.600 EUR bis 62.810 EUR (Progressive)",
        "Zone C: 62.810 EUR bis 186.000 EUR (42%)",
        "Zone D: ab 186.000 EUR (45%)"
      ]
    },
    {
      "function": "calculateSolidarity",
      "description": "Solidaritätszuschlag 5,5%",
      "pap_page": 16,
      "law": "§ 5 SolzG",
      "freigrenze": 20350,
      "note": "Anhebung durch Steuerfortentwicklungsgesetz 2025"
    }
  ]
}
```

---

## 9. QUALITY ASSURANCE & AUDIT

### 9.1 Checkliste vor Release

- [ ] Alle 75 Testfälle aus Excel erfolgreich
- [ ] Differenz zu Excel: max. ±0,01 EUR
- [ ] Unit-Test Coverage >90%
- [ ] Jede Funktion hat PAP-Referenz
- [ ] Audit-Trail für Mind. 5 Beispiel-Berechnungen dokumentiert
- [ ] Validierung gegen BMF-Lohnsteuer-Tabelle (Stichprobe)
- [ ] Benutzer-Dokumentation vollständig
- [ ] Code-Review durch 2 Personen

### 9.2 Post-Release Monitoring

- Fehler-Log aktiv überwachen
- Monatliche Stichproben-Validierung
- Feedback-Kanal für Nutzer
- Vorbereitung für Audit/Revision (Dokumentenpaket)

---

## 10. BESONDERHEITEN & RISIKEN

### 10.1 Identifizierte Risiken

| Risiko | Schweregrad | Mitigation |
|--------|-----------|-----------|
| VBA-Black-Box nicht vollständig nachgebildet | **KRITISCH** | Reverse-Engineering via Testfälle + Validierung |
| Altersentlastung (§ 24a EStG) unklar | HOCH | Explizite Implementierung + Testfall-Validierung |
| Gleitzone-Logik komplex | MITTEL | Detaillierte Dokumentation + Unit-Tests |
| PAP-Updates 2027 ff. | MITTEL | VersionManager-Struktur bereits vorgesehen |
| Numerische Genauigkeit (Rounding) | MITTEL | Alle Berechnungen in Cent (Integer) durchführen |

### 10.2 Nicht in Prototyp v1 enthalten (später)

- ❌ KI-basierte PAP-PDF-Analyse (Phase 5)
- ❌ Datenbankanbindung (lokal über IndexedDB)
- ❌ Multi-User/Cloud-Sync
- ❌ Mehrsprachigkeit
- ❌ Mobile-App (später als Wrapper)

---

## 11. DOKUMENTATIONS-STANDARD

### 11.1 Code-Dokumentation

Jede Funktion mit:
```typescript
/**
 * Berechnet die Lohnsteuer nach Tarifformel § 32a EStG
 * 
 * @param zu_versteuerndesEinkommen - Jahreseinkommen in EUR
 * @param stkl - Lohnsteuerklasse (1-6)
 * @param faktor - Faktor für STKL IV (nur wenn STKL === 4)
 * @returns Lohnsteuer in EUR (auf Cent)
 * 
 * PAP-Referenz: S. 12-13, Schritt 6.1-6.3
 * Rechtliche Grundlage: § 32a EStG (Einkommensteuertarif 2026)
 * Test-Validation: Alle 75 Test-Cases 'prüft PAP'
 * 
 * @example
 * calculateTariff(50000, 1) // → 8.234,00 EUR
 */
function calculateTariff(zu_versteuerndesEinkommen, stkl, faktor = 1) { ... }
```

### 11.2 Inline-Kommentare (sparsam)

Nur für Non-Obvious:
```typescript
// Runden auf Cent (PAP S. 3: Alle Beträge in EUR und Cent)
return Math.round(result * 100) / 100

// STKL IV: Faktor-Anwendung nach PAP S. 14
lst = lst * faktor

// Mehrfachbesteuerung vermeiden: Max. 50% Satz
marginalRate = Math.min(marginalRate, 0.50)
```

### 11.3 Changelog-Format

```markdown
## Version 2026.1.0 (5. Mai 2026)

### Neue Features
- Vollständige Lohnsteuerberechnung nach PAP 2026
- Versionsverwaltung für Parameter-Sets
- Audit-Trail für Nachvollziehbarkeit

### Änderungen gegenüber Excel v2.5.2
- Solidaritätszuschlag-Freigrenze: 16.956 EUR → 20.350 EUR
- RV-Beitragssätze: 18,6% (unverändert)
- KV-Beitragsbemessungsgrenze: +3.600 EUR (66.150 → 69.750 EUR)

### Bekannte Einschränkungen
- Altersentlastung (§ 24a EStG): Validation pending gegen Tabellen
- Gleitzone: Testfälle vorhanden, aber zusätzliche Validation empfohlen
```

---

## 12. ERFOLGS-KRITERIEN

Das Prototyp-Projekt ist erfolgreich, wenn:

1. ✅ **Funktional:** Rechner liefert Ergebnisse, die mit Excel zu 99,99% übereinstimmen
2. ✅ **Transparent:** Jeder Berechnungsschritt ist im Code dokumentiert und nachvollziehbar
3. ✅ **Wartbar:** Neue PAP-Versionen können mit <8 Stunden Aufwand integriert werden
4. ✅ **Auditierbar:** Vollständiger Audit-Trail für jede Berechnung vorhanden
5. ✅ **Erweiterbar:** Architektur ermöglicht Phase-5-KI-Integration
6. ✅ **Getestet:** >90% Code-Coverage, alle 75 Excel-Testfälle Pass
7. ✅ **Dokumentiert:** JSDoc + PAP-Referenzen im Code, Benutzerhandbuch separat

---

## ANHANG: TIMELINE & RESSOURCEN

### Geschätzter Aufwand
- **Phase 1:** 1-2 Wochen (Grundstruktur)
- **Phase 2:** 2-3 Wochen (Berechnungen)
- **Phase 3:** 1-2 Wochen (UI & Docs)
- **Phase 4:** 1 Woche (Versionierung)
- **Gesamt Phase 1-4:** ~7-8 Wochen für Prototyp v1.0

### Ressourcen benötigt
- 1 Senior Developer (TypeScript/JavaScript)
- 1 QA-Person (für Validierung)
- 1 Tax-Consultant (für PAP-Interpretation)
- Zugriff auf offizielle Lohnsteuer-Tabellen (BMF)

### Tools & Infrastruktur
- Git Repository
- Code Editor (VS Code)
- Testing Framework (Jest)
- Build Tool (Vite)
- PDF-Tools (Phase 5)

---

**Dokumentation abgeschlossen:** 5. Mai 2026  
**Status:** Bereit für Entwicklungs-Start Phase 1  
**Nächster Schritt:** Projekt-Setup + Team-Alignment
