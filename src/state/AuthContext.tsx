/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type UserProfile } from '../api/client'

type AuthContextShape = {
  user: UserProfile | null
  token: string | null
  loading: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  refreshProfile: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState<boolean>(!!token)

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null)
      return
    }
    const me = await api.me()
    setUser(me)
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    void refreshProfile()
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [token, refreshProfile])

  async function login(emailOrUsername: string, password: string) {
    setLoading(true)
    try {
      const res = await api.login({ emailOrUsername, password })
      setToken(res.token)
      localStorage.setItem('token', res.token)
      setUser(res.user)
    } finally {
      setLoading(false)
    }
  }

  async function register(name: string, email: string, password: string) {
    setLoading(true)
    try {
      const res = await api.register({ name, email, password })
      setToken(res.token)
      localStorage.setItem('token', res.token)
      setUser(res.user)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
