/**
 * src/components/auth/ProtectedRoute.jsx  ← FILE BARU
 *
 * Wrapper untuk melindungi route berdasarkan:
 * 1. Apakah user sudah login
 * 2. Apakah user punya role yang diizinkan
 *
 * Contoh penggunaan di App.jsx:
 *
 *   // Hanya user yang sudah login
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/" element={<HomePage />} />
 *   </Route>
 *
 *   // Hanya admin & superadmin
 *   <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
 *     <Route path="/users" element={<UserManagementPage />} />
 *   </Route>
 *
 *   // Hanya superadmin
 *   <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
 *     <Route path="/users/roles" element={<RoleManagementPage />} />
 *   </Route>
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const location = useLocation()

  // Tampilkan loading sementara verifikasi token awal
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="font-mono text-xs text-slate-500">Memverifikasi sesi…</span>
        </div>
      </div>
    )
  }

  // Belum login → redirect ke /login, simpan tujuan asal
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Sudah login tapi role tidak cukup → redirect ke dashboard
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
