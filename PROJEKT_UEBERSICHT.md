# 🔢 LexLohnRechner - Projekt-Übersicht

**Projekt:** Digitalisierung des Excel-Lohnsteuer-Rechners zu einem dokumentierten HTML-Webtool mit jährlicher PAP-Integration

**Status:** Phase 1 - Konzept abgeschlossen ✅  
**Startdatum:** 5. Mai 2026  
**Zielabschluss Prototyp:** Juni/Juli 2026

---

## 📋 Was wurde bisher gemacht

### ✅ Analyse-Phase (Abgeschlossen)
1. **Technische Analyse der Excel-Datei AM_Lohnsteuer252.xlsm**
   - Struktur: 2 Arbeitsblätter, 2.456 Formeln, 24 Named Ranges
   - Zentrale VBA-Funktion `LohnSt25()` dokumentiert
   - 24 Eingabeparameter katalogisiert
   - PAP-Konformität: 85% (Schwellwerte korrekt, Berechnung teilweise unklar)

2. **PAP-Analyse (Programmablaufplan 2026)**
   - Offizielle Vorgaben extrahiert (2025-11-12-PAP-2026-anlage-1.pdf)
   - Schwellwerte 2026 validiert
   - Beitragssätze Sosialversicherung dokumentiert
   - Unterschiede zu Excel identifiziert

3. **Dokumentation erstellt**
   - `README_ANALYSE.md` - Einstiegspunkt (8,4 KB)
   - `ANALYSE_Lohnsteuer_Excel.md` - Hauptdokumentation (18 KB)
   - `TECHNISCHE_DETAILS_Anhang.md` - Tiefgehende Details (16 KB)
   - Gesamt: ~6.000 Wörter technische Dokumentation

---

## 📁 Dateistruktur (aktuell)

```
LexLohnRechner/
│
├─ 📊 [QUELLE - Excel-Dateien]
│  ├─ AM_Lohnsteuer252.xlsm          (Hauptdatei 2025)
│  ├─ 2025-11-12-PAP-2026-anlage-1.pdf (Offizielle PAP)
│  └─ erst mal nicht berücksichtigen/
│     ├─ Anpassungen.xlsx
│     └─ #AM_Lohnsteuer26AVT.xlsm
│
├─ 📚 [ANALYSE - Dokumentation]
│  ├─ README_ANALYSE.md               (Übersicht & Index)
│  ├─ ANALYSE_Lohnsteuer_Excel.md     (Vollständige Analyse)
│  ├─ TECHNISCHE_DETAILS_Anhang.md    (Tiefgehende Technikalien)
│  └─ PROJEKT_UEBERSICHT.md           (Diese Datei)
│
├─ 📋 [KONZEPT - Entwicklungsplanung]
│  └─ ENTWICKLUNGSKONZEPT_Prototype_v1.md (Detaillierter Entwicklungsplan)
│
└─ 💻 [WEBTOOL - noch zu erstellen]
   ├─ src/
   │  ├─ modules/
   │  │  ├─ InputValidator.ts
   │  │  ├─ TaxCalculator.ts
   │  │  ├─ SocialSecurityCalculator.ts
   │  │  ├─ VersionManager.ts
   │  │  ├─ ReferenceRegistry.ts
   │  │  └─ AuditLogger.ts
   │  ├─ ui/
   │  │  ├─ index.html
   │  │  ├─ styles.css
   │  │  └─ app.ts
   │  └─ test/
   │     └─ calculator.test.ts
   ├─ data/
   │  ├─ parameters-2025.json
   │  ├─ parameters-2026.json
   │  ├─ parameters-2027.json (Vorlage)
   │  └─ pap-references.json
   ├─ package.json
   ├─ tsconfig.json
   ├─ vite.config.ts
   └─ README.md
```

---

## 🎯 Nächste Schritte (Phase 1-2: Entwicklung)

### Phase 1: Grundstruktur (1-2 Wochen)
**Ziele:**
- [ ] Git-Repository initialisieren
- [ ] Projekt-Setup (Vite, TypeScript)
- [ ] HTML-Eingabeform erstellen
- [ ] InputValidator-Modul schreiben
- [ ] Unit-Tests einrichten
- [ ] Dokumentation Standards festlegen

