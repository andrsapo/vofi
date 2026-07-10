/**
 * Feld-Infrastruktur der Prozessschritte:
 * – Feld-Wrapper mit Label, Kommentar-Icon, Rechtsklick-Kontextmenü
 * – Override-Kennzeichnung für ERP-vorbefüllte Werte (blauer Punkt + Popup)
 * – Kommentar-Popup mit Wert-Historisierung (kommentiert vs. aktuell)
 *
 * Ticket "Feldbezogene Kommentare und Aufgaben (Deep-Linking auf Feldebene)":
 *  - Kommentare hängen an einem konkreten Feldwert (nicht der Feldbezeichnung).
 *  - Rechtsklick auf den Feldwert öffnet ein Kontextmenü mit den Aktionen
 *    "Kommentar erstellen" und "Zur Aufgabe machen".
 *  - Beim Erstellen wird der aktuelle Wert in `valueAtCreation` mitgespeichert.
 *  - Kommentierte Felder tragen ein Sprechblasen-Icon.
 *  - Im Kommentar-Popup wird der kommentierte Wert angezeigt; wenn er sich
 *    inzwischen geändert hat, zusätzlich der aktuelle Wert.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { FeldReferenz, ProzessSchritt } from '../types'
import { kommentareZuFeld, useApp, useStore, wurzelKommentare } from '../state/store'
import { erpRepository } from '../data/erpRepository'
import { formatZeitstempel } from '../utils/format'
import { Avatar, Modal, Popover } from './ui'
import { IconCheckKreis, IconChevronLinks, IconKommentar, IconMehr, IconSenden } from './icons'

/** Kontext des aktuell dargestellten Prozessschritts */
export interface FeldKontextWert {
  projektId: string
  szenarioId: string
  schritt: ProzessSchritt
  szenarioName: string
}

const FeldKontext = createContext<FeldKontextWert | null>(null)

export function FeldKontextProvider({ wert, children }: { wert: FeldKontextWert; children: ReactNode }) {
  return <FeldKontext.Provider value={wert}>{children}</FeldKontext.Provider>
}

export function useFeldKontext(): FeldKontextWert {
  const ctx = useContext(FeldKontext)
  if (!ctx) throw new Error('FeldKontext fehlt')
  return ctx
}

export interface OverrideInfo {
  istUeberschrieben: boolean
  erpAnzeige: string
  onZuruecksetzen: () => void
}

/**
 * Ermittelt den aktuell dargestellten Textwert eines Feldes aus dem DOM.
 * Deckt Input-Elemente, Selects und beliebige Anzeige-Container ab; wird
 * beim Rechtsklick zum Snapshot ("valueAtCreation") verwendet.
 */
function leseFeldWertAusDom(wrapper: HTMLElement | null): string {
  if (!wrapper) return ''
  const input = wrapper.querySelector<HTMLInputElement>('input, textarea')
  if (input) {
    // Für ZahlenInput steht die formatierte Anzeige im Attribut `value`.
    return input.value.trim()
  }
  const select = wrapper.querySelector<HTMLSelectElement>('select')
  if (select) {
    return select.options[select.selectedIndex]?.text.trim() ?? select.value
  }
  return wrapper.textContent?.trim() ?? ''
}

/**
 * Generischer Feld-Wrapper: Label + Eingabeelement. Bei aktivem Kommentar-
 * bezug ist das Label gelb markiert und das Kommentar-Popup wird geöffnet.
 * Feldwerte mit Kommentaren tragen ein Sprechblasen-Icon.
 */
