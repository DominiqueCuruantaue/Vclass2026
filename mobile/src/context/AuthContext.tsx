import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@shared/types'
import { loadStoredToken, setAccessToken, getAccessToken } from '../api/client'
import * as authApi from '../api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  registerStudent: (payload: Parameters<typeof authApi.registerStudent>[0]) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (u: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const token = await loadStoredToken()
      if (token) {
        try {
          const me = await authApi.fetchMe()
          setUser(me)
        } catch {
          await setAccessToken(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setUser(res.user)
  }, [])

  const registerStudent = useCallback(async (payload: Parameters<typeof authApi.registerStudent>[0]) => {
    const res = await authApi.registerStudent(payload)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return
    const me = await authApi.fetchMe()
    setUser(me)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, registerStudent, logout, refreshUser, setUser }),
    [user, loading, login, registerStudent, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
