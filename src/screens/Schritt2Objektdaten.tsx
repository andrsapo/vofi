/**
 * Schritt 2 – Objektdaten (Folien 12–14, 19–20): Aufschlüsselung,
 * Investition, Restnutzungsdauer, Grundstückswert (echte Formel),
 * Energetische Sanierung (nur Datenerfassung).
 */

import type { Objektdaten, Projekt, SanierungsPosition, SzenarioDaten } from '../types'
import { useState } from 'react'
import { berechnung } from '../calc/berechnung'
import { Aufschluesselung } from '../components/Aufschluesselung'
import { Feld, useFeldKontext } from '../components/felder'
import { IconFrage, IconInfo } from '../components/icons'
import { InfoTip, Klappbereich, Toggle, ZahlenInput } from '../components/ui'
import { useHilfePanel, type HilfeTab } from '../components/HilfePanelContext'
import { useApp, useStore } from '../state/store'
import { formatEuro, formatGanzzahl, formatZahl } from '../utils/format'

type SanierungsKey = 'wdvs' | 'pvAnlage' | 'fenstertausch' | 'dachdaemmung' | 'kellerdaemmung'

export function Schritt2Objektdaten({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const kontext = useFeldKontext()
  const daten = app.szenarioDaten[kontext.szenarioId]
  const [investitionOffen, setInvestitionOffen] = useState(true)
  const [rndOffen, setRndOffen] = useState(true)
  const [grundstueckOffen, setGrundstueckOffen] = useState(true)
  const alleOffen = investitionOffen && rndOffen && grundstueckOffen
  if (!daten) return null
  const d = daten.objektdaten

  const aendere = (fn: (daten: SzenarioDaten) => void) => store.aendereSzenarioDaten(kontext.szenarioId, fn)
  const toggleAlle = () => {
    const neu = !alleOffen
    setInvestitionOffen(neu)
    setRndOffen(neu)
    setGrundstueckOffen(neu)
  }

  const grundstueckswert = berechnung.grundstueckswertAmEnde(
    d.grundstueck.flaecheM2,
    d.grundstueck.bodenwertEurM2,
    d.grundstueck.wertsteigerungProzent,
    projekt.betrachtungszeitraumJahre,
  )

  return (
    <div className="schritt">
      <h1>Objektdaten</h1>

      <div className="schritt__zweispaltig">
        <Aufschluesselung
          titel="Wohnungen"
          state={d.wohnungen}
          mitFlaeche
          aggregatLabel="Wohneinheiten"
          kategorieVorschlaege={[
            'Wohnungen freifinanziert',
            'Wohnungen öffentlich gefördert',
            'Studentenwohnungen',
            'Seniorenwohnungen',
          ]}
          onChange={(neu) => aendere((sd) => (sd.objektdaten.wohnungen = neu))}
        />
        <Aufschluesselung
          titel="Garagen- / Stellplätze"
          state={d.garagenStellplaetze}
          mitFlaeche={false}
          aggregatLabel="Stellmöglichkeiten"
          kategorieVorschlaege={['Garagen', 'Stellplätze', 'Tiefgaragenstellplätze', 'Carports']}
          onChange={(neu) => aendere((sd) => (sd.objektdaten.garagenStellplaetze = neu))}
        />
      </div>

      <button type="button" className="link-btn schritt__alle-toggle" onClick={toggleAlle}>
        {alleOffen ? 'Alle zuklappen' : 'Alle aufklappen'}
      </button>

      <Klappbereich
        titel="Investition"
        ueberschriftKlasse="klappbereich__titel--h2"
        klasse="klappbereich--mit-infobox"
        rechts={<SektionsKopfHilfe tab={HILFE_INVESTITION} />}
        offen={investitionOffen}
        onOffen={setInvestitionOffen}
      >
        <div className="schritt__mit-infobox">
          <div className="feld-spalte">
            <InvestFeld d={d} feld="grundUndBoden" label="Grund und Boden" aendere={aendere} />
            <InvestFeld d={d} feld="gebaeudeInklNebenkosten" label="Gebäude, einschl. Nebenkosten" aendere={aendere} />
            <InvestFeld d={d} feld="ausstattung" label="Ausstattung" aendere={aendere} />
            <InvestFeld d={d} feld="direkterBaukostenzuschuss" label="Direkter Baukostenzuschuss" aendere={aendere} />
            <InvestFeld d={d} feld="tilgungszuschussNachlass" label="Tilgungszuschuss/-nachlass" aendere={aendere} />
            <InvestFeld d={d} feld="nichtAktivierbareKosten" label="Nicht aktivierbare Kosten" aendere={aendere} />
          </div>
          <aside className="infobox">
            <div className="infobox__zeile">
              <span>
                Investition ohne Grundstück
                <br />
                vor Zuschüssen je m²
              </span>
              <strong>
                {formatEuro(berechnung.investitionOhneGrundstueckJeM2(d))}
                <StubInfo />
              </strong>
            </div>
            <div className="infobox__zeile">
              <span>Durchschnittliche Wohn-/Nutzfläche</span>
              <strong>
                {formatGanzzahl(berechnung.durchschnittlicheWohnNutzflaeche(d))} m²
                <StubInfo />
              </strong>
            </div>
          </aside>
        </div>
      </Klappbereich>

      <Klappbereich
        titel="Restnutzungsdauer"
        ueberschriftKlasse="klappbereich__titel--h2"
        klasse="klappbereich--mit-infobox"
        rechts={<SektionsKopfHilfe tab={HILFE_RESTNUTZUNGSDAUER} />}
        offen={rndOffen}
        onOffen={setRndOffen}
      >
        <div className="schritt__mit-infobox">
          <div className="feld-spalte">
            <JahresFeld d={d} feld="gebaeudeJahre" label="Gebäude" aendere={aendere} />
            <JahresFeld d={d} feld="aussenanlagenJahre" label="Außenanlagen" aendere={aendere} />
            <JahresFeld d={d} feld="ausstattungJahre" label="Ausstattung" aendere={aendere} />
            <JahresFeld d={d} feld="beurteilungszeitraumJahre" label="Beurteilungszeitraum für Dauerhaftigkeit" aendere={aendere} />
          </div>
        </div>
      </Klappbereich>

      <Klappbereich
        titel="Grundstückswert"
        ueberschriftKlasse="klappbereich__titel--h2"
        klasse="klappbereich--mit-infobox"
        rechts={<SektionsKopfHilfe tab={HILFE_GRUNDSTUECK} />}
        offen={grundstueckOffen}
        onOffen={setGrundstueckOffen}
      >
        <div className="schritt__mit-infobox">
          <div className="feld-spalte">
            <Feld feldKey="grundstueck.flaecheM2" label="Grundstücksfläche" klasse="feld--breit">
              <ZahlenInput
                wert={d.grundstueck.flaecheM2}
                nachkommastellen={0}
                einheit="m²"
                onWert={(v) => aendere((sd) => (sd.objektdaten.grundstueck.flaecheM2 = v))}
              />
            </Feld>
            <Feld feldKey="grundstueck.bodenwertEurM2" label="Bodenwert" klasse="feld--breit">
              <ZahlenInput
                wert={d.grundstueck.bodenwertEurM2}
                nachkommastellen={0}
                einheit="€/m²"
                onWert={(v) => aendere((sd) => (sd.objektdaten.grundstueck.bodenwertEurM2 = v))}
              />
            </Feld>
            <Feld feldKey="grundstueck.wertsteigerungProzent" label="Jährliche Wertsteigerung" klasse="feld--breit">
              <ZahlenInput
                wert={d.grundstueck.wertsteigerungProzent}
                nachkommastellen={0}
                einheit="%"
                onWert={(v) => aendere((sd) => (sd.objektdaten.grundstueck.wertsteigerungProzent = v))}
              />
            </Feld>
          </div>
          <aside className="infobox">
            <div className="infobox__zeile">
              <span>
                Grundstückswert am Ende des
                <br />
                Betrachtungszeitraums
              </span>
              <strong>
                {formatEuro(grundstueckswert)}
                <FormelInfo d={d} jahre={projekt.betrachtungszeitraumJahre} ergebnis={grundstueckswert} />
              </strong>
            </div>
          </aside>
        </div>
      </Klappbereich>

      <div className="sanierung__kopf">
        <Toggle
          checked={d.energetischeSanierung.aktiv}
          onChange={(v) => aendere((sd) => (sd.objektdaten.energetischeSanierung.aktiv = v))}
        />
        <h2>Energetische Sanierung planen</h2>
      </div>
      {d.energetischeSanierung.aktiv && (
        <div className="schritt__mit-infobox">
          <div className="feld-spalte">
            <SanierungsFeld d={d} feld="wdvs" label="WDVS" einheit="m²" aendere={aendere} />
            <SanierungsFeld d={d} feld="pvAnlage" label="PV-Anlage" einheit="m²" aendere={aendere} />
            <SanierungsFeld d={d} feld="fenstertausch" label="Fenstertausch" einheit="Stück" aendere={aendere} />
            <SanierungsFeld d={d} feld="dachdaemmung" label="Dachdämmung" einheit="m²" aendere={aendere} />
            <SanierungsFeld d={d} feld="kellerdaemmung" label="Kellerdämmung" einheit="m²" aendere={aendere} />
          </div>
          <aside className="hintbox">
            <IconInfo size={16} />
            <p>
              Die Eingaben haben Auswirkungen auf die CO₂-Emissionen des Unternehmens. Die Emissionen werden neu
              berechnet, sobald die Daten vollständig sind.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}

const HILFE_INVESTITION: HilfeTab = {
  id: 'investition',
  kopfTitel: 'Investition. Hinweis zum Ausfüllen',
  h2: 'Wie fülle ich die Investitionsdaten aus?',
  videoSrc: '/videos/immology Andrej.mp4',
  eskalationsThema: 'Ausfühlung der Investitionsdaten',
  schritte: [
    'Tragen Sie in das Feld "Gebäude, einschl. Nebenkosten" bitte ausschließlich Baukosten ohne Grundstückskosten ein.',
    'Geben Sie im Feld "Grund und Boden" Kosten für die Erschließung und den Erwerb des Grundstücks ein.',
    'Sofern ein Baukostenzuschuss gewährt wird der nicht in Zusammenhang mit einem Darlehen steht, tragen Sie diesen bitte in das Feld "Direkter Baukostenzuschuss" ein.',
    'Tilgungszuschüsse werden im Finanzierungsbereich erfasst.',
    'Wenn es nicht aktivierbare Kosten gibt können diese hier erfasst werden.',
    'Überprüfen Sie Ihre Eingaben und klicken Sie auf "Weiter".',
    'Wiederholen Sie die Schritte zum Hinzufügen/Ändern von Daten.',
  ],
}

const HILFE_RESTNUTZUNGSDAUER: HilfeTab = {
  id: 'restnutzungsdauer',
  kopfTitel: 'Restnutzungsdauer. Hinweis zum Ausfüllen',
  h2: 'Wie ermittele ich die korrekte Restnutzungsdauer?',
  videoSrc: '/videos/immology2.mp4',
  eskalationsThema: 'Ermittlung der korrekten Restnutzungsdauer',
  freitext: 'Die Ermittlung der Restnutzungsdauer (NRD) nach Modernisierungen richtet sich in der Wohnungswirtschaft zwingend nach dem jeweiligen Anwendungszweck. In der Verkehrswertermittlung (ImmoWertV) verlängert sich die NRD kalkulatorisch über ein normiertes Punktesystem, das den Modernisierungsgrad der erneuerten Bauteile abbildet. Steuerrechtlich führt eine reguläre Modernisierung dagegen nicht zur Verlängerung der NRD des Gesamtgebäudes, es sei denn, es handelt sich um eine vollständige Kernsanierung auf Neubauniveau. Im technischen Asset Management wird die Gesamt-NRD hingegen bauteilscharf ermittelt und als gewichteter Durchschnitt aus den physischen Restlebensdauern aller Anlagen berechnet. Folglich existiert keine universelle Gebäude-NRD, sondern stets eine zweckgebundene Bewertungs-, Steuer- oder Instandhaltungslogik.',
}

const HILFE_GRUNDSTUECK: HilfeTab = {
  id: 'grundstueck',
  kopfTitel: 'Grundstückswert. Hinweis zum Ausfüllen',
  h2: 'Wie ermittele ich den Grundstückswert?',
  videoSrc: '/videos/immology3.mp4',
  eskalationsThema: 'Ermittlung des objektiven Grundstücks- bzw. Bodenwerts',
  freitext: 'Der objektive Grundstückswert wird in Deutschland zwingend nach dem Vergleichswertverfahren der ImmoWertV ermittelt. Die erforderlichen amtlichen Daten stellen die Gutachterausschüsse der Kommunen primär über die Bodenrichtwertinformationssysteme (BORIS) der Bundesländer bereit. Im Gegensatz dazu erfordert ein Vollständiger Finanzplan (VoFi) für die subjektive Investitionsrechnung fallspezifische Daten, für die keine zentrale Datenbank existiert. Die Zahlungsströme des Objekts müssen aus lokalen Mietspiegeln, Verordnungen zu Bewirtschaftungskosten und konkreten Kostenangeboten abgeleitet werden. Zudem werden aktuelle Finanzierungskonditionen von Kreditinstituten wie Sollzinsen und Laufzeiten benötigt. Abschließend müssen die individuellen steuerlichen Parameter des Investors, einschließlich Grenzsteuersatz und AfA-Sätzen, zwingend in die Berechnung einfließen.',
}

function SektionsKopfHilfe({ tab }: { tab: HilfeTab }) {
  const hilfe = useHilfePanel()
  return (
    <button type="button" className="sektionskopf__hilfe" onClick={() => hilfe.oeffne(tab)}>
      Wo finde ich die richtigen Daten? <IconFrage size={15} />
    </button>
  )
}

function StubInfo() {
  return (
    <InfoTip
      kind={<IconInfo size={14} className="infotip__icon" />}
      breite={240}
      inhalt={<span>Platzhalterwert – die fachliche Berechnung folgt in einer späteren Ausbaustufe.</span>}
    />
  )
}

/** Formel-Tooltip wie im Mockup (Folie 20) mit eingesetzten Werten */
function FormelInfo({ d, jahre, ergebnis }: { d: Objektdaten; jahre: number; ergebnis: number }) {
  const r = d.grundstueck.wertsteigerungProzent / 100
  return (
    <InfoTip
      kind={<IconInfo size={14} className="infotip__icon" />}
      breite={430}
      inhalt={
        <span className="formel">
          <span>
            Grundstücksfläche · Bodenwert · (1 + Jährliche Wertsteigerung/100)
            <sup>Betrachtungszeitraum</sup>
          </span>
          <span>
            {formatGanzzahl(d.grundstueck.flaecheM2)} m² · {formatGanzzahl(d.grundstueck.bodenwertEurM2)} €/m² ·{' '}
            {formatZahl(1 + r, 2)}
            <sup>{jahre}</sup> = {formatEuro(ergebnis)}
          </span>
        </span>
      }
    />
  )
}

function InvestFeld({
  d,
  feld,
  label,
  aendere,
}: {
  d: Objektdaten
  feld: keyof Objektdaten['investition']
  label: string
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  return (
    <Feld feldKey={`investition.${feld}`} label={label} klasse="feld--breit">
      <ZahlenInput
        wert={d.investition[feld]}
        einheit="€"
        ariaLabel={label}
        onWert={(v) => aendere((sd) => (sd.objektdaten.investition[feld] = v))}
      />
    </Feld>
  )
}

function JahresFeld({
  d,
  feld,
  label,
  aendere,
}: {
  d: Objektdaten
  feld: keyof Objektdaten['restnutzungsdauer']
  label: string
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  return (
    <Feld feldKey={`restnutzungsdauer.${feld}`} label={label} klasse="feld--breit">
      <ZahlenInput
        wert={d.restnutzungsdauer[feld]}
        nachkommastellen={0}
        einheit="Jahre"
        ariaLabel={label}
        onWert={(v) => aendere((sd) => (sd.objektdaten.restnutzungsdauer[feld] = v))}
      />
    </Feld>
  )
}

function SanierungsFeld({
  d,
  feld,
  label,
  einheit,
  aendere,
}: {
  d: Objektdaten
  feld: SanierungsKey
  label: string
  einheit: string
  aendere: (fn: (daten: SzenarioDaten) => void) => void
}) {
  const pos: SanierungsPosition = d.energetischeSanierung[feld]
  return (
    <div className="sanierung__zeile">
      <label className="checkzeile checkzeile--sanierung">
        <input
          type="checkbox"
          checked={pos.aktiv}
          onChange={(e) => aendere((sd) => (sd.objektdaten.energetischeSanierung[feld].aktiv = e.target.checked))}
        />
        {label}
      </label>
      <ZahlenInput
        wert={pos.menge}
        nachkommastellen={0}
        einheit={einheit}
        disabled={!pos.aktiv}
        ariaLabel={`${label} Menge`}
        onWert={(v) => aendere((sd) => (sd.objektdaten.energetischeSanierung[feld].menge = v))}
      />
    </div>
  )
}
