/**
 * Schritt 3 – Erträge und Aufwendungen (Folien 21–22): zweispaltig,
 * Kopfzeilen mit Stub-Summen, auf-/zuklappbare Kategorien, Aufschlüsselungs-
 * Mechanik für Ertragskategorien, Instandhaltungs-Staffelung.
 */

import { useEffect, useState } from 'react'
import type { ErtragsPosition, Projekt, SzenarioDaten } from '../types'
import { berechnung } from '../calc/berechnung'
import { Feld, useFeldKontext } from '../components/felder'
import { IconInfo, IconPapierkorb, IconPlusKreis, IconRegler } from '../components/icons'
import { InfoTip, Klappbereich, Toggle, ZahlenInput } from '../components/ui'
import { useApp, useStore } from '../state/store'
import { formatEuroSigniert, neueId } from '../utils/format'

export function Schritt3Ertraege({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const kontext = useFeldKontext()
  const daten = app.szenarioDaten[kontext.szenarioId]
  // Steuerung des äußeren "Sollmieten"-Klappbereichs: Header (Toggle,
  // "Kategorie hinzufügen") bleibt immer sichtbar; der Pfeil neben
  // "Sollmieten" klappt ausschließlich die Liste der Unterkategorien
  // gemeinsam auf/zu.
  const [sammelSollmietenOffen, setSammelSollmietenOffen] = useState(true)
  if (!daten || !daten.objektdaten || !daten.ertraegeAufwendungen || !daten.finanzierung) return null
  const jahre = projekt.betrachtungszeitraumJahre

  const aendere = (fn: (daten: SzenarioDaten) => void) => store.aendereSzenarioDaten(kontext.szenarioId, fn)

  const ertraege = berechnung.ertraegeGesamt(daten, jahre)
  const aufwendungen = berechnung.aufwendungenGesamt(daten, jahre)
  const instandhaltung = berechnung.aufwandsSummeInstandhaltung(daten, jahre)
  const verwaltung = berechnung.aufwandsSummeVerwaltung(daten, jahre)

  return (
    <div className="schritt schritt--voll">
      <div className="ea">
        {/* ---------------- Erträge (links) ---------------- */}
        <div className="ea__spalte">
          <header className="ea__kopf ea__kopf--ertraege">
            <div>
              <h2>Erträge</h2>
              <small>{daten.ertraegeAufwendungen.sollmieten.length} Kategorien</small>
            </div>
            <div className="ea__kopf-summen">
              <span>
                Im ersten Jahr der Planung <strong className="betrag--pos">{formatEuroSigniert(ertraege.erstesJahr)}</strong>
              </span>
              <span>
                Gesamter Betrachtungszeitraum{' '}
                <strong className="betrag--pos">{formatEuroSigniert(ertraege.gesamterZeitraum, 2)}</strong>
              </span>
            </div>
          </header>

          <section className="klappbereich">
            <div className="klappbereich__kopf">
              <button
                type="button"
                className="klappbereich__titel klappbereich__titel--btn"
                onClick={() => setSammelSollmietenOffen((v) => !v)}
                aria-expanded={sammelSollmietenOffen}
              >
                <span>Sollmieten</span>
                <span
                  className={`klappbereich__chevron${sammelSollmietenOffen ? '' : ' klappbereich__chevron--zu'}`}
                  aria-hidden="true"
                >
                  ⌃
                </span>
              </button>
              <div className="klappbereich__rechts">
                <div className="ea__sektion-rechts">
                  <button
                    type="button"
                    className="link-btn"
                    disabled={!daten.ertraegeAufwendungen.sollmietenAufgeschluesselt}
                    onClick={() =>
                      aendere((sd) => {
                        const anzahl = sd.ertraegeAufwendungen.sollmieten.length + 1
                        sd.ertraegeAufwendungen.sollmieten.push(neueKategorie(anzahl))
                      })
                    }
                  >
                    <IconPlusKreis size={15} /> Kategorie hinzufügen
                  </button>
                  <span className="ea__aufschluesseln-label">Aufschlüsseln</span>
                  <Toggle
                    checked={daten.ertraegeAufwendungen.sollmietenAufgeschluesselt}
                    onChange={(v) =>
                      aendere((sd) => (sd.ertraegeAufwendungen.sollmietenAufgeschluesselt = v))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="klappbereich__inhalt">
              {daten.ertraegeAufwendungen.sollmietenAufgeschluesselt ? (
                daten.ertraegeAufwendungen.sollmieten.map((pos, index) => (
                  <SollmietenBlock
                    key={pos.id}
                    pos={pos}
                    index={index}
                    jahre={jahre}
                    aendere={aendere}
                    offen={sammelSollmietenOffen}
                  />
                ))
              ) : (
                <SollmietenAggregat daten={daten} jahre={jahre} aendere={aendere} />
              )}
            </div>
          </section>
        </div>

        {/* ---------------- Aufwendungen (rechts) ---------------- */}
        <div className="ea__spalte">
          <header className="ea__kopf ea__kopf--aufwendungen">
            <div>
              <h2>Aufwendungen</h2>
              <small>2 Kategorien</small>
            </div>
            <div className="ea__kopf-summen">
              <span>
                Im ersten Jahr der Planung <strong className="betrag--neg">{formatEuroSigniert(aufwendungen.erstesJahr)}</strong>
              </span>
              <span>
                Gesamter Betrachtungszeitraum{' '}
                <strong className="betrag--neg">{formatEuroSigniert(aufwendungen.gesamterZeitraum, 2)}</strong>
              </span>
            </div>
          </header>

          <Klappbereich titel="Instandhaltung">
            <div className="instandhaltung__modus">
              <span className={daten.ertraegeAufwendungen.instandhaltung.modus === 'staffel' ? 'modus--aktiv' : ''}>
                Staffelung nach Jahren
              </span>
              <Toggle
                checked={daten.ertraegeAufwendungen.instandhaltung.modus === 'linear'}
                onChange={(v) => aendere((sd) => (sd.ertraegeAufwendungen.instandhaltung.modus = v ? 'linear' : 'staffel'))}
              />
              <span className={daten.ertraegeAufwendungen.instandhaltung.modus === 'linear' ? 'modus--aktiv' : ''}>
                Linear
              </span>
            </div>

            {daten.ertraegeAufwendungen.instandhaltung.modus === 'staffel' ? (
              <div className="staffel">
                <StaffelFeld label="1-5" feld="von1bis5" daten={daten} aendere={aendere} />
                <StaffelFeld label="6-10" feld="von6bis10" daten={daten} aendere={aendere} />
                <StaffelFeld label="11-15" feld="von11bis15" daten={daten} aendere={aendere} />
                <StaffelFeld label="16-20" feld="von16bis20" daten={daten} aendere={aendere} />
                <StaffelFeld label="20>" feld="ab20" daten={daten} aendere={aendere} />
              </div>
            ) : (
              // ANNAHME: "Linear" = ein konstanter Satz über den gesamten Zeitraum.
              <Feld feldKey="instandhaltung.linear" label="Instandhaltung je m² (linear)" klasse="feld--breit">
                <ZahlenInput
                  wert={daten.ertraegeAufwendungen.instandhaltung.linearEurM2}
                  einheit="€/m²"
                  onWert={(v) => aendere((sd) => (sd.ertraegeAufwendungen.instandhaltung.linearEurM2 = v))}
                />
              </Feld>
            )}

            <BlockFuss
              betragErstesJahr={instandhaltung.erstesJahr}
              betragGesamt={instandhaltung.gesamterZeitraum}
              negativ
            />
          </Klappbereich>

          <Klappbereich titel="Verwaltungskosten">
            <Feld feldKey="verwaltungskosten" label="Betrag je Einheit" klasse="feld--breit">
              <ZahlenInput
                wert={daten.ertraegeAufwendungen.verwaltungskostenJeEinheit}
                einheit="€"
                onWert={(v) => aendere((sd) => (sd.ertraegeAufwendungen.verwaltungskostenJeEinheit = v))}
              />
            </Feld>
            <BlockFuss betragErstesJahr={verwaltung.erstesJahr} betragGesamt={verwaltung.gesamterZeitraum} negativ />
          </Klappbereich>
        </div>
      </div>
    </div>
  )
}

function neueKategorie(nr: number): ErtragsPosition {
  return {
    id: neueId('ep'),
    titel: `Sollmieten ${nr}: Neue Kategorie`,
    satz: 0,
    satzEinheit: '€/m²',
    mietausfallProzent: 0,
    steigerung: 0,
    steigerungEinheit: '€/m²',
    turnusJahre: 1,
    loeschbar: true,
  }
}

/**
 * Aggregierte "Sammelkategorie"-Ansicht der Sollmieten (Toggle "Aufschlüsseln" AUS).
 * Zeigt ein zusammengefasstes Bild ohne die Detailkategorien; die zugrundeliegenden
 * Positionen bleiben unverändert im State, so dass beim erneuten Aufschlüsseln
 * alle Eingaben wieder vorhanden sind.
 */
function SollmietenAggregat({
  daten,
  jahre,
  aendere,
}: {
  daten: SzenarioDaten
  jahre: number
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  const positionen = daten.ertraegeAufwendungen.sollmieten
  // Repräsentativer Satz: gewichteter Mittelwert; bei nur einer Kategorie einfach deren Satz.
  // ANNAHME: Wenn der Anwender im aggregierten Modus den Satz ändert, wird die
  // Differenz gleichmäßig auf alle vorhandenen Kategorien mit gleicher Einheit verteilt.
  const gleicherEinheit = positionen.filter((p) => p.satzEinheit === '€/m²')
  const summeAlt = gleicherEinheit.reduce((s, p) => s + p.satz, 0)
  const durchschnitt =
    gleicherEinheit.length > 0 ? summeAlt / gleicherEinheit.length : positionen[0]?.satz ?? 0

  const mietausfall = positionen.find((p) => p.mietausfallProzent !== null)?.mietausfallProzent ?? 0
  const steigerung = positionen[0]?.steigerung ?? 0
  const steigerungEinheit = positionen[0]?.steigerungEinheit ?? '€/m²'
  const turnus = positionen[0]?.turnusJahre ?? 1

  const ertraege = berechnung.ertraegeGesamt(daten, jahre)

  return (
    <>
      <div className="feld-raster">
        <Feld feldKey="sollmieten.aggregat.satz" label="Monatliche Sollmieten">
          <ZahlenInput
            wert={durchschnitt}
            einheit="€/m²"
            onWert={(v) =>
              aendere((sd) => {
                // Alle Kategorien mit €/m²-Einheit auf denselben neuen Wert setzen.
                sd.ertraegeAufwendungen.sollmieten.forEach((p) => {
                  if (p.satzEinheit === '€/m²') p.satz = v
                })
              })
            }
          />
        </Feld>
        <Feld feldKey="sollmieten.aggregat.mietausfall" label="Mietausfall p.a. (in % der Sollmiete)">
          <ZahlenInput
            wert={mietausfall}
            nachkommastellen={0}
            einheit="%"
            onWert={(v) =>
              aendere((sd) => {
                sd.ertraegeAufwendungen.sollmieten.forEach((p) => {
                  if (p.mietausfallProzent !== null) p.mietausfallProzent = v
                })
              })
            }
          />
        </Feld>
      </div>
      <p className="ea__zwischentitel">Mietsteigerung</p>
      <div className="feld-raster">
        <Feld feldKey="sollmieten.aggregat.steigerung" label="Mietsteigerung p.a.">
          <ZahlenInput
            wert={steigerung}
            nachkommastellen={steigerungEinheit === '%' ? 0 : 2}
            einheit={steigerungEinheit}
            onWert={(v) =>
              aendere((sd) => {
                sd.ertraegeAufwendungen.sollmieten.forEach((p) => (p.steigerung = v))
              })
            }
          />
        </Feld>
        <Feld feldKey="sollmieten.aggregat.turnus" label="Turnus">
          <span className="feld__mit-icon">
            <ZahlenInput
              wert={turnus}
              nachkommastellen={0}
              einheit="Jahre"
              onWert={(v) =>
                aendere((sd) => {
                  sd.ertraegeAufwendungen.sollmieten.forEach((p) => (p.turnusJahre = v))
                })
              }
            />
            <IconRegler size={15} className="feld__deko-icon" />
          </span>
        </Feld>
      </div>
      <BlockFuss betragErstesJahr={ertraege.erstesJahr} betragGesamt={ertraege.gesamterZeitraum} />
    </>
  )
}

function SollmietenBlock({
  pos,
  index,
  jahre,
  aendere,
  offen: offenExtern,
}: {
  pos: ErtragsPosition
  index: number
  jahre: number
  aendere: (fn: (daten: SzenarioDaten) => void) => void
  /** Externer Öffnen-Signal: kommt vom Sammel-Klappbereich "Sollmieten". */
  offen: boolean
}) {
  // Interner Zustand, wird bei Änderung des externen Signals nachgeführt.
  // So kann der Anwender einzelne Kategorien lokal weiter auf-/zuklappen,
  // ohne den Sammel-Zustand zu verlieren.
  const [offen, setOffen] = useState(offenExtern)
  useEffect(() => setOffen(offenExtern), [offenExtern])

  const summe = berechnung.ertragsSummeJeKategorie(pos.satz, index, jahre)
  const aenderePos = (fn: (p: ErtragsPosition) => void) =>
    aendere((sd) => {
      const ziel = sd.ertraegeAufwendungen.sollmieten.find((x) => x.id === pos.id)
      if (ziel) fn(ziel)
    })

  return (
    <Klappbereich
      offen={offen}
      onOffen={setOffen}
      titel={
        pos.loeschbar ? (
          <input
            type="text"
            className="ea__block-titel-input"
            value={pos.titel}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => aenderePos((p) => (p.titel = e.target.value))}
          />
        ) : (
          pos.titel
        )
      }
      ueberschriftKlasse="ea__block-titel"
      rechts={
        pos.loeschbar ? (
          <button
            type="button"
            className="icon-btn"
            aria-label={`${pos.titel} löschen`}
            onClick={() =>
              aendere((sd) => {
                sd.ertraegeAufwendungen.sollmieten = sd.ertraegeAufwendungen.sollmieten.filter((x) => x.id !== pos.id)
              })
            }
          >
            <IconPapierkorb size={16} />
          </button>
        ) : undefined
      }
    >
      <div className="feld-raster">
        <Feld
          feldKey={`sollmieten.${pos.id}.satz`}
          label={pos.satzEinheit === '€/m²' ? 'Monatliche Sollmieten' : 'Monatliche Sollmieten pro Stellplatz/Garage'}
        >
          <ZahlenInput wert={pos.satz} einheit={pos.satzEinheit} onWert={(v) => aenderePos((p) => (p.satz = v))} />
        </Feld>
        {pos.mietausfallProzent !== null && (
          <Feld feldKey={`sollmieten.${pos.id}.mietausfall`} label="Mietausfall p.a. (in % der Sollmiete)">
            <ZahlenInput
              wert={pos.mietausfallProzent}
              nachkommastellen={0}
              einheit="%"
              onWert={(v) => aenderePos((p) => (p.mietausfallProzent = v))}
            />
          </Feld>
        )}
      </div>
      <p className="ea__zwischentitel">Mietsteigerung</p>
      <div className="feld-raster">
        <Feld feldKey={`sollmieten.${pos.id}.steigerung`} label="Mietsteigerung p.a.">
          <ZahlenInput
            wert={pos.steigerung}
            nachkommastellen={pos.steigerungEinheit === '%' ? 0 : 2}
            einheit={pos.steigerungEinheit}
            onWert={(v) => aenderePos((p) => (p.steigerung = v))}
          />
        </Feld>
        <Feld feldKey={`sollmieten.${pos.id}.turnus`} label="Turnus">
          <span className="feld__mit-icon">
            <ZahlenInput
              wert={pos.turnusJahre}
              nachkommastellen={0}
              einheit="Jahre"
              onWert={(v) => aenderePos((p) => (p.turnusJahre = v))}
            />
            <IconRegler size={15} className="feld__deko-icon" />
          </span>
        </Feld>
      </div>
      <BlockFuss betragErstesJahr={summe.erstesJahr} betragGesamt={summe.gesamterZeitraum} />
    </Klappbereich>
  )
}

/** "Detailplanung"-Button (ohne Funktion) + Stub-Summen des Blocks */
function BlockFuss({
  betragErstesJahr,
  betragGesamt,
  negativ,
}: {
  betragErstesJahr: number
  betragGesamt: number
  negativ?: boolean
}) {
  return (
    <div className="ea__block-fuss">
      <button type="button" className="btn btn--klein" title="Ohne Funktion in dieser Ausbaustufe">
        <IconRegler size={14} /> Detailplanung
      </button>
      <span className="ea__block-summen">
        <strong className={negativ ? 'betrag--neg' : 'betrag--pos'}>
          {formatEuroSigniert(betragErstesJahr)}{' '}
          <InfoTip
            kind={<IconInfo size={13} className="infotip__icon" />}
            breite={230}
            inhalt={<span>Platzhalterwert (Stub) – erste Planungsjahr-Summe dieser Kategorie.</span>}
          />
        </strong>
        <small>{formatEuroSigniert(betragGesamt, 2)}</small>
      </span>
    </div>
  )
}

function StaffelFeld({
  label,
  feld,
  daten,
  aendere,
}: {
  label: string
  feld: keyof SzenarioDaten['ertraegeAufwendungen']['instandhaltung']['staffel']
  daten: SzenarioDaten
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  return (
    <Feld feldKey={`instandhaltung.staffel.${feld}`} label={label} klasse="staffel__feld" block="Instandhaltung">
      <ZahlenInput
        wert={daten.ertraegeAufwendungen.instandhaltung.staffel[feld]}
        einheit="€/m²"
        ariaLabel={`Instandhaltung Jahre ${label}`}
        onWert={(v) => aendere((sd) => (sd.ertraegeAufwendungen.instandhaltung.staffel[feld] = v))}
      />
    </Feld>
  )
}
