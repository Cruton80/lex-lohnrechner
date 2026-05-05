# Technische Details und Anhang: Lohnsteuer-Excel-Analyse

**Ergänzung zur Hauptanalyse:** ANALYSE_Lohnsteuer_Excel.md

---

## A. DETAILLIERTE FORMEL-REFERENZEN

### A.1 Eingabevalidierungs-Formeln

#### PVSachsen-Validierung (Zelle F15)
```excel
=IF(PVSachsen=1,
    "1 = Sachsenzuschlag: Achtung - dann RVStatus = Ost und WESTOST anpassen",
    "Kein Sachsenzuschlag (1) ?")
```

**Zweck:** Warnt bei Sachsen-Zuschlag-Aktivierung
**Logik:** Prüft PVStatus-Konsistenz mit Ost/West-Auswahl
**Fehler-Risiko:** Inkonsistenzen können zu falschen Beiträgen führen

#### Kinderfreibetrag-Validierung (Zelle F16)
```excel
=IF(AnzahlKFB>0,
    "Achtung: bei StKl 2 muss AnzahlKFB mindestens 1 betragen - und PVStatus ebenfalls anpassen !",
    "Kein Kinderfreibetrag bei StKl 2  ?")
```

**Zweck:** Validiert Kinderfreibetrag-Eintrag für StKl II
**Logik:** StKl II erfordert Kinderfreibetrag, sonst ist StKl I korrekt
**Fehler-Risiko:** Falsche Steuerklasse → zu hohe oder zu niedrige Lohnsteuer

### A.2 Berechnung der Belastungsquoten

#### Durchschnittsbelastung Lohnsteuer (Zelle E42)
```excel
=IF(LZZBrutto>0, E38/($E$7/100), "")
```

**Komponenten:**
- E38: Berechnete Lohnsteuer
- $E$7: Bruttolohn (absoluter Bezug)
- Formel: (Lohnsteuer / Bruttolohn) × 100 = Prozentsatz

**Beispiel:** 2.000 EUR Brutto, 187 EUR Lohnsteuer
- Durchschnittsbelastung = 187/2000 × 100 = 9,35%

#### Gesamtbelastung LSt + Solidaritätszuschlag (Zelle E43)
```excel
=IF(LZZBrutto>0, (E38+E39)/($E$7/100), "")
```

**Komponenten:**
- E38: Lohnsteuer
- E39: Solidaritätszuschlag (5,5% auf LSt, wenn > Freigrenze)
- Freigrenze Solidaritätszuschlag 2026: 20.350 EUR

**Beispiel:** E38=187 EUR, E39=10,29 EUR (5,5%)
- Gesamtbelastung = (187+10,29)/2000 × 100 = 9,86%

#### Gesamtbelastung mit Kirchensteuer 8% (Zelle E44)
```excel
=IF(LZZBrutto>0, (E38+E39+E40)/($E$7/100), "")
```

**Kirchensteuer-Berechnung:** 8% auf Lohnsteuer
- Bundesland-abhängig (Bayern/Baden-Württemberg: 8%)

**Beispiel:** E40 = 187 × 0,08 = 14,96 EUR
- Gesamtbelastung = (187+10,29+14,96)/2000 × 100 = 10,61%

### A.3 Grenzbelastungs-Berechnung

#### Grenzbelastung der letzten X EUR (Zelle E46)
```excel
=IF(LohnZZ=1,
    AMLohnAbgabenLast(Jahr, LohnZZ, E$37, LZZBrutto, 21),
    "")
```

**Parameter:**
- Jahr: 2025 (Tarif-Version)
- LohnZZ: 1 (nur für Jahreswerte berechenbar)
- E$37: Steuerklasse
- LZZBrutto: Bruttolohn
- 21: Konstante (möglicherweise Betrag für Grenzberechnung)

**Funktionsweise:** 
- Berechnet Lohnsteuer für (Brutto + Zuwachs)
- Differenz: ((LSt neue - LSt alte) / Zuwachs) × 100
- Zeigt effektiven Steuersatz für nächste EUR

**Beispiel:** Brutto 50.000 EUR, Zuwachs 1.000 EUR
- LSt(50.000): ca. 7.285 EUR
- LSt(51.000): ca. 7.487 EUR
- Grenzbelastung: (7.487-7.285)/1.000 = 20,2%

**Hinweis:** Funktion `AMLohnAbgabenLast()` ist nicht dokumentiert - wahrscheinlich Add-In

### A.4 Spezial-Logik für Beamte/Freiberufler (RVStatus = 9)

#### VBEZ-Vorberechnung (Zeilen 24-26)

