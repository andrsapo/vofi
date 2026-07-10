/**
 * Modal "Aufgabe erstellen" – wird aus der Aufgaben-Übersicht geöffnet
 * (Ticket "Aufgaben-Seite an Berichtsübersicht angleichen").
 *
 * Felder:
 *  1) Aufgabenbeschreibung (Pflichtfeld, mehrzeilig)
 *  2) Mitarbeiter zuweisen  (Pflichtfeld, Dropdown aus Personen-Stammdaten)
 *  3) Projekt zuordnen      (optional, Dropdown aus vorhandenen Projekten)
 *
 * Beim Absenden legt der Store eine neue Aufgabe mit Status "Offen",
 * aktuellem Datum und dem aktuell angemeldeten Nutzer als Ersteller an.
 */

import { useState } from 'react'
import { erpRepository } from '../data/erpRepository'
import { useApp, useStore } from '../state/store'
import { Modal } from './ui'

export function NeueAufgabeModal({ onClose }: { onClose: () => void }) {
  const app = useApp()
  const store = useStore()

  const [text, setText] = useState('')
  const [mitarbeiterId, setMitarbeiterId] = useState<string>('')
  const [projektId, setProjektId] = useState<string>('')

  // Für die Mitarbeiter-Auswahl: alle Personen aus dem ERP-Repository
  // (Beispiel-Liste: Anna Rita Müller, Herbert Zimmermann, Peter Stumpf …).
  const personen = erpRepository.ladePersonen()

  const kannSpeichern = text.trim().length > 0 && mitarbeiterId !== ''

  return (
    <Modal
      titel="Aufgabe erstellen"
      breite={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--primaer"
            disabled={!kannSpeichern}
            onClick={() => {
              store.erstelleAufgabe({
                text: text.trim(),
                zugewiesenAnId: mitarbeiterId,
                projektId: projektId || undefined,
              })
              onClose()
            }}
          >
            Aufgabe erstellen
          </button>
        </>
      }
    >
      <label className="formfeld">
        <span className="formfeld__label">Beschreiben Sie die Aufgabe</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="z. B. Bitte prüfen Sie noch einmal den Tilgungszuschuss."
          className="aufgabe-modal__textarea"
        />
      </label>

      <label className="formfeld">
        <span className="formfeld__label">Ordnen Sie einen Mitarbeiter zu</span>
        <select
          className="select-input"
          value={mitarbeiterId}
          onChange={(e) => setMitarbeiterId(e.target.value)}
        >
          <option value="" disabled>
            Mitarbeiter auswählen …
          </option>
          {personen.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="formfeld">
        <span className="formfeld__label">Ordnen Sie einem Projekt zu (optional)</span>
        <select
          className="select-input"
          value={projektId}
          onChange={(e) => setProjektId(e.target.value)}
        >
          <option value="">— kein Projekt —</option>
          {app.projekte.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </Modal>
  )
}
