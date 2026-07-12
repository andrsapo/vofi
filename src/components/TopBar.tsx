/** Obere Leiste: einfache Variante (Breadcrumb) und Projekt-Variante mit
 * "Grafiken"/"Kommentare" (Folien 4 und 9). */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BENACHRICHTIGUNGEN_SEED } from '../data/benachrichtigungen'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { useAuthContext } from '../auth/AuthContext'
import { Avatar, StatusBadge } from './ui'
import { BenachrichtigungenPanel } from './BenachrichtigungenPanel'
import { MeinProfilModal } from './MeinProfilModal'
import type { Projekt } from '../types'
import { ProjektBearbeitenModal } from './ProjektBearbeitenModal'
import {
  IconChevronLinks,
  IconGlocke,
  IconGrafik,
  IconKommentar,
  IconMehr,
  IconVerlauf,
  IconZahnrad,
} from './icons'

export function NutzerBereich() {
  const app = useApp()
  const { signOut } = useAuthContext()
  const [nutzer, setNutzer] = useState(() => erpRepository.ladePerson(app.aktuellerNutzerId))
  const [panelOffen, setPanelOffen] = useState(false)
  const [menuOffen, setMenuOffen] = useState(false)
  const [profilOffen, setProfilOffen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const ungelesen = BENACHRICHTIGUNGEN_SEED.filter((n) => !n.read).length

  useEffect(() => {
    const handler = () => setNutzer(erpRepository.ladePerson(app.aktuellerNutzerId))
    window.addEventListener('erpchange', handler)
    return () => window.removeEventListener('erpchange', handler)
  }, [app.aktuellerNutzerId])

  useEffect(() => {
    if (!menuOffen) return
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return
      setMenuOffen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [menuOffen])

  return (
    <div className="topbar__nutzer">
      <button
        type="button"
        className="icon-btn topbar__glocke"
        title="Benachrichtigungen"
        aria-label={`Benachrichtigungen (${ungelesen} ungelesen)`}
        onClick={() => setPanelOffen(true)}
      >
        <IconGlocke size={18} />
        {ungelesen > 0 && <span className="topbar__glocke-punkt" />}
      </button>
      {nutzer && (
        <div className="topbar__profil-wrapper" ref={menuRef}>
          <button
            type="button"
            className="topbar__profil"
            onClick={() => setMenuOffen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOffen}
          >
            <Avatar person={nutzer} size={28} />
            <span>{nutzer.name}</span>
          </button>
          {menuOffen && (
            <div className="topbar__profil-menu">
              <button type="button" className="topbar__profil-option"
                onClick={() => { setMenuOffen(false); setProfilOffen(true) }}>
                Mein Profil
              </button>
              <button type="button" className="topbar__profil-option topbar__profil-option--abmelden"
                onClick={() => { setMenuOffen(false); signOut() }}>
                Abmelden
              </button>
            </div>
          )}
        </div>
      )}
      {panelOffen && (
        <BenachrichtigungenPanel eintraege={BENACHRICHTIGUNGEN_SEED} onClose={() => setPanelOffen(false)} />
      )}
      {profilOffen && nutzer && (
        <MeinProfilModal nutzerId={nutzer.id} onClose={() => setProfilOffen(false)} />
      )}
    </div>
  )
}

export function TopBar({
  titel,
  titelZusatz,
  onZurueck,
  rechts,
}: {
  titel: string
  /** Optionales Element rechts neben dem Titel (z. B. Widget-Auswahl-Button). */
  titelZusatz?: ReactNode
  onZurueck?: () => void
  rechts?: ReactNode
}) {
  return (
    <header className="topbar">
      <div className="topbar__links">
        {onZurueck && (
          <button type="button" className="icon-btn" onClick={onZurueck} aria-label="Zurück">
            <IconChevronLinks size={18} />
          </button>
        )}
        <span className="topbar__titel">{titel}</span>
        {titelZusatz}
      </div>
      <div className="topbar__rechts">
        {rechts}
        <NutzerBereich />
      </div>
    </header>
  )
}

export function ProjektTopBar({ projekt, onZurueck }: { projekt: Projekt; onZurueck: () => void }) {
  const app = useApp()
  const store = useStore()
  const [dropdownOffen, setDropdownOffen] = useState(false)
  const [modalOffen, setModalOffen] = useState(false)
  return (
    <>
      <header className="topbar">
        <div className="topbar__links">
          <button type="button" className="icon-btn" onClick={onZurueck} aria-label="Zurück zum Dashboard">
            <IconChevronLinks size={18} />
          </button>
          <span className="topbar__titel">{projekt.name}</span>
          <div className="topbar__dropdown-wrapper">
            <button
              type="button"
              className="icon-btn"
              title="Weitere Aktionen"
              aria-label="Projektoptionen"
              onClick={() => setDropdownOffen((v) => !v)}
            >
              <IconMehr size={16} />
            </button>
            {dropdownOffen && (
              <>
                <div className="topbar__dropdown-overlay" onClick={() => setDropdownOffen(false)} />
                <div className="topbar__dropdown">
                  <button
                    type="button"
                    className="topbar__dropdown-eintrag"
                    onClick={() => { setDropdownOffen(false); setModalOffen(true) }}
                  >
                    <IconZahnrad size={15} /> Projekt bearbeiten
                  </button>
                  <hr className="topbar__dropdown-trennlinie" />
                  <button
                    type="button"
                    className="topbar__dropdown-eintrag"
                    onClick={() => { setDropdownOffen(false); console.log('Versionsverlauf – Platzhalter') }}
                  >
                    <IconVerlauf size={15} /> Versionsverlauf
                  </button>
                </div>
              </>
            )}
          </div>
          <StatusBadge status="Bearbeitung möglich" />
        </div>
        <div className="topbar__rechts">
          <button type="button" className="topbar__aktion" onClick={() => store.setzeGrafikenPopup(true)}>
            <IconGrafik size={17} /> Grafiken
          </button>
          <button
            type="button"
            className={`topbar__aktion${app.ui.rechtePanelAnsicht === 'kommentare' ? ' topbar__aktion--aktiv' : ''}`}
            onClick={() =>
              app.ui.rechtePanelAnsicht === 'kommentare' ? store.schliesseKommentare() : store.oeffneKommentare()
            }
          >
            <IconKommentar size={17} /> Kommentare
            {app.ui.kommentareUngelesen && <span className="topbar__ungelesen" aria-label="Ungelesene Kommentare" />}
          </button>
          <div className="topbar__beteiligte">
            {erpRepository
              .ladePersonen()
              .filter((p) => ['p-anna', 'p-robert'].includes(p.id))
              .map((p) => (
                <Avatar key={p.id} person={p} size={26} />
              ))}
          </div>
          <NutzerBereich />
        </div>
      </header>
      {modalOffen && <ProjektBearbeitenModal projekt={projekt} onClose={() => setModalOffen(false)} />}
    </>
  )
}
