/**
 * Assistent-Wizard (Folien 4–6): progressive Offenlegung ohne Seitenwechsel.
 * Nur der Zweig "Planen" führt weiter; "Analysieren"/"Berichten" sind sichtbar,
 * aber ohne Folgefunktion (außerhalb des Scopes).
 */

import { useState } from 'react'
import type { Investitionsart } from '../types'
import { useStore } from '../state/store'
import { TopBar } from '../components/TopBar'
import { NeuesProjektModal } from './NeuesProjektModal'
import { IconCheckKreis } from '../components/icons'

type Aktion = 'Planen' | 'Analysieren' | 'Berichten'

export function Assistent() {
  const store = useStore()
  const [aktion, setAktion] = useState<Aktion | null>(null)
  const [investitionsart, setInvestitionsart] = useState<Investitionsart | null>(null)
  const [modalOffen, setModalOffen] = useState(false)

  return (
    <div className="seite">
      <TopBar titel="Assistent" onZurueck={() => store.navigiere({ view: 'dashboard' })} />
      <div className="assistent">
        <p className="assistent__untertitel">Gezielte Fragen führen Sie Schritt für Schritt durch die Datenerfassung</p>

        <div className="assistent__frage">
          <span className="assistent__nummer">1</span>
          <div className="assistent__frage-inhalt">
            <h2>Was möchten Sie machen?</h2>
            <div className="assistent__kacheln">
              <Kachel
                titel="Planen"
                aktiv={aktion === 'Planen'}
                onClick={() => {
                  setAktion('Planen')
                  setInvestitionsart(null)
                }}
                icon={<PlanenIcon />}
              />
              <Kachel
                titel="Analysieren"
                aktiv={aktion === 'Analysieren'}
                onClick={() => setAktion('Analysieren')}
                icon={<AnalysierenIcon />}
              />
              <Kachel
                titel="Berichten"
                aktiv={aktion === 'Berichten'}
                onClick={() => setAktion('Berichten')}
                icon={<BerichtenIcon />}
              />
            </div>
            {(aktion === 'Analysieren' || aktion === 'Berichten') && (
              <p className="assistent__hinweis">
                Der Bereich „{aktion}“ ist nicht Teil dieser Ausbaustufe und wird in einer separaten Klickstrecke
                beschrieben. Bitte wählen Sie „Planen“.
              </p>
            )}
          </div>
        </div>

        {aktion === 'Planen' && (
          <div className="assistent__frage">
            <span className="assistent__nummer">2</span>
            <div className="assistent__frage-inhalt">
              <h2>In was soll investiert werden?</h2>
              <div className="assistent__kacheln">
                <Kachel
                  titel="Bestand"
                  untertitel="Maßnahme an einem Objekt im Bestand"
                  aktiv={investitionsart === 'Bestand'}
                  onClick={() => setInvestitionsart('Bestand')}
                  icon={<BestandIcon />}
                />
                <Kachel
                  titel="Erwerb"
                  untertitel="Kauf eines bestehenden Objekts"
                  aktiv={investitionsart === 'Erwerb'}
                  onClick={() => setInvestitionsart('Erwerb')}
                  icon={<ErwerbIcon />}
                />
                <Kachel
                  titel="Neubau"
                  untertitel="Errichtung eines neuen Gebäudes"
                  aktiv={investitionsart === 'Neubau'}
                  onClick={() => setInvestitionsart('Neubau')}
                  icon={<NeubauIcon />}
                />
              </div>
            </div>
          </div>
        )}

        {aktion === 'Planen' && investitionsart && (
          <div className="assistent__frage">
            <span className="assistent__nummer assistent__nummer--gruen">
              <IconCheckKreis size={18} />
            </span>
            <div className="assistent__frage-inhalt">
              <div className="losgehts">
                <h2>Los geht&apos;s!</h2>
                <p>
                  Auf Grundlage der bisherigen Angaben legen wir nun ein neues Projekt an. Vergeben Sie einen Titel,
                  eine Beschreibung und laden Sie die wichtigsten Beteiligten ein.
                </p>
                <button type="button" className="btn btn--primaer" onClick={() => setModalOffen(true)}>
                  Neues Projekt anlegen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOffen && investitionsart && (
        <NeuesProjektModal investitionsart={investitionsart} onClose={() => setModalOffen(false)} />
      )}
    </div>
  )
}

function Kachel({
  titel,
  untertitel,
  aktiv,
  onClick,
  icon,
}: {
  titel: string
  untertitel?: string
  aktiv: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button type="button" className={`wizard-kachel dashboard-card${aktiv ? ' wizard-kachel--aktiv' : ''}`} onClick={onClick}>
      <span className="wizard-kachel__icon">{icon}</span>
      <strong>{titel}</strong>
      {untertitel && <small>{untertitel}</small>}
    </button>
  )
}

/* Abstrakte zweifarbige Icons im Stil des Mockups */
function PlanenIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <rect x="10" y="20" width="10" height="18" fill="#2f3c7e" />
      <rect x="20" y="10" width="10" height="28" fill="var(--color-accent)" />
      <path d="M30 16l8 6v16h-8z" fill="#7a86d6" />
    </svg>
  )
}
function AnalysierenIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <path d="M8 38L20 14l8 12 6-8 6 20z" fill="#5b8def" />
      <path d="M8 38L20 14l6 9-8 15z" fill="#2f3c7e" opacity="0.85" />
    </svg>
  )
}
function BerichtenIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <rect x="10" y="12" width="16" height="24" rx="2" fill="var(--color-accent)" />
      <circle cx="32" cy="20" r="9" fill="#2f3c7e" />
      <path d="M32 11a9 9 0 0 1 9 9h-9z" fill="#7a86d6" />
    </svg>
  )
}
function BestandIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <rect x="12" y="14" width="14" height="24" fill="#2f3c7e" />
      <rect x="26" y="20" width="10" height="18" fill="var(--color-accent)" />
      <rect x="15" y="18" width="3" height="3" fill="#fff" />
      <rect x="20" y="18" width="3" height="3" fill="#fff" />
      <rect x="15" y="24" width="3" height="3" fill="#fff" />
      <rect x="20" y="24" width="3" height="3" fill="#fff" />
    </svg>
  )
}
function ErwerbIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <path d="M10 24L24 12l14 12" fill="none" stroke="#2f3c7e" strokeWidth="3" />
      <rect x="15" y="24" width="18" height="14" fill="var(--color-accent)" />
      <rect x="21" y="29" width="6" height="9" fill="#2f3c7e" />
    </svg>
  )
}
function NeubauIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <rect x="10" y="26" width="14" height="12" fill="#7a86d6" />
      <path d="M28 38V16l10-4v26" fill="var(--color-accent)" />
      <path d="M6 14h18M15 14V8l6 3" fill="none" stroke="#2f3c7e" strokeWidth="2.4" />
    </svg>
  )
}
