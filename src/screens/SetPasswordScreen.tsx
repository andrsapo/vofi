import { useState, FormEvent } from 'react'
import { useAuthContext } from '../auth/AuthContext'

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

export default function SetPasswordScreen() {
  const { updatePassword, session } = useAuthContext()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const name = session?.user?.user_metadata?.name ?? session?.user?.email ?? ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    setLoading(true)
    const err = await updatePassword(password)
    setLoading(false)
    if (err) setError(err.message)
  }

  const formOk = password.length >= 8 && passwordConfirm.length >= 1

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

          <h2 style={{
            fontSize: '28px', fontWeight: 800, color: '#12142a',
            letterSpacing: '-.02em', margin: '0 0 6px',
          }}>
            {name ? `Willkommen, ${name}!` : 'Passwort festlegen'}
          </h2>
          <p style={{ fontSize: '14.5px', color: '#6b7180', margin: '0 0 32px', lineHeight: 1.6 }}>
            Bitte legen Sie ein persönliches Passwort fest, um Ihr Konto zu aktivieren.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            <label style={{
              display: 'flex', flexDirection: 'column', gap: '7px',
              fontSize: '13.5px', fontWeight: 600, color: '#12142a', marginBottom: '18px',
            }}>
              Neues Passwort
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                autoComplete="new-password"
                style={{
                  border: '1.5px solid #d8dae3', borderRadius: '10px',
                  padding: '13px 15px', fontFamily: 'inherit',
                  fontSize: '15px', color: '#12142a', outline: 'none', background: '#ffffff',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #f6c945'; e.target.style.boxShadow = '0 0 0 3px rgba(246,201,69,.18)' }}
                onBlur={e => { e.target.style.border = '1.5px solid #d8dae3'; e.target.style.boxShadow = 'none' }}
              />
            </label>

            <label style={{
              display: 'flex', flexDirection: 'column', gap: '7px',
              fontSize: '13.5px', fontWeight: 600, color: '#12142a', marginBottom: '10px',
            }}>
              Passwort bestätigen
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                autoComplete="new-password"
                style={{
                  border: '1.5px solid #d8dae3', borderRadius: '10px',
                  padding: '13px 15px', fontFamily: 'inherit',
                  fontSize: '15px', color: '#12142a', outline: 'none', background: '#ffffff',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #f6c945'; e.target.style.boxShadow = '0 0 0 3px rgba(246,201,69,.18)' }}
                onBlur={e => { e.target.style.border = '1.5px solid #d8dae3'; e.target.style.boxShadow = 'none' }}
              />
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
              disabled={!formOk || loading}
              style={{
                width: '100%', border: 0, marginTop: '16px',
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
              {loading ? 'Bitte warten…' : 'Passwort festlegen & anmelden'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              marginTop: '22px', fontSize: '13px', color: '#9aa0af',
            }}>
              <span>🔒</span>Verschlüsselte Verbindung · DSGVO-konform
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
