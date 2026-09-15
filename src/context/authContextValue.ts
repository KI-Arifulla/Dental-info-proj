import { createContext } from 'react'

export interface AuthContextValue {
  unlocked: boolean
  unlock: () => void
  lock: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
