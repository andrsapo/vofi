/** Menüpunkt "Aufgaben": tabellarische Übersicht mit vollem Data-Grid-
 *  Funktionsumfang – anpassbare Spaltenbreiten, ein-/ausblendbare Spalten,
 *  benutzerspezifische Persistenz.
 *
 *  Umgesetzte Tickets:
 *   - "Aufgaben-Seite an Berichtsübersicht angleichen"
 *   - "Optimierung der Aufgabenübersicht"
 *   - "Löschen von Aufgaben und Berichten"
 *   - "Erweiterte Tabellenfunktionalität für Berichte und Aufgaben":
 *     Spalten resizable per Drag & Drop, per Rechtsklick-Kontextmenü ein-/
 *     ausblendbar, Konfiguration pro Nutzer in localStorage persistiert. */

import { useMemo, useState } from 'react'
import type { AufgabenStatus, KommentarAufgabe, Projekt } from '../types'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { TopBar } from '../components/TopBar'
import { Avatar, Modal, Popover } from '../components/ui'
import { NeueAufgabeModal } from '../components/NeueAufgabeModal'
import { DataGridKopf } from '../components/DataGridKopf'
import { useTabellenConfig, tabellenBreitenStyle, type SpaltenDefinition } from '../utils/useTabellenConfig'
import { IconAufgaben, IconFilter, IconMehr, IconSuche } from '../components/icons'
import { formatDatum } from '../utils/format'

type Sortierbar = 'text' | 'zustaendig' | 'ersteller' | 'datum' | 'projekt' | 'status'
type SortRichtung = 'asc' | 'desc'
type ZeitraumOption = 'alle' | 'heute' | '7t' | '30t' | 'jahr'

const STATUS_OPTIONEN: AufgabenStatus[] = ['Offen', 'In Bearbeitung', 'Erledigt']

// Zentraldefinition aller Spalten der Aufgaben-Tabelle. Änderungen an
// Reihenfolge, Standardbreite oder Mindestbreite passieren hier.
//
// `flexibel: true` markiert Spalten, die den verfügbaren Restplatz teilen,
// solange der Nutzer sie nicht manuell resized (Ticket "Layout-Anpassung"):
// Aufgabenbeschreibung und Projekt sollen mitwachsen; Zuständiger, Ersteller,
// Datum und Status haben feste Breiten.
const AUFGABEN_SPALTEN: SpaltenDefinition[] = [
  { schluessel: 'text', label: 'Aufgabenbeschreibung', standardBreite: 500, minBreite: 250, flexibel: true },
  { schluessel: 'zustaendig', label: 'Zuständiger', standardBreite: 180, minBreite: 140 },
  { schluessel: 'ersteller', label: 'Ersteller', standardBreite: 180, minBreite: 140 },
  { schluessel: 'datum', label: 'Erstellt am', standardBreite: 140, minBreite: 110 },
  { schluessel: 'projekt', label: 'Projekt', standardBreite: 220, minBreite: 150, flexibel: true },
  { schluessel: 'status', label: 'Status', standardBreite: 150, minBreite: 130 },
]

