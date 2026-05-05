# LexLohnRechner - Phase 1

**Transparente Lohnsteuerberechnung 2026 als HTML-Webtool**

## 🚀 Status: Phase 1 - Grundstruktur

### Was ist implementiert?

- ✅ TypeScript/Vite Projekt-Setup
- ✅ HTML Eingabeform mit vollständiger Eingabe-Validierung
- ✅ InputValidator-Modul (alle 12 Validierungsfunktionen)
- ✅ ReferenceRegistry mit PAP-Quellenangaben (13 Funktionen dokumentiert)
- ✅ Parameter-Set 2026 (JSON mit Schwellwerten & Beitragssätzen)
- ✅ Unit-Tests für InputValidator
- ✅ Responsive UI mit Fehler-/Warnmeldungen
- ✅ Vite Dev-Server & Build-Config

### Was folgt in Phase 2?

- [ ] TaxCalculator-Modul (Tarifberechnung nach § 32a EStG)
- [ ] SocialSecurityCalculator (RV, ALV, KV, PV)
- [ ] Echte Berechnungslogik statt Dummy-Werte
- [ ] Integration gegen 75 Excel-Testfälle
- [ ] Audit-Logger für Nachvollziehbarkeit

## 📦 Installation

```bash
npm install
```

## 🎯 Entwicklung

```bash
# Dev-Server starten (öffnet http://localhost:3000)
npm run dev

# TypeScript kompilieren
npm run build

# Tests ausführen
npm run test

# Tests mit UI
npm run test:ui
```

## 📋 Projektstruktur

```
src/
├── types/
│   └── index.ts              # Zentrale Type-Definitionen
├── modules/
│   ├── InputValidator.ts      # ✅ Eingabe-Validierung
│   ├── InputValidator.test.ts # Unit Tests
│   ├── ReferenceRegistry.ts   # ✅ PAP-Quellenangaben
│   ├── TaxCalculator.ts       # Phase 2
│   ├── SocialSecurityCalculator.ts # Phase 2
│   ├── VersionManager.ts      # Phase 4
│   └── AuditLogger.ts         # Phase 3
├── data/
│   ├── parameters-2026.json   # ✅ Parametersatz
│   ├── parameters-2025.json   # Phase 4
│   └── pap-references.json    # Phase 5
├── ui/
│   ├── index.html             # ✅ Eingabeform
│   └── app.ts                 # ✅ Hauptanwendung
└── test/
    └── calculator.test.ts     # Phase 2

Documentation/
├── INDEX.md                   # Dokumentations-Index
├── README_ANALYSE.md          # Quick Reference
├── ANALYSE_Lohnsteuer_Excel.md # Vollständige Analyse
├── TECHNISCHE_DETAILS_Anhang.md # Technische Details
├── ENTWICKLUNGSKONZEPT_Prototype_v1.md # Architektur
└── PROJEKT_UEBERSICHT.md      # Projekt-Übersicht
```

## 🔑 Zentrale Konzepte

### InputValidator
Validiert alle 12 Eingabeparameter gegen PAP-Anforderungen:
- Lohnzahlungszeitraum (LZZ)
- Lohnsteuerklasse (STKL)
- Bruttolohn (RE4)
- Versicherungsstatus (RV, KV, PV)
- Kinderfreibeträge (ZKF)
- Geburtsjahr (AJAHR)
- West/Ost Kennzeichen (BBG)

Jede Validierung enthält PAP-Referenzen.

### ReferenceRegistry
Zentrale Verwaltung aller PAP-Quellenangaben:
- 13 Funktionen mit PAP-Seiten/Schritten dokumentiert
- Verlinkung zu rechtlichen Grundlagen (EStG, SGB, etc.)
- Inline-Formeln und Hinweise
- Markdown/HTML-Export

### Parameter-Sets
JSON-basierte Parameter für jedes Steuerjahr:
```json
{
  "version": "2026.1.0",
  "tariff": { ... },
  "contributions": { ... },
  "solidarity": { ... },
  "metadata": { ... }
}
```

## 🧪 Testing

Unit Tests mit Vitest:
```bash
npm test
```

Alle 12 Validierungsfunktionen haben Tests:
- ✅ 24 Test-Cases
- ✅ Edge Cases abgedeckt
- ✅ PAP-Compliance validiert

## 📊 Phase 1 Deliverables

- [x] Funktionsfähige Eingabeform
- [x] Vollständige Validierung (mit Fehler/Warnings)
- [x] Quellenverweis-System
- [x] Parameter-Management
- [x] Unit-Tests
- [x] Dokumentation

**Status:** Ready for Phase 2 ✅

## 🔗 Dokumentation

Für detaillierte Informationen siehe:
- **[INDEX.md](INDEX.md)** - Navigation & Lesepfade
- **[ENTWICKLUNGSKONZEPT_Prototype_v1.md](ENTWICKLUNGSKONZEPT_Prototype_v1.md)** - Architektur & Roadmap
- **[ANALYSE_Lohnsteuer_Excel.md](ANALYSE_Lohnsteuer_Excel.md)** - Excel-Struktur

## ⚙️ Konfiguration

- **TypeScript:** tsconfig.json (ES2020, strict mode)
- **Vite:** vite.config.ts (Port 3000, HMR enabled)
- **Testing:** vitest.config.ts (UI mode available)

## 📝 Lizenz

PROPRIETARY - Marc Grethen

## 📞 Kontakt

marc.grethen@gmail.com

---

**Phase 1 Status:** ✅ ABGESCHLOSSEN (5. Mai 2026)  
**Phase 2 Start:** Bereit

**PAP-Version:** 2026 (Stand 12.11.2025)