export function Feld({
  feldKey,
  label,
  children,
  override,
  klasse,
  block,
}: {
  feldKey: string
  label: string
  children: ReactNode
  override?: OverrideInfo
  klasse?: string
  /** Fachlicher Block innerhalb des Schritts (z. B. "Investition"). Wird beim
   *  Anlegen eines Kommentars in die Feldreferenz übernommen und in der
   *  rechten Kommentarleiste als Metadatum angezeigt. */
  block?: string
}) {
  const app = useApp()
  const store = useStore()
  const kontext = useContext(FeldKontext)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const eingabeRef = useRef<HTMLDivElement>(null)
  const [overridePopupOffen, setOverridePopupOffen] = useState(false)
  // Kontextmenü-Position (fixed relativ zum Viewport), erscheint an der
  // Rechtsklick-Koordinate.
  const [kontextMenu, setKontextMenu] = useState<{ x: number; y: number } | null>(null)
  const [kommentarDialog, setKommentarDialog] = useState<
    | { valueAtCreation: string; alsAufgabe: boolean }
    | null
  >(null)

  const aktiveRef = app.ui.aktiveFeldReferenz
  const kommentarAktiv =
    !!aktiveRef &&
    !!kontext &&
    aktiveRef.szenarioId === kontext.szenarioId &&
    aktiveRef.schritt === kontext.schritt &&
    aktiveRef.feldKey === feldKey

  // Kommentare am Feld – nur Wurzelkommentare zählen für das Icon.
  const feldKommentare = kontext
    ? kommentareZuFeld(app, {
        szenarioId: kontext.szenarioId,
        schritt: kontext.schritt,
        feldKey,
        bereichLabel: '',
      }).filter((k) => !k.parentId)
    : []
  const hatKommentare = feldKommentare.length > 0

  useEffect(() => {
    if (kommentarAktiv) {
      wrapperRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [kommentarAktiv])

  // Escape schließt Kontextmenü.
  useEffect(() => {
    if (!kontextMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKontextMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kontextMenu])

  const ueberschrieben = override?.istUeberschrieben ?? false

  const oeffneKontextmenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!kontext) return
    // Rechtsklick nur auf dem Eingabebereich, nicht auf dem Label selbst –
    // das schont den nativen Browser-Kontextmenu-Fluss beim Kopieren von
    // Feldnamen.
    e.preventDefault()
    setKontextMenu({ x: e.clientX, y: e.clientY })
  }

  const erstelleKommentar = (alsAufgabe: boolean) => {
    const valueAtCreation = leseFeldWertAusDom(eingabeRef.current)
    setKontextMenu(null)
    setKommentarDialog({ valueAtCreation, alsAufgabe })
  }

  const submitKommentar = (text: string) => {
    if (!kontext || !kommentarDialog) return
    store.erstelleFeldKommentar({
      projektId: kontext.projektId,
      referenz: {
        szenarioId: kontext.szenarioId,
        schritt: kontext.schritt,
        feldKey,
        bereichLabel: `${kontext.szenarioName}/${schrittLabel(kontext.schritt)}`,
        blockLabel: block,
        feldLabel: label,
      },
      text,
      valueAtCreation: kommentarDialog.valueAtCreation,
      alsAufgabe: kommentarDialog.alsAufgabe,
    })
    setKommentarDialog(null)
  }

  return (
    <div ref={wrapperRef} className={`feld ${klasse ?? ''}`} data-feld-key={feldKey}>
      <span
        className={`feld__label${ueberschrieben ? ' feld__label--override' : ''}${
          kommentarAktiv ? ' feld__label--kommentar' : ''
        }`}
      >
        {label}
        {ueberschrieben && (
          <button
            type="button"
            className="feld__override-punkt"
            aria-label="Wert wurde überschrieben – Details anzeigen"
            onClick={() => setOverridePopupOffen(!overridePopupOffen)}
          />
        )}
        {hatKommentare && (
          <button
            type="button"
            className="feld__kommentar-marker"
            aria-label={`${feldKommentare.length} Kommentar${feldKommentare.length === 1 ? '' : 'e'} zu diesem Feld anzeigen`}
            title={`${feldKommentare.length} Kommentar${feldKommentare.length === 1 ? '' : 'e'}`}
            onClick={() => {
              // Auf den ersten Wurzelkommentar springen (öffnet das Popup).
              store.springeZuKommentar(feldKommentare[0])
            }}
          >
            <IconKommentar size={13} />
          </button>
        )}
      </span>
      <div className="feld__eingabe" ref={eingabeRef} onContextMenu={oeffneKontextmenu}>
        {children}
      </div>
      {overridePopupOffen && override && (
        <Popover onClose={() => setOverridePopupOffen(false)} style={{ top: 8, left: 120 }}>
          <div className="override-popup">
            <p>
              Daten wurden händisch angepasst und stimmen nicht mehr mit den Daten aus dem
              ERP-System überein. Daten im ERP-System: <strong>{override.erpAnzeige}</strong>
            </p>
            <button
              type="button"
              className="override-popup__reset"
              onClick={() => {
                override.onZuruecksetzen()
                setOverridePopupOffen(false)
              }}
            >
              Änderungen zurücksetzen
            </button>
          </div>
        </Popover>
      )}
      {kontextMenu && (
        <Popover
          onClose={() => setKontextMenu(null)}
          style={{ position: 'fixed', top: kontextMenu.y, left: kontextMenu.x, zIndex: 80, minWidth: 200 }}
        >
          <div className="feld-kontextmenu">
            <button
              type="button"
              className="feld-kontextmenu__aktion"
              onClick={() => erstelleKommentar(false)}
            >
              Kommentar erstellen
            </button>
            <button
              type="button"
              className="feld-kontextmenu__aktion"
              onClick={() => erstelleKommentar(true)}
            >
              Zur Aufgabe machen
            </button>
          </div>
        </Popover>
      )}
      {kommentarDialog && (
        <NeuerFeldKommentarModal
          label={label}
          valueAtCreation={kommentarDialog.valueAtCreation}
          alsAufgabe={kommentarDialog.alsAufgabe}
          onClose={() => setKommentarDialog(null)}
          onSubmit={submitKommentar}
        />
      )}
      {kommentarAktiv && aktiveRef && <FeldKommentarPopup referenz={aktiveRef} />}
    </div>
  )
}

/** Kurzform der Prozessschritt-Bezeichnung für die Anzeige in Kommentaren. */
function schrittLabel(schritt: ProzessSchritt): string {
  switch (schritt) {
    case 1:
      return 'IST-Zustand'
    case 2:
      return 'Objektdaten'
    case 3:
      return 'Erträge und Aufwendungen'
    case 4:
      return 'Finanzierung'
  }
}

/**
 * Kleines Modal zum Erfassen eines neuen Kommentars (oder direkt einer
 * Aufgabe). Zeigt oben den Wert an, auf den sich die Diskussion bezieht –
 * damit der Nutzer sofort sieht, welchen Snapshot er kommentiert.
 */
function NeuerFeldKommentarModal({
  label,
  valueAtCreation,
  alsAufgabe,
  onClose,
  onSubmit,
}: {
  label: string
  valueAtCreation: string
  alsAufgabe: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState('')

  return (
    <Modal
      titel={alsAufgabe ? 'Aufgabe erstellen' : 'Kommentar erstellen'}
      breite={480}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primaer"
            disabled={text.trim().length === 0}
            onClick={() => onSubmit(text.trim())}
          >
            {alsAufgabe ? 'Aufgabe erstellen' : 'Kommentar erstellen'}
          </button>
        </>
      }
    >
      <div className="feld-kommentar-modal__snapshot">
        <span className="feld-kommentar-modal__label">Referenziertes Feld</span>
        <strong>{label}</strong>
        {valueAtCreation && (
          <div className="feld-kommentar-modal__wert">{valueAtCreation}</div>
        )}
      </div>
      <label className="formfeld">
        <span className="formfeld__label">Kommentar</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          className="aufgabe-modal__textarea"
        />
      </label>
    </Modal>
  )
}

/** Popup mit allen Kommentaren zum referenzierten Feld (Folie 16). */
function FeldKommentarPopup({ referenz }: { referenz: FeldReferenz }) {
  const app = useApp()
  const store = useStore()
  const [antwort, setAntwort] = useState('')
  const kommentare = kommentareZuFeld(app, referenz)
  const wurzel = kommentare.find((k) => !k.parentId) ?? kommentare[0]
  const aktuellerNutzer = erpRepository.ladePerson(app.aktuellerNutzerId)

  const projektId = app.route.view === 'projekt' ? app.route.projektId : undefined
  const alleWurzeln = projektId ? wurzelKommentare(app, projektId) : []
  const aktuellerIndex = wurzel ? alleWurzeln.findIndex((k) => k.id === wurzel.id) : -1
  const vorheriger = aktuellerIndex >= 0 && aktuellerIndex < alleWurzeln.length - 1 ? alleWurzeln[aktuellerIndex + 1] : null
  const naechster = aktuellerIndex > 0 ? alleWurzeln[aktuellerIndex - 1] : null

  // Aktuellen Wert des Feldes live aus dem DOM lesen – dieselbe Heuristik
  // wie beim Rechtsklick, damit "Aktueller Wert" konsistent zur Anzeige ist.
  const aktuellerWert = leseFeldWertAusDom(
    document.querySelector<HTMLElement>(`[data-feld-key="${referenz.feldKey}"] .feld__eingabe`),
  )

  return (
    <Popover onClose={() => store.schliesseFeldPopup()} style={{ top: '100%', left: 40, zIndex: 60 }}>
      <div className="kommentar-popup">
        <div className="kommentar-popup__kopf">
          <strong>{wurzel?.typ ?? 'Kommentar'}</strong>
          <span className="kommentar-popup__blaettern">
            <button
              type="button"
              className="icon-btn"
              aria-label="Vorheriger Kommentar"
              disabled={!vorheriger}
              onClick={() => vorheriger && store.springeZuKommentar(vorheriger)}
            >
              <IconChevronLinks size={14} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Nächster Kommentar"
              disabled={!naechster}
              onClick={() => naechster && store.springeZuKommentar(naechster)}
            >
              <IconChevronLinks size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </span>
          <span className="kommentar-popup__aktionen">
            {wurzel && wurzel.typ === 'Kommentar' && (
              <button
                type="button"
                className="link-btn"
                onClick={() => store.macheZurAufgabe(wurzel.id)}
              >
                Zur Aufgabe machen
              </button>
            )}
            <IconCheckKreis size={16} className="kommentar-popup__check" />
            <IconMehr size={16} />
          </span>
        </div>
        <div className="kommentar-popup__liste">
          {kommentare.map((k) => {
            const autor = erpRepository.ladePerson(k.autorId)
            const zustaendig =
              k.typ === 'Aufgabe' && k.zugewiesenAnId
                ? erpRepository.ladePerson(k.zugewiesenAnId)
                : undefined
            const angezeigtePerson = zustaendig ?? autor
            return (
              <div key={k.id} className="kommentar-popup__eintrag">
                <div className="kommentar-popup__autor">
                  {angezeigtePerson && <Avatar person={angezeigtePerson} size={24} />}
                  <span className="kommentar-popup__meta">
                    <span className="kommentar-popup__name">{angezeigtePerson?.name}</span>
                    {!k.parentId && k.feldReferenz && (
                      <span className="kommentar-popup__ref">
                        №{k.nr} {k.feldReferenz.bereichLabel}
                      </span>
                    )}
                    <time className="kommentar-popup__zeit">{formatZeitstempel(k.zeitstempel)}</time>
                  </span>
                </div>
                {/* Wert-Historisierung: Wurzelkommentar zeigt den Wert zum
                    Zeitpunkt der Erstellung. Weicht der aktuelle Wert davon
                    ab, wird er zusätzlich als "Aktueller Wert" angezeigt. */}
                {!k.parentId && k.valueAtCreation && (
                  <div className="kommentar-popup__wert-block">
                    <span className="kommentar-popup__wert">{k.valueAtCreation}</span>
                    {aktuellerWert && aktuellerWert !== k.valueAtCreation && (
                      <div className="kommentar-popup__wert-diff">
                        <span className="kommentar-popup__wert-label">Aktueller Wert:</span>
                        <span className="kommentar-popup__wert-neu">{aktuellerWert}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="kommentar-popup__text">{k.text}</p>
              </div>
            )
          })}
        </div>
        <div className="kommentar-popup__antwort">
          {aktuellerNutzer && <Avatar person={aktuellerNutzer} size={24} />}
          <input
            type="text"
            placeholder="Kommentar hinzufügen"
            value={antwort}
            onChange={(e) => setAntwort(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && antwort.trim() && wurzel) {
                store.antworteAufKommentar(wurzel, antwort.trim())
                setAntwort('')
              }
            }}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Antwort senden"
            disabled={!antwort.trim()}
            onClick={() => {
              if (wurzel && antwort.trim()) {
                store.antworteAufKommentar(wurzel, antwort.trim())
                setAntwort('')
              }
            }}
          >
            <IconSenden size={15} />
          </button>
        </div>
      </div>
    </Popover>
  )
}