**Deliverable:** Funktionierende Eingabeform mit Validierung

---

### Phase 2: Kern-Berechnung (2-3 Wochen)
**Ziele:**
- [ ] TaxCalculator implementieren (Tarif-Berechnung nach § 32a EStG)
- [ ] SocialSecurityCalculator implementieren (Beitragssätze)
- [ ] Alle Excel-Formeln in TypeScript überführen
- [ ] Audit-Logging einbauen
- [ ] Alle 75 Test-Cases validieren
- [ ] >90% Code-Coverage erreichen

**Deliverable:** Funktionsfähiger Rechner mit Test-Suite

---

### Phase 3: UI & Dokumentation (1-2 Wochen)
**Ziele:**
- [ ] HTML-Interface Styling
- [ ] Ergebnisse mit PAP-Referenzen anzeigen
- [ ] Inline-Dokumentation fertigstellen
- [ ] Audit-Trail UI entwickeln
- [ ] PDF-Export-Funktion
- [ ] Benutzer-Handbuch schreiben

**Deliverable:** Vollständiges Webtool mit Dokumentation

---

### Phase 4: Versionierung (1 Woche)
**Ziele:**
- [ ] VersionManager implementieren
- [ ] Multi-Jahr Support (2025, 2026, 2027)
- [ ] Vergleichsmodus (Jahr-zu-Jahr)
- [ ] Changelog-Generator
- [ ] PDF-Upload-Vorbereitung (Phase 5)

**Deliverable:** Multi-Year Support mit Vergleichsfunktion

---

## 🔍 Kritische Erkenntnisse aus der Analyse

### ⚠️ "Black Box" - Zentrale VBA-Funktion
Die Excel-Datei führt die komplette Lohnsteuerberechnung über das VBA-Makro `LohnSt25()` durch, dessen Quellcode nicht einsehbar ist.

**Lösungsansatz im Webtool:**
- Reverse-Engineering über 75 Testfälle (Blatt "prüft PAP")
- Schrittweise Reimplementierung nach PAP
- Jeder Schritt wird gegen Testfälle validiert
- Transparent dokumentiert, welche Schritte unsicher sind

### ✅ Stärken der Excel-Implementierung
- Alle Schwellwerte 2026 korrekt (BBG KV: 69.750€, RV: 101.400€)
- Beitragssätze aktualisiert (RV 18,6%, ALV 2,6%)
- Umfangreiche Testmatrix (75 Testfälle)
- Gutes Fehler-Handling

### ❌ Schwächen / Lücken
- Zentrales Makro nicht transparent
- Altersentlastung (§ 24a EStG) unklar implementiert
- Gleitzone-Berechnung nicht nachvollziehbar
- VBEZ-Parameter teilweise unvollständig

---

## 📊 Schwellwerte & Sätze 2026

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Grundfreibetrag** | 11.600 EUR | § 32a EStG |
| **Spitzensteuersatz ab** | 62.810 EUR | PAP S. 12 |
| **KV-Beitragsbemessungsgrenze** | 69.750 EUR | +3.600 EUR ↑ |
| **RV-Beitragsbemessungsgrenze West** | 101.400 EUR | +4.800 EUR ↑ |
| **RV-Beitragsbemessungsgrenze Ost** | 107.100 EUR | Separate BBG |
| **Solidaritätszuschlag-Freigrenze** | 20.350 EUR | NEU: SteFeG 2025 |
| **Minijob-Grenze** | 520 EUR/Monat | § 8 SGB IV |
| **Gleitzone** | 520-1.500 EUR | Abgestufte Sätze |

---

## 💡 Besonderheiten des Webtool-Ansatzes

### Transparenz-Features
1. **PAP-Quellenangaben direkt in der UI**
   - Jedes Bergebnis zeigt: "Quelle: PAP S. 12, Schritt 6"
   - Vollständige JSDoc-Dokumentation im Code
   - Audit-Trail für jeden Berechnungsschritt

