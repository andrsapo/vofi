import { useState, FormEvent } from 'react'
import { useAuthContext } from '../auth/AuthContext'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

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

interface Props {
  onBack: () => void
}

export default function ForgotPasswordScreen({ onBack }: Props) {
  const { resetPassword } = useAuthContext()
  const [email, setEmail] = useState('')
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailOk = EMAIL_RE.test(email.trim())
  const emailError = touchedEmail && email.length > 0 && !emailOk

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!emailOk) return
    setError(null)
    setLoading(true)
    const err = await resetPassword(email.trim())
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
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
            background: '#f2d551', borderRadius: '50%',
            width: '38px', height: '38px', minWidth: '38px', minHeight: '38px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
            fontWeight: 500, fontSize: '14px', letterSpacing: '-0.3px',
            color: '#12142a', flexShrink: 0,
          }}>immo</span>
          <span style={{
            fontFamily: "'Nunito', 'Quicksand', 'Segoe UI', system-ui, sans-serif",
            fontSize: '14px', fontWeight: 500, letterSpacing: '-0.3px',
            color: '#ffffff', marginLeft: '2px', whiteSpace: 'nowrap',
          }}>logy</span>
        </div>

        {/* Headline */}
        <div style={{
          position: 'absolute',
          left: '64px', right: '64px',
          top: 'max(140px, calc(50% - 237px))',
          maxWidth: '560px', zIndex: 1,
        }}>
          <h1 style={{
            fontSize: 'clamp(40px, 4.5vw, 62px)', fontWeight: 800,
            color: '#ffffff', letterSpacing: '-.03em', lineHeight: 1.05, margin: '0 0 18px',
          }}>Willkommen!</h1>
          <p style={{
            fontSize: '19px', fontWeight: 400, color: '#ffffff',
            lineHeight: 1.55, margin: 0, opacity: 0.72,
          }}>
            Bereit für kluge Entscheidungen und erfolgreiche Planungen?
          </p>
        </div>

        {/* Markengrafik */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', zIndex: 0 }}>
          <LoginGrafik />
        </div>

        <div />
      </div>

      {/* ── Rechte Formular-Spalte ── */}
      <div style={{
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 72px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>

          {sent ? (
            /* ── Erfolgsansicht ── */
            <>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#eaf6ee', color: '#2f9e5f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', marginBottom: '20px',
              }}>✓</div>
              <h2 style={{
                fontSize: '28px', fontWeight: 800, color: '#12142a',
                letterSpacing: '-.02em', margin: '0 0 10px',
              }}>E-Mail gesendet</h2>
              <p style={{ fontSize: '14.5px', color: '#6b7180', margin: '0 0 28px', lineHeight: 1.6 }}>
                Wir haben einen Link zum Zurücksetzen Ihres Passworts an <strong style={{ color: '#12142a' }}>{email}</strong> gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>
              <button
                onClick={onBack}
                style={{
                  width: '100%', border: 0, cursor: 'pointer',
                  fontFamily: 'inherit', background: '#f6c945',
                  color: '#12142a', fontSize: '15px', fontWeight: 700,
                  padding: '14px 0', borderRadius: '12px',
                  boxShadow: '0 8px 30px rgba(246,201,69,.3)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = '#ffd75e'}
                onMouseLeave={e => (e.target as HTMLElement).style.background = '#f6c945'}
              >
                Zurück zur Anmeldung
              </button>
            </>
          ) : (
            /* ── Formular ── */
            <>
              <h2 style={{
                fontSize: '28px', fontWeight: 800, color: '#12142a',
                letterSpacing: '-.02em', margin: '0 0 6px',
              }}>Passwort vergessen?</h2>
              <p style={{ fontSize: '14.5px', color: '#6b7180', margin: '0 0 32px', lineHeight: 1.6 }}>
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <label style={{
                  display: 'flex', flexDirection: 'column', gap: '7px',
                  fontSize: '13.5px', fontWeight: 600, color: '#12142a', marginBottom: '18px',
                }}>
                  E-Mail
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setTouchedEmail(true) }}
                    onBlur={() => setTouchedEmail(true)}
                    placeholder="name@unternehmen.de"
                    autoComplete="email"
                    style={{
                      border: `1.5px solid ${emailError ? '#c23b3b' : '#d8dae3'}`,
                      borderRadius: '10px', padding: '13px 15px',
                      fontFamily: 'inherit', fontSize: '15px', color: '#12142a',
                      outline: 'none', background: '#ffffff',
                    }}
                    onFocus={e => { e.target.style.border = '1.5px solid #f6c945'; e.target.style.boxShadow = '0 0 0 3px rgba(246,201,69,.18)' }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${emailError ? '#c23b3b' : '#d8dae3'}`; e.target.style.boxShadow = 'none'; setTouchedEmail(true) }}
                  />
                  {emailError && (
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#c23b3b' }}>
                      Bitte eine gültige E-Mail-Adresse eingeben.
                    </span>
                  )}
                </label>

                {error && (
                  <div style={{
                    background: '#fdeae6', border: '1px solid #f5c9be', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '13.5px', color: '#c0392b',
                    lineHeight: 1.5, marginBottom: '16px',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!emailOk || loading}
                  style={{
                    width: '100%', border: 0,
                    cursor: emailOk && !loading ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                    background: emailOk && !loading ? '#f6c945' : '#eceef4',
                    color: emailOk && !loading ? '#12142a' : '#9aa0af',
                    fontSize: '16px', fontWeight: 700,
                    padding: '15px 0', borderRadius: '12px',
                    boxShadow: emailOk && !loading ? '0 8px 30px rgba(246,201,69,.3)' : 'none',
                    transition: 'background .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => { if (emailOk && !loading) (e.target as HTMLElement).style.background = '#ffd75e' }}
                  onMouseLeave={e => { if (emailOk && !loading) (e.target as HTMLElement).style.background = '#f6c945' }}
                >
                  {loading ? 'Bitte warten…' : 'Link anfordern'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={onBack}
                    style={{
                      border: 0, background: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '14px',
                      fontWeight: 600, color: '#2f6bd6',
                    }}
                  >
                    ← Zurück zur Anmeldung
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
