/**
 * Schritt 4 – Finanzierung (Folien 23–25): EK/FK-Split mit Schieberegler,
 * Annuitätendarlehen mit Zinsbindungsphasen, Förderdarlehen-Toggle.
 */

import type { Darlehen, Projekt, SzenarioDaten } from '../types'
import { berechnung } from '../calc/berechnung'
import { Feld, useFeldKontext } from '../components/felder'
import { IconFrage, IconInfo, IconPapierkorb, IconPlus } from '../components/icons'
import { InfoTip, Toggle, ZahlenInput } from '../components/ui'
import { useApp, useStore } from '../state/store'
import { formatEuro, formatZahl, neueId } from '../utils/format'

export function Schritt4Finanzierung({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const kontext = useFeldKontext()
  const daten = app.szenarioDaten[kontext.szenarioId]
  if (!daten || !daten.objektdaten || !daten.ertraegeAufwendungen || !daten.finanzierung) return null
  const fin = daten.finanzierung

  const aendere = (fn: (daten: SzenarioDaten) => void) => store.aendereSzenarioDaten(kontext.szenarioId, fn)

  const investitionssumme = berechnung.investitionssumme(daten.objektdaten)
  const ekBetrag = (investitionssumme * fin.eigenkapitalProzent) / 100
  const fkBetrag = investitionssumme - ekBetrag

  const setzeEkProzent = (prozent: number) =>
    aendere((sd) => (sd.finanzierung.eigenkapitalProzent = Math.min(100, Math.max(0, prozent))))

  // ANNAHME (Spez. Abschnitt 8): Auch das erste Darlehen ist löschbar, sofern
  // mindestens eine Finanzierungsquelle bestehen bleibt (EK > 0 oder weiteres Darlehen).
  const darfLoeschen = (d: Darlehen) => fin.darlehen.length > 1 || fin.eigenkapitalProzent > 0

  return (
    <div className="schritt">
      <h1>Finanzierung</h1>

      <div className="fin-kopf" id="feld-finanzierung.eigenkapital">
        <div className="fin-kopf__summe">
          <span className="feld__label">Investitionssumme</span>
          <strong>
            {formatEuro(investitionssumme, 0)}{' '}
            <InfoTip
              kind={<IconInfo size={14} className="infotip__icon" />}
              breite={260}
              inhalt={<span>Stub-Summe aus den Investitionsfeldern in Schritt 2 (Objektdaten).</span>}
            />
          </strong>
        </div>
        <Feld feldKey="finanzierung.eigenkapital" label="Eigenkapital">
          <ZahlenInput
            wert={Math.round(ekBetrag)}
            nachkommastellen={0}
            einheit="€"
            onWert={(v) => investitionssumme > 0 && setzeEkProzent((v / investitionssumme) * 100)}
          />
        </Feld>
        <Feld feldKey="finanzierung.fremdkapital" label="Fremdkapital">
          <ZahlenInput
            wert={Math.round(fkBetrag)}
            nachkommastellen={0}
            einheit="€"
            onWert={(v) => investitionssumme > 0 && setzeEkProzent(100 - (v / investitionssumme) * 100)}
          />
        </Feld>
      </div>
      <div className="fin-slider">
        <span>{formatZahl(fin.eigenkapitalProzent, 0)}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={fin.eigenkapitalProzent}
          aria-label="Eigenkapital-Anteil in Prozent"
          onChange={(e) => setzeEkProzent(Number(e.target.value))}
        />
        <span>{formatZahl(100 - fin.eigenkapitalProzent, 0)}%</span>
      </div>

      {fin.darlehen.map((darlehen, index) => (
        <DarlehenBlock
          key={darlehen.id}
          darlehen={darlehen}
          index={index}
          loeschbar={darfLoeschen(darlehen)}
          aendere={aendere}
        />
      ))}

      <button
        type="button"
        className="btn btn--sekundaer"
        onClick={() =>
          aendere((sd) =>
            sd.finanzierung.darlehen.push({
              id: neueId('dar'),
              typ: 'Annuitaet',
              nominalbetrag: 0,
              tilgungsfreieAnlaufjahre: 0,
              bearbeitungsentgeltProzent: 0,
              zinsbindungsphasen: [
                { id: neueId('zbp'), reihenfolge: 1, zinsbindungJahre: 0, zinssatzProzent: 0, tilgungssatzProzent: 0 },
              ],
              foerderdarlehen: null,
            }),
          )
        }
      >
        <IconPlus size={15} /> Darlehen hinzufügen
      </button>
    </div>
  )
}

function DarlehenBlock({
  darlehen,
  index,
  loeschbar,
  aendere,
}: {
  darlehen: Darlehen
  index: number
  loeschbar: boolean
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  const aendereDarlehen = (fn: (d: Darlehen) => void) =>
    aendere((sd) => {
      const ziel = sd.finanzierung.darlehen.find((x) => x.id === darlehen.id)
      if (ziel) fn(ziel)
    })

  return (
    <section className="darlehen">
      <div className="darlehen__kopf">
        <h2>Annuitätendarlehen {index + 1}</h2>
        <button
          type="button"
          className="icon-btn"
          disabled={!loeschbar}
          title={
            loeschbar
              ? `Annuitätendarlehen ${index + 1} löschen`
              : 'Mindestens eine Finanzierungsquelle muss bestehen bleiben'
          }
          aria-label={`Annuitätendarlehen ${index + 1} löschen`}
          onClick={() =>
            aendere((sd) => {
              sd.finanzierung.darlehen = sd.finanzierung.darlehen.filter((x) => x.id !== darlehen.id)
            })
          }
        >
          <IconPapierkorb size={17} />
        </button>
      </div>

      <div className="darlehen__raster">
        <div className="darlehen__grunddaten">
          <p className="darlehen__untertitel">
            Grundlegende Kreditdaten <IconFrage size={14} />
          </p>
          <Feld feldKey={`darlehen.${darlehen.id}.nominalbetrag`} label="Nominalbetrag" klasse="feld--breit">
            <ZahlenInput
              wert={darlehen.nominalbetrag}
              nachkommastellen={0}
              einheit="€"
              onWert={(v) => aendereDarlehen((d) => (d.nominalbetrag = v))}
            />
          </Feld>
          <Feld feldKey={`darlehen.${darlehen.id}.anlaufjahre`} label="Tilgungsfreie Anlaufjahre" klasse="feld--breit">
            <ZahlenInput
              wert={darlehen.tilgungsfreieAnlaufjahre}
              nachkommastellen={0}
              einheit="Jahre"
              onWert={(v) => aendereDarlehen((d) => (d.tilgungsfreieAnlaufjahre = v))}
            />
          </Feld>
          <Feld feldKey={`darlehen.${darlehen.id}.entgelt`} label="Bearbeitungsentgelt/Disagio" klasse="feld--breit">
            <ZahlenInput
              wert={darlehen.bearbeitungsentgeltProzent}
              nachkommastellen={0}
              einheit="%"
              onWert={(v) => aendereDarlehen((d) => (d.bearbeitungsentgeltProzent = v))}
            />
          </Feld>
        </div>

        {darlehen.zinsbindungsphasen.map((phase, phasenIndex) => (
          <div key={phase.id} className="darlehen__phase">
            <p className="darlehen__untertitel">
              <span className="darlehen__phase-nr">{phase.reihenfolge}</span> Zinsbindungphase {phase.reihenfolge}{' '}
              <IconFrage size={14} />
              {phasenIndex > 0 && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Zinsbindungsphase ${phase.reihenfolge} entfernen`}
                  onClick={() =>
                    aendereDarlehen((d) => {
                      d.zinsbindungsphasen = d.zinsbindungsphasen
                        .filter((x) => x.id !== phase.id)
                        .map((x, i) => ({ ...x, reihenfolge: i + 1 }))
                    })
                  }
                >
                  <IconPapierkorb size={14} />
                </button>
              )}
            </p>
            <Feld feldKey={`darlehen.${darlehen.id}.phase${phase.reihenfolge}.zinsbindung`} label="Zinsbindung" klasse="feld--breit">
              <ZahlenInput
                wert={phase.zinsbindungJahre}
                nachkommastellen={0}
                einheit="Jahre"
                onWert={(v) =>
                  aendereDarlehen((d) => {
                    const z = d.zinsbindungsphasen.find((x) => x.id === phase.id)
                    if (z) z.zinsbindungJahre = v
                  })
                }
              />
            </Feld>
            <Feld
              feldKey={`darlehen.${darlehen.id}.phase${phase.reihenfolge}.zinssatz`}
              label={`Zinssatz in Zinsbindungsphase ${phase.reihenfolge}`}
              klasse="feld--breit"
            >
              <ZahlenInput
                wert={phase.zinssatzProzent}
                einheit="%"
                onWert={(v) =>
                  aendereDarlehen((d) => {
                    const z = d.zinsbindungsphasen.find((x) => x.id === phase.id)
                    if (z) z.zinssatzProzent = v
                  })
                }
              />
            </Feld>
            <Feld
              feldKey={`darlehen.${darlehen.id}.phase${phase.reihenfolge}.tilgung`}
              label={`Tilgungssatz in Zinsbindungsphase ${phase.reihenfolge}`}
              klasse="feld--breit"
            >
              <ZahlenInput
                wert={phase.tilgungssatzProzent}
                einheit="%"
                onWert={(v) =>
                  aendereDarlehen((d) => {
                    const z = d.zinsbindungsphasen.find((x) => x.id === phase.id)
                    if (z) z.tilgungssatzProzent = v
                  })
                }
              />
            </Feld>
          </div>
        ))}

        <button
          type="button"
          className="darlehen__phase-hinzufuegen"
          aria-label="Weitere Zinsbindungsphase hinzufügen"
          onClick={() =>
            aendereDarlehen((d) =>
              d.zinsbindungsphasen.push({
                id: neueId('zbp'),
                reihenfolge: d.zinsbindungsphasen.length + 1,
                zinsbindungJahre: 0,
                zinssatzProzent: 0,
                tilgungssatzProzent: 0,
              }),
            )
          }
        >
          <IconPlus size={20} />
        </button>
      </div>

      <div className="darlehen__foerder-toggle">
        <span>Förderdarlehen</span>
        <Toggle
          checked={darlehen.foerderdarlehen !== null}
          onChange={(v) =>
            aendereDarlehen((d) => {
              d.foerderdarlehen = v
                ? {
                    bezugsgroesse: 'Nominalbetrag',
                    tilgungsnachlassProzent: 5,
                    verrechnungMitDarlehenImJahr: 1,
                    verrechnungMitHerstellungskosten: 'Nein',
                  }
                : null
            })
          }
        />
      </div>

      {darlehen.foerderdarlehen && (
        <div className="darlehen__foerder">
          <div className="darlehen__foerder-spalte">
            <Feld feldKey={`darlehen.${darlehen.id}.bezugsgroesse`} label="Bezugsgröße" klasse="feld--breit">
              <select
                className="select-input"
                value={darlehen.foerderdarlehen.bezugsgroesse}
                onChange={(e) =>
                  aendereDarlehen((d) => {
                    if (d.foerderdarlehen) d.foerderdarlehen.bezugsgroesse = e.target.value
                  })
                }
              >
                {/* ANNAHME: Auswahlwerte nicht in der Klickstrecke dokumentiert */}
                <option>Nominalbetrag</option>
                <option>Herstellungskosten</option>
                <option>Restschuld</option>
              </select>
            </Feld>
            <Feld feldKey={`darlehen.${darlehen.id}.tilgungsnachlass`} label="Tilgungsnachlass" klasse="feld--breit">
              <ZahlenInput
                wert={darlehen.foerderdarlehen.tilgungsnachlassProzent}
                nachkommastellen={0}
                einheit="%"
                onWert={(v) =>
                  aendereDarlehen((d) => {
                    if (d.foerderdarlehen) d.foerderdarlehen.tilgungsnachlassProzent = v
                  })
                }
              />
            </Feld>
          </div>
          <div className="darlehen__foerder-spalte">
            <Feld feldKey={`darlehen.${darlehen.id}.verrechnungJahr`} label="Verrechnung mit Darlehen im Jahr" klasse="feld--breit">
              <ZahlenInput
                wert={darlehen.foerderdarlehen.verrechnungMitDarlehenImJahr}
                nachkommastellen={0}
                onWert={(v) =>
                  aendereDarlehen((d) => {
                    if (d.foerderdarlehen) d.foerderdarlehen.verrechnungMitDarlehenImJahr = v
                  })
                }
              />
            </Feld>
            <Feld
              feldKey={`darlehen.${darlehen.id}.verrechnungHk`}
              label="Verrechnung mit Herstellungskosten"
              klasse="feld--breit"
            >
              <select
                className="select-input"
                value={darlehen.foerderdarlehen.verrechnungMitHerstellungskosten}
                onChange={(e) =>
                  aendereDarlehen((d) => {
                    if (d.foerderdarlehen) d.foerderdarlehen.verrechnungMitHerstellungskosten = e.target.value
                  })
                }
              >
                <option>Ja</option>
                <option>Nein</option>
                <option>Anteilig</option>
              </select>
            </Feld>
          </div>
        </div>
      )}
    </section>
  )
}
