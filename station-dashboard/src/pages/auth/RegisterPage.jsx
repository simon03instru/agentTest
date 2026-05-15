/**
 * src/pages/auth/RegisterPage.jsx  ← FILE BARU
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import {
  AuthLayout, FormField, AuthInput,
  AuthButton, AuthAlert,
} from '@/components/auth/AuthLayout'

export default function RegisterPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm: '',
  })
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const validate = () => {
    if (!form.username.trim()) return 'Username wajib diisi.'
    if (!form.email.trim())    return 'Email wajib diisi.'
    if (!form.password)        return 'Password wajib diisi.'
    if (form.password.length < 8) return 'Password minimal 8 karakter.'
    if (form.password !== form.confirm) return 'Konfirmasi password tidak cocok.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErr = validate()
    if (validationErr) { setError(validationErr); return }

    try {
      setLoading(true)
      setError('')

      // Step 1: Register
      await register({
        full_name: form.full_name.trim() || undefined,
        username:  form.username.trim(),
        email:     form.email.trim(),
        password:  form.password,
      })

      // Step 2: Auto-login setelah register berhasil
      // Tangani error login secara terpisah dari error register
      try {
        await login({ username: form.username.trim(), password: form.password })
        navigate('/', { replace: true })
      } catch {
        // Register berhasil tapi auto-login gagal → arahkan ke halaman login manual
        navigate('/login', {
          replace: true,
          state: { message: 'Akun berhasil dibuat. Silakan masuk.' },
        })
      }

    } catch (err) {
      // Error dari proses REGISTER (bukan login)
      setError(err.message ?? 'Registrasi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // Hitung kekuatan password
  const passStrength = (() => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8)  score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return Math.min(score, 4)
  })()

  const strengthColor = ['', 'bg-status-off', 'bg-status-delay', 'bg-status-delay', 'bg-status-on']
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Baik', 'Kuat']

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Daftar Akun</h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          Buat akun baru untuk mengakses dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthAlert type="error">{error}</AuthAlert>}

        <FormField label="Nama Lengkap (opsional)">
          <AuthInput
            name="full_name"
            type="text"
            placeholder="Nama lengkap"
            value={form.full_name}
            onChange={handleChange}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username">
            <AuthInput
              name="username"
              type="text"
              placeholder="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </FormField>
          <FormField label="Email">
            <AuthInput
              name="email"
              type="email"
              placeholder="email@domain.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </FormField>
        </div>

        <FormField label="Password">
          <div className="relative">
            <AuthInput
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {showPass ? (
                  <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.8 5.2 1.8 6.5 1.5 8c.8 3.3 4 5.5 6.5 5.5a7 7 0 0 0 3.3-.9M7 2.6C7.2 2.5 7.6 2.5 8 2.5c2.5 0 5.7 2.2 6.5 5.5-.3 1.2-.9 2.3-1.8 3.1"
                        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                ) : (
                  <>
                    <path d="M1.5 8C2.3 4.7 5.5 2.5 8 2.5S13.7 4.7 14.5 8c-.8 3.3-4 5.5-6.5 5.5S2.3 11.3 1.5 8z"
                          stroke="currentColor" strokeWidth="1.4"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Password strength bar */}
          {form.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= passStrength ? strengthColor[passStrength] : 'bg-surface-3'
                  }`} />
                ))}
              </div>
              <p className="font-mono text-[10px] text-slate-500">
                Kekuatan password: <span className={
                  passStrength >= 4 ? 'text-status-on' :
                  passStrength >= 2 ? 'text-status-delay' : 'text-status-off'
                }>{strengthLabel[passStrength]}</span>
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Konfirmasi Password">
          <AuthInput
            name="confirm"
            type={showPass ? 'text' : 'password'}
            placeholder="Ulangi password"
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {form.confirm && form.confirm !== form.password && (
            <p className="font-mono text-[10px] text-status-off mt-1">
              ✕ Password tidak cocok
            </p>
          )}
          {form.confirm && form.confirm === form.password && form.password && (
            <p className="font-mono text-[10px] text-status-on mt-1">
              ✓ Password cocok
            </p>
          )}
        </FormField>

        <AuthButton isLoading={isLoading} type="submit">
          {isLoading ? 'Mendaftar…' : 'Daftar'}
        </AuthButton>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-slate-500">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-accent hover:text-accent/80 transition-colors">
          Masuk
        </Link>
      </p>
    </AuthLayout>
  )
}
