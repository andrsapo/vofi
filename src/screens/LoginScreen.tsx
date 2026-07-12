import React, { useState, FormEvent } from 'react'
import { useAuthContext } from '../auth/AuthContext'
import { DemoBuchenModal } from '../components/DemoBuchenModal'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/* Markengrafik – login-grafik.png, Seitenverhältnis 2752:1006 */
function LoginGrafik() {
  return (
    <img
      src="/login-grafik.png"
      alt=""
      aria-hidden="true"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  )
}

export default function LoginScreen() {
  const { signIn } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  const emailOk = EMAIL_RE.test(email.trim())
  const emailError = touchedEmail && email.length > 0 && !emailOk
  const formOk = emailOk && password.length >= 1

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!formOk) return
    setServerError(null)
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) {
      const msg = err.message
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
        setServerError('E-Mail oder Passwort ist falsch.')
      else if (msg.includes('Email not confirmed'))
        setServerError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.')
      else setServerError(msg)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 560px',
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ── Linke Marken-Spalte ── */}
      <div style={{
        position: 'relative',
        background: '#12142a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
      }}>
        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0', zIndex: 1 }}>
          <span style={{
            background: '#f2d551',
            borderRadius: '50%',
            width: '38px', height: '38px',
            minWidth: '38px', minHeight: '38px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            letterSpacing: '-0.3px',
            color: '#12142a',
            flexShrink: 0,
          }}>immo</span>
          <span style={{
            fontFamily: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '-0.3px',
            color: '#ffffff',
            marginLeft: '2px',
            whiteSpace: 'nowrap',
          }}>logy</span>
        </div>

        {/* Headline — ausgerichtet an der Formular-Oberkante */}
        <div style={{
          position: 'absolute',
          left: '64px', right: '64px',
          top: 'max(140px, calc(50% - 237px))',
          maxWidth: '560px',
          zIndex: 1,
        }}>
          <h1 style={{
            fontSize: 'clamp(40px, 4.5vw, 62px)',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-.03em',
            lineHeight: 1.05,
            margin: '0 0 18px',
          }}>Willkommen!</h1>
          <p style={{
            fontSize: '19px',
            fontWeight: 400,
            color: '#ffffff',
            lineHeight: 1.55,
            margin: 0,
            opacity: 0.72,
          }}>
            Bereit für kluge Entscheidungen und erfolgreiche Planungen?
          </p>
        </div>

        {/* Markengrafik am unteren Rand */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', zIndex: 0 }}>
          <LoginGrafik />
        </div>

        <div />
      </div>

      {/* ── Rechte Anmelde-Spalte ── */}
      <div style={{
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 72px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>

          <h2 style={{
            fontSize: '28px', fontWeight: 800, color: '#12142a',
            letterSpacing: '-.02em', margin: '0 0 6px',
          }}>Anmelden</h2>
          <p style={{ fontSize: '14.5px', color: '#6b7180', margin: '0 0 32px' }}>
            Melden Sie sich mit Ihrem Firmenkonto an.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* E-Mail */}
            <label style={{
              display: 'flex', flexDirection: 'column', gap: '7px',
              fontSize: '13.5px', fontWeight: 600, color: '#12142a', marginBottom: '18px',
            }}>
              E-Mail
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setTouchedEmail(true) }}
                placeholder="name@unternehmen.de"
                autoComplete="email"
                style={{
                  border: `1.5px solid ${emailError ? '#c23b3b' : '#d8dae3'}`,
                  borderRadius: '10px', padding: '13px 15px',
                  fontFamily: 'inherit', fontSize: '15px', color: '#12142a',
                  outline: 'none', background: '#ffffff',
                }}
                onFocus={e => {
                  e.target.style.border = '1.5px solid #f6c945'
                  e.target.style.boxShadow = '0 0 0 3px rgba(246,201,69,.18)'
                }}
                onBlur={e => {
                  e.target.style.border = `1.5px solid ${emailError ? '#c23b3b' : '#d8dae3'}`
                  e.target.style.boxShadow = 'none'
                  setTouchedEmail(true)
                }}
              />
              {emailError && (
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#c23b3b' }}>
                  Bitte eine gültige E-Mail-Adresse eingeben.
                </span>
              )}
            </label>

            {/* Passwort */}
            <label style={{
              display: 'flex', flexDirection: 'column', gap: '7px',
              fontSize: '13.5px', fontWeight: 600, color: '#12142a', marginBottom: '10px',
            }}>
              Passwort
              <div style={{ position: 'relative', display: 'flex' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  autoComplete="current-password"
                  style={{
                    flex: 1, border: '1.5px solid #d8dae3', borderRadius: '10px',
                    padding: '13px 56px 13px 15px',
                    fontFamily: 'inherit', fontSize: '15px', color: '#12142a',
                    outline: 'none', background: '#ffffff',
                  }}
                  onFocus={e => {
                    e.target.style.border = '1.5px solid #f6c945'
                    e.target.style.boxShadow = '0 0 0 3px rgba(246,201,69,.18)'
                  }}
                  onBlur={e => {
                    e.target.style.border = '1.5px solid #d8dae3'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  title={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  style={{
                    position: 'absolute', right: '6px', top: '50%',
                    transform: 'translateY(-50%)',
                    border: 0, background: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600,
                    color: '#6b7180', padding: '8px 10px', borderRadius: '8px',
                    transition: 'background .12s, color .12s',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = '#f2f3f7';
                    (e.target as HTMLElement).style.color = '#12142a'
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = 'none';
                    (e.target as HTMLElement).style.color = '#6b7180'
                  }}
                >
                  {showPw ? 'Verbergen' : 'Anzeigen'}
                </button>
              </div>
            </label>

            {/* Angemeldet bleiben + Passwort vergessen */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '26px',
            }}>
              <label
                onClick={() => setRemember(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  fontSize: '13.5px', color: '#4a4f60', cursor: 'pointer', userSelect: 'none',
                }}
              >
                <span style={{
                  width: '19px', height: '19px', flexShrink: 0, borderRadius: '5px',
                  border: `1.5px solid ${remember ? '#f6c945' : '#c6c9d4'}`,
                  background: remember ? '#f6c945' : '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#12142a', fontSize: '12px', fontWeight: 700,
                  transition: 'background .12s, border-color .12s',
                }}>
                  {remember ? '✓' : ''}
                </span>
                Angemeldet bleiben
              </label>
              <a href="#" style={{ fontSize: '13.5px', fontWeight: 600, color: '#2f6bd6', textDecoration: 'none' }}>
                Passwort vergessen?
              </a>
            </div>

            {/* Server-Fehlermeldung */}
            {serverError && (
              <div style={{
                background: '#fdeae6', border: '1px solid #f5c9be',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13.5px', color: '#c0392b', lineHeight: 1.5, marginBottom: '16px',
              }}>
                {serverError}
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={!formOk || loading}
              style={{
                width: '100%', border: 0,
                cursor: formOk && !loading ? 'pointer' : 'default',
                fontFamily: 'inherit',
                background: formOk && !loading ? '#f6c945' : '#eceef4',
                color: formOk && !loading ? '#12142a' : '#9aa0af',
                fontSize: '16px', fontWeight: 700,
                padding: '15px 0', borderRadius: '12px',
                boxShadow: formOk && !loading ? '0 8px 30px rgba(246,201,69,.3)' : 'none',
                transition: 'background .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { if (formOk && !loading) (e.target as HTMLElement).style.background = '#ffd75e' }}
              onMouseLeave={e => { if (formOk && !loading) (e.target as HTMLElement).style.background = '#f6c945' }}
            >
              {loading ? 'Bitte warten…' : 'Anmelden'}
            </button>

            {/* Vertrauenszeile */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              marginTop: '22px', fontSize: '13px', color: '#9aa0af',
            }}>
              <span>🔒</span>Verschlüsselte Verbindung · DSGVO-konform
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '1px solid #ececec', marginTop: '30px', paddingTop: '22px',
              textAlign: 'center', fontSize: '14px', color: '#6b7180',
            }}>
              Noch kein Zugang?{' '}
              <a
                href="#"
                onClick={e => { e.preventDefault(); setDemoOpen(true) }}
                style={{ fontWeight: 600, color: '#2f6bd6', textDecoration: 'none' }}
              >
                Demo buchen
              </a>
            </div>
          </form>
        </div>
      </div>

      <DemoBuchenModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