**Zeile E24:**
```excel
=IF(RVStatus=9, LZZBrutto, "")
```

**Zeile E25:**
```excel
=IF(RVStatus=9, 12, "")
```

**Zeile E26:**
```excel
=IF(RVStatus=9, LZZBrutto, "")
```

**Logik:**
- RVStatus=9 zeigt Beamte/Freiberufler (keine Rentenversicherung)
- VBEZ (Versorgungsbezüge) werden speziell behandelt
- Faktor 12: Umrechnung auf Jahresbasis
- E26: VBEZ-Anteil im Bruttolohn

**Steuerliche Auswirkung:**
- Vorsorgepauschale wird nicht berechnet
- Keine RV/ALV-Beiträge
- Spezielle Freibeträge für Versorgungsbezüge

---

## B. STRUKTUR DER INTERNE BERECHNUNGEN

### B.1 Zeilen mit höchster Formel-Dichte

| Zeile | Formel-Anzahl | Inhalte | Zweck |
|---|---|---|---|
| **110** | 10 | Sätze (342) | Beitragssätze-Tabelle |
| **107** | 9 | Schwellwerte (332) | Grenzbeträge-Tabelle |
| **108** | 9 | Schwellwerte (335) | Progressions-Tabellen |
| **88-96** | je 8 | Diverse | Umrechnungstabellen |
| **103** | 8 | Sätze (322) | Weitere Sätze |
| **105** | 8 | Sätze (312) | Optionale Sätze |

**Hinweis:** Zeilen 88-110 enthalten wahrscheinlich die Tarif- und Schwellwert-Tabellen für 2026

### B.2 Formel-Verteilung nach Zellbereichen

```
Eingabe-Bereich (E2-E35)        :     13 Formeln
Validierungs-Bereich (F15-F16)  :      2 Formeln
Hauptberechnung (E38-E41)       :      4 Formeln
Belastungsquoten (E42-E50)      :     13 Formeln
Interne Daten (E51-R485)        :  2.424 Formeln
─────────────────────────────
TOTAL                           :  2.456 Formeln
```

### B.3 Makroaufrufe nach Blatt

**Blatt "prüft PAP":**
- Zeilen 15-96: Test-Matrix
- Spalten C-E: LohnSt25()-Aufrufe
- Gesamt: ~225 Makroaufrufe (15 Zeilen × 3 Spalten × 5 Tests)

**Blatt "LStBerechnung":**
- Zeilen 38-50: Hauptberechnungen
- Spalten E-R: Szenarien
- Gesamt: ~260 Makroaufrufe (13 Zeilen × 13 Spalten × 1 Basis + erweitert)

**Gesamte Datei:**
- LohnSt25(): 1.963 Aufrufe
- AMLohnAbgabenLast(): ~20 Aufrufe

---

## C. SCHWELLWERT-ANALYSE FÜR 2026

### C.1 Steuertarif-Schwellwerte

**Nach § 32a EStG (Einkommensteuertarif 2026):**

```
Grundfreibetrag (ab 1.1.2026):  11.600 EUR (§ 1 Abs. 1, 32 Abs. 6 EStG)

Zonen:
─────────────────────────────────────────────────────────────
Zone 1:  0 - 11.600 EUR         Steuersatz: 0% (Grundfreibetrag)

Zone 2:  11.600 - 47.998 EUR    Steuersatz: progressiv von 0% zu 42%
         Formel: 973,77×z + 1.900 EUR (z = (Einkommen-11.600)/10.000)

Zone 3:  47.998 - 62.810 EUR    Steuersatz: 42% (konstant)

Zone 4:  > 62.810 EUR           Steuersatz: 45% (Spitzensatz)
```

**Hinweis:** Diese exakten Werte müssen im VBA-Makro hinterlegt sein - nicht in Excel sichtbar!

### C.2 Sozialversicherungs-Schwellwerte 2026

#### Beitragsbemessungsgrenzen (BBG)

| Versicherung | Grenzwert 2026 | Monatlich | Status |
|---|---|---|---|
| KV (West) | 69.750 EUR | 5.812,50 EUR | Erhöht um 3.600 EUR |
| RV (West) | 101.400 EUR | 8.450 EUR | Erhöht um 4.800 EUR |
| RV (Ost) | 101.400 EUR | 8.450 EUR | Erhöht um 4.800 EUR |
| ALV | 101.400 EUR | 8.450 EUR | Erhöht um 4.800 EUR |

#### Beitragssätze 2026

