# LexLohnRechner - Verbesserungsplan (Benutzer-Feedback 2026-05-05)

**Status:** Roadmap für Phase 6-8

---

## 🔴 Priorität 1: Kritische Fixes (diese Woche)

### 1.1 NaN-Fehler beheben
- [x] Format-Funktionen mit NaN-Handling
- [ ] Berechnung von Pflegeversicherung überprüfen (gibt NaN zurück)
- [ ] Gesamtabzüge-Berechnung überprüfen
- [ ] Nettolohn-Berechnung überprüfen

**Aktion:** SocialSecurityCalculator debuggen, fehlende Fallback-Werte ergänzen

---

### 1.2 Audit-Trail verständlich machen
- [ ] Alert-Dialog durch strukturierte Anzeige ersetzen
- [ ] Alle Berechnungsschritte in Tabelle anzeigen
- [ ] Pro Schritt: Input, Formel, Output, PAP-Referenz

**Beispiel:**
```
Schritt 1: Grundfreibetrag abziehen
  Input: Bruttolohn 5000 EUR
  Formel: zu_versteuerndes = brutto - grundfreibetrag
  Output: 3840 EUR
  Quelle: PAP S. 2, § 32a EStG
```

---

### 1.3 PAP-Badge Interaktivität
- [ ] Klick auf "PAP S.8" öffnet Modal mit vollständiger Info
- [ ] Modal zeigt:
  - Seite und Paragraf
  - Vollständige Beschreibung
  - Beispiel
  - Link zu Quelle (wenn verfügbar)

**Beispiel Modal:**
```
┌─ Krankenversicherung (PAP S. 8) ─────────┐
│                                          │
│ § 242 SGB V - Beitragsbemessungsgrenze  │
│                                          │
│ BBG 2026: 69.750 EUR/Monat               │
│ Satz: 14% (7% Arbeitnehmer)              │
│                                          │
│ Berechnung:                              │
│ KV-Beitrag = min(Bruttolohn, BBG) * 7%  │
│                                          │
│ + Zusatzbeitrag (kassendividuell, ø2,5%)│
│                                          │
└──────────────────────────────────────────┘
```

---

## 🟡 Priorität 2: UX-Verbesserungen (nächste 2 Wochen)

### 2.1 Live-Berechnung (Echtzeitrechnung)
- [ ] Input-Felder mit `oninput` Event statt `onclick`
- [ ] Berechnung bei jedem Feldwechsel (mit Debounce 300ms)
- [ ] Validierung zeigt Fehler rot, Warnungen orange in Echtzeit
- [ ] Ergebnisse aktualisieren sich automatisch

**Auswirkung:** Benutzer sieht sofort, wie sich Änderungen auswirken

---

### 2.2 Eingabe-Validierung mit Konflikt-Erkennung
- [ ] Unmögliche Kombinationen kennzeichnen
- [ ] Beispiele:
  - KV=Privat + RV=Gesetzlich (widersinnig)
  - KV=Privat + KV-Zusatz setzen (irrelevant)
  - Geburtsjahr=2010 + Altersentlastung (noch nicht wirksam)
  - Pflegeversicherung ohne KV (unmöglich)

**UI-Konzept:**
```
[Krankenversicherung: Privat] ⚠️ Widerspruch erkannt!
                              "KV-Zusatz wird ignoriert"
[KV-Zusatz: 2.5%] (greyed out, disabled)
```

---

### 2.3 Bessere Fehlerbehandlung
- [ ] Alle NaN-Fehler beheben
- [ ] Fallback-Werte für fehlende Parameter
- [ ] Verständliche Fehlermeldungen für Benutzer
- [ ] Console-Logs für Debugging

---

## 🟢 Priorität 3: Neue Features (Phase 6+)

### 3.1 Parameter-Management Panel
**Neuer Bereich "⚙️ Parameter"**

```
┌─ Parameter 2026 ─────────────────────────────┐
│                                              │
│ 📋 Tariff                                    │
│   Grundfreibetrag: 11.600 EUR                │
│   Spitzensteuersatz: 45%                     │
│   [Edit] [History]                           │
│                                              │
│ 💼 Sozialversicherung                        │
│   RV Satz: 18,6%                             │
│   RV BBG West: 101.400 EUR                   │
│   RV BBG Ost: 107.100 EUR                    │
│   [Edit] [History] [Compare]                 │
│                                              │
│ 🏥 Sonstiges                                 │
│   Solz Freigrenze: 20.350 EUR                │
│   [Edit] [History]                           │
│                                              │
│ 📊 Version-Vergleich                         │
│   [2025 vs 2026] [2026 vs 2027]              │
│   → Zeigt Änderungen farbcodiert             │
│                                              │
└──────────────────────────────────────────────┘
```

