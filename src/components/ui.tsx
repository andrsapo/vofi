/** Wiederverwendbare Basis-Bausteine: Badges, Avatare, Toggle, Modal, Inputs, Tooltip */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { AufgabenStatus, BerichtStatus, Person, ProjektStatus } from '../types'
import { formatZahl, parseZahl } from '../utils/format'
import { IconSchliessen } from './icons'

// ---------- Status-Badge ----------

type BadgeArt = ProjektStatus | BerichtStatus | AufgabenStatus | 'Bearbeitung möglich'

const BADGE_KLASSE: Record<BadgeArt, string> = {
  Beschlussreif: 'badge--info',
  Diskutiert: 'badge--info',
  Entwurf: 'badge--neutral',
  Beschlossen: 'badge--success',
  Gesendet: 'badge--success',
  Erledigt: 'badge--success',
  'In Bearbeitung': 'badge--neutral',
  Archiviert: 'badge--neutral',
  Offen: 'badge--info',
  'Bearbeitung möglich': 'badge--neutral',
}

export function StatusBadge({ status, aufgabe }: { status: BadgeArt; aufgabe?: boolean }) {
  // Aufgabenstatus "In Bearbeitung" ist im Mockup blau (nicht grau wie Projektstatus)
  const klasse = aufgabe && status === 'In Bearbeitung' ? 'badge--task-progress' : BADGE_KLASSE[status]
  return <span className={`badge ${klasse}`}>{status}</span>
}

// ---------- Avatar ----------

export function Avatar({ person, size = 26 }: { person: Person; size?: number }) {
  if (person.avatarUrl) {
    return (
      <span
        className="avatar"
        title={`${person.name} (${person.rolle})`}
        style={{ width: size, height: size, background: person.farbe, overflow: 'hidden', padding: 0 }}
      >
        <img src={person.avatarUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </span>
    )
  }
  return (
    <span
      className="avatar"
      title={`${person.name} (${person.rolle})`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: person.farbe }}
    >
      {person.initialen}
    </span>
  )
}

// ---------- Toggle (gelber Schalter wie im Mockup) ----------

