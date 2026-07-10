/**
 * Wiederverwendbare Aufschlüsselungs-Mechanik (Geschäftsregel 2):
 * Toggle "Aufschlüsseln" wandelt eine aggregierte Menge in eine Tabelle mit
 * Zeilen (Kategorie, Anzahl, optional Fläche) um. Zeilen sind hinzufügbar
 * (freier Kategoriename), löschbar; Summen aktualisieren sich live.
 * Verwendet für Wohnungen, Garagen/Stellplätze (Schritt 2) – strukturell
 * identisch nutzbar für Ertragskategorien (Schritt 3).
 */

import type { AufschluesselungsState } from '../types'
import { formatGanzzahl, neueId } from '../utils/format'
import { IconPapierkorb, IconPlusKreis } from './icons'
import { Toggle, ZahlenInput } from './ui'

export function Aufschluesselung({
  titel,
  state,
  onChange,
  mitFlaeche,
  einheitLabel = 'Einheiten',
  kategorieVorschlaege = [],
  aggregatLabel,
}: {
  titel: string
  state: AufschluesselungsState
  onChange: (neu: AufschluesselungsState) => void
  /** Fläche-Spalte anzeigen (Wohnungen ja, Garagen/Stellplätze nein) */
  mitFlaeche: boolean
  einheitLabel?: string
  kategorieVorschlaege?: string[]
  /** Label der aggregierten Anzeige, z. B. "Wohneinheiten" */
  aggregatLabel: string
}) {
  const summeAnzahl = state.positionen.reduce((s, p) => s + p.anzahl, 0)
  const summeFlaeche = state.positionen.reduce((s, p) => s + (p.flaeche ?? 0), 0)

  return (
    <div className="aufschluesselung">
      <div className="aufschluesselung__kopf">
        <h3>{titel}</h3>
        <div className="aufschluesselung__kopf-rechts">
          <Toggle
            checked={state.aufgeschluesselt}
            onChange={(v) => onChange({ ...state, aufgeschluesselt: v })}
            label="Aufschlüsseln"
          />
          <button
            type="button"
            className="link-btn"
            disabled={!state.aufgeschluesselt}
            onClick={() =>
              onChange({
                ...state,
                positionen: [
                  ...state.positionen,
                  { id: neueId('kat'), bezeichnung: '', anzahl: 1, flaeche: mitFlaeche ? 0 : null },
                ],
              })
            }
          >
            <IconPlusKreis size={15} /> Kategorie hinzufügen
          </button>
        </div>
      </div>

      {!state.aufgeschluesselt ? (
        <div className="aufschluesselung__aggregat">
          <span className="aufschluesselung__aggregat-wert">
            {formatGanzzahl(summeAnzahl)} {aggregatLabel}
          </span>
          {mitFlaeche && (
            <span className="aufschluesselung__aggregat-wert">{formatGanzzahl(summeFlaeche)} m² Nutzfläche</span>
          )}
        </div>
      ) : (
        <div className="aufschluesselung__tabelle">
          <div className={`aufschluesselung__zeile aufschluesselung__zeile--kopf${mitFlaeche ? '' : ' aufschluesselung__zeile--ohne-flaeche'}`}>
            <span>Kategorie</span>
            <span>Anzahl</span>
            {mitFlaeche && <span>Nutzfläche</span>}
            <span />
          </div>
          {state.positionen.map((p) => (
            <div key={p.id} className={`aufschluesselung__zeile${mitFlaeche ? '' : ' aufschluesselung__zeile--ohne-flaeche'}`}>
              <span className="aufschluesselung__kategorie">
                <select
                  value={p.bezeichnung}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      positionen: state.positionen.map((x) =>
                        x.id === p.id ? { ...x, bezeichnung: e.target.value } : x,
                      ),
                    })
                  }
                >
                  {p.bezeichnung === '' && <option value="">Kategorie wählen …</option>}
                  {kategorieVorschlaege.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                  {p.bezeichnung !== '' && !kategorieVorschlaege.includes(p.bezeichnung) && (
                    <option value={p.bezeichnung}>{p.bezeichnung}</option>
                  )}
                </select>
              </span>
              <ZahlenInput
                wert={p.anzahl}
                nachkommastellen={0}
                ariaLabel={`Anzahl ${p.bezeichnung || 'neue Kategorie'}`}
                onWert={(v) =>
                  onChange({
                    ...state,
                    positionen: state.positionen.map((x) => (x.id === p.id ? { ...x, anzahl: v } : x)),
                  })
                }
              />
              {mitFlaeche && (
                <ZahlenInput
                  wert={p.flaeche ?? 0}
                  nachkommastellen={0}
                  einheit="m²"
                  ariaLabel={`Nutzfläche ${p.bezeichnung || 'neue Kategorie'}`}
                  onWert={(v) =>
                    onChange({
                      ...state,
                      positionen: state.positionen.map((x) => (x.id === p.id ? { ...x, flaeche: v } : x)),
                    })
                  }
                />
              )}
              <button
                type="button"
                className="icon-btn"
                aria-label={`Kategorie ${p.bezeichnung || ''} löschen`}
                onClick={() =>
                  onChange({ ...state, positionen: state.positionen.filter((x) => x.id !== p.id) })
                }
              >
                <IconPapierkorb size={16} />
              </button>
            </div>
          ))}
          <div className={`aufschluesselung__zeile aufschluesselung__zeile--summe${mitFlaeche ? '' : ' aufschluesselung__zeile--ohne-flaeche'}`}>
            <span>Insgesamt</span>
            <span className="aufschluesselung__summe-wert">{formatGanzzahl(summeAnzahl)}</span>
            {mitFlaeche && <span className="aufschluesselung__summe-wert">{formatGanzzahl(summeFlaeche)} m²</span>}
            <span />
          </div>
        </div>
      )}
    </div>
  )
}