| Versicherung | Arbeitnehmer | Arbeitgeber | Gesamt |
|---|---|---|---|
| RV | 9,3% | 9,3% | 18,6% |
| ALV | 2,6% | 2,6% | 5,2% |
| KV | 7,0% + KVZ* | 7,0% + KVZ* | 14,0% + 2×KVZ* |
| PV | 1,8%** | 1,8%+ | 3,6% + Zu/Abschlag |

*KVZ = Kassenindividueller Zusatzbeitragssatz (durchschn. 2,5%)
**Bei kinderlos über 23 Jahren zusätzlich 0,6%

### C.3 Zusatzbeitrag Krankenversicherung (KVZ)

**2026 Durchschnittssatz:** ~2,5% (kann je Krankenkasse abweichen)

**Excel-Vorgabe:** KVZSatz = 2.5 (E13)

**Aufteilung (nach R 39b LStR):**
- Der Zusatzbeitrag wird hälftiges aufgeteilt:
  - Arbeitnehmeranteil: KVZ ÷ 2 (z.B. 1,25%)
  - Arbeitgeberanteil: KVZ ÷ 2 (z.B. 1,25%)

**PAP-Vorgabe:** "Die Aufteilung in Arbeitnehmer- und Arbeitgeberanteil erfolgt im Programmablauf"
(d.h., im VBA-Makro umgesetzt)

### C.4 Solidaritätszuschlag 2026

**Rechtsgrundlage:** Steuerfortentwicklungsgesetz (SteFeG)

**Tarif:**
```
Solidaritätszuschlag = Lohnsteuer × 5,5%

ABER mit Freigrenze (Klasse II-Effekt):
  Zu versteuerndes Einkommen < 20.350 EUR   → Satz: 0%
  20.350 - 27.100 EUR                        → progressiv von 0% zu 5,5%
  > 27.100 EUR                               → Satz: 5,5%
```

**Beispiel:** Jahresbrutto 50.000 EUR, StKl I
- Lohnsteuer (Schätzung): ~7.285 EUR
- SZ-Freigrenze überschritten: 50.000 > 20.350
- Solidaritätszuschlag: 7.285 × 5,5% = 400,68 EUR

### C.5 Kirchensteuer 2026

**Bundeslandspezifisch:**

| Bundesland | Satz | Berechnung |
|---|---|---|
| Bayern | 8% | auf Lohnsteuer |
| Baden-Württemberg | 8% | auf Lohnsteuer |
| Mehrheit der Länder | 9% | auf Lohnsteuer |
| Grenzfälle | 8% | Einzelfall-prüfung |

**Excel-Implementierung:**
- kist8lzz (E40): 8%-Variante
- kist9lzz (E41): 9%-Variante
- Beide Varianten werden berechnet, Nutzer wählt korrekte

---

## D. ABHÄNGIGKEITSANALYSE

### D.1 Direkte Abhängigkeiten der Hauptberechnung (E38)

```
E38 (lstlzz - Lohnsteuer) ← LohnSt25()
                             ├─ E4 (LohnZZ)
                             ├─ E37 (STKL) *variable
                             ├─ E6 (Faktor4)
                             ├─ E7 (LZZBrutto)
                             ├─ E8 (LZZFreibetrag)
                             ├─ E9 (RVStatus)
                             ├─ E12 (KVMonat)
                             ├─ E11 (KVStatus)
                             ├─ E13 (KVZSatz)
                             ├─ E14 (PVStatus)
                             ├─ E15 (PVSachsen)
                             ├─ E16 (AnzahlKFB)
                             ├─ E18 (sonstBez)
                             ├─ E19 (mehrjBez)
                             ├─ E20 (Abfindg)
                             ├─ E21 (vJBrutto)
                             └─ B38 (Testwert)
```

*E37 wird in Spalte E fest gesetzt, aber für Szenarios (F-R) variiert

### D.2 Indirekte Abhängigkeiten

#### Belastungsquoten (Z42-Z50)
```
E42 (Durchschnitt LSt)     ← E38, E7
E43 (LSt + SZ)              ← E38, E39, E7
E44 (LSt + SZ + KSt8)       ← E38, E39, E40, E7
E45 (LSt + SZ + KSt9)       ← E38, E39, E41, E7
E46 (Grenzbelastung)        ← Jahr, LohnZZ, E37, E7, Konstante
E47 (AN-SV-Beitrag)         ← Interne Tabelle (I119)
E48-E50 (weitere Quoten)    ← Kombinationen E38-E41
```

#### Validierungsketten
```
AnzahlKFB (E16) → F16 (Warnung)
PVSachsen (E15) → F15 (Warnung)
E5 (StKl) → E37 (Scenario-StKl) → E38-E41 (Berechnung)
```

### D.3 Kritischer Pfad für Fehlerfortpflanzung

