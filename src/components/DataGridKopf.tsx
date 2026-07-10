/**
 * Wiederverwendbarer Tabellen-Header für Data-Grid-artige Tabellen (Berichte,
 * Aufgaben). Vereint Sortier-Chevron, Drag-&-Drop-Resize-Griff und Rechts-
 * klick-Kontextmenü zum Ein-/Ausblenden von Spalten.
 *
 * Layout-Verhalten (Ticket "Fehler bei der Spaltenbreiten-Anpassung"):
 *  - Ausgangszustand (keine gespeicherten Nutzerbreiten): flexible Spalten
 *    ohne width, feste Spalten mit Standardbreite. Die Tabelle nutzt die
 *    volle Container-Breite. Der Container-Screen setzt zusätzlich
 *    `table-width: 100%` per Style.
 *  - Sobald der Nutzer eine beliebige Kante zieht, werden ALLE sichtbaren
 *    Spalten (inklusive der flexiblen) auf ihre aktuellen DOM-Breiten
 *    "eingefroren" (`api.friereBreitenEin`). Ab diesem Moment hat jede
 *    Spalte eine explizite Nutzerbreite. Der Screen setzt die Tabellenbreite
 *    auf die Summe dieser Breiten – die Tabelle verhält sich wie in Excel:
 *    das Ziehen einer Spalte verändert AUSSCHLIESSLICH diese Spalte, die
 *    Nachbarn bleiben stehen. Überschreitet die Summe die Container-Breite,
 *    erscheint der horizontale Scrollbalken; ist sie kleiner, bleibt rechts
 *    ein Leerraum – aber keine Kettenreaktion auf andere Spalten.
 */

import { useEffect, useRef, useState } from 'react'
import { IconChevronOben, IconChevronUnten } from './icons'
import { Popover } from './ui'
import type { AktuelleSpalte, SpaltenDefinition, TabellenConfigApi } from '../utils/useTabellenConfig'

export type SortRichtung = 'asc' | 'desc'

interface Props<S extends string> {
  spalten: SpaltenDefinition[]
  sichtbareSpalten: AktuelleSpalte[]
  api: TabellenConfigApi
  sortSpalte: S
  sortRichtung: SortRichtung
  onSort: (spalte: S) => void
  zusatzSpalte?: React.ReactNode
}

export function DataGridKopf<S extends string>({
  spalten,
  sichtbareSpalten,
  api,
  sortSpalte,
  sortRichtung,
  onSort,
  zusatzSpalte,
}: Props<S>) {
  const [kontextMenuAn, setKontextMenuAn] = useState(false)
  const [kontextMenuPos, setKontextMenuPos] = useState<{ x: number; y: number } | null>(null)

  // Refs zu allen <th>-Elementen pro Spalte, damit wir beim Drag-Start alle
  // aktuellen DOM-Breiten einlesen und einfrieren können.
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({})

  const messeUndFriereBreitenEin = () => {
    const gemessen: Record<string, number> = {}
    for (const s of sichtbareSpalten) {
      const el = thRefs.current[s.schluessel]
      if (el) gemessen[s.schluessel] = el.getBoundingClientRect().width
    }
    // `friereBreitenEin` überschreibt nur nicht-gepinnte Werte – existierende
    // Nutzerbreiten bleiben unverändert.
    api.friereBreitenEin(gemessen)
  }

  return (
    <>
      <tr
        onContextMenu={(e) => {
          e.preventDefault()
          setKontextMenuPos({ x: e.clientX, y: e.clientY })
          setKontextMenuAn(true)
        }}
      >
        {sichtbareSpalten.map((s) => (
          <SpaltenKopf
            key={s.schluessel}
            spalte={s}
            aktiv={s.schluessel === sortSpalte}
            richtung={sortRichtung}
            onSort={() => onSort(s.schluessel as S)}
            onResize={(neueBreite) => api.setzeBreite(s.schluessel, neueBreite)}
            onResizeStart={messeUndFriereBreitenEin}
            setThRef={(el) => {
              thRefs.current[s.schluessel] = el
            }}
          />
        ))}
        {zusatzSpalte}
      </tr>

      {kontextMenuAn && kontextMenuPos && (
        <SpaltenKonfigMenu
          spalten={spalten}
          api={api}
          position={kontextMenuPos}
          onClose={() => setKontextMenuAn(false)}
        />
      )}
    </>
  )
}

