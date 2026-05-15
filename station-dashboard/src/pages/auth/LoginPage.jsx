/**
 * src/pages/auth/LoginPage.jsx  ← FILE BARU
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  AuthLayout, FormField, AuthInput,
  AuthButton, AuthAlert,
} from '@/components/auth/AuthLayout'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const redirectTo   = location.state?.from?.pathname ?? '/'

  const [form, setForm]       = useState({ username: '', password: '' })
  const [isLoading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi.')
      return
    }
    try {
      setLoading(true)
      setError('')
      await login({ username: form.username, password: form.password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login gagal. Periksa username dan password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Anda Mau Masuk ?</h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          Kalau Sudah Punya Akun Langsung Login Saja, Kalau Belum Punya Bisa Daftar Dulu eh..... Maksudnya Sekarang
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthAlert type="error">{error}</AuthAlert>}

        <FormField label="Username / Email">
          <AuthInput
            name="username"
            type="text"
            placeholder="username atau email"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            autoFocus
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <AuthInput
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.8 5.2 1.8 6.5 1.5 8c.8 3.3 4 5.5 6.5 5.5a7 7 0 0 0 3.3-.9M7 2.6C7.2 2.5 7.6 2.5 8 2.5c2.5 0 5.7 2.2 6.5 5.5-.3 1.2-.9 2.3-1.8 3.1"
                        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1.5 8C2.3 4.7 5.5 2.5 8 2.5S13.7 4.7 14.5 8c-.8 3.3-4 5.5-6.5 5.5S2.3 11.3 1.5 8z"
                        stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              )}
            </button>
          </div>
        </FormField>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="font-mono text-xs text-accent/70 hover:text-accent transition-colors"
          >
            Lupa password?
          </Link>
        </div>

        <AuthButton isLoading={isLoading} type="submit">
          {isLoading ? 'Masuk…' : 'Masuk'}
        </AuthButton>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-slate-500">
        Belum punya akun?{' '}
        <Link to="/register" className="text-accent hover:text-accent/80 transition-colors">
          Daftar
        </Link>
      </p>
    </AuthLayout>
  )
}
