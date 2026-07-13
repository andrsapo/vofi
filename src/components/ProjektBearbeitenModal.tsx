import { useState, useEffect, useRef } from 'react'
import type { Projekt } from '../types'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { uploadBild } from '../data/supabaseRepository'
import { Avatar, Modal, Popover, ZahlenInput, ZugangOverlay } from './ui'
import { formatDatum } from '../utils/format'
import { IconGebaeude } from './icons'

const PROJEKT_TYPEN = ['Modernisierung', 'Neubau', 'Instandhaltung', 'Sanierung', 'Ankauf', 'Sonstiges']
const MAX_SICHTBARE_AVATARE = 5

interface Entwurf {
  name: string
  beschreibung: string
  typ: string
  objektId: string
  betrachtungszeitraumJahre: number
  inflationaereKostensteigerungProzent: number
  zugangsberechtigteIds: string[]
  titelbildUrl: string
}

function entwurfVonProjekt(p: Projekt): Entwurf {
  return {
    name: p.name,
    beschreibung: p.beschreibung,
    typ: p.typ,
    objektId: p.objektId ?? '',
    betrachtungszeitraumJahre: p.betrachtungszeitraumJahre,
    inflationaereKostensteigerungProzent: p.inflationaereKostensteigerungProzent,
    zugangsberechtigteIds: [...p.zugangsberechtigteIds],
    titelbildUrl: p.titelbildUrl ?? '',
  }
}

function entwurfGleich(a: Entwurf, b: Entwurf): boolean {
  return (
    a.name === b.name &&
    a.beschreibung === b.beschreibung &&
    a.typ === b.typ &&
    a.objektId === b.objektId &&
    a.betrachtungszeitraumJahre === b.betrachtungszeitraumJahre &&
    a.inflationaereKostensteigerungProzent === b.inflationaereKostensteigerungProzent &&
    a.titelbildUrl === b.titelbildUrl &&
    a.zugangsberechtigteIds.length === b.zugangsberechtigteIds.length &&
    a.zugangsberechtigteIds.every((id) => b.zugangsberechtigteIds.includes(id))
  )
}

