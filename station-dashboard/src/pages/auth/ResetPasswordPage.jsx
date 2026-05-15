/**
 * src/pages/auth/ResetPasswordPage.jsx  ← FILE BARU
 *
 * Diakses via link dari email: /reset-password?token=xxx
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/api/auth'
import {
  AuthLayout, FormField, AuthInput,
  AuthButton, AuthAlert,
} from '@/components/auth/AuthLayout'

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')
  const navigate                = useNavigate()

  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) { setError('Token tidak valid. Minta link reset baru.'); return }
    if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return }
    if (form.password !== form.confirm) { setError('Konfirmasi password tidak cocok.'); return }

    try {
      setLoading(true)
      setError('')
      await resetPassword({ token, new_password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setError(err.message ?? 'Reset password gagal. Token mungkin sudah expired.')
    } finally {
      setLoading(false)
    }
  }

  // Token tidak ada di URL
  if (!token) {
    return (
      <AuthLayout>
        <AuthAlert type="error">
          Token tidak ditemukan. Silakan minta link reset password baru.
        </AuthAlert>
        <Link to="/forgot-password"
              className="block mt-4 text-center font-mono text-xs text-accent hover:underline">
          Minta link baru →
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          Buat password baru untuk akun kamu
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <AuthAlert type="success">
            ✓ Password berhasil diubah! Kamu akan diarahkan ke halaman login…
          </AuthAlert>
          <div className="w-full bg-surface-3 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-status-on rounded-full animate-[growWidth_3s_linear_forwards]" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthAlert type="error">{error}</AuthAlert>}

          <FormField label="Password Baru">
            <div className="relative">
              <AuthInput
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={handleChange}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </FormField>

          <FormField label="Konfirmasi Password Baru">
            <AuthInput
              name="confirm"
              type={showPass ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              value={form.confirm}
              onChange={handleChange}
            />
            {form.confirm && form.confirm !== form.password && (
              <p className="font-mono text-[10px] text-status-off mt-1">Password tidak cocok</p>
            )}
          </FormField>

          <AuthButton isLoading={isLoading} type="submit">
            {isLoading ? 'Menyimpan…' : 'Simpan Password Baru'}
          </AuthButton>
        </form>
      )}
    </AuthLayout>
  )
}
