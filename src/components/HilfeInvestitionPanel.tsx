import { useState } from 'react'
import { IconSchliessen } from './icons'
import { BeraterEskalationPopup } from './BeraterEskalationPopup'

const SCHRITTE = [
  'Tragen Sie in das Feld "Gebäude, einschl. Nebenkosten" bitte ausschließlich Baukosten ohne Grundstückskosten ein.',
  'Geben Sie im Feld "Grund und Boden" Kosten für die Erschließung und den Erwerb des Grundstücks ein.',
  'Sofern ein Baukostenzuschuss gewährt wird der nicht in Zusammenhang mit einem Darlehen steht, tragen Sie diesen bitte in das Feld "Direkter Baukostenzuschuss" ein.',
  'Tilgungszuschüsse werden im Finanzierungsbereich erfasst.',
  'Wenn es nicht aktivierbare Kosten gibt können diese hier erfasst werden.',
  'Überprüfen Sie Ihre Eingaben und klicken Sie auf "Weiter".',
  'Wiederholen Sie die Schritte zum Hinzufügen/Ändern von Daten.',
]

export function HilfeInvestitionPanel({ onClose }: { onClose: () => void }) {
  const [eskalationOffen, setEskalationOffen] = useState(false)

  return (
    <>
      <aside className="hilfe-panel">
        <div className="hilfe-panel__kopf">
          <span className="hilfe-panel__kopf-titel">Investition. Hinweis zum Ausfüllen</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Hilfe schließen">
            <IconSchliessen size={16} />
          </button>
        </div>

        <div className="hilfe-panel__inhalt">
          <h2 className="hilfe-panel__h2">Wie fülle ich die Investitionsdaten aus?</h2>

          <video
            className="hilfe-panel__video"
            src="/videos/immology Andrej.mp4"
            controls
            preload="metadata"
          />

          <ol className="hilfe-panel__liste">
            {SCHRITTE.map((schritt, i) => (
              <li key={i}>{schritt}</li>
            ))}
          </ol>

          <button
            type="button"
            className="hilfe-panel__berater-link"
            onClick={() => setEskalationOffen(true)}
          >
            <span className="hilfe-panel__berater-icon">⊙</span> Hilfe des Beraters
          </button>
        </div>
      </aside>

      {eskalationOffen && (
        <BeraterEskalationPopup onClose={() => setEskalationOffen(false)} />
      )}
    </>
  )
}
