import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StoreProvider, useStore } from './state/store'
import { AuthProvider, useAuthContext } from './auth/AuthContext'
import { sicherstelleNutzer, ladeUndSyncPersonen } from './data/erpRepository'
import LoginScreen from './screens/LoginScreen'
import SetPasswordScreen from './screens/SetPasswordScreen'
import './theme/tokens.css'
import './styles/app.css'

function AppLadebildschirm() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
        <span style={{
          background: 'var(--color-accent)', borderRadius: '50%',
          width: '38px', height: '38px', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          fontWeight: 400, fontSize: '.90rem', color: 'var(--color-primary)',
        }}>immo</span>
        <span style={{ fontSize: '.90rem', color: '#fff', letterSpacing: '-.01em' }}>logy</span>
      </div>
    </div>
  )
}

function BootstrapLayer({ children }: { children: React.ReactNode }) {
  const { session } = useAuthContext()
  const store = useStore()

  useEffect(() => {
    if (!session?.user) return
    const user = session.user
    const meta = user.user_metadata ?? {}
    sicherstelleNutzer({
      id: user.id,
      email: user.email ?? '',
      name: meta.name,
      rolle: meta.rolle,
    })
    // App-Daten laden (migriert ggf. localStorage → DB, dann lädt aus DB)
    store.ladeVonServer().then(() => ladeUndSyncPersonen())
  }, [session?.user?.id])

  return <>{children}</>
}

function AuthGate() {
  const { session, loading, mustSetPassword } = useAuthContext()
  if (loading) return <AppLadebildschirm />
  if (!session) return <LoginScreen />
  if (mustSetPassword) return <SetPasswordScreen />
  return (
    <StoreProvider nutzerId={session.user.id}>
      <BootstrapLayer>
        <App />
      </BootstrapLayer>
    </StoreProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </React.StrictMode>,
)
