/**
 * Sehr einfacher localStorage-Hook: liest beim ersten Render, schreibt bei
 * jeder Änderung. SSR- oder JSON-Fehler machen die App nicht kaputt – wir
 * fallen dann still auf den Default zurück.
 */

import { useEffect, useState } from 'react'

export function useLocalStorage<T>(schluessel: string, standardwert: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [wert, setzeWert] = useState<T>(() => {
    if (typeof window === 'undefined') return standardwert
    try {
      const raw = window.localStorage.getItem(schluessel)
      if (raw === null) return standardwert
      return JSON.parse(raw) as T
    } catch {
      return standardwert
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(schluessel, JSON.stringify(wert))
    } catch {
      /* Speicher voll oder Quota – Fehler ignorieren, Wert bleibt im State. */
    }
  }, [schluessel, wert])

  return [wert, setzeWert]
}
