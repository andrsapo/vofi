import { useEffect, useState } from 'react'

interface SysEntwurf {
  sprache: string
  standort: string
  zeitzone: string
  zeitformat: string
  datumsformat: string
  zahlenformat: string
  waehrung: string
  ersterWochentag: string
}

const STANDARD: SysEntwurf = {
  sprache: 'Deutsch',
  standort: 'Deutschland',
  zeitzone: 'Europe/Berlin',
  zeitformat: '24-Stunden',
  datumsformat: 'TT.MM.JJJJ',
  zahlenformat: 'DE',
  waehrung: 'EUR',
  ersterWochentag: 'Montag',
}

// Persistierter Speicher — überlebt Modal-Öffnen/Schließen
let gespeicherteEinstellungen: SysEntwurf = { ...STANDARD }

function SysFeld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="es-feld">
      <label className="es-label">{label}</label>
      {children}
    </div>
  )
}

export function SystemeinstellungModal({ onClose }: { onClose: () => void }) {
  const [entwurf, setEntwurf] = useState<SysEntwurf>({ ...gespeicherteEinstellungen })

  const hatAenderungen = JSON.stringify(entwurf) !== JSON.stringify(gespeicherteEinstellungen)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function set<K extends keyof SysEntwurf>(feld: K, wert: string) {
    setEntwurf((prev) => ({ ...prev, [feld]: wert }))
  }

  return (
    <div className="es-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="es-panel es-panel--sys" role="dialog" aria-modal="true" aria-label="Systemeinstellung">

        <div className="es-kopf">
          <div>
            <div className="es-kopf__titel">Systemeinstellung</div>
            <div className="es-kopf__untertitel">Sprache, Zeitzone und Anzeigeformate</div>
          </div>
          <button type="button" className="es-kopf__schliessen" onClick={onClose} aria-label="Schließen">✕</button>
        </div>

        <div className="es-inhalt">
          <div className="es-raster">
            <SysFeld label="Sprache">
              <select className="es-input" value={entwurf.sprache} onChange={(e) => set('sprache', e.target.value)}>
                <option>Deutsch</option>
                <option>Englisch</option>
                <option>Französisch</option>
              </select>
            </SysFeld>

            <SysFeld label="Standort">
              <select className="es-input" value={entwurf.standort} onChange={(e) => set('standort', e.target.value)}>
                <option>Deutschland</option>
                <option>Österreich</option>
                <option>Schweiz</option>
              </select>
            </SysFeld>

            <SysFeld label="Zeitzone">
              <select className="es-input" value={entwurf.zeitzone} onChange={(e) => set('zeitzone', e.target.value)}>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/Vienna">Europe/Vienna</option>
                <option value="Europe/Zurich">Europe/Zurich</option>
                <option value="UTC">UTC</option>
              </select>
            </SysFeld>

            <SysFeld label="Zeitformat">
              <select className="es-input" value={entwurf.zeitformat} onChange={(e) => set('zeitformat', e.target.value)}>
                <option value="24-Stunden">24-Stunden</option>
                <option value="12-Stunden">12-Stunden</option>
              </select>
            </SysFeld>

            <SysFeld label="Datumsformat">
              <select className="es-input" value={entwurf.datumsformat} onChange={(e) => set('datumsformat', e.target.value)}>
                <option value="TT.MM.JJJJ">TT.MM.JJJJ (z. B. 31.12.2025)</option>
                <option value="JJJJ-MM-TT">JJJJ-MM-TT (z. B. 2025-12-31)</option>
                <option value="MM/TT/JJJJ">MM/TT/JJJJ (z. B. 12/31/2025)</option>
              </select>
            </SysFeld>

            <SysFeld label="Zahlenformat">
              <select className="es-input" value={entwurf.zahlenformat} onChange={(e) => set('zahlenformat', e.target.value)}>
                <option value="DE">DE — 1.234,56</option>
                <option value="EN">EN — 1,234.56</option>
                <option value="FR">FR — 1 234,56</option>
              </select>
            </SysFeld>

            <SysFeld label="Währung">
              <select className="es-input" value={entwurf.waehrung} onChange={(e) => set('waehrung', e.target.value)}>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="CHF">CHF — Schweizer Franken</option>
                <option value="USD">USD — US-Dollar ($)</option>
              </select>
            </SysFeld>

            <SysFeld label="Erster Wochentag">
              <select className="es-input" value={entwurf.ersterWochentag} onChange={(e) => set('ersterWochentag', e.target.value)}>
                <option>Montag</option>
                <option>Sonntag</option>
              </select>
            </SysFeld>
          </div>
        </div>

        <div className="es-fuss">
          <div className="es-fuss__rechts">
            <button type="button" className="es-btn es-btn--abbrechen"
              onClick={() => { setEntwurf({ ...gespeicherteEinstellungen }); onClose() }}>
              Abbrechen
            </button>
            <button type="button"
              className={`es-btn es-btn--speichern${hatAenderungen ? ' es-btn--speichern-aktiv' : ''}`}
              onClick={() => { gespeicherteEinstellungen = { ...entwurf }; onClose() }}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
