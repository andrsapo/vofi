import { useState, FormEvent } from 'react'
import { useAuthContext } from '../auth/AuthContext'

export default function LoginScreen() {
  const { signIn, signUp } = useAuthContext()
  const [tab, setTab] = useState<'anmelden' | 'registrieren'>('anmelden')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function errorText(msg: string): string {
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
      return 'E-Mail oder Passwort ist falsch.'
    if (msg.includes('Email not confirmed'))
      return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.'
    if (msg.includes('User already registered'))
      return 'Diese E-Mail-Adresse ist bereits registriert.'
    if (msg.includes('Password should be'))
      return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
    return msg
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (tab === 'registrieren' && password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setLoading(true)
    const err = tab === 'anmelden'
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)

    if (err) {
      setError(errorText(err.message))
    } else if (tab === 'registrieren') {
      setSuccess(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-family)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 40px 120px rgba(0,0,0,.45)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--color-primary)',
          padding: '32px 36px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}>
          <span style={{
            background: 'var(--color-accent)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 400,
            fontSize: '.90rem',
            color: 'var(--color-primary)',
            flexShrink: 0,
          }}>immo</span>
          <span style={{ fontSize: '.90rem', fontWeight: 400, color: '#fff', letterSpacing: '-.01em' }}>logy</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eceef4' }}>
          {(['anmelden', 'registrieren'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccess(false) }}
              style={{
                flex: 1,
                border: 0,
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: 600,
                padding: '16px',
                color: tab === t ? 'var(--color-primary)' : '#9aa0af',
                borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'color .14s, border-color .14s',
              }}
            >
              {t === 'anmelden' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '32px 36px 36px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#eaf6ee', color: '#2f9e5f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', margin: '0 auto 16px',
              }}>✓</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                Registrierung erfolgreich!
              </div>
              <div style={{ fontSize: '14px', color: '#6b7180', lineHeight: 1.6 }}>
                Sie können sich jetzt anmelden.
              </div>
              <button
                onClick={() => { setTab('anmelden'); setSuccess(false) }}
                style={{
                  marginTop: '20px', border: 0, background: 'var(--color-accent)',
                  color: 'var(--color-primary)', fontFamily: 'inherit',
                  fontSize: '14px', fontWeight: 700, padding: '12px 28px',
                  borderRadius: '10px', cursor: 'pointer',
                }}
              >
                Zur Anmeldung
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="es-label">
                E-Mail
                <input
                  className="es-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@unternehmen.de"
                  required
                  autoComplete="email"
                  style={{ marginTop: '6px' }}
                />
              </label>

              <label className="es-label">
                Passwort
                <input
                  className="es-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  autoComplete={tab === 'anmelden' ? 'current-password' : 'new-password'}
                  style={{ marginTop: '6px' }}
                />
              </label>

              {tab === 'registrieren' && (
                <label className="es-label">
                  Passwort bestätigen
                  <input
                    className="es-input"
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Passwort wiederholen"
                    required
                    autoComplete="new-password"
                    style={{ marginTop: '6px' }}
                  />
                </label>
              )}

              {error && (
                <div style={{
                  background: '#fdeae6', border: '1px solid #f5c9be',
                  borderRadius: '8px', padding: '10px 14px',
                  fontSize: '13.5px', color: '#c0392b', lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  border: 0,
                  background: loading ? '#eceef4' : 'var(--color-accent)',
                  color: loading ? '#9aa0af' : 'var(--color-primary)',
                  fontFamily: 'inherit', fontSize: '15px', fontWeight: 700,
                  padding: '14px', borderRadius: '10px', cursor: loading ? 'default' : 'pointer',
                  marginTop: '4px',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(242,213,81,.3)',
                  transition: 'background .15s, box-shadow .15s',
                }}
              >
                {loading ? 'Bitte warten…' : tab === 'anmelden' ? 'Anmelden' : 'Konto erstellen'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
