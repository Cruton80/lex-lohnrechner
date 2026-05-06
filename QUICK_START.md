# LexLohnRechner - Quick Start Guide

## 🚀 Tool starten

### 1. Dependencies installieren
```bash
npm install
```

### 2. Development Server starten
```bash
npm run dev
```

Das öffnet automatisch http://localhost:3000 im Browser.

### 3. Berechnung durchführen
1. **Formularfelder ausfüllen:**
   - Lohnzahlungszeitraum: "Monatlich" (Standard)
   - Lohnsteuerklasse: "I" (oder deine Klasse)
   - Bruttolohn: z.B. 5000 EUR
   - Rest: Optional oder Standard-Werte

2. **Auf "🔢 Berechnen" klicken**

3. **Ergebnisse anschauen** im rechten Panel

---

## 🛠️ Für Production bauen
```bash
npm run build
```

Erzeugt optimierte Version in `dist/` Ordner.

---

## 🧪 Tests ausführen
```bash
npm run test
```

Mit UI:
```bash
npm run test:ui
```

---

## 📝 Troubleshooting

### Problem: Port 3000 belegt
```bash
npm run dev -- --port 3001
```

### Problem: Module nicht gefunden
```bash
rm -rf node_modules
npm install
npm run dev
```

### Problem: TypeScript Fehler
```bash
npx tsc --noEmit
```

---

## 📂 Dateistruktur

```
src/
├── modules/           # Alle Berechnungslogik
│   ├── TaxCalculator.ts
│   ├── SocialSecurityCalculator.ts
│   ├── InputValidator.ts
│   ├── AuditLogger.ts
│   ├── VersionManager.ts
│   └── ... (weitere Phase 5 Module)
├── types/             # TypeScript Typen
├── data/              # Parameter JSON (2025-2027)
└── ui/                # Web-Interface
    ├── index.html
    └── app.ts

dist/                  # Gebuildete Version
package.json          # Dependencies & Scripts
vite.config.ts        # Build-Konfiguration
tsconfig.json         # TypeScript-Konfiguration
```

---

## ✅ Was sollte funktionieren

- ✅ Formular-Eingabe mit Validierung
- ✅ Live-Validierung (Fehler/Warnungen)
- ✅ Berechnung Lohnsteuer + Sozialversicherung
- ✅ Ergebnisse mit Audit-Trail
- ✅ Jahresvergleich 2025/2026/2027
- ✅ Responsive Design (Desktop + Mobile)

---

## 🔍 Debug-Tipps

Browser Console öffnen (F12) und sehen:
```
✅ LexLohnRechner v1.0 (Phase 4) - VersionManager aktiviert
📦 Available years: [2025, 2026, 2027]
🔗 References registered: 13
```

Bei Berechnung:
```
✅ Berechnung erfolgreich {
  auditId: "audit-xxx",
  brutto: "5000.00",
  netto: "3200.45"
}
```

---

## 📞 Weitere Infos

- **Technische Doku:** `PHASE_5_SUMMARY.md`
- **Entwickler Guide:** `PHASE_5_INTEGRATION_GUIDE.md`
- **Setup & Config:** `PHASE_5_SETUP.md`
- **Benutzerhandbuch:** `BENUTZERHANDBUCH.md`

---

**Viel Erfolg! 🎉**
