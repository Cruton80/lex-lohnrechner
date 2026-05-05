# 📖 Benutzerhandbuch - LexLohnRechner v1.0

**Lohnsteuerberechnung 2026 nach offiziellem PAP**

---

## Übersicht

LexLohnRechner ist ein transparentes HTML-Webtool zur Berechnung der Lohnsteuer und Sozialversicherungsbeiträge für das Jahr 2026. Alle Berechnungen erfolgen nach dem offiziellen **Programmablaufplan (PAP)** der Bundeszentralamt für Steuern.

### Eigenschaften
- ✅ Vollständig dokumentierte Berechnungen
- ✅ PAP 2026 konform (Stand 12.11.2025)
- ✅ Alle 4 Tarifzonen (§ 32a EStG)
- ✅ Audit-Trail für Nachvollziehbarkeit
- ✅ Echtzeit-Validierung von Eingaben
- ✅ Belastungsquoten-Berechnung

---

## Schnelleinstieg

### 1. Eingabefelder ausfüllen

**Erforderlich:**
- **Lohnzahlungszeitraum:** Wie oft wird der Lohn gezahlt? (Monatlich ist Standard)
- **Lohnsteuerklasse:** 1-6 (abhängig von Familienstand, siehe Beispiele unten)
- **Bruttolohn:** Das Bruttoeinkommen für den Lohnzahlungszeitraum

**Empfohlen:**
- **Rentenversicherung:** Normales Arbeitsverhältnis = "Gesetzlich"
- **Krankenversicherung:** Arbeitnehmer meist "Gesetzlich"
- **Kinderfreibeträge:** Anzahl eigener Kinder

### 2. Optional: Zusätzliche Parameter

- **Geburtsjahr:** Für Altersentlastung (ab 64 Jahren, § 24a EStG)
- **Bundesland Region:** West/Ost (unterschiedliche Beitragsbemessungsgrenzen)

### 3. Berechnen klicken

Der Rechner validiert alle Eingaben und zeigt sofort Fehler/Warnungen an.

### 4. Ergebnisse prüfen

Die Ergebnisse werden in drei Kategorien angezeigt:
- **Lohnsteuer & Zuschläge**
- **Sozialversicherung**
- **Belastungsquoten**

---

## Steuerklassen erklärt

| Klasse | Beschreibung | Beispiel |
|--------|-------------|----------|
| **I** | Ledig, keine Kinder | Alleinstehende Personen |
| **II** | Alleinerziehend | Ein Elternteil mit Kind(ern) |
| **III** | Verheiratet (zusammen) | Ehepaar, ein Verdienst oder sehr unterschiedliche Einkommen |
| **IV** | Verheiratet (einzeln) | Ehepaar, ähnliche Einkommen (Standard) |
| **V** | Verheiratet (einzeln, 2. Stelle) | Ehepartner mit höherem Einkommen |
| **VI** | Weitere Arbeitsstelle | Mehrere Jobs (nicht erste Stelle) |

---

## Beispielrechnungen

### Beispiel 1: Angestellte, Steuerklasse I
- Lohnzahlungszeitraum: **Monatlich**
- Lohnsteuerklasse: **I**
- Bruttolohn: **2.000,00 EUR**
- Rentenversicherung: **Gesetzlich**
- Krankenversicherung: **Gesetzlich**
- Kinderfreibeträge: **0**

**Ergebnis:**
- Lohnsteuer: ~376 EUR
- Solidaritätszuschlag: ~21 EUR
- Rentenversicherung: ~186 EUR
- Krankenversicherung: ~140 EUR
- **Netto: ~1.277 EUR** (63,9% Netto)

### Beispiel 2: Verheirateter mit zwei Kindern, Steuerklasse III
- Lohnzahlungszeitraum: **Monatlich**
- Lohnsteuerklasse: **III**
- Bruttolohn: **3.000,00 EUR**
- Kinderfreibeträge: **2**

**Besonderheit:** Steuerklasse III hat höhere Freibeträge, was zu niedrigerer Lohnsteuer führt.

---

## Ergebnisse verstehen

### Lohnsteuer
Der Betrag, der vom Lohn einbehalten wird und an das Finanzamt geht.

**Berechnung:** Nach der Tarifformel in § 32a EStG (progressive Besteuerung)

**PAP-Referenz:** S. 12-13

### Solidaritätszuschlag (SZ)
Ein zusätzlicher Zuschlag von 5,5% auf die Lohnsteuer.

**Freigrenze 2026:** 20.350 EUR (erhöht durch Steuerfortentwicklungsgesetz 2025)

**Hinweis:** Wenn der Rechner "Unter Freigrenze (20.350 EUR)" anzeigt, wird kein SZ fällig!

**PAP-Referenz:** S. 16, § 5 SolzG

### Kirchensteuer
8% oder 9% der Lohnsteuer (je nach Bundesland und Religionszugehörigkeit).

Wird nur berechnet, wenn Sie einer Kirche angehören.

**PAP-Referenz:** S. 17, § 51a EStG

### Rentenversicherung (RV)
Beitrag zur Altersrente.

**2026:** 9,3% des Bruttolohns (Arbeitnehmeranteil)

**Obergrenze:** Beitragsbemessungsgrenze (BBG): 101.400 EUR (West) / 107.100 EUR (Ost)

**PAP-Referenz:** S. 7, § 168 SGB VI

### Arbeitslosenversicherung (ALV)
Schutz bei Arbeitslosigkeit.

