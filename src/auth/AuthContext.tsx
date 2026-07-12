import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthCtx {
  session: Session | null
  loading: boolean
  mustSetPassword: boolean
  signIn: (email: string, password: string) => Promise<AuthError | null>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<AuthError | null>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mustSetPassword, setMustSetPassword] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setLoading(false)
      // Eingeladener Nutzer landet mit SIGNED_IN nach Klick auf Einladungslink
      // und hat mustSetPassword=true in user_metadata gesetzt
      if (event === 'SIGNED_IN' && s?.user?.user_metadata?.mustSetPassword === true) {
        setMustSetPassword(true)
      }
      if (event === 'SIGNED_OUT') {
        setMustSetPassword(false)
      }
      // Nach erfolgreichem Passwort-Update: Flag zurücksetzen
      if (event === 'USER_UPDATED') {
        setMustSetPassword(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async function updatePassword(newPassword: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      // Metadaten-Flag löschen
      await supabase.auth.updateUser({ data: { mustSetPassword: false } })
    }
    return error
  }

  return (
    <AuthContext.Provider value={{ session, loading, mustSetPassword, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext muss innerhalb von AuthProvider verwendet werden')
  return ctx
}
