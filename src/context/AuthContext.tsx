import { useMemo, useState, type ReactNode } from 'react'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked)

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
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {
          // The in-memory state is still cleared below.
        }
        setUnlocked(false)
      },
    }),
    [unlocked],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
