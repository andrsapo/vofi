import { useEffect, useState } from 'react'
import { IconSchliessen } from './icons'

interface OrgEntwurf {
  betrachtungszeitraumJahre: number
  zinsaufwendungenProzent: number
  zinsertraegeProzent: number
  mindestrenditeProzent: number
  risikoloserBasiszinssatzProzent: number
  immowirtschaftlichesRisikoProzent: number
  steuersatzProzent: number
  verwaltungskostenWohnenGewerbe: number
  verwaltungskostenGaragen: number
  kostensteigerungInstandhaltungProzent: number
  kostensteigerungVerwaltungskostenProzent: number
  maklerfaktorBegrenzungProzent: number
  annuitaetenBerechnungsmodus: 'Ursprungskapital' | 'Restkapital'
  tilgungsnachlassProzentpunkte: number
  tilgungsnachlassZielJahr: number
}

const STANDARD: OrgEntwurf = {
  betrachtungszeitraumJahre: 20,
  zinsaufwendungenProzent: 5.0,
  zinsertraegeProzent: 2.5,
  mindestrenditeProzent: 6.0,
  risikoloserBasiszinssatzProzent: 3.5,
  immowirtschaftlichesRisikoProzent: 2.5,
  steuersatzProzent: 30,
  verwaltungskostenWohnenGewerbe: 420,
  verwaltungskostenGaragen: 80,
  kostensteigerungInstandhaltungProzent: 2.0,
  kostensteigerungVerwaltungskostenProzent: 2.0,
  maklerfaktorBegrenzungProzent: 100,
  annuitaetenBerechnungsmodus: 'Ursprungskapital',
  tilgungsnachlassProzentpunkte: 0,
  tilgungsnachlassZielJahr: 5,
}

// Persistierter Speicher — überlebt Modal-Öffnen/Schließen
export let gespeicherteEinstellungen: OrgEntwurf = { ...STANDARD }

function Sektion({ titel, children, offen, onToggle }: {
  titel: string
  children: React.ReactNode
  offen: boolean
  onToggle: () => void
}) {
  return (
    <div className="org-sektion">
      <button type="button" className="org-sektion__kopf" onClick={onToggle} aria-expanded={offen}>
        <span className="org-sektion__pfeil" style={{ transform: offen ? 'rotate(90deg)' : 'none' }}>▶</span>
        <span className="org-sektion__titel">{titel}</span>
      </button>
      {offen && <div className="org-sektion__body">{children}</div>}
    </div>
  )
}

function OrgFeld({ label, hinweis, children }: { label: string; hinweis?: string; children: React.ReactNode }) {
  return (
    <div className="org-feld">
      <div className="org-feld__links">
        <label className="es-label">{label}</label>
        {children}
      </div>
      {hinweis && <span className="org-feld__hinweis">{hinweis}</span>}
    </div>
  )
}

