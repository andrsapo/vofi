/** Menüpunkt "Berichte": tabellarische Übersicht aller persistierten
 *  Berichte mit Suche, Filter, Sortierung und Ungelesen-Kennzeichnung.
 *
 *  Umgesetzte Tickets:
 *   - "Berichtsübersicht als Arbeitsbereich"
 *   - "Löschen von Aufgaben und Berichten" (Aktionsmenü + Admin-Rolle)
 *   - "Erweiterte Tabellenfunktionalität für Berichte und Aufgaben":
 *     resizable Spalten (Drag & Drop), Rechtsklick-Kontextmenü zum Ein-/
 *     Ausblenden von Spalten, benutzerspezifische Persistenz. */

import { useMemo, useState } from 'react'
import type { Bericht, BerichtStatus, Projekt } from '../types'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { TopBar } from '../components/TopBar'
import { Avatar, Modal, Popover, StatusBadge } from '../components/ui'
import { DataGridKopf } from '../components/DataGridKopf'
import { useTabellenConfig, tabellenBreitenStyle, type SpaltenDefinition } from '../utils/useTabellenConfig'
import {
  IconBericht,
  IconFilter,
  IconMehr,
  IconSuche,
} from '../components/icons'
import { formatDatum } from '../utils/format'
import { BestaetigungModal } from './AufgabenListe'

type Sortierbar = 'name' | 'ersteller' | 'datum' | 'projekte' | 'status'
type SortRichtung = 'asc' | 'desc'
type ZeitraumOption = 'alle' | 'heute' | '7t' | '30t' | 'jahr'

const STATUS_OPTIONEN: BerichtStatus[] = [
  'In Bearbeitung',
  'Diskutiert',
  'Beschlussreif',
  'Beschlossen',
  'Gesendet',
  'Archiviert',
]

const BERICHT_SPALTEN: SpaltenDefinition[] = [
  // Name und Projekte teilen sich den Restplatz (Ticket "Layout-Anpassung":
  // Berichtsname flexibel wachsen, Projekte flexibel wachsen). Ersteller,
  // Datum und Status bleiben fest, damit sie nicht "wackeln".
  { schluessel: 'name', label: 'Name des Berichts', standardBreite: 420, minBreite: 240, flexibel: true },
  { schluessel: 'ersteller', label: 'Ersteller', standardBreite: 200, minBreite: 140 },
  { schluessel: 'datum', label: 'Erstellt am', standardBreite: 140, minBreite: 110 },
  { schluessel: 'projekte', label: 'Projekte', standardBreite: 260, minBreite: 180, flexibel: true },
  { schluessel: 'status', label: 'Status', standardBreite: 160, minBreite: 130 },
]

