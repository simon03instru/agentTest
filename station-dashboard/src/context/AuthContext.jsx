/**
 * src/context/AuthContext.jsx  ← FILE BARU
 *
 * Menyediakan:
 * - user, token, role, isLoading
 * - login(), logout(), hasRole()
 *
 * Wrap App dengan <AuthProvider> di main.jsx.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, login as apiLogin } from '@/api/auth'
import { TOKEN_KEY } from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [token, setToken]       = useState(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true) // cek session awal

  // Saat mount — verifikasi token yang tersimpan di localStorage
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then((data) => {
        localStorage.setItem('user', JSON.stringify(data))
        setUser(data)
      })
      .catch(() => {
        // Token tidak valid / expired
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Login: simpan token, ambil data user
   * @param {{ username, password }} credentials
   */
  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials)
    const jwt  = data.access_token
    localStorage.setItem(TOKEN_KEY, jwt)
    setToken(jwt)
    // Ambil data user lengkap
    const me = await getMe()
    localStorage.setItem('user', JSON.stringify(me))
    setUser(me)
    return me
  }, [])

  /**
   * Logout: bersihkan token dan user dari state & storage
   */
  const logout = useCallback(() => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('user')
  setToken(null)
  setUser(null)
}, [])

  /**
   * Cek apakah user punya role yang diizinkan
   * @param {string|string[]} allowedRoles
   * Contoh: hasRole('admin') atau hasRole(['admin', 'superadmin'])
   */
  const hasRole = useCallback((allowedRoles) => {
    if (!user?.role) return false
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return roles.includes(user.role)
  }, [user])

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    login,
    logout,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook untuk mengakses auth context */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam <AuthProvider>')
  return ctx
}

export default AuthContext