export function AufgabenListe() {
  const app = useApp()
  const store = useStore()

  const [suche, setSuche] = useState('')
  const [filterOffen, setFilterOffen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AufgabenStatus | 'alle'>('alle')
  const [filterErstellerId, setFilterErstellerId] = useState<string | 'alle'>('alle')
  const [filterZustaendigId, setFilterZustaendigId] = useState<string | 'alle'>('alle')
  const [filterZeitraum, setFilterZeitraum] = useState<ZeitraumOption>('alle')
  const [filterProjektId, setFilterProjektId] = useState<string | 'alle'>('alle')
  const [sortSpalte, setSortSpalte] = useState<Sortierbar>('datum')
  const [sortRichtung, setSortRichtung] = useState<SortRichtung>('desc')
  const [modalOffen, setModalOffen] = useState(false)

  // Persistente Tabellenkonfiguration (Breiten + Sichtbarkeit) pro Nutzer.
  const [sichtbareSpalten, tabellenApi] = useTabellenConfig('aufgaben', app.aktuellerNutzerId, AUFGABEN_SPALTEN)

  // Nur echte Aufgaben (keine Kommentare) – Basis für die gesamte Tabelle.
  const alleAufgaben = useMemo(
    () => app.kommentare.filter((k) => k.typ === 'Aufgabe'),
    [app.kommentare],
  )

  const erstellerListe = useMemo(() => {
    const ids = new Set<string>()
    alleAufgaben.forEach((a) => {
      if (a.autorId) ids.add(a.autorId)
    })
    return [...ids].map((id) => erpRepository.ladePerson(id)).filter(Boolean) as { id: string; name: string }[]
  }, [alleAufgaben])

  const zustaendigeListe = useMemo(() => {
    const ids = new Set<string>()
    alleAufgaben.forEach((a) => {
      if (a.zugewiesenAnId) ids.add(a.zugewiesenAnId)
    })
    return [...ids].map((id) => erpRepository.ladePerson(id)).filter(Boolean) as { id: string; name: string }[]
  }, [alleAufgaben])

  const gefiltert = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase()
    const jetzt = new Date()
    const zeitraumAb = (() => {
      if (filterZeitraum === 'alle') return null
      const d = new Date(jetzt)
      if (filterZeitraum === 'heute') d.setHours(0, 0, 0, 0)
      else if (filterZeitraum === '7t') d.setDate(d.getDate() - 7)
      else if (filterZeitraum === '30t') d.setDate(d.getDate() - 30)
      else if (filterZeitraum === 'jahr') {
        d.setMonth(0, 1)
        d.setHours(0, 0, 0, 0)
      }
      return d.getTime()
    })()
    return alleAufgaben.filter((a) => {
      if (filterStatus !== 'alle' && (a.aufgabenstatus ?? 'Offen') !== filterStatus) return false
      if (filterErstellerId !== 'alle' && a.autorId !== filterErstellerId) return false
      if (filterZustaendigId !== 'alle' && a.zugewiesenAnId !== filterZustaendigId) return false
      if (filterProjektId !== 'alle' && a.projektId !== filterProjektId) return false
      if (zeitraumAb !== null && new Date(a.zeitstempel).getTime() < zeitraumAb) return false
      if (!suchbegriff) return true
      const projekt = app.projekte.find((p) => p.id === a.projektId)
      const autor = a.autorId ? erpRepository.ladePerson(a.autorId) : undefined
      const zustaendig = a.zugewiesenAnId ? erpRepository.ladePerson(a.zugewiesenAnId) : undefined
      return (
        a.text.toLowerCase().includes(suchbegriff) ||
        (projekt?.name.toLowerCase().includes(suchbegriff) ?? false) ||
        (autor?.name.toLowerCase().includes(suchbegriff) ?? false) ||
        (zustaendig?.name.toLowerCase().includes(suchbegriff) ?? false)
      )
    })
  }, [
    alleAufgaben,
    app.projekte,
    suche,
    filterStatus,
    filterErstellerId,
    filterZustaendigId,
    filterZeitraum,
    filterProjektId,
  ])

  const sortiert = useMemo(() => {
    const kopie = [...gefiltert]
    const richtung = sortRichtung === 'asc' ? 1 : -1
    kopie.sort((a, b) => {
      const va = wertFuerSpalte(a, sortSpalte, app.projekte)
      const vb = wertFuerSpalte(b, sortSpalte, app.projekte)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * richtung
      return String(va).localeCompare(String(vb)) * richtung
    })
    return kopie
  }, [gefiltert, sortSpalte, sortRichtung, app.projekte])

  const setzeSort = (spalte: Sortierbar) => {
    if (spalte === sortSpalte) setSortRichtung(sortRichtung === 'asc' ? 'desc' : 'asc')
    else {
      setSortSpalte(spalte)
      setSortRichtung(spalte === 'datum' ? 'desc' : 'asc')
    }
  }

  const filterAktiv =
    filterStatus !== 'alle' ||
    filterErstellerId !== 'alle' ||
    filterZustaendigId !== 'alle' ||
    filterZeitraum !== 'alle' ||
    filterProjektId !== 'alle'

  const aktuellerNutzer = erpRepository.ladePerson(app.aktuellerNutzerId)
  const istAdmin = aktuellerNutzer?.istAdmin === true

  return (
    <div className="seite">
      <TopBar titel="Aufgaben" onZurueck={() => store.navigiere({ view: 'dashboard' })} />
      <div className="liste-seite">
        <div className="berichte__kopf">
          <h1>Aufgaben</h1>
          <div className="berichte__aktionen">
            <button
              type="button"
              className="btn btn--primaer"
              onClick={() => setModalOffen(true)}
              title="Neue Aufgabe erstellen"
            >
              Aufgabe erstellen
            </button>
            <span className="berichte__suche">
              <input
                type="text"
                placeholder="Suche nach einer Aufgabe"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
              />
              <span className="berichte__suche-icon">
                <IconSuche size={16} />
              </span>
            </span>
            <span className="berichte__filter">
              <button
                type="button"
                className={`icon-btn berichte__filter-btn${filterAktiv ? ' berichte__filter-btn--aktiv' : ''}`}
                aria-label="Filter"
                title="Filter"
                onClick={() => setFilterOffen((v) => !v)}
              >
                <IconFilter size={16} />
              </button>
              {filterOffen && (
                <Popover onClose={() => setFilterOffen(false)} style={{ right: 0, top: '100%', marginTop: 6, zIndex: 60, minWidth: 280 }}>
                  <div className="berichte__filter-menue">
                    <div className="berichte__filter-gruppe">
                      <strong>Status</strong>
                      <FilterOption aktiv={filterStatus === 'alle'} label="Alle" onClick={() => setFilterStatus('alle')} />
                      {STATUS_OPTIONEN.map((s) => (
                        <FilterOption key={s} aktiv={filterStatus === s} label={s} onClick={() => setFilterStatus(s)} />
                      ))}
                    </div>
                    {zustaendigeListe.length > 0 && (
                      <div className="berichte__filter-gruppe">
                        <strong>Zuständiger</strong>
                        <FilterOption aktiv={filterZustaendigId === 'alle'} label="Alle" onClick={() => setFilterZustaendigId('alle')} />
                        {zustaendigeListe.map((p) => (
                          <FilterOption key={p.id} aktiv={filterZustaendigId === p.id} label={p.name} onClick={() => setFilterZustaendigId(p.id)} />
                        ))}
                      </div>
                    )}
                    {erstellerListe.length > 0 && (
                      <div className="berichte__filter-gruppe">
                        <strong>Ersteller</strong>
                        <FilterOption aktiv={filterErstellerId === 'alle'} label="Alle" onClick={() => setFilterErstellerId('alle')} />
                        {erstellerListe.map((p) => (
                          <FilterOption key={p.id} aktiv={filterErstellerId === p.id} label={p.name} onClick={() => setFilterErstellerId(p.id)} />
                        ))}
                      </div>
                    )}
                    <div className="berichte__filter-gruppe">
                      <strong>Erstellt am</strong>
                      <FilterOption aktiv={filterZeitraum === 'alle'} label="Alle" onClick={() => setFilterZeitraum('alle')} />
                      <FilterOption aktiv={filterZeitraum === 'heute'} label="Heute" onClick={() => setFilterZeitraum('heute')} />
                      <FilterOption aktiv={filterZeitraum === '7t'} label="Letzte 7 Tage" onClick={() => setFilterZeitraum('7t')} />
                      <FilterOption aktiv={filterZeitraum === '30t'} label="Letzte 30 Tage" onClick={() => setFilterZeitraum('30t')} />
                      <FilterOption aktiv={filterZeitraum === 'jahr'} label="Dieses Jahr" onClick={() => setFilterZeitraum('jahr')} />
                    </div>
                    {app.projekte.length > 0 && (
                      <div className="berichte__filter-gruppe">
                        <strong>Projekt</strong>
                        <FilterOption aktiv={filterProjektId === 'alle'} label="Alle" onClick={() => setFilterProjektId('alle')} />
                        {app.projekte.map((p) => (
                          <FilterOption key={p.id} aktiv={filterProjektId === p.id} label={p.name} onClick={() => setFilterProjektId(p.id)} />
                        ))}
                      </div>
                    )}
                    {filterAktiv && (
                      <button
                        type="button"
                        className="link-btn berichte__filter-reset"
                        onClick={() => {
                          setFilterStatus('alle')
                          setFilterErstellerId('alle')
                          setFilterZustaendigId('alle')
                          setFilterZeitraum('alle')
                          setFilterProjektId('alle')
                        }}
                      >
                        Filter zurücksetzen
                      </button>
                    )}
                  </div>
                </Popover>
              )}
            </span>
          </div>
        </div>

        {alleAufgaben.length === 0 ? (
          <div className="berichte__leer">
            <p>
              <strong>Noch keine Aufgaben vorhanden.</strong>
            </p>
            <p className="berichte__leer-hinweis">
              Erstellen Sie Ihre erste Aufgabe über den Button „Aufgabe erstellen“ oder wandeln Sie einen Kommentar
              in einem Projekt über „Zu Aufgabe machen“ in eine Aufgabe um.
            </p>
          </div>
        ) : sortiert.length === 0 ? (
          <p className="hinweis-dezent">Keine Aufgaben entsprechen dem aktuellen Filter.</p>
        ) : (
          <div className="data-grid__scroll">
            <table
              className="berichte-tabelle data-grid"
              // Sobald der Nutzer irgendeine Spalte per Drag angepasst hat,
              // sind ALLE sichtbaren Spalten gepinnt (siehe DataGridKopf).
              // Dann setzen wir die Tabellenbreite auf die Summe der Spalten
              // – Nachbarspalten bleiben beim weiteren Ziehen unverändert.
              // Solange nichts gepinnt ist, füllt die Tabelle mit 100% den
              // Container (flexibles Standard-Layout).
              style={tabellenBreitenStyle(sichtbareSpalten, istAdmin ? 48 : 0)}
            >
              <thead>
                <DataGridKopf<Sortierbar>
                  spalten={AUFGABEN_SPALTEN}
                  sichtbareSpalten={sichtbareSpalten}
                  api={tabellenApi}
                  sortSpalte={sortSpalte}
                  sortRichtung={sortRichtung}
                  onSort={setzeSort}
                  zusatzSpalte={istAdmin ? <th className="berichte-tabelle__aktionen-th" aria-label="Aktionen" /> : undefined}
                />
              </thead>
              <tbody>
                {sortiert.map((a) => (
                  <AufgabenZeile
                    key={a.id}
                    aufgabe={a}
                    istAdmin={istAdmin}
                    sichtbareSpalten={sichtbareSpalten}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOffen && <NeueAufgabeModal onClose={() => setModalOffen(false)} />}
    </div>
  )
}

function wertFuerSpalte(a: KommentarAufgabe, spalte: Sortierbar, projekte: Projekt[]): string | number {
  switch (spalte) {
    case 'text':
      return a.text.toLowerCase()
    case 'zustaendig': {
      const p = a.zugewiesenAnId ? erpRepository.ladePerson(a.zugewiesenAnId) : undefined
      return p?.name.toLowerCase() ?? ''
    }
    case 'ersteller': {
      const autor = a.autorId ? erpRepository.ladePerson(a.autorId) : undefined
      return autor?.name.toLowerCase() ?? ''
    }
    case 'datum':
      return new Date(a.zeitstempel).getTime()
    case 'projekt':
      return projekte.find((p) => p.id === a.projektId)?.name.toLowerCase() ?? ''
    case 'status':
      return a.aufgabenstatus ?? 'Offen'
  }
}

function FilterOption({ aktiv, label, onClick }: { aktiv: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`berichte__filter-opt${aktiv ? ' berichte__filter-opt--aktiv' : ''}`}
      onClick={onClick}
    >
      <span className="berichte__filter-check">{aktiv ? '✓' : ''}</span>
      {label}
    </button>
  )
}

/**
 * Rendert eine Zeile der Aufgabentabelle. Die Spalten kommen aus der
 * konfigurierten Liste – so werden ausgeblendete Spalten wirklich nicht
 * gerendert (nicht nur unsichtbar). Wenn der Nutzer Administrator ist,
 * wird zusätzlich rechts ein Aktionsmenü angehängt (unabhängig von der
 * Konfiguration).
 */
function AufgabenZeile({
  aufgabe,
  istAdmin,
  sichtbareSpalten,
}: {
  aufgabe: KommentarAufgabe
  istAdmin: boolean
  sichtbareSpalten: SpaltenDefinition[]
}) {
  const app = useApp()
  const store = useStore()
  const projekt = app.projekte.find((p) => p.id === aufgabe.projektId)
  const autor = aufgabe.autorId ? erpRepository.ladePerson(aufgabe.autorId) : undefined
  const zustaendig = aufgabe.zugewiesenAnId ? erpRepository.ladePerson(aufgabe.zugewiesenAnId) : undefined
  const ungelesen = aufgabe.isRead === false

  const [menueOffen, setMenueOffen] = useState(false)
  const [bearbeitenOffen, setBearbeitenOffen] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)

  const oeffnen = () => {
    if (!aufgabe.feldReferenz) return
    store.markiereAufgabeGelesen(aufgabe.id)
    store.springeZuKommentar(aufgabe)
  }

  // Mapping Spalten-Schlüssel → Zellinhalt. Alle Zellen nutzen `.clamp-2`
  // (max. zwei Zeilen mit Ellipse) und ein `title`-Attribut für den vollen
  const hatFeldbezug = !!aufgabe.feldReferenz

  // Text beim Hover.
  const zelle = (schluessel: string) => {
    switch (schluessel) {
      case 'text':
        return (
          <td key={schluessel} className="aufgaben-tabelle__text-zelle">
            {hatFeldbezug ? (
              // Feldbezogene Aufgabe: klickbar, Pointer-Cursor, Hover-Unterstrich.
              <button
                type="button"
                className="aufgaben-tabelle__name-btn aufgaben-tabelle__name-btn--link"
                onClick={oeffnen}
                title={aufgabe.text}
              >
                <span className="aufgaben-tabelle__name-icon" aria-hidden="true">
                  <IconAufgaben size={16} />
                </span>
                <span className="aufgaben-tabelle__text-inhalt">
                  <span className={`clamp-2${ungelesen ? ' clamp-2--fett' : ''}`}>{aufgabe.text}</span>
                  {aufgabe.feldReferenz?.feldLabel && (
                    <span className="aufgaben-tabelle__feldref">
                      <span>{aufgabe.feldReferenz.feldLabel}</span>
                      {aufgabe.valueAtCreation && (
                        <span className="aufgaben-tabelle__feldref-wert">
                          {aufgabe.valueAtCreation}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            ) : (
              // Allgemeine Aufgabe ohne Feldbezug: kein Klick, kein Pointer,
              // kein Hover-Unterstrich – sieht aus wie normaler Inhalt.
              <div className="aufgaben-tabelle__name-static">
                <span className="aufgaben-tabelle__name-icon" aria-hidden="true">
                  <IconAufgaben size={16} />
                </span>
                <span className="aufgaben-tabelle__text-inhalt">
                  <span className={`clamp-2${ungelesen ? ' clamp-2--fett' : ''}`}>{aufgabe.text}</span>
                </span>
              </div>
            )}
          </td>
        )
      case 'zustaendig':
        return (
          <td key={schluessel}>
            {zustaendig ? (
              <span className="berichte-tabelle__ersteller" title={zustaendig.name}>
                <Avatar person={zustaendig} size={26} />
                <span className="clamp-2">{zustaendig.name}</span>
              </span>
            ) : (
              <span className="hinweis-dezent">—</span>
            )}
          </td>
        )
      case 'ersteller':
        return (
          <td key={schluessel}>
            {autor ? (
              <span className="berichte-tabelle__ersteller" title={autor.name}>
                <Avatar person={autor} size={26} />
                <span className="clamp-2">{autor.name}</span>
              </span>
            ) : (
              <span className="hinweis-dezent">—</span>
            )}
          </td>
        )
      case 'datum':
        return <td key={schluessel}>{formatDatum(aufgabe.zeitstempel)}</td>
      case 'projekt':
        return (
          <td key={schluessel}>
            {projekt ? (
              <span className="clamp-2" title={projekt.name}>
                {projekt.name}
              </span>
            ) : (
              <span className="hinweis-dezent">—</span>
            )}
          </td>
        )
      case 'status':
        return (
          <td key={schluessel}>
            <select
              className="select-input aufgaben__status-select"
              value={aufgabe.aufgabenstatus ?? 'Offen'}
              aria-label="Aufgabenstatus"
              onChange={(e) =>
                store.setzeAufgabenStatus(aufgabe.id, e.target.value as AufgabenStatus)
              }
            >
              {STATUS_OPTIONEN.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </td>
        )
      default:
        return <td key={schluessel} />
    }
  }

  return (
    <>
      <tr className={`berichte-tabelle__zeile${ungelesen ? ' berichte-tabelle__zeile--ungelesen' : ''}`}>
        {sichtbareSpalten.map((s) => zelle(s.schluessel))}
        {istAdmin && (
          <td className="berichte-tabelle__aktionen-zelle">
            <span className="berichte-tabelle__aktionen">
              <button
                type="button"
                className="icon-btn"
                aria-label="Aktionen"
                title="Aktionen"
                onClick={() => setMenueOffen((v) => !v)}
              >
                <IconMehr size={16} />
              </button>
              {menueOffen && (
                <Popover
                  onClose={() => setMenueOffen(false)}
                  style={{ right: 0, top: '100%', marginTop: 4, zIndex: 60, minWidth: 160 }}
                >
                  <div className="berichte__aktionen-menue">
                    <button
                      type="button"
                      className="berichte__aktion"
                      onClick={() => {
                        setMenueOffen(false)
                        setBearbeitenOffen(true)
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="berichte__aktion berichte__aktion--gefahr"
                      onClick={() => {
                        setMenueOffen(false)
                        setLoeschenOffen(true)
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </Popover>
              )}
            </span>
          </td>
        )}
      </tr>

      {bearbeitenOffen && (
        <AufgabeBearbeitenModal aufgabe={aufgabe} onClose={() => setBearbeitenOffen(false)} />
      )}
      {loeschenOffen && (
        <BestaetigungModal
          titel="Aufgabe löschen?"
          text="Möchten Sie diese Aufgabe wirklich löschen?"
          bestaetigenLabel="Löschen"
          onBestaetigen={() => {
            store.loescheAufgabe(aufgabe.id)
            setLoeschenOffen(false)
          }}
          onClose={() => setLoeschenOffen(false)}
        />
      )}
    </>
  )
}

function AufgabeBearbeitenModal({
  aufgabe,
  onClose,
}: {
  aufgabe: KommentarAufgabe
  onClose: () => void
}) {
  const store = useStore()
  const [text, setText] = useState(aufgabe.text)
  const [zugewiesenAnId, setZugewiesenAnId] = useState(aufgabe.zugewiesenAnId ?? '')
  const personen = erpRepository.ladePersonen()

  return (
    <Modal
      titel="Aufgabe bearbeiten"
      breite={520}
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
            onClick={() => {
              store.bearbeiteAufgabenText(aufgabe.id, text.trim(), zugewiesenAnId)
              onClose()
            }}
          >
            Speichern
          </button>
        </>
      }
    >
      <label className="formfeld">
        <span className="formfeld__label">Aufgabenbeschreibung</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="aufgabe-modal__textarea"
        />
      </label>

      <label className="formfeld">
        <span className="formfeld__label">Zuständiger</span>
        <select
          className="select-input"
          value={zugewiesenAnId}
          onChange={(e) => setZugewiesenAnId(e.target.value)}
        >
          <option value="">— nicht zugewiesen —</option>
          {personen.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </Modal>
  )
}

/** Wiederverwendbares Bestätigungsmodal für Löschaktionen. */
export function BestaetigungModal({
  titel,
  text,
  bestaetigenLabel,
  onBestaetigen,
  onClose,
}: {
  titel: string
  text: string
  bestaetigenLabel: string
  onBestaetigen: () => void
  onClose: () => void
}) {
  return (
    <Modal
      titel={titel}
      breite={420}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn--gefahr" onClick={onBestaetigen}>
            {bestaetigenLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{text}</p>
    </Modal>
  )
}
