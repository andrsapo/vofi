/** Dashboard (Folie 1): Soll-Ist-Abgleich, Direktzugriff, ESG, Zuletzt verwendet
 *  – zusätzliche Widgets (Risikomanagement, Aufgaben, Beraterteam) werden über
 *  ein Filter-Popover neben dem Titel ein-/ausgeblendet; Auswahl in localStorage. */

import { useEffect, useMemo, useState } from 'react'
import {
  ESG_RINGE,
  SOLL_IST_2023,
  SOLL_IST_SUMME,
  type SollIstZeile,
} from '../data/mockDashboard'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore, szenarienFuerProjekt } from '../state/store'
import { formatDatum, formatZahl, parseZahl } from '../utils/format'
import { useLocalStorage } from '../utils/useLocalStorage'
import { RingDiagramm } from '../components/charts'
import { Avatar, Popover, StatusBadge } from '../components/ui'
import { TopBar } from '../components/TopBar'
import {
  IconAssistent,
  IconBerichtvorlage,
  IconChevronUnten,
  IconChevronOben,
  IconGebaeude,
  IconKommentar,
  IconManuell,
  IconMehr,
  IconPfeilHoch,
  IconPfeilRunter,
  IconRegler,
  IconRisikoBunt,
  IconSchliessen,
} from '../components/icons'

type SortSpalte = 'position' | 'soll' | 'ist' | 'abweichungProzent'

type WidgetKey = 'sollIst' | 'zuletzt' | 'esg' | 'beraterteam' | 'risiko' | 'aufgaben'

const WIDGET_LABELS: { key: WidgetKey; label: string }[] = [
  { key: 'sollIst', label: 'Soll-Ist Abgleich' },
  { key: 'zuletzt', label: 'Zuletzt verwendet' },
  { key: 'esg', label: 'ESG-Überwachung' },
  { key: 'beraterteam', label: 'Beraterteam' },
  { key: 'risiko', label: 'Risikomanagement' },
  { key: 'aufgaben', label: 'Aufgaben' },
]

const WIDGET_STANDARD: Record<WidgetKey, boolean> = {
  sollIst: true,
  zuletzt: true,
  esg: true,
  beraterteam: false,
  risiko: false,
  aufgaben: false,
}