export function ProjektBearbeitenModal({ projekt, onClose }: { projekt: Projekt; onClose: () => void }) {
  const store = useStore()
  const app = useApp()
  const dateiInput = useRef<HTMLInputElement>(null)
  const [titelbildDatei, setTitelbildDatei] = useState<File | undefined>(undefined)
  const [personen, setPersonen] = useState(() => erpRepository.ladePersonen())
  const objekte = erpRepository.ladeObjekte()

  useEffect(() => {
    const handler = () => setPersonen(erpRepository.ladePersonen())
    window.addEventListener('erpchange', handler)
    return () => window.removeEventListener('erpchange', handler)
  }, [])

  const [entwurf, setEntwurf] = useState<Entwurf>(() => entwurfVonProjekt(projekt))
  const [snapshot, setSnapshot] = useState<Entwurf>(() => entwurfVonProjekt(projekt))
  const [fehler, setFehler] = useState<Partial<Record<keyof Entwurf, string>>>({})
  const [zeigeVerwerfenDialog, setZeigeVerwerfenDialog] = useState(false)
  const [zeigeLoeschenDialog, setZeigeLoeschenDialog] = useState(false)
  const [zugangEditorOffen, setZugangEditorOffen] = useState(false)

  const isDirty = !entwurfGleich(entwurf, snapshot)
  const erstelltVonPerson = erpRepository.ladePerson(app.aktuellerNutzerId)

  const zugangsberechtigte = entwurf.zugangsberechtigteIds
    .map((id) => erpRepository.ladePerson(id))
    .filter(Boolean)
  const sichtbarePersonen = zugangsberechtigte.slice(0, MAX_SICHTBARE_AVATARE)
  const weitereAnzahl = zugangsberechtigte.length - sichtbarePersonen.length

  const versucheSchliessen = () => {
    if (isDirty) setZeigeVerwerfenDialog(true)
    else onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') versucheSchliessen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDirty])

  const validiere = (): boolean => {
    const neuerFehler: Partial<Record<keyof Entwurf, string>> = {}
    if (!entwurf.name.trim()) neuerFehler.name = 'Bitte geben Sie einen Projektnamen ein.'
    if (!entwurf.betrachtungszeitraumJahre || entwurf.betrachtungszeitraumJahre <= 0)
      neuerFehler.betrachtungszeitraumJahre = 'Bitte geben Sie einen gültigen Betrachtungszeitraum ein.'
    if (entwurf.inflationaereKostensteigerungProzent < 0)
      neuerFehler.inflationaereKostensteigerungProzent = 'Bitte geben Sie eine gültige Kostensteigerung ein.'
    setFehler(neuerFehler)
    return Object.keys(neuerFehler).length === 0
  }

  const speichern = async () => {
    if (!validiere()) return
    // Alle Werte VOR dem async Upload sichern (React-State-Closure-Problem)
    const aktuellerEntwurf = { ...entwurf }
    let bildUrl: string | null = aktuellerEntwurf.titelbildUrl || null
    const datei = titelbildDatei

    if (datei) {
      const ext = datei.name.split('.').pop() ?? 'jpg'
      const storageUrl = await uploadBild(datei, `titelbilder/${projekt.id}.${ext}`)
      if (storageUrl) bildUrl = storageUrl
      setTitelbildDatei(undefined)
    }

    store.aktualisiereProjekt(projekt.id, {
      name: aktuellerEntwurf.name.trim(),
      beschreibung: aktuellerEntwurf.beschreibung,
      typ: aktuellerEntwurf.typ,
      objektId: aktuellerEntwurf.objektId || null,
      betrachtungszeitraumJahre: aktuellerEntwurf.betrachtungszeitraumJahre,
      inflationaereKostensteigerungProzent: aktuellerEntwurf.inflationaereKostensteigerungProzent,
      zugangsberechtigteIds: aktuellerEntwurf.zugangsberechtigteIds,
      titelbildUrl: bildUrl,
    })
    // Snapshot und Entwurf mit finaler bildUrl aktualisieren
    const neuerSnapshot = { ...aktuellerEntwurf, name: aktuellerEntwurf.name.trim(), titelbildUrl: bildUrl ?? '' }
    setSnapshot(neuerSnapshot)
    setEntwurf(neuerSnapshot)
    setFehler({})
  }

  const loeschen = () => {
    store.loescheProjekt(projekt.id)
    onClose()
  }

  const aendere = <K extends keyof Entwurf>(feld: K, wert: Entwurf[K]) => {
    setEntwurf((prev) => ({ ...prev, [feld]: wert }))
    if (fehler[feld]) setFehler((prev) => ({ ...prev, [feld]: undefined }))
  }

  const handleBildKlick = () => dateiInput.current?.click()

  const handleBildAuswahl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTitelbildDatei(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const result = evt.target?.result
      if (typeof result === 'string') aendere('titelbildUrl', result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const footer = (
    <div className="pb-modal__fuss">
      <button type="button" className="btn btn--gefahr" onClick={() => setZeigeLoeschenDialog(true)}>
        Löschen
      </button>
      <div className="pb-modal__fuss-rechts">
        <button type="button" className="btn" onClick={versucheSchliessen}>
          Abbrechen
        </button>
        <button
          type="button"
          className="btn btn--primaer"
          disabled={!isDirty}
          onClick={speichern}
        >
          Speichern
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Modal titel="Projekt bearbeiten" breite={680} onClose={versucheSchliessen} footer={footer}>
        <div className="projekt-modal">
          {/* Linke Spalte – identisch zu NeuesProjekt */}
          <div className="pb-modal__links">
            <button
              type="button"
              className="projekt-modal__bild"
              onClick={handleBildKlick}
              aria-label="Titelbild hochladen"
              style={{ width: '100%' }}
            >
              {entwurf.titelbildUrl
                ? <img src={entwurf.titelbildUrl} alt="Titelbild" />
                : <IconGebaeude size={48} />
              }
              <input
                ref={dateiInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handleBildAuswahl}
              />
            </button>

            {/* Metadaten – Display-Modus, keine Inputs */}
            <div className="pb-modal__meta">
              <div className="pb-modal__meta-zeile">
                <span className="pb-modal__meta-label">Erstellt von</span>
                <span className="pb-modal__meta-wert">{erstelltVonPerson?.name ?? '–'}</span>
              </div>
              <div className="pb-modal__meta-zeile">
                <span className="pb-modal__meta-label">Erstellt am</span>
                <span className="pb-modal__meta-wert">{formatDatum(projekt.erstelltAm)}</span>
              </div>
              <div className="pb-modal__meta-zeile">
                <span className="pb-modal__meta-label">Letzte Änderung</span>
                <span className="pb-modal__meta-wert">
                  {projekt.aktualisiertAm ? formatDatum(projekt.aktualisiertAm) : formatDatum(projekt.erstelltAm)}
                </span>
              </div>
              <div className="pb-modal__meta-zeile">
                <span className="pb-modal__meta-label">Version</span>
                <span className="pb-modal__meta-wert">v1.0</span>
              </div>
            </div>
          </div>

          {/* Rechte Spalte – identische Komponenten wie NeuesProjekt */}
          <div className="projekt-modal__felder">
            <label className="formfeld">
              <span className="formfeld__label">Projektname</span>
              <input
                type="text"
                className={fehler.name ? 'text-input--fehler' : undefined}
                value={entwurf.name}
                onChange={(e) => aendere('name', e.target.value)}
              />
              {fehler.name && <span className="formfeld__fehler">{fehler.name}</span>}
            </label>

            <label className="formfeld">
              <span className="formfeld__label">Beschreibung</span>
              <textarea
                rows={3}
                value={entwurf.beschreibung}
                onChange={(e) => aendere('beschreibung', e.target.value)}
              />
            </label>

            <label className="formfeld">
              <span className="formfeld__label">Typ</span>
              <select value={entwurf.typ} onChange={(e) => aendere('typ', e.target.value)}>
                {PROJEKT_TYPEN.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label className="formfeld">
              <span className="formfeld__label">Objekt</span>
              <select value={entwurf.objektId} onChange={(e) => aendere('objektId', e.target.value)}>
                <option value="">– kein Objekt –</option>
                {objekte.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>

            <div className="formzeile">
              <label className="formfeld">
                <span className="formfeld__label">Betrachtungszeitraum</span>
                <ZahlenInput
                  wert={entwurf.betrachtungszeitraumJahre}
                  onWert={(v) => aendere('betrachtungszeitraumJahre', Math.max(1, v))}
                  nachkommastellen={0}
                  einheit="Jahre"
                  ariaLabel="Betrachtungszeitraum in Jahren"
                />
                {fehler.betrachtungszeitraumJahre && (
                  <span className="formfeld__fehler">{fehler.betrachtungszeitraumJahre}</span>
                )}
              </label>
              <label className="formfeld">
                <span className="formfeld__label">Inflationäre Kostensteigerung</span>
                <ZahlenInput
                  wert={entwurf.inflationaereKostensteigerungProzent}
                  onWert={(v) => aendere('inflationaereKostensteigerungProzent', Math.max(0, v))}
                  nachkommastellen={0}
                  einheit="%"
                  ariaLabel="Inflationäre Kostensteigerung in Prozent"
                />
                {fehler.inflationaereKostensteigerungProzent && (
                  <span className="formfeld__fehler">{fehler.inflationaereKostensteigerungProzent}</span>
                )}
              </label>
            </div>

            {/* Zugangsberechtigte – Popover wie in NeuesProjekt */}
            <div className="formfeld" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="formfeld__label">Zugangsberechtigte</span>
                <button type="button" className="link-btn" onClick={() => setZugangEditorOffen(true)}>
                  Bearbeiten
                </button>
              </div>
              <span className="zugang__avatare">
                {sichtbarePersonen.map((p) => p && <Avatar key={p.id} person={p} size={28} />)}
                {weitereAnzahl > 0 && <span className="pb-modal__zugang-mehr">+{weitereAnzahl}</span>}
              </span>
              {zugangEditorOffen && (
                <ZugangOverlay
                  personen={personen}
                  ausgewaehlteIds={entwurf.zugangsberechtigteIds}
                  gesperrteId={app.aktuellerNutzerId}
                  onFertig={(ids) => { aendere('zugangsberechtigteIds', ids); setZugangEditorOffen(false) }}
                  onAbbrechen={() => setZugangEditorOffen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {zeigeVerwerfenDialog && (
        <Modal
          titel="Änderungen verwerfen?"
          breite={420}
          onClose={() => setZeigeVerwerfenDialog(false)}
          footer={
            <div className="pb-modal__fuss pb-modal__fuss--zentriert">
              <button type="button" className="btn" onClick={() => setZeigeVerwerfenDialog(false)}>
                Weiter bearbeiten
              </button>
              <button
                type="button"
                className="btn btn--gefahr"
                onClick={() => { setZeigeVerwerfenDialog(false); onClose() }}
              >
                Änderungen verwerfen
              </button>
            </div>
          }
        >
          <p>Sie haben ungespeicherte Änderungen.</p>
        </Modal>
      )}

      {zeigeLoeschenDialog && (
        <Modal
          titel="Projekt löschen?"
          breite={420}
          onClose={() => setZeigeLoeschenDialog(false)}
          footer={
            <div className="pb-modal__fuss pb-modal__fuss--zentriert">
              <button type="button" className="btn" onClick={() => setZeigeLoeschenDialog(false)}>
                Abbrechen
              </button>
              <button type="button" className="btn btn--gefahr" onClick={loeschen}>
                Löschen
              </button>
            </div>
          }
        >
          <p>Möchten Sie das Projekt „{projekt.name}" wirklich löschen?</p>
          <p className="pb-modal__loeschen-warnung">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        </Modal>
      )}
    </>
  )
}
