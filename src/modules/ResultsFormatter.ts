/**
 * ResultsFormatter-Modul
 * Formatiert Berechnungsergebnisse für UI-Anzeige
 * Berechnet zusätzliche Kennzahlen für Nachvollziehbarkeit
 */

import type { TaxResult } from '../types/index.js'

export interface FormattedResults {
  bruttolohn: {
    wert: number
    formatiert: string
  }

  lohnsteuer: {
    wert: number
    formatiert: string
    prozentsatz: number
    pap_ref: string
  }

  solidarität: {
    wert: number
    formatiert: string
    prozentsatz: number
    pap_ref: string
    hinweis: string
  }

  kirchensteuer: {
    kst8: {
      wert: number
      formatiert: string
      prozentsatz: number
    }
    kst9: {
      wert: number
      formatiert: string
      prozentsatz: number
    }
    pap_ref: string
  }

  sozialversicherung: {
    rv: {
      wert: number
      formatiert: string
      prozentsatz: number
      pap_ref: string
    }
    alv: {
      wert: number
      formatiert: string
      prozentsatz: number
      pap_ref: string
    }
    kv: {
      wert: number
      formatiert: string
      prozentsatz: number
      pap_ref: string
    }
    pv: {
      wert: number
      formatiert: string
      prozentsatz: number
      pap_ref: string
    }
  }

  belastungsquoten: {
    durchschnitt_lst: {
      wert: number
      formatiert: string
      beschreibung: string
    }
    durchschnitt_lst_solz: {
      wert: number
      formatiert: string
      beschreibung: string
    }
    durchschnitt_gesamt: {
      wert: number
      formatiert: string
      beschreibung: string
    }
    grenzbelastung: {
      wert: number | null
      formatiert: string
      beschreibung: string
    }
  }

  zusammenfassung: {
    gesamtabzüge: {
      wert: number
      formatiert: string
    }
    nettolohn: {
      wert: number
      formatiert: string
    }
    belastungsquote: {
      wert: number
      formatiert: string
    }
  }
}

export class ResultsFormatter {
  /**
   * Formatiert Berechnungsergebnisse für UI-Anzeige
   */
  static formatResults(
    bruttolohn: number,
    taxResult: TaxResult,
    svResult: {
      rvBeitrag: number
      alvBeitrag: number
      kvBeitrag: number
      pvBeitrag: number
    }
  ): FormattedResults {
    const brutto = bruttolohn / 100
    const gesamtAbzüge =
      taxResult.lstlzz +
      taxResult.solzlzz +
      svResult.rvBeitrag +
      svResult.alvBeitrag +
      svResult.kvBeitrag +
      svResult.pvBeitrag
    const netto = bruttolohn - gesamtAbzüge

    return {
      bruttolohn: {
        wert: bruttolohn,
        formatiert: this.formatEUR(bruttolohn),
      },

      lohnsteuer: {
        wert: taxResult.lstlzz,
        formatiert: this.formatEUR(taxResult.lstlzz),
        prozentsatz: bruttolohn > 0 ? (taxResult.lstlzz / bruttolohn) * 100 : 0,
        pap_ref: 'PAP S. 12-13, § 32a EStG',
      },

      solidarität: {
        wert: taxResult.solzlzz,
        formatiert: this.formatEUR(taxResult.solzlzz),
        prozentsatz:
          bruttolohn > 0 ? (taxResult.solzlzz / bruttolohn) * 100 : 0,
        pap_ref: 'PAP S. 16, § 5 SolzG (Freigrenze: 20.350 EUR)',
        hinweis:
          taxResult.solzlzz === 0
            ? 'Unter Freigrenze (20.350 EUR)'
            : 'Solidaritätszuschlag fällig',
      },

      kirchensteuer: {
        kst8: {
          wert: taxResult.kist8lzz,
          formatiert: this.formatEUR(taxResult.kist8lzz),
          prozentsatz:
            bruttolohn > 0 ? (taxResult.kist8lzz / bruttolohn) * 100 : 0,
        },
        kst9: {
          wert: taxResult.kist9lzz,
          formatiert: this.formatEUR(taxResult.kist9lzz),
          prozentsatz:
            bruttolohn > 0 ? (taxResult.kist9lzz / bruttolohn) * 100 : 0,
        },
        pap_ref: 'PAP S. 17, § 51a EStG',
      },

      sozialversicherung: {
        rv: {
          wert: svResult.rvBeitrag,
          formatiert: this.formatEUR(svResult.rvBeitrag),
          prozentsatz:
            bruttolohn > 0 ? (svResult.rvBeitrag / bruttolohn) * 100 : 0,
          pap_ref: 'PAP S. 7, § 168 SGB VI (2026: 9,3%)',
        },
        alv: {
          wert: svResult.alvBeitrag,
          formatiert: this.formatEUR(svResult.alvBeitrag),
          prozentsatz:
            bruttolohn > 0 ? (svResult.alvBeitrag / bruttolohn) * 100 : 0,
          pap_ref: 'PAP S. 7, § 341 SGB III (2026: 2,6%)',
        },
        kv: {
          wert: svResult.kvBeitrag,
          formatiert: this.formatEUR(svResult.kvBeitrag),
          prozentsatz:
            bruttolohn > 0 ? (svResult.kvBeitrag / bruttolohn) * 100 : 0,
          pap_ref: 'PAP S. 8, § 242 SGB V (2026: 7,0% + Zusatzbeitrag)',
        },
        pv: {
          wert: svResult.pvBeitrag,
          formatiert: this.formatEUR(svResult.pvBeitrag),
          prozentsatz:
            bruttolohn > 0 ? (svResult.pvBeitrag / bruttolohn) * 100 : 0,
          pap_ref: 'PAP S. 8, § 55 SGB XI (2026: 1,8%)',
        },
      },

      belastungsquoten: {
        durchschnitt_lst: {
          wert:
            bruttolohn > 0 ? (taxResult.lstlzz / bruttolohn) * 100 : 0,
          formatiert:
            bruttolohn > 0
              ? `${((taxResult.lstlzz / bruttolohn) * 100).toFixed(2)}%`
              : '0,00%',
          beschreibung:
            'Durchschnittliche Belastung durch Lohnsteuer (Lohnsteuer / Bruttolohn)',
        },
        durchschnitt_lst_solz: {
          wert:
            bruttolohn > 0
              ? ((taxResult.lstlzz + taxResult.solzlzz) / bruttolohn) * 100
              : 0,
          formatiert:
            bruttolohn > 0
              ? `${(((taxResult.lstlzz + taxResult.solzlzz) / bruttolohn) * 100).toFixed(2)}%`
              : '0,00%',
          beschreibung: 'Belastung durch Lohnsteuer + Solidaritätszuschlag',
        },
        durchschnitt_gesamt: {
          wert:
            bruttolohn > 0 ? (gesamtAbzüge / bruttolohn) * 100 : 0,
          formatiert:
            bruttolohn > 0
              ? `${((gesamtAbzüge / bruttolohn) * 100).toFixed(2)}%`
              : '0,00%',
          beschreibung:
            'Gesamtbelastung (LSt + SZ + KSt + SV / Bruttolohn)',
        },
        grenzbelastung: {
          wert: null,
          formatiert: 'n.a.',
          beschreibung:
            'Grenzbelastung: Zusätzliche Steuer auf 1 EUR mehr Einkommen (wird später berechnet)',
        },
      },

      zusammenfassung: {
        gesamtabzüge: {
          wert: gesamtAbzüge,
          formatiert: this.formatEUR(gesamtAbzüge),
        },
        nettolohn: {
          wert: netto,
          formatiert: this.formatEUR(netto),
        },
        belastungsquote: {
          wert:
            bruttolohn > 0 ? (gesamtAbzüge / bruttolohn) * 100 : 0,
          formatiert:
            bruttolohn > 0
              ? `${((gesamtAbzüge / bruttolohn) * 100).toFixed(2)}%`
              : '0,00%',
        },
      },
    }
  }