export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  id?: string
}) {
  return (
    <label className="toggle" id={id}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle__track${checked ? ' toggle__track--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__knob" />
      </button>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  )
}

// ---------- Modal ----------

export function Modal({
  titel,
  onClose,
  breite = 560,
  children,
  footer,
}: {
  titel: string
  onClose: () => void
  breite?: number
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: breite }} role="dialog" aria-modal="true" aria-label={titel}>
        <div className="modal__kopf">
          <h2>{titel}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            <IconSchliessen size={18} />
          </button>
        </div>
        <div className="modal__inhalt">{children}</div>
        {footer && <div className="modal__fuss">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Zahleneingabe (deutsches Format, optional Einheit) ----------

export function ZahlenInput({
  wert,
  onWert,
  einheit,
  nachkommastellen = 2,
  breite,
  disabled,
  placeholder,
  ariaLabel,
  ohneGruppierung,
}: {
  wert: number
  onWert: (v: number) => void
  einheit?: string
  nachkommastellen?: number
  breite?: number | string
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
  /** ohne Tausendertrennung anzeigen (z. B. Jahreszahlen) */
  ohneGruppierung?: boolean
}) {
  const [fokussiert, setFokussiert] = useState(false)
  const [entwurf, setEntwurf] = useState('')

  const formatiere = (v: number) =>
    ohneGruppierung ? String(Math.round(v)) : formatZahl(v, nachkommastellen)
  const anzeige = fokussiert ? entwurf : formatiere(wert)

  return (
    <span className={`zahlen-input${disabled ? ' zahlen-input--disabled' : ''}`} style={{ width: breite }}>
      <input
        type="text"
        inputMode="decimal"
        value={anzeige}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={() => {
          setFokussiert(true)
          setEntwurf(formatiere(wert))
        }}
        onBlur={() => setFokussiert(false)}
        onChange={(e) => {
          setEntwurf(e.target.value)
          const geparst = parseZahl(e.target.value)
          if (geparst !== null) onWert(geparst)
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
      {einheit && <span className="zahlen-input__einheit">{einheit}</span>}
    </span>
  )
}

// ---------- Stepper (Plus/Minus, Szenarien analysieren) ----------

export function Stepper({
  wert,
  onWert,
  einheit,
  schrittweite = 1,
  nachkommastellen = 2,
  min = 0,
}: {
  wert: number
  onWert: (v: number) => void
  einheit: string
  schrittweite?: number
  nachkommastellen?: number
  min?: number
}) {
  const runde = (v: number) => Math.round(v * 100) / 100
  return (
    <span className="stepper">
      <button type="button" className="stepper__btn" aria-label="Verringern" onClick={() => onWert(Math.max(min, runde(wert - schrittweite)))}>
        −
      </button>
      <span className="stepper__feld">
        <ZahlenInput wert={wert} onWert={onWert} nachkommastellen={nachkommastellen} einheit={einheit} />
      </span>
      <button type="button" className="stepper__btn" aria-label="Erhöhen" onClick={() => onWert(runde(wert + schrittweite))}>
        +
      </button>
    </span>
  )
}

// ---------- Info-Tooltip (Hover-Popup, z. B. Berechnungsformel) ----------

export function InfoTip({
  kind,
  inhalt,
  breite = 320,
}: {
  kind: ReactNode
  inhalt: ReactNode
  breite?: number
}) {
  const [offen, setOffen] = useState(false)
  return (
    <span
      className="infotip"
      onMouseEnter={() => setOffen(true)}
      onMouseLeave={() => setOffen(false)}
      onFocus={() => setOffen(true)}
      onBlur={() => setOffen(false)}
      tabIndex={0}
    >
      {kind}
      {offen && (
        <span className="infotip__popup" style={{ width: breite }}>
          {inhalt}
        </span>
      )}
    </span>
  )
}

// ---------- Popover (klick-basiert, schließt bei Außenklick) ----------

export function Popover({
  onClose,
  children,
  style,
}: {
  onClose: () => void
  children: ReactNode
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div ref={ref} className="popover" style={style}>
      {children}
    </div>
  )
}

// ---------- Auf-/zuklappbarer Abschnitt ----------

export function Klappbereich({
  titel,
  initialOffen = true,
  offen: offenExtern,
  onOffen,
  rechts,
  children,
  ueberschriftKlasse = '',
  klasse = '',
}: {
  titel: ReactNode
  initialOffen?: boolean
  offen?: boolean
  onOffen?: (offen: boolean) => void
  rechts?: ReactNode
  children: ReactNode
  ueberschriftKlasse?: string
  klasse?: string
}) {
  const [offenIntern, setOffenIntern] = useState(initialOffen)
  const kontrolliert = offenExtern !== undefined
  const offen = kontrolliert ? offenExtern : offenIntern
  const toggle = () => {
    if (kontrolliert) onOffen?.(!offen)
    else setOffenIntern(!offenIntern)
  }
  const istH2 = ueberschriftKlasse.includes('klappbereich__titel--h2')
  return (
    <section className={`klappbereich${istH2 ? ' klappbereich--h2' : ''}${klasse ? ` ${klasse}` : ''}`}>
      <div className="klappbereich__kopf">
        <div
          className={`klappbereich__titel ${ueberschriftKlasse}`}
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => e.key === 'Enter' && toggle()}
        >
          {titel}
          <span className={`klappbereich__chevron${offen ? '' : ' klappbereich__chevron--zu'}`}>⌃</span>
        </div>
        {rechts && <div className="klappbereich__rechts">{rechts}</div>}
      </div>
      {offen && <div className="klappbereich__inhalt">{children}</div>}
    </section>
  )
}

// ---------- Zugangsberechtigte-Overlay (zentriert, festes Layer) ----------

export function ZugangOverlay({
  personen,
  ausgewaehlteIds,
  gesperrteId,
  onFertig,
  onAbbrechen,
}: {
  personen: Person[]
  ausgewaehlteIds: string[]
  /** Diese Person-ID bleibt immer aktiv und deaktiviert (Eigentümer) */
  gesperrteId?: string
  onFertig: (ids: string[]) => void
  onAbbrechen: () => void
}) {
  const [entwurf, setEntwurf] = useState<string[]>(ausgewaehlteIds)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onAbbrechen() }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onAbbrechen])

  const toggle = (id: string) => {
    if (id === gesperrteId) return
    setEntwurf((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div
      className="zugang-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onAbbrechen() }}
    >
      <div className="zugang-overlay__panel" role="dialog" aria-modal="true" aria-label="Zugangsberechtigte bearbeiten">
        <div className="zugang-overlay__kopf">
          <h3 className="zugang-overlay__titel">Zugangsberechtigte bearbeiten</h3>
          <button type="button" className="icon-btn" onClick={onAbbrechen} aria-label="Schließen">
            <IconSchliessen size={18} />
          </button>
        </div>
        <div className="zugang-overlay__liste">
          {personen.map((p) => (
            <label key={p.id} className="checkzeile checkzeile--person">
              <input
                type="checkbox"
                checked={entwurf.includes(p.id)}
                disabled={p.id === gesperrteId}
                onChange={() => toggle(p.id)}
              />
              <Avatar person={p} size={24} />
              <span>{p.name}</span>
              <small className="zugang__rolle">{p.rolle}</small>
            </label>
          ))}
        </div>
        <div className="zugang-overlay__fuss">
          <button type="button" className="btn" onClick={onAbbrechen}>
            Abbrechen
          </button>
          <button type="button" className="btn btn--primaer" onClick={() => onFertig(entwurf)}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
