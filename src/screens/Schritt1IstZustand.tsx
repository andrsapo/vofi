/**
 * Schritt 1 – Objekt IST-Zustand (Folien 9–11).
 * Bei "Bestand" ERP-vorbefüllt; jede manuelle Änderung wird gemäß
 * Override-Regel markiert (Label #424761 + blauer Punkt + Popup mit Reset).
 */

import type { ObjektIst, ObjektIstFeldKey, Projekt } from '../types'
import { useState } from 'react'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { Feld } from '../components/felder'
import { Klappbereich, ZahlenInput } from '../components/ui'
import { formatZahl } from '../utils/format'

const ENERGIEKLASSEN = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function Schritt1IstZustand({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const objekt = app.objektIst[projekt.id]
  const [raeumlichkeitenOffen, setRaeumlichkeitenOffen] = useState(true)
  const [buchwertOffen, setBuchwertOffen] = useState(true)
  const [weitereOffen, setWeitereOffen] = useState(true)
  const [statistikOffen, setStatistikOffen] = useState(true)
  const alleOffen = raeumlichkeitenOffen && buchwertOffen && weitereOffen && statistikOffen
  if (!objekt) return null

  const toggleAlle = () => {
    const neu = !alleOffen
    setRaeumlichkeitenOffen(neu)
    setBuchwertOffen(neu)
    setWeitereOffen(neu)
    setStatistikOffen(neu)
  }

  return (
    <div className="schritt">
      <h1>Objektinformation</h1>
      <p className="schritt__intro">
        {projekt.investitionsart === 'Bestand'
          ? 'Die grundlegenden Objektdaten werden aus dem ERP-System übernommen. Die Daten können manuell bearbeitet werden.'
          : // ANNAHME (Spez. Abschnitt 8): Erwerb/Neubau nutzt dieselbe Feldstruktur ohne ERP-Vorbefüllung.
            'Bitte erfassen Sie die grundlegenden Objektdaten. Ohne ERP-Objekt erfolgt keine Vorbefüllung.'}
      </p>

      {projekt.investitionsart === 'Bestand' && (
        <label className="formfeld formfeld--breit">
          <span className="formfeld__label">Objekt auswählen</span>
          <select
            value={objekt.objektId ?? ''}
            onChange={(e) => store.ladeObjektNeu(projekt.id, e.target.value)}
          >
            {erpRepository.ladeObjekte().map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <TextFeld projekt={projekt} objekt={objekt} feld="adresse" label="Adresse" />
      <NummernFeld
        projekt={projekt}
        objekt={objekt}
        feld="baujahr"
        label="Baujahr des Gebäudes"
        nachkommastellen={0}
        ohneGruppierung
        breit
      />

      <button type="button" className="link-btn schritt__alle-toggle" onClick={toggleAlle}>
        {alleOffen ? 'Alle zuklappen' : 'Alle aufklappen'}
      </button>

      <Klappbereich titel="Räumlichkeiten" ueberschriftKlasse="klappbereich__titel--h2" offen={raeumlichkeitenOffen} onOffen={setRaeumlichkeitenOffen}>
        <div className="feld-raster">
          <NummernFeld projekt={projekt} objekt={objekt} feld="anzahlWohneinheiten" label="Anzahl Wohneinheiten" nachkommastellen={0} />
          <NummernFeld projekt={projekt} objekt={objekt} feld="nutzflaecheWohnen" label="Nutzfläche" einheit="m²" nachkommastellen={0} />
          <NummernFeld projekt={projekt} objekt={objekt} feld="anzahlGewerbeeinheiten" label="Anzahl Gewerbeeinheiten" nachkommastellen={0} />
          <NummernFeld projekt={projekt} objekt={objekt} feld="nutzflaecheGewerbe" label="Nutzfläche" einheit="m²" nachkommastellen={0} />
          <NummernFeld projekt={projekt} objekt={objekt} feld="anzahlGaragenStellplaetze" label="Anzahl Garagen/Stellplätze" nachkommastellen={0} />
        </div>
      </Klappbereich>

      <Klappbereich titel="Buchwerte zum 31.12.23" ueberschriftKlasse="klappbereich__titel--h2" offen={buchwertOffen} onOffen={setBuchwertOffen}>
        <div className="feld-spalte">
          <NummernFeld projekt={projekt} objekt={objekt} feld="grundUndBoden" label="Grund und Boden" einheit="€" breit />
          <NummernFeld projekt={projekt} objekt={objekt} feld="gebaeudeInklNebenkosten" label="Gebäude, einschl. Nebenkosten" einheit="€" breit />
          <NummernFeld projekt={projekt} objekt={objekt} feld="ausstattung" label="Ausstattung" einheit="€" breit />
          <NummernFeld
            projekt={projekt}
            objekt={objekt}
            feld="anschaffungsHerstellungskosten"
            label="Anschaffungs- und Herstellungskosten"
            einheit="€"
            breit
          />
        </div>
      </Klappbereich>

      <Klappbereich titel="Weitere Angaben" ueberschriftKlasse="klappbereich__titel--h2" offen={weitereOffen} onOffen={setWeitereOffen}>
        <div className="feld-raster feld-raster--drei">
          <NummernFeld projekt={projekt} objekt={objekt} feld="rndJahre" label="RND" nachkommastellen={0} />
          <EnergieklasseFeld projekt={projekt} objekt={objekt} />
          <NummernFeld projekt={projekt} objekt={objekt} feld="co2AusstossKgM2a" label="CO₂-Ausstoß" einheit="kg/m²a" />
        </div>
      </Klappbereich>

      <Klappbereich titel="Statistik &amp; Kennzahlen" ueberschriftKlasse="klappbereich__titel--h2" offen={statistikOffen} onOffen={setStatistikOffen}>
        <div className="feld-raster">
          <NummernFeld projekt={projekt} objekt={objekt} feld="jahresnettokaltmiete" label="Jahresnettokaltmiete" einheit="€" />
          <NummernFeld projekt={projekt} objekt={objekt} feld="durchschnittlicheM2Miete" label="Durchschnittliche m²-Miete" einheit="€" />
          <NummernFeld projekt={projekt} objekt={objekt} feld="mietausfallProzent" label="Mietausfall / Erlösschmälerungen" einheit="%" />
          <NummernFeld projekt={projekt} objekt={objekt} feld="leerstandMonate" label="Durchschnittlicher Leerstand p.a." einheit="Monate" />
        </div>
      </Klappbereich>
    </div>
  )
}

// Legacy-Export: wird derzeit von keinem Schritt mehr verwendet (Navigation
// läuft zentral über ProjektLayout.fussRechts in App.tsx). Bleibt exportiert,
// falls externe Aufrufer den Knopf einzeln nutzen wollen.
export function WeiterButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn--primaer" onClick={onClick}>
      Weiter
    </button>
  )
}

// ---------- Feld-Varianten mit Override-Anbindung ----------

function overrideInfo(
  projektId: string,
  objekt: ObjektIst,
  feld: ObjektIstFeldKey,
  formatiere: (wert: string | number) => string,
  reset: () => void,
) {
  const f = objekt[feld]
  return {
    istUeberschrieben: f.erp !== null && f.wert !== f.erp,
    erpAnzeige: f.erp !== null ? formatiere(f.erp) : '',
    onZuruecksetzen: reset,
  }
}

function NummernFeld({
  projekt,
  objekt,
  feld,
  label,
  einheit,
  nachkommastellen = 2,
  ohneGruppierung,
  breit,
}: {
  projekt: Projekt
  objekt: ObjektIst
  feld: ObjektIstFeldKey
  label: string
  einheit?: string
  nachkommastellen?: number
  ohneGruppierung?: boolean
  breit?: boolean
}) {
  const store = useStore()
  const f = objekt[feld]
  return (
    <Feld
      feldKey={`objekt.${feld}`}
      label={label}
      klasse={breit ? 'feld--breit' : ''}
      override={overrideInfo(
        projekt.id,
        objekt,
        feld,
        (w) =>
          `${ohneGruppierung ? String(w) : formatZahl(Number(w), nachkommastellen)}${einheit ? ` ${einheit}` : ''}`,
        () => store.setzeObjektFeldZurueck(projekt.id, feld),
      )}
    >
      <ZahlenInput
        wert={Number(f.wert)}
        nachkommastellen={nachkommastellen}
        einheit={einheit}
        ohneGruppierung={ohneGruppierung}
        ariaLabel={label}
        onWert={(v) => store.setzeObjektFeld(projekt.id, feld, v)}
      />
    </Feld>
  )
}

function TextFeld({
  projekt,
  objekt,
  feld,
  label,
}: {
  projekt: Projekt
  objekt: ObjektIst
  feld: ObjektIstFeldKey
  label: string
}) {
  const store = useStore()
  const f = objekt[feld]
  return (
    <Feld
      feldKey={`objekt.${feld}`}
      label={label}
      klasse="feld--breit"
      override={overrideInfo(projekt.id, objekt, feld, String, () => store.setzeObjektFeldZurueck(projekt.id, feld))}
    >
      <input
        type="text"
        className="text-input"
        value={String(f.wert)}
        aria-label={label}
        onChange={(e) => store.setzeObjektFeld(projekt.id, feld, e.target.value)}
      />
    </Feld>
  )
}

function EnergieklasseFeld({ projekt, objekt }: { projekt: Projekt; objekt: ObjektIst }) {
  const store = useStore()
  const f = objekt.energieeffizienzklasse
  return (
    <Feld
      feldKey="objekt.energieeffizienzklasse"
      label="Energieeffizienzklasse"
      override={overrideInfo(projekt.id, objekt, 'energieeffizienzklasse', String, () =>
        store.setzeObjektFeldZurueck(projekt.id, 'energieeffizienzklasse'),
      )}
    >
      <select
        className="select-input"
        value={String(f.wert)}
        aria-label="Energieeffizienzklasse"
        onChange={(e) => store.setzeObjektFeld(projekt.id, 'energieeffizienzklasse', e.target.value)}
      >
        {ENERGIEKLASSEN.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
    </Feld>
  )
}
