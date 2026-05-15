/**
 * src/App.jsx  ← FILE EXISTING YANG DIMODIFIKASI
 *
 * Perubahan:
 * 1. Import ProtectedRoute
 * 2. Import halaman auth baru
 * 3. Wrap route lama dengan ProtectedRoute
 * 4. Tambah route auth (/login, /register, /forgot-password, /reset-password)
 * 5. Tambah route /users untuk admin & superadmin
 *
 * Route lama (/, /station/:id) TIDAK berubah — hanya dibungkus ProtectedRoute.
 */
import { Routes, Route } from 'react-router-dom'

// ── Layout (tidak berubah) ─────────────────────────────────────────────────
import Layout from '@/components/layout/Layout'

// ── Halaman monitoring (tidak berubah) ────────────────────────────────────
import HomePage          from '@/pages/HomePage'
import StationDetailPage from '@/pages/StationDetailPage'
import NotFoundPage      from '@/pages/NotFoundPage'

// ── TAMBAHAN: Auth guard ───────────────────────────────────────────────────
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// ── TAMBAHAN: Halaman auth ─────────────────────────────────────────────────
import LoginPage          from '@/pages/auth/LoginPage'
import RegisterPage       from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage'

// ── TAMBAHAN: Halaman user management ─────────────────────────────────────
import UserManagementPage from '@/pages/UserManagementPage'

export default function App() {
  return (
    <Routes>

      {/* ── Halaman auth (public, tanpa Layout) ──────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ── Halaman monitoring (protected, dengan Layout) ─────────────────
            Semua route di bawah ini butuh login.
            Route lama tidak berubah sama sekali.
        ──────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="station/:id" element={<StationDetailPage />} />
        </Route>
      </Route>

      {/* ── User Management (admin & superadmin only) ─────────────────────
            Superadmin: bisa ubah role
            Admin: hanya bisa aktifkan/nonaktifkan
        ──────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
        <Route path="/" element={<Layout />}>
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  )
}