function SpaltenKopf({
  spalte,
  aktiv,
  richtung,
  onSort,
  onResize,
  onResizeStart,
  setThRef,
}: {
  spalte: AktuelleSpalte
  aktiv: boolean
  richtung: SortRichtung
  onSort: () => void
  onResize: (neueBreite: number) => void
  onResizeStart: () => void
  setThRef: (el: HTMLTableCellElement | null) => void
}) {
  const localRef = useRef<HTMLTableCellElement | null>(null)
  const startRef = useRef<{ x: number; startBreite: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = localRef.current?.getBoundingClientRect()
    const startBreite = rect ? rect.width : spalte.nutzerBreite ?? spalte.standardBreite
    startRef.current = { x: e.clientX, startBreite }
    // Erst die aktuellen DOM-Breiten aller Header einfrieren (No-Op, wenn
    // bereits gepinnt). Danach folgt sofort das erste setzeBreite auf die
    // Zielspalte – React verrechnet beides in einer Batch, die Nachbar-
    // Spalten sehen keinen Zwischenzustand.
    onResizeStart()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!startRef.current) return
    const delta = e.clientX - startRef.current.x
    onResize(startRef.current.startBreite + delta)
  }

  const beende = (e?: React.PointerEvent<HTMLSpanElement>) => {
    if (!startRef.current) return
    startRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (e) (e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  const zellenStyle =
    spalte.nutzerBreite !== undefined
      ? { width: spalte.nutzerBreite }
      : spalte.flexibel
      ? undefined
      : { width: spalte.standardBreite }

  return (
    <th
      ref={(el) => {
        localRef.current = el
        setThRef(el)
      }}
      style={zellenStyle}
    >
      <div className="data-grid__kopf-inhalt">
        <button type="button" className="berichte-tabelle__sortkopf" onClick={onSort}>
          {spalte.label}
          <span className={`berichte-tabelle__sort-icon${aktiv ? ' berichte-tabelle__sort-icon--aktiv' : ''}`}>
            {aktiv && richtung === 'asc' ? <IconChevronOben size={12} /> : <IconChevronUnten size={12} />}
          </span>
        </button>
        <span
          className="data-grid__resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={`Spaltenbreite ${spalte.label} ändern`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={beende}
          onPointerCancel={beende}
        />
      </div>
    </th>
  )
}

function SpaltenKonfigMenu({
  spalten,
  api,
  position,
  onClose,
}: {
  spalten: SpaltenDefinition[]
  api: TabellenConfigApi
  position: { x: number; y: number }
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Popover
      onClose={onClose}
      style={{ position: 'fixed', top: position.y, left: position.x, zIndex: 80, minWidth: 220 }}
    >
      <div className="spalten-konfig">
        <strong className="spalten-konfig__titel">Spalten konfigurieren</strong>
        <div className="spalten-konfig__trenn" aria-hidden="true" />
        {spalten
          .filter((s) => !s.fest)
          .map((s) => {
            const aktiv = api.sichtbar(s.schluessel)
            return (
              <label key={s.schluessel} className="spalten-konfig__zeile">
                <input
                  type="checkbox"
                  checked={aktiv}
                  onChange={(e) => api.setzeSichtbar(s.schluessel, e.target.checked)}
                />
                {s.label}
              </label>
            )
          })}
        <button
          type="button"
          className="link-btn spalten-konfig__reset"
          onClick={() => {
            api.zuruecksetzen()
            onClose()
          }}
        >
          Auf Standard zurücksetzen
        </button>
      </div>
    </Popover>
  )
}
