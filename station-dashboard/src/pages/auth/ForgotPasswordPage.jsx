/**
 * src/pages/auth/ForgotPasswordPage.jsx  ← FILE BARU
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/api/auth'
import {
  AuthLayout, FormField, AuthInput,
  AuthButton, AuthAlert,
} from '@/components/auth/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email wajib diisi.'); return }
    try {
      setLoading(true)
      setError('')
      await forgotPassword({ email })
      setSuccess(true)
    } catch (err) {
      setError(err.message ?? 'Gagal mengirim email. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Lupa Password</h1>
        <p className="font-mono text-xs text-slate-500 mt-1">
          Masukkan email akun untuk menerima link reset password
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <AuthAlert type="success">
            ✓ Link reset password telah dikirim ke <strong>{email}</strong>.
            Periksa kotak masuk atau folder spam.
          </AuthAlert>
          <p className="font-mono text-xs text-slate-500 text-center">
            Link berlaku selama 15 menit.
          </p>
          <Link
            to="/login"
            className="block w-full text-center py-2.5 rounded-xl font-mono text-sm
                       border border-white/10 text-slate-400 hover:text-white
                       hover:bg-white/5 transition-all"
          >
            ← Kembali ke Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthAlert type="error">{error}</AuthAlert>}

          <FormField label="Email">
            <AuthInput
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </FormField>

          <AuthButton isLoading={isLoading} type="submit">
            {isLoading ? 'Mengirim…' : 'Kirim Link Reset'}
          </AuthButton>

          <Link
            to="/login"
            className="block text-center font-mono text-xs text-slate-500
                       hover:text-slate-300 transition-colors pt-1"
          >
            ← Kembali ke Login
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