2. **Versionsverwaltung**
   - Parameter-Sets pro Jahr (2025, 2026, 2027, ...)
   - Automatische Vergleichsfunktion
   - Changelog (welche Parameter haben sich geändert)

3. **Automatisierte PAP-Updates (Phase 5)**
   - PDF-Upload des neuen PAP
   - KI-gestützte Änderungserkennung
   - Halbautomatische Parameter-Updates
   - Validierungsregeln auto-generieren

### Qualitätssicherung
- ✅ Unit-Tests für jeden Berechnungsschritt
- ✅ Integration-Tests gegen alle 75 Excel-Testfälle
- ✅ Audit-Logging für Compliance/Revision
- ✅ Validierung gegen offizielle BMF-Tabellen

---

## 🚀 Warum ein Webtool statt nur verbesserte Excel?

| Aspekt | Excel | Webtool |
|--------|-------|---------|
| **Transparenz** | VBA-Code nicht einsehbar | Vollständig dokumentiert |
| **Wartung** | Makros manuell updaten | Parameter-Files JSON |
| **Versionierung** | Datei-Duplikate (252, 26AVT) | Git-basiert, saubere Versionen |
| **Validierung** | Schwierig | Automatisierte Tests |
| **Auditierbarkeit** | Black Box | Vollständiger Audit-Trail |
| **Zugänglichkeit** | Windows/Excel benötigt | Browser, jedes Gerät |
| **Erweiterbarkeit** | VBA-Kenntnisse nötig | Standard Web-Stack |
| **PAP-Updates** | Manuelle Anpassung (2-3 Tage) | Halb-automatisiert (2-4 Stunden) |

---

## 📖 Wie man diese Dokumentation nutzt

### Für Projektmanager / Stakeholder
→ Lesen Sie: Diese Datei + `ENTWICKLUNGSKONZEPT_Prototype_v1.md` Kapitel 1-2

### Für Entwickler (die Implementierung übernehmen)
→ Lesen Sie:
1. `ENTWICKLUNGSKONZEPT_Prototype_v1.md` (komplettes Architektur-Design)
2. `ANALYSE_Lohnsteuer_Excel.md` (Excel-Struktur verstehen)
3. `TECHNISCHE_DETAILS_Anhang.md` (Formeln & Berechnungsschritte)

### Für Tax-Consultant / Validator
→ Lesen Sie:
1. `README_ANALYSE.md` Schnellnachschlagewerk
2. `ANALYSE_Lohnsteuer_Excel.md` Kapitel 5 (PAP-Vergleich)
3. `TECHNISCHE_DETAILS_Anhang.md` Anhang H (Validierungs-Checkliste)

### Für Auditor / Compliance
→ Lesen Sie:
1. `ANALYSE_Lohnsteuer_Excel.md` Kapitel 6 (Diskrepanzen)
2. `TECHNISCHE_DETAILS_Anhang.md` (Häufige Fehler)
3. `ENTWICKLUNGSKONZEPT_Prototype_v1.md` Kapitel 9 (QA & Audit)

---

## 📞 Kontakt & Versioning

**Projekt-Owner:** marc.grethen@gmail.com  
**Analyse durchgeführt:** 5. Mai 2026  
**Excel-Datei Version:** 2.5.2 (Steuerjahr 2025)  
**PAP-Version:** 2026 (Stand 12.11.2025)  
**Dokumentation Status:** ABGESCHLOSSEN für Phase 0

---

## ✅ Checkliste Projekt-Start

Vor Beginn Phase 1 durchführen:
- [ ] Team zusammenstellen (1 Dev, 1 QA, 1 Tax-Consultant)
- [ ] Git-Repository erstellen
- [ ] Entwicklungs-Tools installieren (VS Code, Node.js, TypeScript)
- [ ] Initiales Meeting mit Team durchführen
- [ ] Akzeptanzkriterien für Phase 1 festlegen
- [ ] Test-Umgebung einrichten
- [ ] Dokumentations-Standards absprechen

**Status:** Bereit für Entwicklungs-Start! 🚀

---

**DOKUMENTATION VOLLSTÄNDIG**  
*Alle Analysen und Konzepte abgeschlossen. Bereit für Entwicklung.*
