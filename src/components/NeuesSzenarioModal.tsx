/** Dialog "Neue Szenario" (Folie 27): Name + wählbare bereichsweise Übernahme */

import { useState } from 'react'
import type { Projekt } from '../types'
import { szenarienFuerProjekt, useApp, useStore } from '../state/store'
import { Modal } from './ui'

export function NeuesSzenarioModal({ projekt, onClose }: { projekt: Projekt; onClose: () => void }) {
  const app = useApp()
  const store = useStore()
  const anzahlVarianten = szenarienFuerProjekt(app, projekt.id).length - 1
  const [name, setName] = useState(`Szenario ${anzahlVarianten + 1}`)
  const [objektdaten, setObjektdaten] = useState(true)
  const [ertraege, setErtraege] = useState(true)
  const [finanzierung, setFinanzierung] = useState(true)

  return (
    <Modal
      titel="Neue Szenario"
      breite={420}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primaer"
            disabled={!name.trim()}
            onClick={() => {
              store.erstelleSzenario(projekt.id, name.trim(), {
                objektdaten,
                ertraegeUndAufwendungen: ertraege,
                finanzierung,
              })
              onClose()
            }}
          >
            Szenario erstellen
          </button>
        </>
      }
    >
      <label className="formfeld">
        <span className="formfeld__label">Szenario Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="formfeld__label" style={{ marginBottom: 6 }}>
        Kopieren aus dem Basis:
      </p>
      <label className="checkzeile">
        <input type="checkbox" checked={objektdaten} onChange={(e) => setObjektdaten(e.target.checked)} />
        Objektdaten
      </label>
      <label className="checkzeile">
        <input type="checkbox" checked={ertraege} onChange={(e) => setErtraege(e.target.checked)} />
        Erträge und Aufwendungen
      </label>
      <label className="checkzeile">
        <input type="checkbox" checked={finanzierung} onChange={(e) => setFinanzierung(e.target.checked)} />
        Finanzierung
      </label>
    </Modal>
  )
}