export function OrganisationseinstellungModal({ onClose }: { onClose: () => void }) {
  const [entwurf, setEntwurf] = useState<OrgEntwurf>({ ...gespeicherteEinstellungen })
  const [offen, setOffen] = useState<Record<number, boolean>>({ 0: true, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false })

  const hatAenderungen = JSON.stringify(entwurf) !== JSON.stringify(gespeicherteEinstellungen)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const alleOffen = Object.values(offen).every(Boolean)

  function toggleAlle() {
    const neu = !alleOffen
    setOffen({ 0: neu, 1: neu, 2: neu, 3: neu, 4: neu, 5: neu, 6: neu, 7: neu })
  }

  function toggle(i: number) {
    setOffen((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  function set<K extends keyof OrgEntwurf>(feld: K, wert: OrgEntwurf[K]) {
    setEntwurf((prev) => ({ ...prev, [feld]: wert }))
  }

  function numInput(feld: keyof OrgEntwurf, einheit?: string) {
    return (
      <div className="org-num-wrapper">
        <input
          type="number"
          className="es-input es-input--schmal"
          value={entwurf[feld] as number}
          onChange={(e) => set(feld, parseFloat(e.target.value) as OrgEntwurf[typeof feld])}
        />
        {einheit && <span className="org-einheit">{einheit}</span>}
      </div>
    )
  }

  return (
    <div className="es-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="es-panel es-panel--org" role="dialog" aria-modal="true" aria-label="Organisationseinstellung">

        <div className="es-kopf">
          <div>
            <div className="es-kopf__titel">Organisationseinstellung</div>
            <div className="es-kopf__untertitel">Standardwerte für Berechnungen und Kalkulationen</div>
          </div>
          <button type="button" className="es-kopf__schliessen" onClick={onClose} aria-label="Schließen">✕</button>
        </div>

        <div className="es-inhalt">
          <div className="org-alle-toggle">
            <button type="button" className="org-alle-btn" onClick={toggleAlle}>
              {alleOffen ? 'Alles zuklappen' : 'Alles aufklappen'}
            </button>
          </div>

          <Sektion titel="Betrachtungszeitraum = Detailplanungszeitraum" offen={offen[0]} onToggle={() => toggle(0)}>
            <OrgFeld label="Detailplanungszeitraum" hinweis="Anzahl der Jahre für die Detailplanung">
              {numInput('betrachtungszeitraumJahre', 'Jahre')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Verzinsung aufgelaufener Kontokorrentguthaben bzw. -verbindlichkeiten" offen={offen[1]} onToggle={() => toggle(1)}>
            <OrgFeld label="Zinsaufwendungen" hinweis="Zinssatz für Verbindlichkeiten im Kontokorrent">
              {numInput('zinsaufwendungenProzent', '%')}
            </OrgFeld>
            <OrgFeld label="Zinserträge" hinweis="Zinssatz für Guthaben im Kontokorrent">
              {numInput('zinsertraegeProzent', '%')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Mindestrendite (für Kapitalwert)" offen={offen[2]} onToggle={() => toggle(2)}>
            <OrgFeld label="Mindestrendite" hinweis="Geforderte Mindestrendite auf das eingesetzte Kapital">
              {numInput('mindestrenditeProzent', '%')}
            </OrgFeld>
            <OrgFeld label="Risikoloser Basiszinssatz" hinweis="Risikofreier Basiszinssatz (z. B. Bundesanleihen)">
              {numInput('risikoloserBasiszinssatzProzent', '%')}
            </OrgFeld>
            <OrgFeld label="Immobilienwirtschaftliches Risiko" hinweis="Aufschlag für immobilienspezifische Risiken">
              {numInput('immowirtschaftlichesRisikoProzent', '%')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Ertragsteuern" offen={offen[3]} onToggle={() => toggle(3)}>
            <OrgFeld label="Steuersatz" hinweis="Effektiver Ertragsteuersatz für Berechnungen">
              {numInput('steuersatzProzent', '%')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Verwaltungskosten je WE" offen={offen[4]} onToggle={() => toggle(4)}>
            <OrgFeld label="Wohnungen / Gewerbe" hinweis="Jährliche Verwaltungskosten je Wohn- oder Gewerbeeinheit">
              {numInput('verwaltungskostenWohnenGewerbe', '€/WE')}
            </OrgFeld>
            <OrgFeld label="Garagen" hinweis="Jährliche Verwaltungskosten je Garage oder Stellplatz">
              {numInput('verwaltungskostenGaragen', '€/Garage')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Kostensteigerung" offen={offen[5]} onToggle={() => toggle(5)}>
            <OrgFeld label="Instandhaltung" hinweis="Jährliche Kostensteigerungsrate für Instandhaltung">
              {numInput('kostensteigerungInstandhaltungProzent', '%')}
            </OrgFeld>
            <OrgFeld label="Verwaltungskosten" hinweis="Jährliche Kostensteigerungsrate für Verwaltungskosten">
              {numInput('kostensteigerungVerwaltungskostenProzent', '%')}
            </OrgFeld>
          </Sektion>

          <Sektion titel="Maklerfaktor & Annuitätenberechnung" offen={offen[6]} onToggle={() => toggle(6)}>
            <OrgFeld label="Begrenzung Maklerfaktor" hinweis="Maximaler Faktor für Maklercourtage">
              {numInput('maklerfaktorBegrenzungProzent', '%')}
            </OrgFeld>
            <OrgFeld label="Berechnungsmodus der Annuitäten" hinweis="Basis für die Annuitätenberechnung">
              <select className="es-input"
                value={entwurf.annuitaetenBerechnungsmodus}
                onChange={(e) => set('annuitaetenBerechnungsmodus', e.target.value as 'Ursprungskapital' | 'Restkapital')}>
                <option value="Ursprungskapital">Ursprungskapital</option>
                <option value="Restkapital">Restkapital</option>
              </select>
            </OrgFeld>
          </Sektion>

          <Sektion titel="Verschiebung Tilgungsnachlass" offen={offen[7]} onToggle={() => toggle(7)}>
            <OrgFeld label="Prozentpunkte" hinweis="Verschiebung des Tilgungsnachlasses in Prozentpunkten">
              {numInput('tilgungsnachlassProzentpunkte', 'PP')}
            </OrgFeld>
            <OrgFeld label="Ziel-Jahr" hinweis="Zieljahr für die Tilgungsnachlassverschiebung">
              {numInput('tilgungsnachlassZielJahr', 'Jahr')}
            </OrgFeld>
          </Sektion>
        </div>

        <div className="es-fuss">
          <div className="es-fuss__rechts">
            <button type="button" className="es-btn es-btn--abbrechen"
              onClick={() => { setEntwurf({ ...gespeicherteEinstellungen }); onClose() }}>
              Abbrechen
            </button>
            <button type="button"
              className={`es-btn es-btn--speichern${hatAenderungen ? ' es-btn--speichern-aktiv' : ''}`}
              onClick={() => { gespeicherteEinstellungen = { ...entwurf }; onClose() }}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