  /**
   * Formatiert EUR-Betrag für Anzeige
   */
  static formatEUR(cent: number): string {
    const eur = cent / 100
    return eur.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  /**
   * Gibt eine lesbare Zusammenfassung aus
   */
  static getSummaryText(results: FormattedResults): string {
    return `
Bruttolohn:         ${results.bruttolohn.formatiert}

Steuern:
  Lohnsteuer:       ${results.lohnsteuer.formatiert} (${results.lohnsteuer.prozentsatz.toFixed(2)}%)
  Solidaritätszuschlag: ${results.solidarität.formatiert} (${results.solidarität.prozentsatz.toFixed(2)}%)
  Kirchensteuer 8%: ${results.kirchensteuer.kst8.formatiert} (${results.kirchensteuer.kst8.prozentsatz.toFixed(2)}%)

Sozialversicherung:
  Rentenversicherung:    ${results.sozialversicherung.rv.formatiert} (${results.sozialversicherung.rv.prozentsatz.toFixed(2)}%)
  Arbeitslosenversicherung: ${results.sozialversicherung.alv.formatiert} (${results.sozialversicherung.alv.prozentsatz.toFixed(2)}%)
  Krankenversicherung:   ${results.sozialversicherung.kv.formatiert} (${results.sozialversicherung.kv.prozentsatz.toFixed(2)}%)
  Pflegeversicherung:    ${results.sozialversicherung.pv.formatiert} (${results.sozialversicherung.pv.prozentsatz.toFixed(2)}%)

Gesamtabzüge:       ${results.zusammenfassung.gesamtabzüge.formatiert}
Nettolohn:          ${results.zusammenfassung.nettolohn.formatiert}

Belastungsquote:    ${results.zusammenfassung.belastungsquote.formatiert}
    `
  }

  /**
   * Gibt HTML für Belastungsquoten aus
   */
  static getChartHTML(results: FormattedResults): string {
    const durchschnitt = results.belastungsquoten.durchschnitt_gesamt.wert

    // Einfaches ASCII-Chart
    const barLength = Math.round(durchschnitt / 2) // Skaliert auf 0-50
    const bar = '█'.repeat(Math.min(barLength, 50))

    return `
<div class="chart">
  <div class="chart-bar">
    <div class="bar" style="width: ${Math.min(durchschnitt, 100)}%"></div>
  </div>
  <p>Gesamtbelastung: ${results.belastungsquoten.durchschnitt_gesamt.formatiert}</p>
</div>
    `
  }
}