**2026:** 2,6% des Bruttolohns

**Obergrenze:** 101.400 EUR (gleich wie RV)

**PAP-Referenz:** S. 7, § 341 SGB III

### Krankenversicherung (KV)
Basisversicherung für medizinische Leistungen.

**2026:** 7,0% + kassenindividueller Zusatzbeitrag (~2,5% durchschnittlich)

**Obergrenze:** 69.750 EUR

**PAP-Referenz:** S. 8, § 242 SGB V

### Pflegeversicherung (PV)
Versicherung für Pflegefälle.

**2026:** 1,8% des Bruttolohns

**Zusätze/Abzüge:**
- Kinderlos (ab 23 Jahren): +0,6%
- Pro Kind: -0,25%
- Sachsen-Zuschlag: +0,75%

**PAP-Referenz:** S. 8, § 55 SGB XI

---

## Belastungsquoten erklärt

### Durchschnittliche Belastung (Lohnsteuer)
**Berechnung:** Lohnsteuer / Bruttolohn × 100

Der prozentuale Anteil des Bruttolohns, der als Lohnsteuer gezahlt wird.

**Beispiel:** Bei 2.000 EUR Brutto und 376 EUR Lohnsteuer = 18,8%

### Durchschnittliche Belastung (LSt + SZ)
Wie oben, aber inkl. Solidaritätszuschlag.

**Zeigt:** Gesamte Einkommensteuer-Last

### Gesamtbelastung
**Berechnung:** (LSt + SZ + SV) / Bruttolohn × 100

Der **Prozentsatz des Bruttolohns**, der insgesamt einbehalten wird.

**Beispiel:** 2.000 EUR Brutto, Gesamtabzüge 723 EUR = 36,2% Belastung

### Grenzbelastung
Zusätzliche Steuer auf 1 EUR mehr Einkommen (wird in Phase 4 erweitert).

---

## Fehler und Warnungen

### Fehler (rot)
Die Berechnung kann nicht durchgeführt werden. Bitte korrigieren Sie die markierten Felder.

**Beispiele:**
- Bruttolohn negativ
- Steuerklasse außerhalb 1-6
- Geburtsjahr unrealistisch

### Warnungen (orange)
Die Berechnung ist möglich, es könnte aber ein Fehler in den Eingaben sein.

**Beispiele:**
- Sehr hoher Bruttolohn (>10.000 EUR/Monat)
- Viele Kinderfreibeträge (>14)

---

## Häufige Fragen

### F: Die Lohnsteuer ist höher als bei meinem Arbeitgeber
**A:** Dies kann mehrere Gründe haben:
1. Der Arbeitgeber könnte andere Einstellungen verwenden
2. Freibeträge, die Sie beim Finanzamt eingetragen haben, werden hier nicht berücksichtigt
3. Spezialfälle (Abfindungen, Sonderzahlungen) sind in dieser Version begrenzt

### F: Warum wird kein Solidaritätszuschlag berechnet?
**A:** Der SZ wird nur berechnet, wenn die Lohnsteuer über der Freigrenze von 20.350 EUR liegt. Für niedrigere Einkommen ist kein SZ fällig!

### F: Was ist der Unterschied zwischen KV-Basisbeitrag und Zusatzbeitrag?
**A:** 
- **Basisbeitrag (7,0%):** Von der Krankenkasse garantiert
- **Zusatzbeitrag (~2,5%):** Unterschiedlich je Krankenkasse

Dieser Rechner nutzt 2,5% als Durchschnitt.

### F: Kann ich die Ergebnisse exportieren?
**A:** In Phase 4 wird ein PDF-Export hinzugefügt. Derzeit können Sie den Audit-Trail via Button anzeigen und kopieren.

---

## Audit-Trail

Jede Berechnung wird komplett dokumentiert. Sie können den **Audit-Trail** via Button anzeigen, um:
- Jeden Berechnungsschritt nachzuverfolgen
- Zu prüfen, welche Eingaben verwendet wurden
- Für Reklamationen die genaue Berechnung zu belegen

---

## Datenschutz

- ✅ **Alle Berechnungen erfolgen lokal in Ihrem Browser**
- ✅ **Keine Daten werden an einen Server übertragen**
- ✅ **Keine Cookies oder Tracking**
- ✅ **Audit-Trail wird nicht gespeichert** (außer bei lokalem Export)

---

## PAP-Referenzen

Alle Berechnungen basieren auf dem **Programmablaufplan 2026**:

**Dokument:** 2025-11-12-PAP-2026-anlage-1.pdf  
**Quelle:** Bundeszentralamt für Steuern  
**Gültig für:** Lohnzahlungszeiträume nach 31.12.2025

Rechtliche Grundlagen:
- § 39b EStG (Lohnsteuerabzug)
- § 32a EStG (Einkommensteuertarif)
- § 5 SolzG (Solidaritätszuschlag)
- SGB III, V, VI (Sozialversicherung)

---

## Kontakt & Feedback

Fragen oder Fehlerberichte:  
📧 marc.grethen@gmail.com

---

**Hinweis:** Dieses Webtool ist zu Testzwecken und für private Berechnungen gedacht. Für offizielle Lohnsteuerberechnungen verwenden Sie die behördlich zugelassenen Systeme.

**Version:** 1.0 (Phase 3)  
**Gültig für:** Steuerjahr 2026  
**Stand:** 5. Mai 2026
