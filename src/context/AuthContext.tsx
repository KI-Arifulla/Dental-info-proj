import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { STAFF_UNAUTHORIZED_EVENT, authApi } from '../api/client'
import { AuthContext } from './authContextValue'
import type { AuthContextValue } from './authContextValue'

const STORAGE_KEY = 'nandini-dental-care.unlocked'

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function clearUnlocked() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory state is still cleared by the caller.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked)

  // The server session is the source of truth; drop back to the lock screen when it expires.
  useEffect(() => {
    function handleUnauthorized() {
      clearUnlocked()
      setUnlocked(false)
    }
    window.addEventListener(STAFF_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(STAFF_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      unlocked,
      unlock: () => {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true')
        } catch {
          // Keep the in-memory session usable when storage is unavailable.
        }
        setUnlocked(true)
      },
      lock: () => {
        void authApi.logout().catch(() => {})
        clearUnlocked()
        setUnlocked(false)
      },
    }),
    [unlocked],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
