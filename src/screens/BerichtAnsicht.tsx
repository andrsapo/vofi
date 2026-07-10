/**
 * Berichtsansicht + Sende-Popup (Folien 32–35): Blick-Umschalter AR/Manager/
 * Berater (identischer Inhalt, ANNAHME Abschnitt 8), Auswertungstabelle,
 * Diagramme mit Stub-Daten, Datei-Anhänge, Versand mit Statuswechsel "Gesendet".
 */

import { useEffect, useRef, useState } from 'react'
import type { Bericht, Rolle } from '../types'
import { berechnung } from '../calc/berechnung'
import { BalkenGruppe, LinienDiagramm } from '../components/charts'
import {
  IconCheckKreis,
  IconChevronLinks,
  IconDownload,
  IconPapierkorb,
  IconPlus,
  IconSchliessen,
  IconSenden,
  IconStift,
} from '../components/icons'
import { Avatar, StatusBadge } from '../components/ui'
import { erpRepository } from '../data/erpRepository'
import { szenarienFuerProjekt, useApp, useStore } from '../state/store'
import { NutzerBereich } from '../components/TopBar'
import { formatZahl } from '../utils/format'
import { AuswertungsTabelle } from './SzenarienAnalyse'

const BLICKE: ('AR' | 'Manager' | 'Berater')[] = ['AR', 'Manager', 'Berater']

