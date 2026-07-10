import { useEffect } from 'react'
import type { Person } from '../types'
import { erpRepository } from '../data/erpRepository'
import { useApp } from '../state/store'
import { Avatar } from './ui'
import { IconChatBubble, IconMail, IconSchliessen, IconTelefon } from './icons'

function mailtoAn(berater: Person, absenderName: string, thema: string) {
  const text =
    `Hallo ${berater.name},\n\n` +
    `ich brauche Ihre fachliche Unterstützung bei der ${thema}.\n\n` +
    `Mit freundlichen Grüßen\n${absenderName}`
  const a = document.createElement('a')
  a.href = `mailto:${berater.email ?? ''}?subject=${encodeURIComponent('Anfrage fachliche Unterstützung')}&body=${encodeURIComponent(text)}`
  a.target = '_top'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function teamsAn(berater: Person, thema: string) {
  if (!berater.email) return
  const vorname = berater.name.split(' ')[0]
  const text = `Hallo ${vorname}, ich brauche Ihre fachliche Unterstützung bei der ${thema}.`
  window.open(
    `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(berater.email)}&message=${encodeURIComponent(text)}`,
    `teams_eskalation_${berater.id}`
  )
}

function anrufen(berater: Person) {
  if (!berater.telefon) return
  window.location.href = `tel:${berater.telefon.replace(/\s/g, '')}`
}

function BeraterZeile({ berater, absenderName, thema }: { berater: Person; absenderName: string; thema: string }) {
  return (
    <div className="eskalation__zeile">
      <Avatar person={berater} size={42} />
      <div className="eskalation__info">
        <strong className="eskalation__name">{berater.name}</strong>
        <span className="eskalation__rolle">
          {berater.fachgebiet ? `Berater · ${berater.fachgebiet}` : 'Berater'}
        </span>
      </div>
      <div className="eskalation__aktionen">
        <button
          type="button"
          className="eskalation__icon-btn"
          title="E-Mail"
          aria-label={`E-Mail an ${berater.name}`}
          onClick={(e) => { e.stopPropagation(); mailtoAn(berater, absenderName, thema) }}
        >
          <IconMail size={16} />
        </button>
        <button
          type="button"
          className="eskalation__icon-btn"
          title="Teams-Chat"
          aria-label={`Teams-Chat mit ${berater.name}`}
          onClick={(e) => { e.stopPropagation(); teamsAn(berater, thema) }}
        >
          <IconChatBubble size={16} />
        </button>
        <button
          type="button"
          className="eskalation__icon-btn"
          title="Anrufen"
          aria-label={`${berater.name} anrufen`}
          onClick={(e) => { e.stopPropagation(); anrufen(berater) }}
        >
          <IconTelefon size={16} />
        </button>
      </div>
    </div>
  )
}

export function BeraterEskalationPopup({ onClose, thema = 'Ausfühlung der Investitionsdaten' }: { onClose: () => void; thema?: string }) {
  const app = useApp()
  const nutzer = erpRepository.ladePerson(app.aktuellerNutzerId)
  const absenderName = nutzer?.name ?? ''
  const berater = erpRepository.ladePersonen().filter((p) => p.rolle === 'Berater')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [onClose])

  return (
    <div
      className="es-overlay"
      style={{ zIndex: 500 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="eskalation__panel" role="dialog" aria-modal="true" aria-label="Hilfe des Beraters">
        <div className="eskalation__kopf">
          <strong>Hilfe des Beraters</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            <IconSchliessen size={16} />
          </button>
        </div>
        <div className="eskalation__liste">
          {berater.length === 0 ? (
            <p className="eskalation__leer">Keine Berater verfügbar.</p>
          ) : (
            berater.map((b) => <BeraterZeile key={b.id} berater={b} absenderName={absenderName} thema={thema} />)
          )}
        </div>
      </div>
    </div>
  )
}