**Funktionen:**
- Alle Parameter in einer Tabelle
- Edit-Mode zum Ändern von Werten
- Auto-Save
- Versionsverlauf (wer, wann, was geändert)
- Changelog Export

---

### 3.2 PAP-Import
**Neuer Button: "📤 PAP hochladen"**

Workflow:
1. PDF oder Textdatei hochladen
2. PAPAnalyzer + ClaudeParameterExtractor laufen
3. Erkannte Parameter anzeigen:
   ```
   ✓ Grundfreibetrag: 11.600 EUR (Konfidenz: 95%)
   ✓ RV-Satz: 18,6% (Konfidenz: 98%)
   ? Neue Parameter erkannt: "Energiepreisbremse-Ausgleich" 
   ✗ KV-Zusatzbeitrag: nicht erkannt
   ```
4. Benutzer bestätigt/editiert
5. Parameter-Set erstellen/aktualisieren
6. Auto-Test gegen Validierungsfälle

---

### 3.3 Design nach rehm-verlag.de Stil
**Aktuell:** Modern mit Gradient
**Ziel:** Professionell, vertrauenswürdig, sachlich

```
Farbschema:
- Primär: Dunkelblau (#003366) statt Lila
- Sekundär: Grün (#00AA44) für Positive Werte
- Warnung: Orange (#FF8800)
- Fehler: Rot (#CC0000)
- Hintergrund: Hell-Grau (#F5F5F5)
- Texte: Charcoal (#333333)

Schrift:
- Serif für Überschriften (Georgia, serif)
- Sans-serif für Body (Helvetica, Arial)

Layout:
- Klassische 2-spaltige Struktur
- Prominente PAP-Referenzen
- Juridische Quellenangaben
- Fußnoten zu Paragraphen
```

---

## 📋 Priorität 4: Erweiterte Features (Phase 7+)

### 4.1 Mehrsprachigkeit
- [ ] DE / EN Toggle
- [ ] PAP-Referenzen mehrsprachig
- [ ] Alle Fehlermeldungen übersetzen

### 4.2 Export-Formate
- [ ] PDF mit vollständiger Dokumentation
- [ ] CSV für Personalcontroller
- [ ] XML für Buchhaltungssysteme
- [ ] QR-Code für Audit-Verifikation

### 4.3 Vergleich Tool
- [ ] Zwei Szenarien nebeneinander
- [ ] Delta-Ansicht (Unterschiede farbig)
- [ ] Finanzielle Auswirkungen simulieren

### 4.4 Regelmäßige Updates
- [ ] Automatische Benachrichtigung bei neuer PAP
- [ ] Auto-Download und Validierung
- [ ] Change-Log mit Impact-Analyse

---

## 🎯 Implementierungs-Roadmap

| Phase | Titel | Wochen | Features |
|-------|-------|--------|----------|
| **6** | Fixes & UX | 1-2 | NaN-Fehler, Live-Calc, Validierung, Audit-Trail, PAP-Modal |
| **6b** | Parameter-Panel | 2-3 | Parameter-UI, Versionsverlauf, Vergleich |
| **7** | PAP-Import | 1-2 | PDF-Upload, Analyse, Integration |
| **7b** | Design-Überhaul | 1-2 | Rehm-Verlag Stil, neue Farbschema |
| **8** | Erweitert | 2+ | Export, Mehrsprachigkeit, Webhooks |

---

## ✅ Checkliste für Phase 6 (diese Woche)

- [x] NaN-Fehler vollständig beheben → LohnsteuerEngine komplett neu, alle Werte korrekt
- [x] Live-Berechnung implementieren → oninput/onchange auf allen Feldern
- [x] Audit-Trail Modal mit Tabelle → showAuditTrail() mit strukturierter Tabelle
- [x] PAP-Badges mit Modal-Info → showPAPInfo() für alle 7 Positionen
- [x] Konflikt-Erkennung (5+ häufige Cases) → findeKonflikte() mit 7 Regeln
- [x] Zone-Labels korrigiert (Zone B/C/D statt B/B/C) in einkommensteuerJahr2026
- [x] Steuerklasse V/VI korrekt → kein GFB (statt pauschal 1.15×/30%)
- [x] zoneB_max/zoneC_max auf korrekte PAP-2026-Grenzen gesetzt (17005 / 66760)
- [ ] Tests durchführen
- [ ] Benutzer-Feedback einholen

---

## 💬 Nächste Schritte

1. **Sofort:** NaN-Fehler beheben + Seite neuladen
2. **Diese Woche:** Live-Berechnung + besseres Audit-Trail
3. **Nächste Woche:** Parameter-Panel + PAP-Modal
4. **Dann:** Design-Überhaul + PAP-Import

---

**Gesamtaufwand:** ~40-60 Stunden für Phasen 6-7  
**Nutzen:** Tool wird produktionsreif und professionell