export function Dashboard() {
  const store = useStore()
  const [widgets, setzeWidgets] = useLocalStorage<Record<WidgetKey, boolean>>('immology.dashboard.widgets', WIDGET_STANDARD)
  const [widgetMenueOffen, setWidgetMenueOffen] = useState(false)

  const zeigt = (k: WidgetKey) => widgets[k] ?? WIDGET_STANDARD[k]

  useEffect(() => {
    const HOVER_STYLES = {
      background: '#eceef4',
      borderColor: '#d7d9e2',
      boxShadow: '0 6px 18px rgba(20,22,42,.10)',
      transform: 'translateY(-2px)',
    }
    const RESET_STYLES = {
      background: '#ffffff',
      borderColor: '#ececf1',
      boxShadow: '0 1px 2px rgba(20,22,42,.04)',
      transform: 'translateY(0)',
    }
    const apply = (el: HTMLElement, styles: Record<string, string>) =>
      Object.assign(el.style, styles)

    const onOver = (e: MouseEvent) => {
      const card = (e.target as Element).closest?.('.dashboard-card') as HTMLElement | null
      if (card) apply(card, HOVER_STYLES)
    }
    const onOut = (e: MouseEvent) => {
      const card = (e.target as Element).closest?.('.dashboard-card') as HTMLElement | null
      if (card && !card.contains(e.relatedTarget as Node)) apply(card, RESET_STYLES)
    }

    document.addEventListener('mouseover', onOver, true)
    document.addEventListener('mouseout', onOut, true)
    return () => {
      document.removeEventListener('mouseover', onOver, true)
      document.removeEventListener('mouseout', onOut, true)
    }
  }, [])

  return (
    <div className="seite seite--dashboard">
      <TopBar
        titel="Dashboard"
        titelZusatz={
          <span className="widget-filter">
            <button
              type="button"
              className="icon-btn"
              aria-label="Widgets auswählen"
              title="Widgets auswählen"
              onClick={() => setWidgetMenueOffen((v) => !v)}
            >
              <IconRegler size={18} />
            </button>
            {widgetMenueOffen && (
              <Popover onClose={() => setWidgetMenueOffen(false)} style={{ left: 0, top: '100%', marginTop: 6, zIndex: 60 }}>
                <div className="widget-filter__panel">
                  <strong>Widgets</strong>
                  <p className="widget-filter__hinweis">Wählen Sie die Widgets, die auf dem Dashboard angezeigt werden sollen</p>
                  {WIDGET_LABELS.map(({ key, label }) => (
                    <label key={key} className="checkzeile">
                      <input
                        type="checkbox"
                        checked={zeigt(key)}
                        onChange={(e) =>
                          setzeWidgets((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Popover>
            )}
          </span>
        }
      />
      <div className="dashboard">
        <div className="dashboard__links">
          {zeigt('sollIst') && <SollIstTabelle />}
          {zeigt('risiko') && <RisikoWidget />}
          {zeigt('aufgaben') && <AufgabenWidget />}
          {zeigt('zuletzt') && <ZuletztVerwendet />}
        </div>
        <div className="dashboard__rechts">
          <section className="karte karte--sektion">
            <h2>Direktzugriff</h2>
            <div className="direktzugriff">
              <button type="button" className="direktzugriff__kachel dashboard-card" onClick={() => store.navigiere({ view: 'assistent' })}>
                <span className="direktzugriff__icon">
                  <IconAssistent size={36} />
                </span>
                <span>
                  <strong>Assistent</strong>
                  <small>Schritt für Schritt zur Entscheidung</small>
                </span>
              </button>
              <button type="button" className="direktzugriff__kachel direktzugriff__kachel--deko dashboard-card" title="Nicht Teil dieser Ausbaustufe">
                <span className="direktzugriff__icon">
                  <IconManuell size={36} />
                </span>
                <span>
                  <strong>Manuell</strong>
                  <small>Sofort selbstständig arbeiten</small>
                </span>
              </button>
              <button type="button" className="direktzugriff__kachel direktzugriff__kachel--deko dashboard-card" title="Nicht Teil dieser Ausbaustufe">
                <span className="direktzugriff__icon">
                  <IconRisikoBunt size={36} />
                </span>
                <span>
                  <strong>Risikomanagement</strong>
                  <small>Risiken auf einen Blick erkennen</small>
                </span>
              </button>
              <button type="button" className="direktzugriff__kachel direktzugriff__kachel--deko dashboard-card" title="Nicht Teil dieser Ausbaustufe">
                <span className="direktzugriff__icon">
                  <IconBerichtvorlage size={36} />
                </span>
                <span>
                  <strong>Berichtsvorlagendesigner</strong>
                  <small>Zielgruppengerecht berichten</small>
                </span>
              </button>
            </div>
          </section>

          {zeigt('esg') && <EsgWidget />}
          {zeigt('beraterteam') && <BeraterteamWidget />}
        </div>
      </div>
    </div>
  )
}

// ---------- ESG ausgelagert ----------

function EsgWidget() {
  return (
    <section className="karte karte--sektion">
      <h2>
        ESG-Überwachung <span className="beta">BETA</span>
      </h2>
      <div className="esg">
        {ESG_RINGE.map((ring) => (
          <div key={ring.titel} className="esg__spalte">
            <RingDiagramm wert={ring.wert} gruen={ring.gruen} gelb={ring.gelb} />
            <strong className="esg__titel">{ring.titel}</strong>
            <div className="esg__legende">
              <span>
                <i className="esg__punkt" style={{ background: 'var(--color-szenario-2)' }} /> Grün {ring.gruen}
              </span>
              <span>
                <i className="esg__punkt" style={{ background: 'var(--color-accent)' }} /> Gelb {ring.gelb}
              </span>
            </div>
            <dl className="esg__stats">
              <div>
                <dt>Datenpunkte</dt>
                <dd>{ring.datenpunkte}</dd>
              </div>
              <div>
                <dt>Top-Level-Ziele</dt>
                <dd>{ring.topLevelZiele}</dd>
              </div>
              <div>
                <dt>Zwischen-Ziele</dt>
                <dd>{ring.zwischenZiele}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------- Risikomanagement-Widget ----------

const RISIKO_KRITISCH = [
  { name: 'Liquiditätsreserve unterschritten', status: 'hoch' as const },
  { name: 'Eigenkapitalrendite < Zielwert', status: 'mittel' as const },
  { name: 'Förderzusage offen', status: 'mittel' as const },
]

function RisikoWidget() {
  return (
    <section className="karte karte--sektion">
      <div className="karte__kopf">
        <h2>Risikomanagement</h2>
        <span className="karte__untertitel">Risiken auf einen Blick erkennen</span>
      </div>
      <div className="risiko-ampel">
        <span className="risiko-ampel__zelle">
          <i className="risiko-punkt risiko-punkt--niedrig" /> Niedrig
          <strong>12</strong>
        </span>
        <span className="risiko-ampel__zelle">
          <i className="risiko-punkt risiko-punkt--mittel" /> Mittel
          <strong>5</strong>
        </span>
        <span className="risiko-ampel__zelle">
          <i className="risiko-punkt risiko-punkt--hoch" /> Hoch
          <strong>2</strong>
        </span>
      </div>
      <h3 className="risiko__unterkopf">Kritische Risiken</h3>
      <ul className="risiko__liste">
        {RISIKO_KRITISCH.map((r) => (
          <li key={r.name} className="risiko__zeile">
            <span>{r.name}</span>
            <i className={`risiko-punkt risiko-punkt--${r.status}`} />
          </li>
        ))}
      </ul>
      <dl className="widget-kpi">
        <div>
          <dt>Offene Risiken</dt>
          <dd>19</dd>
        </div>
        <div>
          <dt>Neue Risiken</dt>
          <dd>3</dd>
        </div>
        <div>
          <dt>Maßnahmen überfällig</dt>
          <dd>2</dd>
        </div>
      </dl>
    </section>
  )
}

// ---------- Aufgaben-Widget ----------

function AufgabenWidget() {
  const app = useApp()
  const store = useStore()
  // Zahlen aus dem echten State. "Fällig heute" / "Überfällig" sind noch
  // Platzhalter, weil das Aufgaben-Datenmodell aktuell kein Fälligkeitsdatum
  // enthält – wird später aus einem Feld auf KommentarAufgabe abgeleitet.
  const alleAufgaben = app.kommentare.filter((k) => k.typ === 'Aufgabe')
  const offen = alleAufgaben.filter((k) => k.aufgabenstatus !== 'Erledigt').length
  const ungelesen = alleAufgaben.filter((k) => k.isRead === false).length
  return (
    <section className="karte karte--sektion">
      <div className="karte__kopf">
        <h2>Aufgaben</h2>
        <button type="button" className="link-btn" onClick={() => store.navigiere({ view: 'aufgaben' })}>
          Zu allen Aufgaben
        </button>
      </div>
      <span className="karte__untertitel">Offene Aktivitäten und To-dos</span>
      {alleAufgaben.length === 0 ? (
        <p className="hinweis-dezent">Noch keine Aufgaben vorhanden.</p>
      ) : (
        <ul className="risiko__liste">
          {alleAufgaben.slice(0, 3).map((a) => (
            <li key={a.id} className="risiko__zeile">
              <span className="risiko__zeile-inhalt">
                <i
                  className={`risiko-punkt risiko-punkt--${
                    a.aufgabenstatus === 'In Bearbeitung' ? 'mittel' : a.aufgabenstatus === 'Erledigt' ? 'niedrig' : 'hoch'
                  }`}
                />
                <span>
                  <strong>{a.text}</strong>
                  <small>{a.aufgabenstatus ?? 'Offen'}</small>
                </span>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Aufgabe öffnen"
                title="Aufgabe öffnen"
                onClick={() => {
                  store.markiereAufgabeGelesen(a.id)
                  store.navigiere({ view: 'aufgaben' })
                }}
              >
                <IconMehr size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <dl className="widget-kpi">
        <div>
          <dt>Offene Aufgaben</dt>
          <dd>{offen}</dd>
        </div>
        <div>
          <dt>Ungelesen</dt>
          <dd>{ungelesen}</dd>
        </div>
        <div>
          <dt>Gesamt</dt>
          <dd>{alleAufgaben.length}</dd>
        </div>
      </dl>
    </section>
  )
}

// ---------- Beraterteam-Widget ----------

function zusammenarbeitenMailto(person: import('../types').Person, absenderName: string) {
  const subject = encodeURIComponent('Einladung zur Zusammenarbeit')
  const body = encodeURIComponent(
    `Guten Tag ${person.name},\n\n` +
    `ich möchte Sie gerne zu einer Zusammenarbeit einladen und würde mich freuen, wenn Sie uns hierbei unterstützen könnten.\n\n` +
    `Bitte teilen Sie mir Ihre Verfügbarkeit mit, damit wir die nächsten Schritte abstimmen können.\n\n` +
    `Ich freue mich auf Ihre Rückmeldung.\n\n` +
    `Mit freundlichen Grüßen\n${absenderName}`
  )
  const a = document.createElement('a')
  a.href = `mailto:${person.email ?? ''}?subject=${subject}&body=${body}`
  a.target = '_top'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function teamsNachricht(person: import('../types').Person) {
  if (!person.email) return
  const vorname = person.name.split(' ')[0]
  const nachricht = encodeURIComponent(
    `Hi ${vorname}, ich würde dich gerne zu einer Zusammenarbeit einladen und wäre froh, wenn du uns unterstützen könntest. ` +
    `Hast du Lust und Zeit? Lass mich bitte wissen, wann du für ein kurzes Gespräch zur Verfügung stehst, ` +
    `damit wir die nächsten Schritte besprechen können. Viele Grüße.`
  )
  window.open(
    `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(person.email)}&message=${nachricht}&deeplinkId=${Date.now()}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function BeraterProfilPopup({ person, onClose, absenderName }: {
  person: import('../types').Person
  onClose: () => void
  absenderName: string
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="berater-popup-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="berater-popup" role="dialog" aria-modal="true" aria-label={`Profil ${person.name}`}>
        <div className="berater-popup__header" style={{ background: person.farbe + '22' }}>
          <Avatar person={person} size={64} />
          <div className="berater-popup__header-info">
            <h2 className="berater-popup__name">{person.name}</h2>
            <span className="berater-popup__badge">
              <span className="berater-popup__dot" />
              {person.rolle} · Verfügbar
            </span>
          </div>
          <button type="button" className="icon-btn berater-popup__close" onClick={onClose} aria-label="Schließen">
            <IconSchliessen size={18} />
          </button>
        </div>

        <div className="berater-popup__body">
          {person.bio && (
            <div className="berater-popup__sektion">
              <span className="berater-popup__sektion-label">ÜBER</span>
              <p className="berater-popup__bio">{person.bio}</p>
            </div>
          )}

          <div className="berater-popup__meta">
            {person.fachgebiet && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">Fachgebiet</span>
                <strong>{person.fachgebiet}</strong>
              </div>
            )}
            {person.standort && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">Standort</span>
                <strong>{person.standort}</strong>
              </div>
            )}
            {person.telefon && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">Telefon</span>
                <strong>{person.telefon}</strong>
              </div>
            )}
            {person.email && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">E-Mail</span>
                <a href={`mailto:${person.email}`} className="berater-popup__link">{person.email}</a>
              </div>
            )}
            {person.sprachen && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">Sprachen</span>
                <strong>{person.sprachen}</strong>
              </div>
            )}
            {person.linkedin && (
              <div className="berater-popup__meta-zeile">
                <span className="berater-popup__meta-label">LinkedIn</span>
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="berater-popup__linkedin">
                  <span className="berater-popup__linkedin-icon">in</span>
                  Profil
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="berater-popup__footer">
          <button
            type="button"
            className="berater-popup__btn-primary"
            onClick={() => zusammenarbeitenMailto(person, absenderName)}
          >
            Zusammenarbeiten
          </button>
          <button
            type="button"
            className="berater-popup__btn-secondary"
            onClick={() => teamsNachricht(person)}
          >
            <IconKommentar size={15} /> Nachricht
          </button>
        </div>
      </div>
    </div>
  )
}

function BeraterteamWidget() {
  const app = useApp()
  const [, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener('erpchange', handler)
    return () => window.removeEventListener('erpchange', handler)
  }, [])

  const personen = erpRepository.ladePersonen().filter(
    (p) => (p.rolle === 'Berater' || p.rolle === 'Manager') && p.favorisiert === true
  )
  const [aktivePerson, setAktivePerson] = useState<import('../types').Person | null>(null)
  const [toastText, setToastText] = useState<string | null>(null)
  const absender = erpRepository.ladePerson(app.aktuellerNutzerId)

  const zeigeToast = (text: string) => {
    setToastText(text)
    setTimeout(() => setToastText(null), 2500)
  }

  const handleZusammenarbeiten = (e: React.MouseEvent, person: import('../types').Person) => {
    e.stopPropagation()
    zusammenarbeitenMailto(person, absender?.name ?? '')
    zeigeToast(`Anfrage zur Zusammenarbeit an ${person.name} gesendet`)
  }

  return (
    <section className="karte karte--sektion">
      <h2>Beraterteam</h2>
      <div className="beraterteam">
        {personen.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            Keine favorisierten Berater. Stern im User Management setzen.
          </p>
        )}
        {personen.map((p) => (
          <div
            key={p.id}
            className="beraterteam__karte dashboard-card"
            onClick={() => setAktivePerson(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setAktivePerson(p)}
          >
            <Avatar person={p} size={44} />
            <div className="beraterteam__info">
              <strong>{p.name}</strong>
              <small>{p.rolle}</small>
            </div>
            <div className="beraterteam__aktionen">
              <button
                type="button"
                className="btn btn--sekundaer btn--klein beraterteam__btn-zusammen"
                onClick={(e) => handleZusammenarbeiten(e, p)}
              >
                Zusammenarbeiten
              </button>
              <button
                type="button"
                className="icon-btn beraterteam__btn-msg"
                aria-label="Nachricht senden"
                onClick={(e) => { e.stopPropagation(); teamsNachricht(p) }}
              >
                <IconKommentar size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {aktivePerson && (
        <BeraterProfilPopup
          person={aktivePerson}
          onClose={() => setAktivePerson(null)}
          absenderName={absender?.name ?? ''}
        />
      )}

      {toastText && (
        <div className="berater-toast">{toastText}</div>
      )}
    </section>
  )
}

// ---------- Soll-Ist-Tabelle (unverändert) ----------

function SollIstTabelle() {
  const [sortSpalte, setSortSpalte] = useState<SortSpalte | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [offen, setOffen] = useState<Record<string, boolean>>({})

  // Alle IDs mit Kindzeilen (rekursiv) sammeln
  const alleElternIds = (zeilen: SollIstZeile[]): string[] =>
    zeilen.flatMap((z) => z.kinder?.length ? [z.id, ...alleElternIds(z.kinder)] : [])

  const alleOffen = alleElternIds(SOLL_IST_2023).every((id) => offen[id])

  const toggleAlle = () => {
    const ids = alleElternIds(SOLL_IST_2023)
    const neuWert = !alleOffen
    setOffen(Object.fromEntries(ids.map((id) => [id, neuWert])))
  }
  // editierte Soll-Werte (nur Blattknoten)
  const [sollWerte, setSollWerte] = useState<Record<string, number>>({})
  const [sollEntwurf, setSollEntwurf] = useState<Record<string, string>>({})
  // editierte Ist-Werte (nur Blattknoten)
  const [istWerte, setIstWerte] = useState<Record<string, number>>({})
  const [istEntwurf, setIstEntwurf] = useState<Record<string, string>>({})

  const effektivSoll = (zeile: SollIstZeile): number => {
    if (zeile.kinder?.length) return zeile.kinder.reduce((sum, k) => sum + effektivSoll(k), 0)
    return sollWerte[zeile.id] ?? zeile.soll
  }

  const effektivIst = (zeile: SollIstZeile): number => {
    if (zeile.kinder?.length) return zeile.kinder.reduce((sum, k) => sum + effektivIst(k), 0)
    return istWerte[zeile.id] ?? zeile.ist
  }

  const sortiert = useMemo(() => {
    if (!sortSpalte) return SOLL_IST_2023
    const kopie = [...SOLL_IST_2023]
    kopie.sort((a, b) => {
      let va: number | string
      let vb: number | string
      if (sortSpalte === 'soll') {
        va = effektivSoll(a); vb = effektivSoll(b)
      } else if (sortSpalte === 'ist') {
        va = effektivIst(a); vb = effektivIst(b)
      } else if (sortSpalte === 'abweichungProzent') {
        va = a.soll !== 0 ? ((effektivIst(a) - effektivSoll(a)) / effektivSoll(a)) * 100 : 0
        vb = b.soll !== 0 ? ((effektivIst(b) - effektivSoll(b)) / effektivSoll(b)) * 100 : 0
      } else {
        va = a[sortSpalte as keyof SollIstZeile] as number | string
        vb = b[sortSpalte as keyof SollIstZeile] as number | string
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sortAsc ? cmp : -cmp
    })
    return kopie
  }, [sortSpalte, sortAsc, sollWerte, istWerte])

  const sortiere = (spalte: SortSpalte) => {
    if (spalte === sortSpalte) setSortAsc(!sortAsc)
    else { setSortSpalte(spalte); setSortAsc(true) }
  }

  const SortKopf = ({ spalte, label, rechts }: { spalte: SortSpalte; label: string; rechts?: boolean }) => (
    <th className={rechts ? 'th--rechts' : ''}>
      <button type="button" className="th-sort" onClick={() => sortiere(spalte)}>
        {label}
        {sortSpalte === spalte && <span>{sortAsc ? '↑' : '↓'}</span>}
      </button>
    </th>
  )

  const berechneBadge = (zeile: SollIstZeile) => {
    const soll = effektivSoll(zeile)
    const ist = effektivIst(zeile)
    const abw = soll !== 0 ? ((ist - soll) / soll) * 100 : 0
    const istHoeher = ist > soll
    const istGleich = Math.abs(abw) < 0.05
    let bg: string, color: string
    if (istGleich) {
      bg = '#eceef2'; color = '#5b6474'
    } else if ((zeile.typ === 'ertrag' && istHoeher) || (zeile.typ === 'aufwand' && !istHoeher)) {
      bg = '#e6f5ec'; color = '#2f9e5f'
    } else {
      bg = '#fdeae6'; color = '#d1583f'
    }
    return { abw, istHoeher, bg, color }
  }

  const renderZeile = (zeile: SollIstZeile, tiefe: number): JSX.Element[] => {
    const hatKinder = !!zeile.kinder?.length
    const istOffen = offen[zeile.id] ?? false
    const { abw, istHoeher, bg, color } = berechneBadge(zeile)
    const soll = effektivSoll(zeile)
    const ist = effektivIst(zeile)
    const sollEdEntwurf = sollEntwurf[zeile.id]
    const istEdEntwurf = istEntwurf[zeile.id]

    const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') e.currentTarget.blur()
    }

    const zeilen = [
      <tr key={zeile.id} className={tiefe > 0 ? 'soll-ist__unterzeile' : ''}>
        <td style={{ paddingLeft: 8 + tiefe * 22 }}>
          {hatKinder ? (
            <button type="button" className="soll-ist__klapp" onClick={() => setOffen({ ...offen, [zeile.id]: !istOffen })}>
              {istOffen ? <IconChevronOben size={12} /> : <IconChevronUnten size={12} />}
              {zeile.position}
            </button>
          ) : (
            zeile.position
          )}
        </td>
        <td className="td--rechts">
          {hatKinder ? (
            <>{formatZahl(soll, 1)} <span className="soll-ist__einheit">T€</span></>
          ) : (
            <>
              <input
                type="text"
                inputMode="decimal"
                className="soll-ist__soll-input"
                value={sollEdEntwurf !== undefined ? sollEdEntwurf : formatZahl(soll, 1)}
                onFocus={() => setSollEntwurf((p) => ({ ...p, [zeile.id]: formatZahl(soll, 1) }))}
                onChange={(e) => {
                  const text = e.target.value
                  setSollEntwurf((p) => ({ ...p, [zeile.id]: text }))
                  const parsed = parseZahl(text)
                  if (parsed !== null && parsed >= 0)
                    setSollWerte((p) => ({ ...p, [zeile.id]: parsed }))
                }}
                onBlur={() => setSollEntwurf((p) => { const n = { ...p }; delete n[zeile.id]; return n })}
                onKeyDown={onEnter}
                aria-label={`Soll-Wert für ${zeile.position}`}
              />
              <span className="soll-ist__einheit"> T€</span>
            </>
          )}
        </td>
        <td className="td--rechts">
          {hatKinder ? (
            <>{formatZahl(ist, 1)} <span className="soll-ist__einheit">T€</span></>
          ) : (
            <>
              <input
                type="text"
                inputMode="decimal"
                className="soll-ist__soll-input"
                value={istEdEntwurf !== undefined ? istEdEntwurf : formatZahl(ist, 1)}
                onFocus={() => setIstEntwurf((p) => ({ ...p, [zeile.id]: formatZahl(ist, 1) }))}
                onChange={(e) => {
                  const text = e.target.value
                  setIstEntwurf((p) => ({ ...p, [zeile.id]: text }))
                  const parsed = parseZahl(text)
                  if (parsed !== null && parsed >= 0)
                    setIstWerte((p) => ({ ...p, [zeile.id]: parsed }))
                }}
                onBlur={() => setIstEntwurf((p) => { const n = { ...p }; delete n[zeile.id]; return n })}
                onKeyDown={onEnter}
                aria-label={`Ist-Wert für ${zeile.position}`}
              />
              <span className="soll-ist__einheit"> T€</span>
            </>
          )}
        </td>
        <td className="td--rechts">
          <span className="delta" style={{ background: bg, color }}>
            {istHoeher ? <IconPfeilHoch size={11} /> : <IconPfeilRunter size={11} />}
            {formatZahl(Math.abs(abw), 1)} %
          </span>
        </td>
      </tr>,
    ]
    if (hatKinder && istOffen) {
      zeile.kinder!.forEach((kind) => zeilen.push(...renderZeile(kind, tiefe + 1)))
    }
    return zeilen
  }

  return (
    <section className="karte">
      <div className="karte__kopf">
        <h2>Soll-Ist-Abgleich 2023</h2>
        <button type="button" className="link-btn" onClick={toggleAlle}>
          {alleOffen ? 'Tabelle zuklappen' : 'Tabelle aufklappen'}
        </button>
      </div>
      <table className="soll-ist">
        <thead>
          <tr>
            <SortKopf spalte="position" label="Position" />
            <SortKopf spalte="soll" label="Soll" rechts />
            <SortKopf spalte="ist" label="Ist" rechts />
            <SortKopf spalte="abweichungProzent" label="Abweichung in %" rechts />
          </tr>
        </thead>
        <tbody>{sortiert.flatMap((zeile) => renderZeile(zeile, 0))}</tbody>
        <tfoot>
          <tr>
            <td>{SOLL_IST_SUMME.position}</td>
            <td className="td--rechts">{formatZahl(effektivSoll(SOLL_IST_SUMME), 2)} T€</td>
            <td className="td--rechts">{formatZahl(effektivIst(SOLL_IST_SUMME), 2)} T€</td>
            <td className="td--rechts">
              {(() => {
                const { abw, istHoeher, bg, color } = berechneBadge(SOLL_IST_SUMME)
                return (
                  <span className="delta" style={{ background: bg, color }}>
                    {istHoeher ? <IconPfeilHoch size={11} /> : <IconPfeilRunter size={11} />}
                    {formatZahl(Math.abs(abw), 1)} %
                  </span>
                )
              })()}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

function ZuletztVerwendet() {
  const app = useApp()
  const store = useStore()

  const projektKarten = app.projekte.map((p) => ({
    id: p.id,
    titel: p.name,
    anzahlProjekte: szenarienFuerProjekt(app, p.id).length,
    datum: p.erstelltAm,
    status: p.status,
  }))

  return (
    <section className="karte karte--sektion">
      <div className="karte__kopf">
        <h2>Zuletzt verwendet</h2>
        <button type="button" className="link-btn" onClick={() => store.navigiere({ view: 'berichte' })}>
          Zu allen Berichten
        </button>
      </div>
      {projektKarten.length === 0 ? (
        <p className="hinweis-dezent">Noch keine Projekte vorhanden.</p>
      ) : (
        <div className="zuletzt">
          {projektKarten.slice(0, 4).map((k) => (
            <button
              key={k.id}
              type="button"
              className="zuletzt__karte dashboard-card"
              onClick={() => {
                const basis = szenarienFuerProjekt(app, k.id)[0]
                if (basis) store.navigiere({ view: 'projekt', projektId: k.id, szenarioId: basis.id, schritt: 1 })
              }}
            >
              <span className="zuletzt__icon">
                <IconGebaeude size={22} />
              </span>
              <strong>{k.titel}</strong>
              <small>
                {k.anzahlProjekte} {k.anzahlProjekte === 1 ? 'Szenario' : 'Szenarien'} · {formatDatum(k.datum)}
              </small>
              <StatusBadge status={k.status} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
