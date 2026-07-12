import { useState, FormEvent } from 'react'
import { useAuthContext } from '../auth/AuthContext'
import { AuthBackground } from './AuthBackground'

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

  return (
    <AuthBackground>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 40px 120px rgba(0,0,0,.45)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          background: 'var(--color-primary)',
          padding: '24px 36px',
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
        }}>
          <span style={{
            background: 'var(--color-accent)',
            borderRadius: '50%',
            width: '38px', height: '38px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 400, fontSize: '.90rem', color: 'var(--color-primary)', flexShrink: 0,
          }}>immo</span>
          <span style={{ fontSize: '.90rem', fontWeight: 400, color: '#fff', letterSpacing: '-.01em' }}>logy</span>
        </div>

        {/* Form */}
        <div style={{ padding: '28px 36px 32px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            Willkommen{name ? `, ${name}` : ''}!
          </div>
          <div style={{ fontSize: '14px', color: '#6b7180', marginBottom: '20px', lineHeight: 1.6 }}>
            Bitte legen Sie ein persönliches Passwort fest, um Ihr Konto zu aktivieren.
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="es-label">
              Neues Passwort
              <input
                className="es-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                autoComplete="new-password"
                style={{ marginTop: '6px' }}
              />
            </label>
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
                padding: '14px', borderRadius: '10px',
                cursor: loading ? 'default' : 'pointer',
                marginTop: '4px',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(242,213,81,.3)',
                transition: 'background .15s, box-shadow .15s',
              }}
            >
              {loading ? 'Bitte warten…' : 'Passwort festlegen & anmelden'}
            </button>
          </form>
        </div>
      </div>
    </AuthBackground>
  )
}
