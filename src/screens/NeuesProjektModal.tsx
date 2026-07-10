/** Modal "Neues Projekt" (Folie 7): Pflichtfeld-Validierung, Objektauswahl nur bei Bestand */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Investitionsart } from '../types'
import { erpRepository } from '../data/erpRepository'
import { gespeicherteEinstellungen } from '../components/OrganisationseinstellungModal'
import { useApp, useStore } from '../state/store'
import { Avatar, Modal, Popover, ZahlenInput, ZugangOverlay } from '../components/ui'
import { IconGebaeude } from '../components/icons'

// Typ-Optionen je Investitionsart; der Typ steuert die Sichtbarkeit von "Objekt"
const TYPEN: Record<Investitionsart, string[]> = {
  Bestand: ['Modernisierung', 'Sanierung', 'Instandsetzung'],
  Erwerb: ['Erwerb'],
  Neubau: ['Neubau'],
}

export function NeuesProjektModal({
  investitionsart,
  onClose,
}: {
  investitionsart: Investitionsart
  onClose: () => void
}) {
  const app = useApp()
  const store = useStore()
  const objekte = erpRepository.ladeObjekte()
  const [personen, setPersonen] = useState(() => erpRepository.ladePersonen())

  useEffect(() => {
    const handler = () => setPersonen(erpRepository.ladePersonen())
    window.addEventListener('erpchange', handler)
    return () => window.removeEventListener('erpchange', handler)
  }, [])

  const vorschlag = useMemo(
    () => `Neue Investitionsrechnung ${app.projekte.length + 1}`,
    [app.projekte.length],
  )

  const [name, setName] = useState(vorschlag)
  const [beschreibung, setBeschreibung] = useState('')
  const [typ, setTyp] = useState(TYPEN[investitionsart][0])
  const [objektId, setObjektId] = useState('')
  const [zeitraum, setZeitraum] = useState(() => gespeicherteEinstellungen.betrachtungszeitraumJahre)
  const [inflation, setInflation] = useState(3)
  const [zugang, setZugang] = useState<string[]>([app.aktuellerNutzerId])
  const [zugangEditorOffen, setZugangEditorOffen] = useState(false)
  const [titelbildUrl, setTitelbildUrl] = useState<string | undefined>(undefined)
  // Automatische Namensableitung aus Objekt + Typ (Folie: "Wilhelmplatz 3 - Sanierung").
  // Sobald der Anwender den Namen selbst bearbeitet, wird die Auto-Belegung dauerhaft deaktiviert.
  const [nameAutomatisch, setNameAutomatisch] = useState(true)
  const dateiInput = useRef<HTMLInputElement>(null)

  const brauchtObjekt = investitionsart === 'Bestand'

  // Vorschlag aktualisieren, solange der Anwender den Projektnamen nicht selbst geändert hat.
  useEffect(() => {
    if (!nameAutomatisch) return
    if (brauchtObjekt && objektId) {
      const objekt = erpRepository.ladeObjekt(objektId)
      if (objekt) {
        setName(`${objekt.name} - ${typ}`)
        return
      }
    }
    setName(vorschlag)
  }, [nameAutomatisch, brauchtObjekt, objektId, typ, vorschlag])

  // Pflichtfelder laut Prompt-Tabelle; Wertebereiche als ANNAHME minimal gehalten
  // (Spezifikation Abschnitt 8: genaue Validierung noch offen).
  const gueltig =
    name.trim().length > 0 &&
    typ.trim().length > 0 &&
    (!brauchtObjekt || objektId !== '') &&
    zeitraum > 0 &&
    inflation >= 0 &&
    zugang.length > 0

  const erstellen = () => {
    if (!gueltig) return
    store.erstelleProjekt({
      name: name.trim(),
      beschreibung,
      typ,
      investitionsart,
      objektId: brauchtObjekt ? objektId : null,
      betrachtungszeitraumJahre: zeitraum,
      inflationaereKostensteigerungProzent: inflation,
      zugangsberechtigteIds: zugang,
      titelbildUrl,
    })
  }

  return (
    <Modal
      titel="Neues Projekt"
      breite={680}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn--primaer" disabled={!gueltig} onClick={erstellen}>
            Neues Projekt erstellen
          </button>
        </>
      }
    >
      <div className="projekt-modal">
        <button
          type="button"
          className="projekt-modal__bild"
          onClick={() => dateiInput.current?.click()}
          aria-label="Titelbild hochladen"
        >
          {titelbildUrl ? <img src={titelbildUrl} alt="Titelbild" /> : <IconGebaeude size={48} />}
          <input
            ref={dateiInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const datei = e.target.files?.[0]
              if (datei) setTitelbildUrl(URL.createObjectURL(datei))
            }}
          />
        </button>

        <div className="projekt-modal__felder">
          <label className="formfeld">
            <span className="formfeld__label">Projektname</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                // Sobald der Anwender den Namen manuell ändert, keine Auto-Aktualisierung mehr.
                if (nameAutomatisch) setNameAutomatisch(false)
              }}
            />
          </label>

          <label className="formfeld">
            <span className="formfeld__label">Beschreibung</span>
            <textarea
              rows={3}
              placeholder="Kurze Beschreibung des Projekts"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
            />
          </label>

          <label className="formfeld">
            <span className="formfeld__label">Typ</span>
            <select value={typ} onChange={(e) => setTyp(e.target.value)}>
              {TYPEN[investitionsart].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          {/* Objekt nur bei Bestand; bei Erwerb/Neubau ausgeblendet (ANNAHME Abschnitt 8) */}
          {brauchtObjekt && (
            <label className="formfeld">
              <span className="formfeld__label">Objekt</span>
              <select value={objektId} onChange={(e) => setObjektId(e.target.value)}>
                <option value="" disabled>
                  Wählen Sie ein Objekt
                </option>
                {objekte.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="formzeile">
            <label className="formfeld">
              <span className="formfeld__label">Betrachtungszeitraum</span>
              <ZahlenInput wert={zeitraum} onWert={setZeitraum} nachkommastellen={0} einheit="Jahre" />
            </label>
            <label className="formfeld">
              <span className="formfeld__label">Inflationäre Kostensteigerung</span>
              <ZahlenInput wert={inflation} onWert={setInflation} nachkommastellen={0} einheit="%" />
            </label>
          </div>

          <div className="formfeld" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="formfeld__label">Zugangsberechtigte</span>
              <button type="button" className="link-btn" onClick={() => setZugangEditorOffen(true)}>
                Bearbeiten
              </button>
            </div>
            <span className="zugang__avatare">
              {zugang.map((id) => {
                const p = erpRepository.ladePerson(id)
                return p ? <Avatar key={id} person={p} size={28} /> : null
              })}
            </span>
            {zugangEditorOffen && (
              <ZugangOverlay
                personen={personen}
                ausgewaehlteIds={zugang}
                gesperrteId={app.aktuellerNutzerId}
                onFertig={(ids) => { setZugang(ids); setZugangEditorOffen(false) }}
                onAbbrechen={() => setZugangEditorOffen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