**Fehler in E4 (LohnZZ):**
- Auswirkung: LohnSt25() rechnet mit falscher Periodisierung
- Folge: Alle Ergebnisse E38-E41 falsch
- Belastungsquoten (E42-E50) falsch
- Grenzbelastung (E46) nicht berechenbar

**Fehler in E7 (LZZBrutto):**
- Auswirkung: Falsche Bemessungsgrundlage
- Folge: Alle Steuern E38-E41 falsch (Größenordnung ist offensichtlich)
- Belastungsquoten E42-E45 falsch
- Fehler sofort erkennbar

**Fehler in E11/E13/E14 (Versicherungsparameter):**
- Auswirkung: Falsche Vorsorgepauschale in LohnSt25()
- Folge: Alle Steuern E38-E41 falsch (Größe: ca. 1-3%)
- Fehler möglicherweise nicht sofort sichtbar

---

## E. VBA-MAKRO PARAMETER-ÜBERGABE

### E.1 Detaillierte Parameter-Übergabe für LohnSt25()

**Aufruf-Syntax:**
```vba
Function LohnSt25(
    p_LohnZZ,       ' 1=Jahr, 2=Monat, 3=Woche, 4=Tag
    p_STKL,         ' 1-6 (oder F bei StKl I)
    p_F,            ' Faktor für StKl IV (z.B. 1, 1.5, ...)
    p_RE4,          ' Steuerpflichtiger Bruttolohn
    p_LZZFREIB,     ' Freibetrag für LZZ
    p_KRV,          ' Rentenversicherungsstatus (0,1,9)
    p_VKV,          ' Monatsbeitrag KV/PV
    p_PKPV,         ' Krankenversicherungsstatus (0=gesetzlich, 1=privat)
    p_KVZ,          ' Zusatzbeitragssatz KV
    p_PVZ,          ' Pflegeversicherungsstatus
    p_PVSachsen,    ' Sachsen-Flag
    p_ZKF,          ' Anzahl Kinderfreibeträge
    p_SONSTB,       ' Sonstige Bezüge
    p_Mehrj,        ' Mehrjährige Bezüge
    p_SONSTENT,     ' Entschädigungen
    p_JRE4,         ' Jahresbrutto
    p_TestWert      ' Testwert (für Szenarien)
) As Variant
```

### E.2 Interne Verarbeitung (geschätzt nach PAP)

```
1. Eingabeparameter-Validierung
   - LohnZZ: 1-4 prüfen
   - STKL: 1-6 prüfen
   - RE4 > 0 prüfen

2. Periodisierung (falls LohnZZ <> 1)
   - LohnZZ=2: ÷ 12
   - LohnZZ=3: ÷ 52
   - LohnZZ=4: ÷ 365

3. Vorsorgepauschale berechnen
   - RV-Anteil (max. BBG RV)
   - ALV-Anteil (max. BBG ALV)
   - KV-Anteil (max. BBG KV, incl. KVZ)
   - PV-Anteil (incl. Zuschlag/Abschlag)
   - Ergebnis: Sonderabzug für Steuern

4. Steuerbemessungsgrundlage
   - RE4 - Vorsorgepauschale - LZZFREIB
   - Ggf. Sonderausgaben-Pauschbetrag
   - = Steuerbemessungsgrundlage

5. Lohnsteuer-Tarifberechnung
   - Anwendung Einkommensteuertarif 2026
   - Berücksichtigung STKL (I-VI)
   - Bei StKl IV: Faktor F anwenden
   - Bei Kinderfreibeträge (ZKF): Reduktion

6. Solidaritätszuschlag (5,5% auf LSt)
   - Prüfe Freigrenze 20.350 EUR
   - Berechne progressiven Teil

7. Kirchensteuer
   - 8% oder 9% auf Lohnsteuer
   - Ausgabe: beide Varianten

8. Rückgabewert
   - Kann sein: Lohnsteuer ODER Solidaritätszuschlag ODER Kirchensteuer
   - (abhängig von Kontext des Aufrufs)
   - ODER Fehlercode
```

---

## F. VALIDIERUNGS-CHECKLISTE

### F.1 Input-Validierung