export function BerichtAnsicht({ bericht }: { bericht: Bericht }) {
  const app = useApp()
  const store = useStore()
  const projekt = app.projekte.find((p) => p.id === bericht.projektId)
  const [blick, setBlick] = useState<(typeof BLICKE)[number]>('AR')
  const [sendePopupOffen, setSendePopupOffen] = useState(false)
  const dateiInput = useRef<HTMLInputElement>(null)
  const [anhaengeBreite, setAnhaengeBreite] = useState(250)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startBreite = useRef(250)

  function onDragStart(e: React.MouseEvent) {
    isDragging.current = true
    startX.current = e.clientX
    startBreite.current = anhaengeBreite
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return
      const delta = startX.current - ev.clientX
      setAnhaengeBreite(Math.max(180, Math.min(500, startBreite.current + delta)))
    }
    function onUp() {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Bericht als gelesen markieren, sobald der Benutzer die Detailansicht öffnet.
  // Der Zähler-Badge in der Sidebar reduziert sich dadurch automatisch.
  useEffect(() => {
    if (bericht.isRead === false) store.markiereBerichtGelesen(bericht.id)
  }, [bericht.id, bericht.isRead, store])

  if (!projekt) return null
  const szenarien = szenarienFuerProjekt(app, projekt.id)
  const jahre = projekt.betrachtungszeitraumJahre
  const objektName = app.objektIst[projekt.id]?.name.wert ?? projekt.name

  return (
    <div className="seite">
      <header className="topbar">
        <div className="topbar__links">
          <button
            type="button"
            className="icon-btn"
            aria-label="Zurück zur Analyse"
            onClick={() => store.navigiere({ view: 'analyse', projektId: projekt.id })}
          >
            <IconChevronLinks size={18} />
          </button>
          <span className="topbar__titel">{projekt.name}</span>
          <StatusBadge status={bericht.status} />
        </div>
        <div className="topbar__rechts">
          <button type="button" className="icon-btn icon-btn--rahmen" title="Bearbeiten (dekorativ)">
            <IconStift size={16} />
          </button>
          <button type="button" className="icon-btn icon-btn--rahmen" title="Herunterladen (dekorativ)">
            <IconDownload size={16} />
          </button>
          {bericht.status === 'Gesendet' ? (
            <button type="button" className="btn btn--gesendet" onClick={() => setSendePopupOffen(!sendePopupOffen)}>
              <IconCheckKreis size={16} /> Gesendet
            </button>
          ) : (
            <button type="button" className="btn btn--primaer" onClick={() => setSendePopupOffen(true)}>
              <IconSenden size={15} /> Bericht senden
            </button>
          )}
          <NutzerBereich />
        </div>
      </header>

      <div className="bericht">
        <div className="bericht__inhalt">
          <div className="bericht__kopf">
            {/* ANNAHME (Abschnitt 8): identischer Inhalt für alle drei Blicke */}
            <h1>
              {blick} Bericht. {objektName}
            </h1>
            <div className="bericht__blick">
              <span>Blick:</span>
              <div className="segment">
                {BLICKE.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`segment__option${blick === b ? ' segment__option--aktiv' : ''}`}
                    onClick={() => setBlick(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AuswertungsTabelle projekt={projekt} szenarien={szenarien} kompakt />

          <div className="bericht__charts">
            <LinienDiagramm
              titel="Jahresergebnisse"
              serien={szenarien.map((s, i) => ({ name: s.name, werte: berechnung.jahresergebnisse(i, jahre) }))}
            />
            <LinienDiagramm
              titel="Cashflows"
              serien={szenarien.map((s, i) => ({ name: s.name, werte: berechnung.cashflows(i, jahre) }))}
            />
          </div>

          <div className="bericht__balken karte">
            <BalkenGruppe
              titel="Eigenkapitalrendite"
              eintraege={szenarien.map((s, i) => ({
                name: s.name,
                wert: berechnung.eigenkapitalrendite(i),
                zeigeLabel: i > 0,
              }))}
              maxWert={5}
              labelFormat={(w) => `${formatZahl(w, 1)}%`}
            />
            <BalkenGruppe
              titel="Endwert am Ende des Betrachtungszeitraums"
              eintraege={szenarien.map((s, i) => ({
                name: s.name,
                wert: berechnung.endwert(i),
                zeigeLabel: i > 0,
              }))}
              maxWert={8}
              labelFormat={(w) => `${formatZahl(w, 1)}%`}
            />
          </div>
        </div>

        <aside className="bericht__anhaenge" style={{ width: anhaengeBreite }}>
          <div className="bericht__anhaenge-drag-handle" onMouseDown={onDragStart} />
          <button type="button" className="link-btn" onClick={() => dateiInput.current?.click()}>
            <IconPlus size={15} /> Ordner oder Dokument hinzufügen
          </button>
          <input
            ref={dateiInput}
            type="file"
            hidden
            onChange={(e) => {
              const datei = e.target.files?.[0]
              if (datei) store.fuegeBerichtAnhangHinzu(bericht.id, datei.name, datei.size)
              e.target.value = ''
            }}
          />
          {bericht.anhaenge.map((a) => (
            <div key={a.id} className="bericht__anhang">
              <span className="bericht__anhang-name">{a.name}</span>
              <small>{formatZahl(a.groesseBytes / 1024, 1)} KB</small>
              <button
                type="button"
                className="icon-btn"
                aria-label={`${a.name} entfernen`}
                onClick={() => store.entferneBerichtAnhang(bericht.id, a.id)}
              >
                <IconPapierkorb size={14} />
              </button>
            </div>
          ))}
        </aside>
      </div>

      {sendePopupOffen && <SendePopup bericht={bericht} onClose={() => setSendePopupOffen(false)} />}
    </div>
  )
}

/** Popup "Senden eines Berichts" (Folien 33–35) */
function SendePopup({ bericht, onClose }: { bericht: Bericht; onClose: () => void }) {
  const store = useStore()
  const [auswahl, setAuswahl] = useState<string[]>(bericht.empfaenger.map((e) => e.personId))
  const gesendet = bericht.status === 'Gesendet'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const gruppen: { titel: string; rolle: Rolle }[] = [
    { titel: 'AR', rolle: 'AR' },
    { titel: 'Managers', rolle: 'Manager' },
    { titel: 'Beraterteam', rolle: 'Berater' },
  ]

  const umschalten = (personId: string) =>
    setAuswahl((a) => (a.includes(personId) ? a.filter((x) => x !== personId) : [...a, personId]))

  return (
    <div className="sende-popup">
      <div className="sende-popup__kopf">
        <strong>Senden eines Berichts</strong>
        <button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose}>
          <IconSchliessen size={16} />
        </button>
      </div>

      <div className="sende-popup__liste">
        {gruppen.map((gruppe) => (
          <div key={gruppe.rolle} className="sende-popup__gruppe">
            <label className="checkzeile checkzeile--gruppe">
              <input
                type="checkbox"
                checked={erpRepository.ladePersonenNachRolle(gruppe.rolle).every((p) => auswahl.includes(p.id))}
                onChange={(e) => {
                  const ids = erpRepository.ladePersonenNachRolle(gruppe.rolle).map((p) => p.id)
                  setAuswahl((a) =>
                    e.target.checked ? [...new Set([...a, ...ids])] : a.filter((x) => !ids.includes(x)),
                  )
                }}
              />
              <strong>{gruppe.titel}</strong>
            </label>
            {erpRepository.ladePersonenNachRolle(gruppe.rolle).map((p) => (
              <label key={p.id} className="checkzeile checkzeile--person">
                <input type="checkbox" checked={auswahl.includes(p.id)} onChange={() => umschalten(p.id)} />
                <Avatar person={p} size={24} />
                {p.name}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="sende-popup__fuss">
        <button type="button" className="btn" onClick={onClose}>
          Abbrechen
        </button>
        {gesendet ? (
          // Erneuter Klick schließt das Popup (Folie 35)
          <button type="button" className="btn btn--gesendet" onClick={onClose}>
            <IconCheckKreis size={16} /> Gesendet
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primaer"
            disabled={auswahl.length === 0}
            onClick={() => store.sendeBericht(bericht.id, auswahl)}
          >
            Bericht senden
          </button>
        )}
      </div>
    </div>
  )
}
