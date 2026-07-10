/**
 * Kommentarliste (ersetzt die rechte Navigationsleiste, Folien 14–17):
 * Kommentare/Aufgaben aller Projektbeteiligten, "Zu Aufgabe machen",
 * Klick springt zum referenzierten Feld (gelbe Markierung + Popup).
 */

import type { KommentarAufgabe, Projekt } from '../types'
import { kommentarThread, useApp, useStore, wurzelKommentare } from '../state/store'
import { erpRepository } from '../data/erpRepository'
import { formatZeitstempel } from '../utils/format'
import { Avatar, StatusBadge } from './ui'
import { IconCheckKreis, IconFilter, IconMehr, IconSchliessen, IconSuche } from './icons'

export function KommentarPanel({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const liste = wurzelKommentare(app, projekt.id)

  return (
    <aside className="rail rail--kommentare">
      <div className="rail__kopf">
        <strong>Kommentare</strong>
        <button type="button" className="icon-btn" aria-label="Kommentare schließen" onClick={() => store.schliesseKommentare()}>
          <IconSchliessen size={16} />
        </button>
      </div>

      <div className="kommentare__suche">
        <div className="kommentare__suchfeld">
          <input type="text" placeholder="Suche" aria-label="Kommentare durchsuchen" />
          <IconSuche size={14} />
        </div>
        <button type="button" className="icon-btn" title="Filtern (dekorativ)">
          <IconFilter size={16} />
        </button>
      </div>

      <div className="kommentare__liste">
        {liste.map((kommentar) => (
          <KommentarKarte key={kommentar.id} kommentar={kommentar} />
        ))}
      </div>
    </aside>
  )
}

function KommentarKarte({ kommentar }: { kommentar: KommentarAufgabe }) {
  const app = useApp()
  const store = useStore()
  const autor = erpRepository.ladePerson(kommentar.autorId)
  const zustaendig =
    kommentar.typ === 'Aufgabe' && kommentar.zugewiesenAnId
      ? erpRepository.ladePerson(kommentar.zugewiesenAnId)
      : undefined
  const angezeigtePerson = zustaendig ?? autor
  const antworten = kommentarThread(app, kommentar).length - 1
  const aktiv =
    app.ui.aktiveFeldReferenz != null &&
    kommentar.feldReferenz != null &&
    app.ui.aktiveFeldReferenz.feldKey === kommentar.feldReferenz.feldKey &&
    app.ui.aktiveFeldReferenz.szenarioId === kommentar.feldReferenz.szenarioId

  return (
    <article
      className={`kommentar-karte${aktiv ? ' kommentar-karte--aktiv' : ''}${
        kommentar.typ === 'Aufgabe' && kommentar.aufgabenstatus !== 'Erledigt' ? ' kommentar-karte--aufgabe' : ''
      }`}
      onClick={() => store.springeZuKommentar(kommentar)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && store.springeZuKommentar(kommentar)}
    >
      <div className="kommentar-karte__kopf">
        <span className="kommentar-karte__typ">{kommentar.typ}</span>
        <span className="kommentar-karte__kopf-rechts">
          {kommentar.typ === 'Aufgabe' && kommentar.aufgabenstatus ? (
            <StatusBadge status={kommentar.aufgabenstatus} aufgabe />
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={(e) => {
                e.stopPropagation()
                store.macheZurAufgabe(kommentar.id)
              }}
            >
              Zur Aufgabe machen
            </button>
          )}
          <IconCheckKreis size={15} className="kommentar-karte__check" />
          <IconMehr size={15} />
        </span>
      </div>
      <div className="kommentar-karte__autor">
        {angezeigtePerson && <Avatar person={angezeigtePerson} size={26} />}
        <span className="kommentar-karte__meta">
          <strong>{angezeigtePerson?.name}</strong>
          <span className="kommentar-karte__ref">
            №{kommentar.nr} {kommentar.feldReferenz?.bereichLabel}
            {kommentar.feldReferenz?.blockLabel && (
              <> · {kommentar.feldReferenz.blockLabel}</>
            )}
            {kommentar.feldReferenz?.feldLabel && (
              <> · {kommentar.feldReferenz.feldLabel}</>
            )}
          </span>
          <time className="kommentar-karte__zeit">{formatZeitstempel(kommentar.zeitstempel)}</time>
        </span>
      </div>
      {/* Ticket "Feldbezogene Kommentare": in der rechten Leiste wird auch
          der Feldwert zum Zeitpunkt der Erstellung angezeigt, damit die
          Diskussion sofort zuordenbar ist. */}
      {kommentar.valueAtCreation && (
        <div className="kommentar-karte__wert">{kommentar.valueAtCreation}</div>
      )}
      <p className="kommentar-karte__text">{kommentar.text}</p>
      {antworten > 0 && <span className="kommentar-karte__antworten">{antworten} antworten</span>}
    </article>
  )
}