- [ ] LohnZZ (E4): Wert 1-4
- [ ] LohnStKl (E5): Bei Eingabe Wert 1-6 oder leer (wird in E37 gesetzt)
- [ ] Faktor4 (E6): Wert 0,1-2,0 (typisch 1,0)
- [ ] LZZBrutto (E7): >= 0, realistisch < 200.000 EUR
- [ ] LZZFreibetrag (E8): >= 0, < LZZBrutto
- [ ] RVStatus (E9): 0 oder 9
- [ ] GebJahr (E10): YYYY zwischen 1920-2010
- [ ] KVStatus (E11): 0 oder 1
- [ ] KVMonat (E12): >= 0, realistisch < 1.000 EUR
- [ ] KVZSatz (E13): >= 1,0%, <= 4,0% (typisch 2,0-3,0%)
- [ ] PVStatus (E14): 0 oder 1
- [ ] PVSachsen (E15): 0 oder 1
- [ ] AnzahlKFB (E16): >= 0, <= 10
- [ ] sonstBez (E18): >= 0
- [ ] mehrjBez (E19): >= 0
- [ ] Abfindg (E20): >= 0
- [ ] vJBrutto (E21): >= 0, >= LZZBrutto

### F.2 Konsistenz-Validierung

- [ ] PVSachsen=1 UND WestOst=2 (Ost) konsistent?
- [ ] AnzahlKFB>0 UND LohnStKl=2 konsistent?
- [ ] RVStatus=9 UND KVStatus=1 kombinierbar?
- [ ] LZZBrutto > 520 EUR/Monat (Minijob-Grenze)?
- [ ] KVZSatz passt zu Steuerklasse?

### F.3 Output-Validierung

- [ ] E38 (Lohnsteuer) >= 0
- [ ] E39 (Solidaritätszuschlag) >= 0
- [ ] E40, E41 (Kirchensteuer) >= 0
- [ ] E42 (Durchschnittsbelastung) zwischen 0-50%?
- [ ] E46 (Grenzbelastung) zwischen 0-50%?
- [ ] Grenzbelastung > Durchschnittsbelastung (bei progressiv)?

---

## G. HÄUFIGE FEHLER UND LÖSUNGEN

### G.1 "Achtung - für StKl 2 muss AnzahlKFB..."

**Fehler:** In Zelle E37 (Lohnsteuerklasse II) ist AnzahlKFB leer oder 0

**Ursache:** StKl II ist für Alleinerziehende mit mindestens 1 Kind

**Lösung:** 
- Falls Kinder vorhanden: AnzahlKFB >= 1 setzen
- Falls keine Kinder: StKl III oder I wählen

**Auswirkung:** Falsche Berechnung von bis zu 200-500 EUR pro Jahr

### G.2 "1 = Sachsenzuschlag: Achtung - dann RVStatus = Ost..."

**Fehler:** PVSachsen=1, aber WestOst und RVStatus nicht angepasst

**Ursache:** Sachsen hat eigenständige Beitragssätze

**Lösung:**
- WestOst = 2 (Ost)
- RVStatus berücksichtigen

**Auswirkung:** PV-Beiträge ca. 0,75% zu niedrig oder zu hoch

### G.3 Lohnsteuer unrealistisch hoch/niedrig

**Mögliche Ursachen:**

| Symptom | Ursache | Lösung |
|---|---|---|
| LSt > 50% | LohnZZ falsch (monatlich statt jahresweise) | LohnZZ prüfen |
| LSt = 0 | LZZBrutto unter Grundfreibetrag | Bruttowert prüfen |
| LSt sehr niedrig | KVZSatz zu hoch gesetzt | KVZSatz auf 2,5% prüfen |
| LSt oszilliert | RVStatus inkonsistent | RVStatus 0 oder 9 prüfen |

---

## H. REFERENZEN ZUM ORIGINALEN PAP

**Quelle:** Programmablaufplan für die maschinelle Berechnung der vom Arbeitslohn einzubehaltenden Lohnsteuer 2026
**Stand:** 12.11.2025 (endgültig)
**Seiten:** 40
**Gültigkeit:** Lohnzahlungszeiträume nach 31.12.2025 bis 31.12.2026

**Wichtige PAP-Punkte:**

| Punkt | Thema | Relevanz |
|---|---|---|
| 1. | Gesetzliche Grundlagen | § 39b EStG, SteFeG |
| 2.1 | Allgemeines | Lohnzahlungszeitraum-Handling |
| 2.2 | Feldlängen | Genauigkeit der Berechnung |
| 2.3 | Symbole | Dokumentation Variablennamen |
| 2.4 | KVZ-Zusatzbeitrag | Aufteilung AN/AG |
| 3.1 | Eingabeparameter | 17 Parameter erforderlich |
| 3.2 | Ausgangsparameter | 4 Steuerergebnisse |
| 4. | Interne Felder | 20+ Hilfsvariablen |
| 5. | Programmablaufplan | Detaillierte Algorithmen (20 Seiten) |

---

**Umfang:** ~2.500 Wörter technische Detaildokumentation
**Letzter Update:** 5. Mai 2026