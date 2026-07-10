/**
 * Szenarien analysieren (Folien 26–30): Auswertungstabelle je Szenario,
 * Detailbereiche mit Plus-/Minus-Steppern (isoliert je Szenario),
 * Szenario anlegen/löschen, Bericht erstellen.
 */

import { useState } from 'react'
import type { Projekt, Szenario } from '../types'
import { berechnung } from '../calc/berechnung'
import { szenarioFarbe } from '../components/charts'
import { NeuesSzenarioModal } from '../components/NeuesSzenarioModal'
import { IconPapierkorb, IconPlusKreis } from '../components/icons'
import { Klappbereich, Modal, Stepper } from '../components/ui'
import { szenarienFuerProjekt, useApp, useStore } from '../state/store'
import { formatZahl, parseZahl } from '../utils/format'
import { ProjektLayout } from './ProjektLayout'

export function SzenarienAnalyse({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const szenarien = szenarienFuerProjekt(app, projekt.id)
  const [neuesSzenarioOffen, setNeuesSzenarioOffen] = useState(false)
  const [berichtModalOffen, setBerichtModalOffen] = useState(false)

  return (
    <ProjektLayout
      projekt={projekt}
      fussRechts={
        <>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const basis = szenarien[0]
              if (basis) store.navigiere({ view: 'projekt', projektId: projekt.id, szenarioId: basis.id, schritt: 4 })
            }}
          >
            Zurück
          </button>
          <button type="button" className="btn btn--sekundaer" onClick={() => setBerichtModalOffen(true)}>
            Bericht erstellen
          </button>
        </>
      }
    >
      <div className="schritt schritt--voll analyse">
        <h1>Szenarien analysieren</h1>
        <div className="analyse__anzeigen">
          <span>Anzeigen:</span>
          {szenarien.map((s, i) => (
            <SzenarioChip key={s.id} szenario={s} farbe={szenarioFarbe(i)} />
          ))}
          <button type="button" className="icon-btn" aria-label="Neues Szenario anlegen" onClick={() => setNeuesSzenarioOffen(true)}>
            <IconPlusKreis size={17} />
          </button>
        </div>

        <AuswertungsTabelle projekt={projekt} szenarien={szenarien} />
        <DetailBereiche projekt={projekt} szenarien={szenarien} />
      </div>

      {neuesSzenarioOffen && <NeuesSzenarioModal projekt={projekt} onClose={() => setNeuesSzenarioOffen(false)} />}
      {berichtModalOffen && <BerichtErstellenModal projekt={projekt} onClose={() => setBerichtModalOffen(false)} />}
    </ProjektLayout>
  )
}

