/**
 * Benachrichtigungscenter (Slide-in-Panel rechts).
 * Trigger: Glocken-Symbol in der TopBar. Schließt via X-Button, Klick auf
 * Overlay oder ESC-Taste. Statische Platzhalter-Daten (siehe
 * data/benachrichtigungen.ts) – Filter- und Suchlogik sind bewusst simpel
 * gehalten und operieren rein auf dem geladenen Array.
 */

import { useEffect, useMemo, useState } from 'react'
import type { Benachrichtigung, BenachrichtigungTyp } from '../data/benachrichtigungen'
import { erpRepository } from '../data/erpRepository'
import { Avatar, Popover } from './ui'
import { IconFilter, IconGebaeude, IconSchliessen, IconSuche } from './icons'

type FilterModus = 'alle' | 'system' | 'projekt'

export function BenachrichtigungenPanel({
  eintraege,
  onClose,
}: {
  eintraege: Benachrichtigung[]
  onClose: () => void
}) {
  const [suche, setSuche] = useState('')
  const [filter, setFilter] = useState<FilterModus>('alle')
  const [filterOffen, setFilterOffen] = useState(false)

  // ESC schließt das Panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const gefiltert = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase()
    return eintraege.filter((n) => {
      if (filter === 'system' && n.type !== 'system') return false
      if (filter === 'projekt' && n.type !== 'project') return false
      if (!suchbegriff) return true
      return (
        n.title.toLowerCase().includes(suchbegriff) ||
        n.message.toLowerCase().includes(suchbegriff) ||
        n.project.toLowerCase().includes(suchbegriff)
      )
    })
  }, [eintraege, suche, filter])

  return (
    <>
      <div className="benachrichtigung__overlay" onClick={onClose} aria-hidden="true" />
      <aside className="benachrichtigung__panel" role="dialog" aria-label="Benachrichtigungen">
        <header className="benachrichtigung__kopf">
          <h2>Benachrichtigungen</h2>
          <button type="button" className="icon-btn" aria-label="Schließen" onClick={onClose}>
            <IconSchliessen size={16} />
          </button>
        </header>

        <div className="benachrichtigung__filterzeile">
          <span className="benachrichtigung__suche">
            <input
              type="text"
              placeholder="Benachrichtigung suchen ..."
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
            />
            <span className="benachrichtigung__suche-icon">
              <IconSuche size={16} />
            </span>
          </span>
          <div className="benachrichtigung__filter">
            <button
              type="button"
              className="btn btn--klein benachrichtigung__filter-btn"
              aria-label="Filter"
              onClick={() => setFilterOffen((v) => !v)}
            >
              <IconFilter size={16} />
            </button>
            {filterOffen && (
              <Popover onClose={() => setFilterOffen(false)} style={{ right: 0, top: '100%', marginTop: 6, zIndex: 60 }}>
                <div className="benachrichtigung__filter-menue">
                  <FilterOption aktiv={filter === 'alle'} label="Alle Benachrichtigungen" onClick={() => { setFilter('alle'); setFilterOffen(false) }} />
                  <FilterOption aktiv={filter === 'system'} label="Nur System" onClick={() => { setFilter('system'); setFilterOffen(false) }} />
                  <FilterOption aktiv={filter === 'projekt'} label="Nur Ereignisse in Projekten" onClick={() => { setFilter('projekt'); setFilterOffen(false) }} />
                </div>
              </Popover>
            )}
          </div>
        </div>

        <div className="benachrichtigung__liste">
          {gefiltert.length === 0 ? (
            <div className="benachrichtigung__leer">Keine Benachrichtigungen gefunden.</div>
          ) : (
            gefiltert.map((n) => <BenachrichtigungEintrag key={n.id} n={n} />)
          )}
        </div>
      </aside>
    </>
  )
}

function FilterOption({ aktiv, label, onClick }: { aktiv: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="benachrichtigung__filter-opt" onClick={onClick}>
      <span className="benachrichtigung__filter-check">{aktiv ? '✓' : ''}</span>
      {label}
    </button>
  )
}

function BenachrichtigungEintrag({ n }: { n: Benachrichtigung }) {
  return (
    <article className={`benachrichtigung${n.read ? '' : ' benachrichtigung--ungelesen'}`}>
      <div className="benachrichtigung__avatar">
        <PersonenAvatar n={n} />
      </div>
      <div className="benachrichtigung__inhalt">
        <p className="benachrichtigung__titel">
          {n.type === 'system' ? renderSystemTitel(n) : renderProjektTitel(n)}
        </p>
        {n.message && <p className="benachrichtigung__nachricht">{n.message}</p>}
        {n.badge && (
          <span className={`benachrichtigung__badge benachrichtigung__badge--${n.badge.ton}`}>{n.badge.text}</span>
        )}
      </div>
    </article>
  )
}

function renderSystemTitel(n: Benachrichtigung) {
  return (
    <>
      Bericht <strong>{n.project}</strong>
    </>
  )
}

function renderProjektTitel(n: Benachrichtigung) {
  const [personenTeil, ...rest] = n.title.split(' hinterließ')
  if (rest.length === 0) return <strong>{n.title}</strong>
  return (
    <>
      <strong>{personenTeil}</strong> hinterließ{rest.join(' hinterließ')} in der <strong>{n.project}</strong>
    </>
  )
}

function PersonenAvatar({ n }: { n: Benachrichtigung }) {
  if (n.type === 'system') {
    return (
      <span className="benachrichtigung__system-icon">
        {n.systemKategorie === 'projekt' ? <IconGebaeude size={16} /> : <IconBlattFallback />}
      </span>
    )
  }
  if (n.personenIds && n.personenIds.length > 0) {
    const person = erpRepository.ladePerson(n.personenIds[0])
    if (person) return <Avatar person={person} size={32} />
  }
  return (
    <span className="benachrichtigung__initial">
      {n.personenLabel ?? '?'}
    </span>
  )
}

// Kleine Bergwerks-Ersatzform für "Blatt" – reicht als Marker für Reports.
function IconBlattFallback() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
    </svg>
  )
}
