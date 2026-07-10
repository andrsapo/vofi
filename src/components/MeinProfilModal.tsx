import { useEffect, useRef, useState } from 'react'
import type { Person } from '../types'
import { erpRepository } from '../data/erpRepository'
import { Avatar } from './ui'
import { IconKamera } from './icons'

interface Entwurf {
  name: string
  telefon: string
  email: string
  avatarUrl?: string
  aktuellesPasswort: string
  neuesPasswort: string
  neuesPasswortBestaetigen: string
}

function entwurfVonPerson(p: Person): Entwurf {
  return {
    name: p.name,
    telefon: p.telefon ?? '',
    email: p.email ?? '',
    avatarUrl: p.avatarUrl,
    aktuellesPasswort: '',
    neuesPasswort: '',
    neuesPasswortBestaetigen: '',
  }
}

export function MeinProfilModal({ nutzerId, onClose }: { nutzerId: string; onClose: () => void }) {
  const person = erpRepository.ladePerson(nutzerId)!
  const [entwurf, setEntwurf] = useState<Entwurf>(() => entwurfVonPerson(person))
  const [gespeichert, setGespeichert] = useState<Entwurf>(() => entwurfVonPerson(person))
  const dateiInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const hatAenderungen =
    entwurf.name !== gespeichert.name ||
    entwurf.telefon !== gespeichert.telefon ||
    entwurf.email !== gespeichert.email ||
    entwurf.avatarUrl !== gespeichert.avatarUrl ||
    entwurf.aktuellesPasswort !== '' ||
    entwurf.neuesPasswort !== '' ||
    entwurf.neuesPasswortBestaetigen !== ''

  function set<K extends keyof Entwurf>(feld: K, wert: Entwurf[K]) {
    setEntwurf((prev) => ({ ...prev, [feld]: wert }))
  }

  function speichern() {
    const aktualisiert: Person = {
      ...person,
      name: entwurf.name.trim() || person.name,
      telefon: entwurf.telefon,
      email: entwurf.email,
      avatarUrl: entwurf.avatarUrl,
    }
    erpRepository.aktualisierePerson(aktualisiert)
    const neuerSnapshot = { ...entwurf, aktuellesPasswort: '', neuesPasswort: '', neuesPasswortBestaetigen: '' }
    setGespeichert(neuerSnapshot)
    setEntwurf(neuerSnapshot)
  }

  function handleBild(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    if (!datei) return
    const reader = new FileReader()
    reader.onload = (ev) => set('avatarUrl', ev.target?.result as string)
    reader.readAsDataURL(datei)
    e.target.value = ''
  }

  const vorschauPerson: Person = { ...person, name: entwurf.name || person.name, avatarUrl: entwurf.avatarUrl }

  return (
    <div className="es-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="es-panel es-panel--sys" role="dialog" aria-modal="true" aria-label="Mein Profil">

        <div className="es-kopf">
          <div>
            <div className="es-kopf__titel">Mein Profil</div>
            <div className="es-kopf__untertitel">Persönliche Daten und Passwort</div>
          </div>
          <button type="button" className="es-kopf__schliessen" onClick={onClose} aria-label="Schließen">✕</button>
        </div>

        <div className="es-inhalt">
          {/* Avatar mit Kamera */}
          <div className="um-avatar-bereich" style={{ marginBottom: 24 }}>
            <div className="um-avatar-wrapper">
              <Avatar person={vorschauPerson} size={64} />
              <button type="button" className="um-kamera-btn" aria-label="Profilbild hochladen"
                onClick={() => dateiInputRef.current?.click()}>
                <IconKamera size={13} />
              </button>
              <input ref={dateiInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={handleBild} />
            </div>
          </div>

          {/* Felder */}
          <div className="es-raster">
            <div className="es-feld">
              <label className="es-label" htmlFor="mp-name">Name</label>
              <input id="mp-name" type="text" className="es-input" value={entwurf.name}
                onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="es-feld">
              <label className="es-label" htmlFor="mp-telefon">Telefon</label>
              <input id="mp-telefon" type="text" className="es-input" value={entwurf.telefon}
                onChange={(e) => set('telefon', e.target.value)} />
            </div>
            <div className="es-feld es-feld--voll">
              <label className="es-label" htmlFor="mp-email">E-Mail</label>
              <input id="mp-email" type="email" className="es-input" value={entwurf.email}
                onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>

          {/* Passwort-Abschnitt */}
          <div className="mp-passwort-trenner">
            <span>Passwort ändern</span>
          </div>
          <div className="es-raster">
            <div className="es-feld es-feld--voll">
              <label className="es-label" htmlFor="mp-pw-aktuell">Aktuelles Passwort</label>
              <input id="mp-pw-aktuell" type="password" className="es-input" value={entwurf.aktuellesPasswort}
                autoComplete="current-password"
                onChange={(e) => set('aktuellesPasswort', e.target.value)} />
            </div>
            <div className="es-feld">
              <label className="es-label" htmlFor="mp-pw-neu">Neues Passwort</label>
              <input id="mp-pw-neu" type="password" className="es-input" value={entwurf.neuesPasswort}
                autoComplete="new-password"
                onChange={(e) => set('neuesPasswort', e.target.value)} />
            </div>
            <div className="es-feld">
              <label className="es-label" htmlFor="mp-pw-bestaetigen">Neues Passwort bestätigen</label>
              <input id="mp-pw-bestaetigen" type="password" className="es-input" value={entwurf.neuesPasswortBestaetigen}
                autoComplete="new-password"
                onChange={(e) => set('neuesPasswortBestaetigen', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="es-fuss">
          <div className="es-fuss__rechts">
            <button type="button" className="es-btn es-btn--abbrechen" onClick={onClose}>
              Abbrechen
            </button>
            <button type="button"
              className={`es-btn es-btn--speichern${hatAenderungen ? ' es-btn--speichern-aktiv' : ''}`}
              onClick={speichern}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