export function BerichteListe() {
  const app = useApp()
  const store = useStore()

  const [suche, setSuche] = useState('')
  const [filterOffen, setFilterOffen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<BerichtStatus | 'alle'>('alle')
  const [filterErstellerId, setFilterErstellerId] = useState<string | 'alle'>('alle')
  const [filterZeitraum, setFilterZeitraum] = useState<ZeitraumOption>('alle')
  const [sortSpalte, setSortSpalte] = useState<Sortierbar>('datum')
  const [sortRichtung, setSortRichtung] = useState<SortRichtung>('desc')

  const [sichtbareSpalten, tabellenApi] = useTabellenConfig('berichte', app.aktuellerNutzerId, BERICHT_SPALTEN)

  const erstellerListe = useMemo(() => {
    const ids = new Set<string>()
    app.berichte.forEach((b) => {
      if (b.autorId) ids.add(b.autorId)
    })
    return [...ids].map((id) => erpRepository.ladePerson(id)).filter(Boolean) as { id: string; name: string }[]
  }, [app.berichte])

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
    return app.berichte.filter((b) => {
      if (filterStatus !== 'alle' && b.status !== filterStatus) return false
      if (filterErstellerId !== 'alle' && b.autorId !== filterErstellerId) return false
      if (zeitraumAb !== null && new Date(b.erstelltAm).getTime() < zeitraumAb) return false
      if (!suchbegriff) return true
      const projekt = app.projekte.find((p) => p.id === b.projektId)
      const autor = b.autorId ? erpRepository.ladePerson(b.autorId) : undefined
      return (
        b.name.toLowerCase().includes(suchbegriff) ||
        (projekt?.name.toLowerCase().includes(suchbegriff) ?? false) ||
        (autor?.name.toLowerCase().includes(suchbegriff) ?? false)
      )
    })
  }, [app.berichte, app.projekte, suche, filterStatus, filterErstellerId, filterZeitraum])

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
    filterStatus !== 'alle' || filterErstellerId !== 'alle' || filterZeitraum !== 'alle'

  const aktuellerNutzer = erpRepository.ladePerson(app.aktuellerNutzerId)
  const istAdmin = aktuellerNutzer?.istAdmin === true

  return (
    <div className="seite">
      <TopBar titel="Berichte" onZurueck={() => store.navigiere({ view: 'dashboard' })} />
      <div className="liste-seite">
        <div className="berichte__kopf">
          <h1>Berichte</h1>
          <div className="berichte__aktionen">
            <button
              type="button"
              className="btn btn--primaer"
              onClick={() => store.navigiere({ view: 'assistent' })}
              title="Geführten Assistenten öffnen, um einen Bericht zu erstellen"
            >
              Bericht erstellen
            </button>
            <span className="berichte__suche">
              <input
                type="text"
                placeholder="Suche nach einem Bericht"
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
                        <FilterOption
                          key={s}
                          aktiv={filterStatus === s}
                          label={s}
                          onClick={() => setFilterStatus(s)}
                        />
                      ))}
                    </div>
                    {erstellerListe.length > 0 && (
                      <div className="berichte__filter-gruppe">
                        <strong>Ersteller</strong>
                        <FilterOption
                          aktiv={filterErstellerId === 'alle'}
                          label="Alle"
                          onClick={() => setFilterErstellerId('alle')}
                        />
                        {erstellerListe.map((p) => (
                          <FilterOption
                            key={p.id}
                            aktiv={filterErstellerId === p.id}
                            label={p.name}
                            onClick={() => setFilterErstellerId(p.id)}
                          />
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
                    {filterAktiv && (
                      <button
                        type="button"
                        className="link-btn berichte__filter-reset"
                        onClick={() => {
                          setFilterStatus('alle')
                          setFilterErstellerId('alle')
                          setFilterZeitraum('alle')
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

        {app.berichte.length === 0 ? (
          <div className="berichte__leer">
            <p>
              <strong>Noch keine Berichte vorhanden.</strong>
            </p>
            <p className="berichte__leer-hinweis">
              Erstellen Sie Ihren ersten Bericht, um ihn hier zu sehen. Öffnen Sie dazu ein Projekt und wählen Sie
              „Szenarien analysieren“ → „Bericht erstellen“.
            </p>
          </div>
        ) : sortiert.length === 0 ? (
          <p className="hinweis-dezent">Keine Berichte entsprechen dem aktuellen Filter.</p>
        ) : (
          <div className="data-grid__scroll">
            <table
              className="berichte-tabelle data-grid"
              // Vgl. AufgabenListe: Excel-artiges Verhalten. Nach dem ersten
              // Drag hat jede Spalte eine Nutzerbreite; die Tabellenbreite
              // ist dann die Summe – Nachbarspalten stehen still, wenn der
              // Nutzer eine Spalte zieht.
              style={tabellenBreitenStyle(sichtbareSpalten, istAdmin ? 48 : 0)}
            >
              <thead>
                <DataGridKopf<Sortierbar>
                  spalten={BERICHT_SPALTEN}
                  sichtbareSpalten={sichtbareSpalten}
                  api={tabellenApi}
                  sortSpalte={sortSpalte}
                  sortRichtung={sortRichtung}
                  onSort={setzeSort}
                  zusatzSpalte={istAdmin ? <th className="berichte-tabelle__aktionen-th" aria-label="Aktionen" /> : undefined}
                />
              </thead>
              <tbody>
                {sortiert.map((b) => (
                  <BerichtsZeile
                    key={b.id}
                    bericht={b}
                    istAdmin={istAdmin}
                    sichtbareSpalten={sichtbareSpalten}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function wertFuerSpalte(b: Bericht, spalte: Sortierbar, projekte: Projekt[]): string | number {
  switch (spalte) {
    case 'name':
      return b.name.toLowerCase()
    case 'ersteller': {
      const autor = b.autorId ? erpRepository.ladePerson(b.autorId) : undefined
      return autor?.name.toLowerCase() ?? ''
    }
    case 'datum':
      return new Date(b.erstelltAm).getTime()
    case 'projekte':
      return projekte.find((p) => p.id === b.projektId)?.name.toLowerCase() ?? ''
    case 'status':
      return b.status
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

function BerichtsZeile({
  bericht,
  istAdmin,
  sichtbareSpalten,
}: {
  bericht: Bericht
  istAdmin: boolean
  sichtbareSpalten: SpaltenDefinition[]
}) {
  const app = useApp()
  const store = useStore()
  const projekt = app.projekte.find((p) => p.id === bericht.projektId)
  const autor = bericht.autorId ? erpRepository.ladePerson(bericht.autorId) : undefined
  const ungelesen = bericht.isRead === false
  const zusatzProjekte = projekt ? [projekt.name] : []
  const [projekteOffen, setProjekteOffen] = useState(false)

  const [menueOffen, setMenueOffen] = useState(false)
  const [umbenennenOffen, setUmbenennenOffen] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)

  const oeffnen = () => store.navigiere({ view: 'bericht', berichtId: bericht.id })

  // Wie in der Aufgaben-Liste: pro Spaltenschlüssel eine Zell-Renderer-
  // Funktion. So können ausgeblendete Spalten wirklich entfallen und die
  // Anzeigereihenfolge folgt streng der Konfiguration.
  const zelle = (schluessel: string) => {
    switch (schluessel) {
      case 'name':
        return (
          <td key={schluessel}>
            <button type="button" className="berichte-tabelle__name" onClick={oeffnen} title={bericht.name}>
              <span className="berichte-tabelle__ungelesen-punkt" aria-hidden="true" />
              {/* Einheitliches Berichts-Icon (unabhängig davon, ob dem
                  Bericht bereits ein Projekt zugeordnet ist). Linksbündig
                  zum Spaltenkopf-Text durch das Padding der <td>. */}
              <span className="berichte-tabelle__name-icon" aria-hidden="true">
                <IconBericht size={16} />
              </span>
              <span className={`clamp-2${ungelesen ? ' clamp-2--fett' : ''}`}>{bericht.name}</span>
            </button>
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
        return <td key={schluessel}>{formatDatum(bericht.erstelltAm)}</td>
      case 'projekte':
        return (
          <td key={schluessel}>
            {zusatzProjekte.length === 0 ? (
              <span className="hinweis-dezent">—</span>
            ) : zusatzProjekte.length === 1 ? (
              <span className="clamp-2" title={zusatzProjekte[0]}>• {zusatzProjekte[0]}</span>
            ) : (
              <div className="berichte-tabelle__projekte">
                <span>• {zusatzProjekte[0]}</span>
                {(projekteOffen ? zusatzProjekte.slice(1) : []).map((p) => (
                  <span key={p}>• {p}</span>
                ))}
                <button type="button" className="link-btn" onClick={() => setProjekteOffen((v) => !v)}>
                  {projekteOffen ? 'Weniger anzeigen ▲' : 'Alle anzeigen ▼'}
                </button>
              </div>
            )}
          </td>
        )
      case 'status':
        return (
          <td key={schluessel}>
            <StatusBadge status={bericht.status} />
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
                        oeffnen()
                      }}
                    >
                      Öffnen
                    </button>
                    <button
                      type="button"
                      className="berichte__aktion"
                      onClick={() => {
                        setMenueOffen(false)
                        setUmbenennenOffen(true)
                      }}
                    >
                      Umbenennen
                    </button>
                    <button
                      type="button"
                      className="berichte__aktion"
                      onClick={() => {
                        setMenueOffen(false)
                        store.dupliziereBericht(bericht.id)
                      }}
                    >
                      Duplizieren
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

      {umbenennenOffen && (
        <BerichtUmbenennenModal bericht={bericht} onClose={() => setUmbenennenOffen(false)} />
      )}
      {loeschenOffen && (
        <BestaetigungModal
          titel="Bericht löschen?"
          text={`Möchten Sie den Bericht "${bericht.name}" wirklich löschen?`}
          bestaetigenLabel="Löschen"
          onBestaetigen={() => {
            store.loescheBericht(bericht.id)
            setLoeschenOffen(false)
          }}
          onClose={() => setLoeschenOffen(false)}
        />
      )}
    </>
  )
}

function BerichtUmbenennenModal({
  bericht,
  onClose,
}: {
  bericht: Bericht
  onClose: () => void
}) {
  const store = useStore()
  const [name, setName] = useState(bericht.name)

  return (
    <Modal
      titel="Bericht umbenennen"
      breite={460}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primaer"
            disabled={name.trim().length === 0}
            onClick={() => {
              store.aktualisiereBericht(bericht.id, { name: name.trim() })
              onClose()
            }}
          >
            Speichern
          </button>
        </>
      }
    >
      <label className="formfeld">
        <span className="formfeld__label">Name des Berichts</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
    </Modal>
  )
}