/** Chip in der "Anzeigen:"-Zeile: Name inline editierbar; Löschbutton nur bei Nicht-Basis. */
function SzenarioChip({ szenario, farbe }: { szenario: Szenario; farbe: string }) {
  const store = useStore()
  const [editiere, setEditiere] = useState(false)
  const [entwurf, setEntwurf] = useState(szenario.name)

  const speichere = () => {
    const trimmed = entwurf.trim()
    if (trimmed && trimmed !== szenario.name) store.umbenenneSzenario(szenario.id, trimmed)
    else setEntwurf(szenario.name)
    setEditiere(false)
  }

  return (
    <span className="analyse__chip">
      <i className="analyse__punkt" style={{ background: farbe }} />
      {editiere ? (
        <input
          type="text"
          className="analyse__chip-input"
          value={entwurf}
          autoFocus
          onChange={(e) => setEntwurf(e.target.value)}
          onBlur={speichere}
          onKeyDown={(e) => {
            if (e.key === 'Enter') speichere()
            else if (e.key === 'Escape') {
              setEntwurf(szenario.name)
              setEditiere(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="analyse__chip-name"
          onClick={() => setEditiere(true)}
          title="Zum Umbenennen klicken"
        >
          {szenario.name}
        </button>
      )}
      {!szenario.istBasis && (
        <button
          type="button"
          className="analyse__chip-loeschen"
          aria-label={`${szenario.name} löschen`}
          title={`${szenario.name} löschen`}
          onClick={() => store.loescheSzenario(szenario.id)}
        >
          <IconPapierkorb size={13} />
        </button>
      )}
    </span>
  )
}

/**
 * Regel für die Anzeige einer Auswertungs-Kennzahl in nicht-Basis-Szenarien:
 *
 * - "projekt"-Werte (z. B. Betrachtungszeitraum) stammen aus dem Projekt-
 *   Header und sind IMMER verfügbar.
 * - Alle übrigen Kennzahlen (Renditen, Restwerte, DCF etc.) sind Ergebnisse
 *   der VoFi-Berechnung, die konzeptionell alle drei Datenbereiche
 *   (Objektdaten, Erträge/Aufwendungen, Finanzierung) benötigt. Wird auch
 *   nur EIN Bereich beim Anlegen des Szenarios nicht übernommen, ist die
 *   fachliche Datenbasis unvollständig und die Kennzahl darf nicht aus
 *   dem Basisszenario "durchsickern".
 *
 * Der Anwender kann jederzeit einen manuellen Override in der Zelle
 * eintragen (Inline-Editing) – dieser hat Vorrang vor dieser Regel.
 */
const KENNZAHLEN_AUS_PROJEKT = new Set(['betrachtungszeitraum'])

function kennzahlIstVerfuegbar(key: string, szenario: Szenario): boolean {
  if (szenario.istBasis) return true
  if (KENNZAHLEN_AUS_PROJEKT.has(key)) return true
  const u = szenario.uebernommeneBereiche
  // Nur wenn ALLE drei Datenbereiche übernommen wurden, ist die
  // Datenbasis für die Auswertung vollständig.
  return u.objektdaten && u.ertraegeUndAufwendungen && u.finanzierung
}

export function AuswertungsTabelle({
  projekt,
  szenarien,
  kompakt,
}: {
  projekt: Projekt
  szenarien: Szenario[]
  kompakt?: boolean
}) {
  const app = useApp()
  const store = useStore()
  const kennzahlenJeSzenario = szenarien.map((s, i) => {
    const daten = app.szenarioDaten[s.id]
    return daten ? berechnung.kennzahlen(projekt, daten, i) : []
  })
  const zeilen = kennzahlenJeSzenario[0] ?? []

  return (
    <div
      className={`auswertung${kompakt ? ' auswertung--kompakt' : ''}`}
      style={{ gridTemplateColumns: `320px repeat(${szenarien.length}, 200px)` }}
    >
      <div className="auswertung__spalte auswertung__spalte--labels">
        <h2>Auswertung</h2>
        {zeilen.map((z) => (
          <div key={z.key} className={`auswertung__zeile${z.sekundaer ? ' auswertung__zeile--sekundaer' : ''}`}>
            {z.label}
          </div>
        ))}
      </div>
      {szenarien.map((s, i) => {
        const daten = app.szenarioDaten[s.id]
        const overrides = daten?.auswertungOverrides ?? {}
        return (
          <div key={s.id} className="auswertung__spalte">
            <h2 className="auswertung__szenario">
              <i className="analyse__punkt" style={{ background: szenarioFarbe(i) }} />
              {s.name}
            </h2>
            {kennzahlenJeSzenario[i].map((z) => {
              // Wenn Bereich nicht übernommen und kein manueller Override:
              // leerer Wert. Override hat immer Vorrang.
              const override = overrides[z.key]
              const verfuegbar = kennzahlIstVerfuegbar(z.key, s)
              const anzeigeWert = override ?? (verfuegbar ? z.formatiert : '')
              return (
                <AuswertungsZelle
                  key={z.key}
                  sekundaer={z.sekundaer}
                  wert={anzeigeWert}
                  onWert={(v) => store.setzeAuswertungOverride(s.id, z.key, v === z.formatiert && verfuegbar ? null : v)}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Formatiert eine Roh-Eingabe nach dem Muster einer Referenz-Anzeige.
 * Beispiele (vorlage → eingabe → ausgabe):
 *   "-258.537 €" + "111222333"  → "111.222.333 €"
 *   "-258.537 €" + "-111222 €"  → "-111.222 €"
 *   "1,78 %"     + "2,5"         → "2,50 %"
 *   "Jahr 43"    + "50"          → "Jahr 50"
 *   "20 Jahre"   + "25"          → "25 Jahre"
 * Enthält die Vorlage keine erkennbare Zahl, wird die Eingabe unverändert übernommen.
 */
function formatiereWieVorlage(eingabe: string, vorlage: string): string {
  // Nur Ziffern, Vorzeichen, Punkte, Komma extrahieren – der Anwender darf
  // z. B. auch "-111222 €" oder "5 %" eintippen und wir verwerfen die
  // Nicht-Zahl-Teile vor dem Parsen.
  const nurZahl = eingabe.replace(/[^0-9.,\-]/g, '').trim()
  const zahl = parseZahl(nurZahl)
  if (zahl === null) return eingabe.trim()

  // Erste Ziffer bzw. Vorzeichen in der Vorlage finden.
  const start = vorlage.search(/[-\d]/)
  if (start < 0) {
    // Leere Vorlage: Rohzahl mit deutscher Tausendertrennung formatieren.
    const rohEingabe = eingabe.replace(/[^0-9.,\-]/g, '').trim()
    const kommaInEingabe = rohEingabe.indexOf(',')
    const nachkomma = kommaInEingabe >= 0 ? rohEingabe.length - kommaInEingabe - 1 : 0
    return formatZahl(zahl, nachkomma)
  }

  // Ende der Zahl finden: nach dem Start alle Ziffern, Punkte und ggf. Komma.
  let ende = start
  if (vorlage[ende] === '-') ende++
  while (ende < vorlage.length && /[\d.]/.test(vorlage[ende])) ende++
  if (vorlage[ende] === ',' && /\d/.test(vorlage[ende + 1] ?? '')) {
    ende++
    while (ende < vorlage.length && /\d/.test(vorlage[ende])) ende++
  }

  const original = vorlage.slice(start, ende)
  const praefix = vorlage.slice(0, start)
  const suffix = vorlage.slice(ende)

  const kommaPos = original.indexOf(',')
  const nachkomma = kommaPos >= 0 ? original.length - kommaPos - 1 : 0
  const formatiert = formatZahl(zahl, nachkomma)

  return `${praefix}${formatiert}${suffix}`
}

/** Editierbare Zelle in der Auswertungstabelle. Klick startet Inline-Editing;
 *  Enter/Blur speichert, Escape verwirft. Der berechnete Wert dient als
 *  Fallback und als Format-Vorlage (Euro/Prozent/Jahre) für die Ausgabe. */
function AuswertungsZelle({
  wert,
  onWert,
  sekundaer,
}: {
  wert: string
  onWert: (v: string) => void
  sekundaer?: boolean
}) {
  const [editiere, setEditiere] = useState(false)
  const [entwurf, setEntwurf] = useState(wert)

  const speichere = () => {
    const trimmed = entwurf.trim()
    if (!trimmed) {
      setEditiere(false)
      return
    }
    const formatiert = formatiereWieVorlage(trimmed, wert)
    if (formatiert !== wert) onWert(formatiert)
    setEditiere(false)
  }

  return (
    <div className={`auswertung__zeile${sekundaer ? ' auswertung__zeile--sekundaer' : ''}`}>
      {editiere ? (
        <input
          type="text"
          className="auswertung__zeile-input"
          value={entwurf}
          autoFocus
          onChange={(e) => setEntwurf(e.target.value)}
          onBlur={speichere}
          onKeyDown={(e) => {
            if (e.key === 'Enter') speichere()
            else if (e.key === 'Escape') {
              setEntwurf(wert)
              setEditiere(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="auswertung__zeile-btn"
          onClick={() => {
            setEntwurf(wert)
            setEditiere(true)
          }}
        >
          {wert || <span className="auswertung__leer">–</span>}
        </button>
      )}
    </div>
  )
}

/** Detailbereiche "Erträge"/"Aufwendungen"/"Finanzierung" mit Steppern je Szenario */
function DetailBereiche({ projekt, szenarien }: { projekt: Projekt; szenarien: Szenario[] }) {
  const app = useApp()
  const store = useStore()

  // Zeilen: Label links, je Szenario ein Stepper (Änderungen nur im jeweiligen Szenario)
  const ertragsZeilen: {
    gruppe: string
    label: string
    einheit: (szenarioId: string) => string
    wert: (szenarioId: string) => number
    setze: (szenarioId: string, wert: number) => void
    schrittweite?: number
  }[] = []

  const basisDaten = app.szenarioDaten[szenarien[0]?.id]
  basisDaten?.ertraegeAufwendungen.sollmieten.forEach((_, index) => {
    const titelVon = (szenarioId: string) =>
      app.szenarioDaten[szenarioId]?.ertraegeAufwendungen.sollmieten[index]
    const basisPos = basisDaten.ertraegeAufwendungen.sollmieten[index]
    ertragsZeilen.push(
      {
        gruppe: basisPos.titel,
        label:
          basisPos.satzEinheit === '€/m²' ? 'Monatliche Sollmieten pro m²' : 'Monatliche Sollmieten pro Stellplatz/Garage',
        einheit: () => '€',
        wert: (id) => titelVon(id)?.satz ?? 0,
        setze: (id, v) =>
          store.aendereSzenarioDaten(id, (sd) => {
            const p = sd.ertraegeAufwendungen.sollmieten[index]
            if (p) p.satz = v
          }),
        schrittweite: 0.1,
      },
      ...(basisPos.mietausfallProzent !== null
        ? [
            {
              gruppe: basisPos.titel,
              label: 'Mietausfall p.a. (in % der Sollmiete)',
              einheit: () => '%',
              wert: (id: string) => titelVon(id)?.mietausfallProzent ?? 0,
              setze: (id: string, v: number) =>
                store.aendereSzenarioDaten(id, (sd) => {
                  const p = sd.ertraegeAufwendungen.sollmieten[index]
                  if (p) p.mietausfallProzent = v
                }),
            },
          ]
        : []),
      {
        gruppe: basisPos.titel,
        label: 'Mietsteigerung p.a.',
        einheit: (id) => titelVon(id)?.steigerungEinheit ?? '€/m²',
        wert: (id) => titelVon(id)?.steigerung ?? 0,
        setze: (id, v) =>
          store.aendereSzenarioDaten(id, (sd) => {
            const p = sd.ertraegeAufwendungen.sollmieten[index]
            if (p) p.steigerung = v
          }),
      },
      {
        gruppe: basisPos.titel,
        label: 'Turnus',
        einheit: () => 'Jahre',
        wert: (id) => titelVon(id)?.turnusJahre ?? 0,
        setze: (id, v) =>
          store.aendereSzenarioDaten(id, (sd) => {
            const p = sd.ertraegeAufwendungen.sollmieten[index]
            if (p) p.turnusJahre = Math.round(v)
          }),
      },
    )
  })

  const staffelFelder = [
    ['von1bis5', 'Instandhaltung 1–5 Jahre'],
    ['von6bis10', 'Instandhaltung 6–10 Jahre'],
    ['von11bis15', 'Instandhaltung 11–15 Jahre'],
    ['von16bis20', 'Instandhaltung 16–20 Jahre'],
    ['ab20', 'Instandhaltung > 20 Jahre'],
  ] as const

  return (
    <>
      <Klappbereich titel="Erträge" ueberschriftKlasse="analyse__bereich-titel">
        <div className="analyse-detail">
          {gruppiere(ertragsZeilen).map(([gruppe, zeilen]) => (
            <div key={gruppe} className="analyse-detail__gruppe">
              <h3>{gruppe}</h3>
              {zeilen.map((zeile) => (
                <div
                  key={zeile.label}
                  className="analyse-detail__zeile"
                  style={{ gridTemplateColumns: `320px repeat(${szenarien.length}, 200px)` }}
                >
                  <span className="analyse-detail__label">{zeile.label}</span>
                  {szenarien.map((s) => (
                    <Stepper
                      key={s.id}
                      wert={zeile.wert(s.id)}
                      einheit={zeile.einheit(s.id)}
                      schrittweite={zeile.schrittweite ?? 1}
                      nachkommastellen={zeile.einheit(s.id) === '€' ? 2 : 0}
                      onWert={(v) => zeile.setze(s.id, v)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Klappbereich>

      <Klappbereich titel="Aufwendungen" ueberschriftKlasse="analyse__bereich-titel">
        <div className="analyse-detail">
          <div className="analyse-detail__gruppe">
            <h3>Instandhaltung (Staffelung nach Jahren)</h3>
            {staffelFelder.map(([feld, label]) => (
              <div
                key={feld}
                className="analyse-detail__zeile"
                style={{ gridTemplateColumns: `320px repeat(${szenarien.length}, 200px)` }}
              >
                <span className="analyse-detail__label">{label}</span>
                {szenarien.map((s) => (
                  <Stepper
                    key={s.id}
                    wert={app.szenarioDaten[s.id]?.ertraegeAufwendungen.instandhaltung.staffel[feld] ?? 0}
                    einheit="€/m²"
                    schrittweite={0.5}
                    onWert={(v) =>
                      store.aendereSzenarioDaten(s.id, (sd) => (sd.ertraegeAufwendungen.instandhaltung.staffel[feld] = v))
                    }
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="analyse-detail__gruppe">
            <h3>Verwaltungskosten</h3>
            <div
              className="analyse-detail__zeile"
              style={{ gridTemplateColumns: `320px repeat(${szenarien.length}, 200px)` }}
            >
              <span className="analyse-detail__label">Betrag je Einheit</span>
              {szenarien.map((s) => (
                <Stepper
                  key={s.id}
                  wert={app.szenarioDaten[s.id]?.ertraegeAufwendungen.verwaltungskostenJeEinheit ?? 0}
                  einheit="€"
                  schrittweite={10}
                  nachkommastellen={0}
                  onWert={(v) =>
                    store.aendereSzenarioDaten(s.id, (sd) => (sd.ertraegeAufwendungen.verwaltungskostenJeEinheit = v))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Klappbereich>

      <Klappbereich titel="Finanzierung" ueberschriftKlasse="analyse__bereich-titel" initialOffen={false}>
        <div className="analyse-detail">
          <div className="analyse-detail__gruppe">
            <h3>Kapitalstruktur</h3>
            <div
              className="analyse-detail__zeile"
              style={{ gridTemplateColumns: `320px repeat(${szenarien.length}, 200px)` }}
            >
              <span className="analyse-detail__label">Eigenkapitaleinsatz</span>
              {szenarien.map((s) => (
                <Stepper
                  key={s.id}
                  wert={app.szenarioDaten[s.id]?.finanzierung.eigenkapitalProzent ?? 0}
                  einheit="%"
                  schrittweite={5}
                  nachkommastellen={0}
                  onWert={(v) =>
                    store.aendereSzenarioDaten(
                      s.id,
                      (sd) => (sd.finanzierung.eigenkapitalProzent = Math.min(100, Math.max(0, v))),
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Klappbereich>
    </>
  )
}

function gruppiere<T extends { gruppe: string }>(zeilen: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  zeilen.forEach((z) => {
    const liste = map.get(z.gruppe) ?? []
    liste.push(z)
    map.set(z.gruppe, liste)
  })
  return [...map.entries()]
}

/** Modal "Bericht erstellen" (Folie 31): Name vorbelegt mit Projektname */
function BerichtErstellenModal({ projekt, onClose }: { projekt: Projekt; onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState(projekt.name)
  return (
    <Modal
      titel="Bericht erstellen"
      breite={420}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primaer"
            disabled={!name.trim()}
            onClick={() => store.erstelleBericht(projekt.id, name.trim())}
          >
            Bericht erstellen
          </button>
        </>
      }
    >
      <label className="formfeld">
        <span className="formfeld__label">Name des Berichts</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
    </Modal>
  )
}
