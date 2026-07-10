/** Linke Hauptnavigation (dunkles Navy, Folie 1) */

import { useEffect, useRef, useState } from 'react'
import {
  persoenlicheUngeleseneAufgaben,
  szenarienFuerProjekt,
  ungeleseneBerichte,
  useApp,
  useStore,
} from '../state/store'
import {
  IconAufgaben,
  IconBericht,
  IconChevronLinks,
  IconDashboard,
  IconHilfe,
  IconPlusKreis,
  IconRisiko,
  IconSuche,
  IconZahnrad,
  IconChevronOben,
} from './icons'
import { UserManagementModal } from './UserManagementModal'
import { OrganisationseinstellungModal } from './OrganisationseinstellungModal'
import { SystemeinstellungModal } from './SystemeinstellungModal'

export function Sidebar() {
  const app = useApp()
  const store = useStore()
  const route = app.route
  const [offen, setOffen] = useState(true)
  const [sektionOffen, setSektionOffen] = useState(true)
  const [einstellungenMenuOffen, setEinstellungenMenuOffen] = useState(false)
  const [userMgmtOffen, setUserMgmtOffen] = useState(false)
  const [orgEinstellungOffen, setOrgEinstellungOffen] = useState(false)
  const [sysEinstellungOffen, setSysEinstellungOffen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [sidebarBreite, setSidebarBreite] = useState(248)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startBreite = useRef(248)

  function onDragStart(e: React.MouseEvent) {
    if (!offen) return
    isDragging.current = true
    startX.current = e.clientX
    startBreite.current = sidebarBreite
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return
      const delta = ev.clientX - startX.current
      const neu = Math.max(180, Math.min(400, startBreite.current + delta))
      setSidebarBreite(neu)
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

  const anzahlBerichte = ungeleseneBerichte(app).length
  const anzahlAufgaben = persoenlicheUngeleseneAufgaben(app, app.aktuellerNutzerId).length

  const toggle = () => setOffen((v) => !v)

  const oeffneProjekt = (projektId: string) => {
    const basis = szenarienFuerProjekt(app, projektId)[0]
    if (basis) store.navigiere({ view: 'projekt', projektId, szenarioId: basis.id, schritt: 1 })
  }

  useEffect(() => {
    if (!einstellungenMenuOffen) return
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return
      setEinstellungenMenuOffen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [einstellungenMenuOffen])

  return (
    <aside
      className={`sidebar${offen ? '' : ' sidebar--kollabiert'}`}
      style={offen ? { width: sidebarBreite } : undefined}
    >
      <div className="sidebar__drag-handle" onMouseDown={onDragStart} />

      {/* Logo – Kreis ist zusätzlicher Toggle (Punkt 4, Variante A) */}
      <div className="sidebar__logo">
        <button
          type="button"
          className="sidebar__logo-kreis"
          onClick={toggle}
          aria-label={offen ? 'Navigation einklappen' : 'Navigation erweitern'}
          title={offen ? 'Navigation einklappen' : 'Navigation erweitern'}
        >
          immo
        </button>
        {offen && <span className="sidebar__logo-text">logy</span>}
      </div>

      <nav className="sidebar__nav">
        <button
          type="button"
          className={`sidebar__item${route.view === 'dashboard' ? ' sidebar__item--aktiv' : ''}`}
          onClick={() => store.navigiere({ view: 'dashboard' })}
          title={offen ? undefined : 'Dashboard'}
        >
          <IconDashboard />
          {offen && <span>Dashboard</span>}
        </button>
        <button
          type="button"
          className={`sidebar__item${route.view === 'berichte' || route.view === 'bericht' ? ' sidebar__item--aktiv' : ''}`}
          onClick={() => store.navigiere({ view: 'berichte' })}
          title={offen ? undefined : 'Berichte'}
        >
          <IconBericht />
          {offen && <span>Berichte</span>}
          {anzahlBerichte > 0 && <span className="sidebar__badge">+{anzahlBerichte}</span>}
        </button>
        <button
          type="button"
          className={`sidebar__item${route.view === 'aufgaben' ? ' sidebar__item--aktiv' : ''}`}
          onClick={() => store.navigiere({ view: 'aufgaben' })}
          title={offen ? undefined : 'Aufgaben'}
        >
          <IconAufgaben />
          {offen && <span>Aufgaben</span>}
          {anzahlAufgaben > 0 && <span className="sidebar__badge">+{anzahlAufgaben}</span>}
        </button>
        <button type="button" className="sidebar__item sidebar__item--deko" title="Nicht Teil dieser Ausbaustufe">
          <IconRisiko />
          {offen && <span>Risikomanagement</span>}
        </button>
        <button type="button" className="sidebar__item sidebar__item--deko" title="Nicht Teil dieser Ausbaustufe">
          <IconHilfe />
          {offen && <span>Hilfe</span>}
        </button>
      </nav>

      {offen && (
        <div className="sidebar__suche">
          <input type="text" placeholder="Projekte und Pläne suchen" aria-label="Projekte und Pläne suchen" />
          <IconSuche size={15} />
        </div>
      )}

      {offen && (
        <div className="sidebar__baum">
          <div className="sidebar__sektion">
            <button
              type="button"
              className="sidebar__sektion-kopf"
              onClick={() => setSektionOffen((v) => !v)}
              aria-expanded={sektionOffen}
            >
              <IconChevronOben size={13} style={{ transform: sektionOffen ? undefined : 'rotate(180deg)', transition: 'transform 0.15s' }} />
              <span>Investitionsrechnungen</span>
              <button
                type="button"
                className="icon-btn icon-btn--hell"
                aria-label="Neue Investitionsrechnung"
                onClick={(e) => { e.stopPropagation(); store.navigiere({ view: 'assistent' }) }}
              >
                <IconPlusKreis size={15} />
              </button>
            </button>
            {sektionOffen && app.projekte.map((p) => {
              const aktiv =
                (route.view === 'projekt' && route.projektId === p.id) ||
                (route.view === 'analyse' && route.projektId === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`sidebar__eintrag${aktiv ? ' sidebar__eintrag--aktiv' : ''}`}
                  onClick={() => oeffneProjekt(p.id)}
                >
                  <span className="sidebar__punkt" style={{ background: '#2fae7e' }} />
                  <span className="sidebar__eintrag-name">{p.name}</span>
                  <span className="sidebar__eintrag-anzahl">{szenarienFuerProjekt(app, p.id).length}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Fuss: immer unten verankert (margin-top: auto) */}
      <div className="sidebar__fuss">
        <div className="sidebar__einstellungen-wrapper" ref={menuRef}>
          {einstellungenMenuOffen && (
            <div className="sidebar__einstellungen-menu">
              <button
                type="button"
                className="sidebar__einstellungen-option"
                onClick={() => { setEinstellungenMenuOffen(false); setSysEinstellungOffen(true) }}
              >
                Systemeinstellung
              </button>
              <button
                type="button"
                className="sidebar__einstellungen-option"
                onClick={() => { setEinstellungenMenuOffen(false); setOrgEinstellungOffen(true) }}
              >
                Organisationseinstellung
              </button>
              <button
                type="button"
                className="sidebar__einstellungen-option"
                onClick={() => { setEinstellungenMenuOffen(false); setUserMgmtOffen(true) }}
              >
                User Management
              </button>
            </div>
          )}
          <button
            type="button"
            className={`sidebar__item${einstellungenMenuOffen ? ' sidebar__item--aktiv' : ''}`}
            onClick={() => setEinstellungenMenuOffen((v) => !v)}
            title={offen ? undefined : 'Einstellungen'}
            aria-haspopup="true"
            aria-expanded={einstellungenMenuOffen}
          >
            <IconZahnrad />
            {offen && <span>Einstellungen</span>}
          </button>
        </div>

        {/* Collapse-Button: Pfeil verschwindet nie (Punkt 2) */}
        <button
          type="button"
          className="sidebar__collapse-btn"
          onClick={toggle}
          title={offen ? 'Navigation einklappen' : 'Navigation ausklappen'}
          aria-label={offen ? 'Navigation einklappen' : 'Navigation ausklappen'}
        >
          <IconChevronLinks
            size={15}
            style={{
              transform: offen ? 'none' : 'rotate(180deg)',
              transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
            }}
          />
          {offen && <span>Navigation einklappen</span>}
        </button>
      </div>

      {userMgmtOffen && <UserManagementModal onClose={() => setUserMgmtOffen(false)} />}
      {orgEinstellungOffen && <OrganisationseinstellungModal onClose={() => setOrgEinstellungOffen(false)} />}
      {sysEinstellungOffen && <SystemeinstellungModal onClose={() => setSysEinstellungOffen(false)} />}
    </aside>
  )
}
