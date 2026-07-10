import { IconSchliessen } from './icons'
import { useHilfePanel } from './HilfePanelContext'
import { BeraterEskalationPopup } from './BeraterEskalationPopup'
import { useState } from 'react'

export function HilfePanelMultiTab({ onPanelClose }: { onPanelClose: () => void }) {
  const hilfe = useHilfePanel()
  const [eskalationOffen, setEskalationOffen] = useState(false)

  const aktiverTab = hilfe.tabs.find((t) => t.id === hilfe.aktiverTabId) ?? hilfe.tabs[0]
  if (!aktiverTab) return null

  return (
    <>
      <aside className="hilfe-panel">
        {/* Tab-Leiste */}
        <div className="hilfe-panel__tabs">
          {hilfe.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`hilfe-panel__tab${tab.id === hilfe.aktiverTabId ? ' hilfe-panel__tab--aktiv' : ''}`}
              onClick={() => hilfe.setAktiverTab(tab.id)}
            >
              <span className="hilfe-panel__tab-label">{tab.kopfTitel}</span>
              <span
                className="hilfe-panel__tab-x"
                role="button"
                aria-label={`Tab ${tab.kopfTitel} schließen`}
                onClick={(e) => { e.stopPropagation(); hilfe.schliesseTab(tab.id) }}
              >
                <IconSchliessen size={11} />
              </span>
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="hilfe-panel__inhalt">
          <h2 className="hilfe-panel__h2">{aktiverTab.h2}</h2>

          {aktiverTab.videoSrc && (
            <video
              key={aktiverTab.videoSrc}
              className="hilfe-panel__video"
              src={aktiverTab.videoSrc}
              controls
              preload="metadata"
            />
          )}

          {aktiverTab.schritte && aktiverTab.schritte.length > 0 && (
            <ol className="hilfe-panel__liste">
              {aktiverTab.schritte.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}

          {aktiverTab.freitext && (
            <p className="hilfe-panel__freitext">{aktiverTab.freitext}</p>
          )}

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
        <BeraterEskalationPopup
          onClose={() => setEskalationOffen(false)}
          thema={aktiverTab.eskalationsThema}
        />
      )}
    </>
  )
}
