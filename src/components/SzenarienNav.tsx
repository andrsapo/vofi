/**
 * Rechte Navigationsleiste ("Szenarien"-Baum, Folie 14): freie Navigation
 * zwischen den Prozessschritten je Szenario + "Szenarien analysieren".
 * Wird bei geöffneten Kommentaren durch die Kommentarliste ersetzt.
 */

import { useState } from 'react'
import type { Projekt, ProzessSchritt, Szenario } from '../types'
import { szenarienFuerProjekt, useApp, useStore } from '../state/store'
import {
  IconChevronOben,
  IconChevronUnten,
  IconDoppelpfeil,
  IconMehr,
  IconPapierkorb,
  IconPlusKreis,
  IconRegler,
} from './icons'
import { NeuesSzenarioModal } from './NeuesSzenarioModal'

const SCHRITTE: { nr: ProzessSchritt; titel: string; hinweis?: string[] }[] = [
  { nr: 1, titel: 'Objekt IST-Zustand', hinweis: ['Grundlegende Informationen über das Objekt, konstant in allen Szenarien'] },
  { nr: 2, titel: 'Objektdaten', hinweis: ['Bitte geben Sie hier Details zu', '• Investitionskosten', '• Grundstück', '• Abschreibungsparameter', 'ein.'] },
  {
    nr: 3,
    titel: 'Erträge und Aufwendungen',
    hinweis: ['Hier werden alle Erträge und Aufwendungen der Investition erfasst.'],
  },
  { nr: 4, titel: 'Finanzierung', hinweis: ['Bitte beschreiben Sie alle grundlegenden Kreditdaten'] },
]

export function SzenarienNav({ projekt }: { projekt: Projekt }) {
  const app = useApp()
  const store = useStore()
  const szenarien = szenarienFuerProjekt(app, projekt.id)
  const route = app.route
  const [neuesSzenarioOffen, setNeuesSzenarioOffen] = useState(false)
  const [loeschKandidat, setLoeschKandidat] = useState<Szenario | null>(null)
  const [zugeklappt, setZugeklappt] = useState<Record<string, boolean>>({})
  const [kollabiert, setKollabiert] = useState(false)

  const aktivesSzenarioId = route.view === 'projekt' ? route.szenarioId : null
  const aktiverSchritt = route.view === 'projekt' ? route.schritt : null

  return (
    <aside className={`rail${kollabiert ? ' rail--kollabiert' : ''}`}>
      <div className="rail__kopf">
        <button
          type="button"
          className="rail__collapse-btn"
          aria-label={kollabiert ? 'Leiste aufklappen' : 'Leiste zuklappen'}
          onClick={() => setKollabiert((v) => !v)}
        >
          <IconDoppelpfeil
            size={15}
            style={{
              transform: kollabiert ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </button>
        {!kollabiert && (
          <>
            <strong className="rail__kopf-titel">Szenarien</strong>
            <button type="button" className="icon-btn" aria-label="Neues Szenario anlegen" onClick={() => setNeuesSzenarioOffen(true)}>
              <IconPlusKreis size={17} />
            </button>
          </>
        )}
      </div>

      {!kollabiert && szenarien.map((szenario) => {
        const zu = zugeklappt[szenario.id] ?? false
        return (
          <div key={szenario.id} className="rail__szenario">
            <div className="rail__szenario-kopf">
              <button
                type="button"
                className="rail__szenario-name"
                onClick={() => setZugeklappt({ ...zugeklappt, [szenario.id]: !zu })}
              >
                {zu ? <IconChevronUnten size={13} /> : <IconChevronOben size={13} />}
                <span>{szenario.name}</span>
              </button>
              <span className="rail__szenario-aktionen">
                {!szenario.istBasis && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Szenario ${szenario.name} löschen`}
                    onClick={() => setLoeschKandidat(szenario)}
                  >
                    <IconPapierkorb size={15} />
                  </button>
                )}
                <span className="icon-btn icon-btn--passiv">
                  <IconRegler size={15} />
                </span>
              </span>
            </div>
            {!zu && (
              <ol className="rail__schritte">
                {SCHRITTE.map((schritt) => {
                  const aktiv = aktivesSzenarioId === szenario.id && aktiverSchritt === schritt.nr
                  return (
                    <li key={schritt.nr}>
                      <button
                        type="button"
                        className={`rail__schritt${aktiv ? ' rail__schritt--aktiv' : ''}`}
                        onClick={() =>
                          store.navigiere({ view: 'projekt', projektId: projekt.id, szenarioId: szenario.id, schritt: schritt.nr })
                        }
                      >
                        <span className={`rail__schritt-nr${aktiv ? ' rail__schritt-nr--aktiv' : ''}`}>{schritt.nr}</span>
                        <span className="rail__schritt-text">
                          {schritt.titel}
                          {aktiv && schritt.hinweis && (
                            <span className="rail__schritt-hinweis">
                              {schritt.hinweis.map((z) => (
                                <span key={z}>{z}</span>
                              ))}
                            </span>
                          )}
                        </span>
                        <IconMehr size={14} className="rail__schritt-mehr" />
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        )
      })}

      {!kollabiert && (
      <button
        type="button"
        className={`rail__analyse${route.view === 'analyse' ? ' rail__analyse--aktiv' : ''}`}
        onClick={() => store.navigiere({ view: 'analyse', projektId: projekt.id })}
      >
        <span className="rail__analyse-icon">◔</span> Szenarien analysieren
      </button>
      )}

      {neuesSzenarioOffen && <NeuesSzenarioModal projekt={projekt} onClose={() => setNeuesSzenarioOffen(false)} />}

      {loeschKandidat && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setLoeschKandidat(null)}>
          <div className="modal" style={{ width: 400 }} role="dialog" aria-modal="true">
            <div className="modal__kopf">
              <h2>Szenario löschen</h2>
            </div>
            <div className="modal__inhalt">
              <p>
                Soll das Szenario <strong>{loeschKandidat.name}</strong> gelöscht werden? Das Basisszenario und andere
                Szenarien bleiben unverändert.
              </p>
            </div>
            <div className="modal__fuss">
              <button type="button" className="btn" onClick={() => setLoeschKandidat(null)}>
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn--primaer"
                onClick={() => {
                  store.loescheSzenario(loeschKandidat.id)
                  setLoeschKandidat(null)
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
