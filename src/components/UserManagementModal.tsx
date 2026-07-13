import { useEffect, useRef, useState } from 'react'
import type { Person, Rolle } from '../types'
import { erpRepository } from '../data/erpRepository'
import { supabase } from '../lib/supabaseClient'
import { uploadBild } from '../data/supabaseRepository'
import { useApp } from '../state/store'
import { Avatar } from './ui'
import { IconKamera, IconSchliessen } from './icons'

const ROLLEN: Rolle[] = ['Administrator', 'Sachbearbeiter', 'Manager', 'Berater', 'AR']

function neueInitialen(name: string): string {
  const teile = name.trim().split(/\s+/)
  if (teile.length >= 2) return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const FARBEN = ['#5b8def', '#2f9ec4', '#2fae7e', '#d2699e', '#7a86d6', '#b0873c', '#e8964b', '#9a6ee8']

type Entwurf = Omit<Person, 'id'>

function leererEntwurf(): Entwurf {
  return {
    name: '', rolle: 'Berater', initialen: '', farbe: FARBEN[0],
    bio: '', fachgebiet: '', standort: '', sprachen: '', email: '', telefon: '', linkedin: '',
  }
}

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const { aktuellerNutzerId } = useApp()
  const [personen, setPersonen] = useState<Person[]>(() => erpRepository.ladePersonen())
  const [ausgewaehltId, setAusgewaehltId] = useState<string | null>(personen[0]?.id ?? null)
  const [entwuerfe, setEntwuerfe] = useState<Record<string, Entwurf>>({})
  const [neuModus, setNeuModus] = useState(false)
  const [neuerEntwurf, setNeuerEntwurf] = useState<Entwurf>(leererEntwurf())
  const [loeschKandidat, setLoeschKandidat] = useState<Person | null>(null)
  const [einladenStatus, setEinladenStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [einladenFehler, setEinladenFehler] = useState<string | null>(null)
  const dateiInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const ausgewaehltePerson = personen.find((p) => p.id === ausgewaehltId) ?? null

  const aktuellerEntwurf = ausgewaehltId
    ? (entwuerfe[ausgewaehltId] ?? (ausgewaehltePerson ? { ...ausgewaehltePerson } : null))
    : null

  const hatAenderungen = ausgewaehltId && ausgewaehltePerson && aktuellerEntwurf
    ? JSON.stringify(aktuellerEntwurf) !== JSON.stringify({ ...ausgewaehltePerson })
    : false

  function aendere<K extends keyof Entwurf>(feld: K, wert: Entwurf[K]) {
    if (!ausgewaehltId || !ausgewaehltePerson) return
    const basis = entwuerfe[ausgewaehltId] ?? { ...ausgewaehltePerson }
    setEntwuerfe((prev) => ({ ...prev, [ausgewaehltId]: { ...basis, [feld]: wert } }))
  }

  function aendereNeu<K extends keyof Entwurf>(feld: K, wert: Entwurf[K]) {
    setNeuerEntwurf((prev) => ({ ...prev, [feld]: wert }))
    setEinladenStatus('idle')
    setEinladenFehler(null)
  }

  function speichern() {
    if (!ausgewaehltId || !aktuellerEntwurf) return
    const gespeichert: Person = { ...aktuellerEntwurf, id: ausgewaehltId }
    erpRepository.aktualisierePerson(gespeichert)
    setPersonen(erpRepository.ladePersonen())
    setEntwuerfe((prev) => { const n = { ...prev }; delete n[ausgewaehltId]; return n })
  }

  function abbrechen() {
    if (!ausgewaehltId) return
    setEntwuerfe((prev) => { const n = { ...prev }; delete n[ausgewaehltId]; return n })
  }

  function loescheBestaetigt() {
    if (!loeschKandidat) return
    erpRepository.loeschePerson(loeschKandidat.id)
    const neu = erpRepository.ladePersonen()
    setPersonen(neu)
    setAusgewaehltId(neu[0]?.id ?? null)
    setLoeschKandidat(null)
  }

  async function einladen() {
    if (!neuerEntwurf.email || !neuerEntwurf.name) return
    setEinladenStatus('sending')
    setEinladenFehler(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            email: neuerEntwurf.email,
            name: neuerEntwurf.name,
            rolle: neuerEntwurf.rolle,
          }),
        }
      )
      let json: { id?: string; error?: string } = {}
      try { json = await res.json() } catch { /* leere Antwort */ }
      if (!res.ok) {
        setEinladenStatus('error')
        setEinladenFehler(json.error ?? `Fehler ${res.status}. Bitte versuchen Sie es erneut.`)
        return
      }
      setEinladenStatus('sent')
      // Nutzer lokal als Person anlegen (Supabase-ID noch nicht bekannt → temporäre ID)
      const tempId = 'pending-' + Date.now()
      const person: Person = {
        ...neuerEntwurf,
        id: json.id ?? tempId,
        initialen: neueInitialen(neuerEntwurf.name) || 'NN',
        farbe: neuerEntwurf.farbe || FARBEN[Math.floor(Math.random() * FARBEN.length)],
      }
      erpRepository.fuegePersonHinzu(person)
      const neu = erpRepository.ladePersonen()
      setPersonen(neu)
      // Nach 2 Sekunden zur neuen Person wechseln
      setTimeout(() => {
        setAusgewaehltId(person.id)
        setNeuModus(false)
        setNeuerEntwurf(leererEntwurf())
        setEinladenStatus('idle')
      }, 2000)
    } catch {
      setEinladenStatus('error')
      setEinladenFehler('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  function handleBildUpload(e: React.ChangeEvent<HTMLInputElement>, fuerNeu = false) {
    const datei = e.target.files?.[0]
    if (!datei) return
    // Vorschau sofort
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      if (fuerNeu) aendereNeu('avatarUrl', url)
      else aendere('avatarUrl', url)
    }
    reader.readAsDataURL(datei)
    // In Storage hochladen
    const personId = fuerNeu ? `neu-${Date.now()}` : (ausgewaehltId ?? 'unbekannt')
    const ext = datei.name.split('.').pop() ?? 'jpg'
    uploadBild(datei, `avatare/${personId}.${ext}`).then((url) => {
      if (url) {
        if (fuerNeu) aendereNeu('avatarUrl', url)
        else aendere('avatarUrl', url)
      }
    })
    e.target.value = ''
  }

  const anzeigeEntwurf = neuModus ? neuerEntwurf : aktuellerEntwurf
  const isNeu = neuModus

  const einladenMoeglich = isNeu && neuerEntwurf.name.trim().length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(neuerEntwurf.email ?? '')

  return (
    <div className="es-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="es-panel es-panel--breit" role="dialog" aria-modal="true" aria-label="User Management">

        {/* Blaue Kopfzeile */}
        <div className="es-kopf">
          <div>
            <div className="es-kopf__titel">User Management</div>
            <div className="es-kopf__untertitel">Berater und Nutzer verwalten</div>
          </div>
          <button type="button" className="es-kopf__schliessen" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        {/* Master-Detail-Body */}
        <div className="um-body">
          {/* Linke Spalte */}
          <div className="um-liste">
            <button
              type="button"
              className="um-neu-btn"
              onClick={() => { setNeuModus(true); setAusgewaehltId(null); setEinladenStatus('idle'); setEinladenFehler(null) }}
            >
              + Neuer Nutzer einladen
            </button>
            {personen.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`um-zeile${ausgewaehltId === p.id && !neuModus ? ' um-zeile--aktiv' : ''}`}
                onClick={() => { setAusgewaehltId(p.id); setNeuModus(false) }}
              >
                <Avatar person={entwuerfe[p.id] ? { ...p, ...entwuerfe[p.id] } : p} size={34} />
                <div className="um-zeile__info">
                  <span className="um-zeile__name">{entwuerfe[p.id]?.name ?? p.name}</span>
                  <span className="um-zeile__rolle">{entwuerfe[p.id]?.rolle ?? p.rolle}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Rechte Spalte */}
          <div className="um-formular">
            {anzeigeEntwurf ? (
              <>
                <div className="um-avatar-bereich">
                  <div className="um-avatar-wrapper">
                    <Avatar
                      person={isNeu
                        ? { id: 'preview', name: neuerEntwurf.name || 'NN', rolle: neuerEntwurf.rolle, initialen: neueInitialen(neuerEntwurf.name) || 'NN', farbe: neuerEntwurf.farbe, avatarUrl: neuerEntwurf.avatarUrl }
                        : { ...ausgewaehltePerson!, ...aktuellerEntwurf! }
                      }
                      size={72}
                    />
                    <button
                      type="button"
                      className="um-kamera-btn"
                      aria-label="Profilbild hochladen"
                      onClick={() => dateiInputRef.current?.click()}
                    >
                      <IconKamera size={13} />
                    </button>
                    <input ref={dateiInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => handleBildUpload(e, isNeu)} />
                  </div>
                  <button
                    type="button"
                    className={`um-stern${(isNeu ? neuerEntwurf.favorisiert : aktuellerEntwurf?.favorisiert) ? ' um-stern--aktiv' : ''}`}
                    aria-label={`Favorit ${(isNeu ? neuerEntwurf.favorisiert : aktuellerEntwurf?.favorisiert) ? 'entfernen' : 'setzen'}`}
                    onClick={() => isNeu ? aendereNeu('favorisiert', !neuerEntwurf.favorisiert) : aendere('favorisiert', !aktuellerEntwurf?.favorisiert)}
                  >
                    ★
                  </button>
                </div>

                <div className="um-felder">
                  <div className="es-raster">
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-name">Name</label>
                      <input id="um-name" type="text" className="es-input" value={anzeigeEntwurf.name}
                        onChange={(e) => isNeu ? aendereNeu('name', e.target.value) : aendere('name', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor={`um-rolle-${isNeu ? 'neu' : ausgewaehltId}`}>Rolle</label>
                      <select
                        key={isNeu ? 'neu' : ausgewaehltId}
                        id={`um-rolle-${isNeu ? 'neu' : ausgewaehltId}`}
                        className="es-input"
                        defaultValue={anzeigeEntwurf.rolle}
                        onChange={(e) => isNeu ? aendereNeu('rolle', e.target.value as Rolle) : aendere('rolle', e.target.value as Rolle)}
                      >
                        {ROLLEN.map((r) => (
                          <option key={r} value={r}>{r === 'AR' ? 'AR (Aufsichtsrat)' : r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-email">E-Mail {isNeu && <span style={{ color: '#c0392b' }}>*</span>}</label>
                      <input id="um-email" type="email" className="es-input" value={anzeigeEntwurf.email ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('email', e.target.value) : aendere('email', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-fachgebiet">Fachgebiet</label>
                      <input id="um-fachgebiet" type="text" className="es-input" value={anzeigeEntwurf.fachgebiet ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('fachgebiet', e.target.value) : aendere('fachgebiet', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-standort">Standort</label>
                      <input id="um-standort" type="text" className="es-input" value={anzeigeEntwurf.standort ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('standort', e.target.value) : aendere('standort', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-telefon">Telefon</label>
                      <input id="um-telefon" type="text" className="es-input" value={anzeigeEntwurf.telefon ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('telefon', e.target.value) : aendere('telefon', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-sprachen">Sprachen</label>
                      <input id="um-sprachen" type="text" className="es-input" value={anzeigeEntwurf.sprachen ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('sprachen', e.target.value) : aendere('sprachen', e.target.value)} />
                    </div>
                    <div className="es-feld">
                      <label className="es-label" htmlFor="um-linkedin">LinkedIn</label>
                      <input id="um-linkedin" type="text" className="es-input" value={anzeigeEntwurf.linkedin ?? ''}
                        onChange={(e) => isNeu ? aendereNeu('linkedin', e.target.value) : aendere('linkedin', e.target.value)} />
                    </div>
                  </div>
                  <div className="es-feld es-feld--voll">
                    <label className="es-label" htmlFor="um-bio">Bio</label>
                    <textarea id="um-bio" className="es-textarea" rows={3} value={anzeigeEntwurf.bio ?? ''}
                      onChange={(e) => isNeu ? aendereNeu('bio', e.target.value) : aendere('bio', e.target.value)} />
                  </div>

                  {/* Einladen-Status-Meldung */}
                  {isNeu && einladenStatus === 'error' && einladenFehler && (
                    <div style={{
                      background: '#fdeae6', border: '1px solid #f5c9be', borderRadius: '8px',
                      padding: '10px 14px', fontSize: '13px', color: '#c0392b', marginTop: '8px',
                    }}>
                      {einladenFehler}
                    </div>
                  )}
                  {isNeu && einladenStatus === 'sent' && (
                    <div style={{
                      background: '#eaf6ee', border: '1px solid #a8dbb8', borderRadius: '8px',
                      padding: '10px 14px', fontSize: '13px', color: '#2f7a4a', marginTop: '8px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '15px' }}>✓</span>
                      Einladung wurde erfolgreich an <strong>{neuerEntwurf.email}</strong> gesendet.
                    </div>
                  )}
                  {isNeu && einladenStatus === 'idle' && (
                    <div style={{
                      fontSize: '12.5px', color: '#6b7180', marginTop: '8px', lineHeight: 1.5,
                    }}>
                      Der Nutzer erhält eine Einladungs-E-Mail und wird beim ersten Login aufgefordert, ein eigenes Passwort zu setzen.
                    </div>
                  )}
                </div>

                <div className="es-fuss es-fuss--loeschen">
                  {!isNeu ? (
                    <button type="button" className="es-btn es-btn--loeschen"
                      disabled={ausgewaehltId === aktuellerNutzerId}
                      title={ausgewaehltId === aktuellerNutzerId ? 'Sie können sich nicht selbst löschen.' : undefined}
                      style={ausgewaehltId === aktuellerNutzerId ? { opacity: 0.4, cursor: 'default' } : undefined}
                      onClick={() => ausgewaehltePerson && ausgewaehltId !== aktuellerNutzerId && setLoeschKandidat(ausgewaehltePerson)}>
                      Löschen
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="es-fuss__rechts">
                    <button type="button" className="es-btn es-btn--abbrechen"
                      onClick={isNeu ? () => { setNeuModus(false); setAusgewaehltId(personen[0]?.id ?? null) } : onClose}>
                      Abbrechen
                    </button>
                    {isNeu ? (
                      <button
                        type="button"
                        className={`es-btn es-btn--speichern${einladenMoeglich ? ' es-btn--speichern-aktiv' : ''}`}
                        disabled={!einladenMoeglich || einladenStatus === 'sending'}
                        onClick={einladen}
                      >
                        {einladenStatus === 'sending' ? 'Einladung wird gesendet…' : 'Einladung senden'}
                      </button>
                    ) : (
                      <button type="button"
                        className={`es-btn es-btn--speichern${hatAenderungen ? ' es-btn--speichern-aktiv' : ''}`}
                        disabled={!hatAenderungen}
                        onClick={speichern}>
                        Speichern
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="um-leer">Bitte einen Nutzer auswählen oder neu einladen.</div>
            )}
          </div>
        </div>
      </div>

      {loeschKandidat && (
        <div className="es-overlay es-overlay--confirm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setLoeschKandidat(null) }}>
          <div className="es-confirm" role="dialog" aria-modal="true">
            <p>Sind Sie sicher, dass Sie <strong>{loeschKandidat.name}</strong> löschen möchten?</p>
            <div className="es-confirm__fuss">
              <button type="button" className="es-btn es-btn--abbrechen" onClick={() => setLoeschKandidat(null)}>
                Abbrechen
              </button>
              <button type="button" className="es-btn es-btn--loeschen" onClick={loescheBestaetigt}>
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
