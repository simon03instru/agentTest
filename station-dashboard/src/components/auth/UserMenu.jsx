/**
 * src/components/auth/UserMenu.jsx  ← FILE BARU
 *
 * Komponen dropdown di pojok kanan topbar.
 * Tampilkan nama user, role, dan tombol logout.
 * Jika admin/superadmin: tampilkan link ke User Management.
 *
 * Cara pasang di Layout.jsx (lihat instruksi modifikasi):
 *   import UserMenu from '@/components/auth/UserMenu'
 *   // Tambahkan <UserMenu /> di sebelah kanan clock di TopBar
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const ROLE_LABEL = {
  superadmin: { text: 'Superadmin', color: 'text-amber-400' },
  admin:      { text: 'Admin',      color: 'text-accent' },
  user:       { text: 'User',       color: 'text-slate-400' },
}

export default function UserMenu() {
  const { user, logout, hasRole } = useAuth()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  const roleInfo  = ROLE_LABEL[user.role] ?? ROLE_LABEL.user
  const initials  = (user.full_name || user.username || 'U')
                      .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-2 px-2 py-1.5 rounded-xl',
          'border transition-all duration-150',
          open
            ? 'bg-accent/10 border-accent/30'
            : 'border-transparent hover:bg-white/5 hover:border-white/10'
        )}
      >
        {/* Avatar circle */}
        <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30
                        flex items-center justify-center shrink-0">
          <span className="font-mono text-[10px] font-bold text-accent">{initials}</span>
        </div>
        {/* Name + role — hidden on small screens */}
        <div className="hidden sm:block text-left">
          <div className="font-mono text-xs text-slate-200 leading-tight max-w-[120px] truncate">
            {user.full_name || user.username}
          </div>
          <div className={clsx('font-mono text-[10px] leading-tight', roleInfo.color)}>
            {roleInfo.text}
          </div>
        </div>
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={clsx('text-slate-400 transition-transform duration-150', open && 'rotate-180')}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-card border border-white/10
                        shadow-xl shadow-black/40 rounded-xl overflow-hidden z-[200]
                        animate-slide-up">

          {/* User info */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="font-mono text-xs text-white font-medium truncate">
              {user.full_name || user.username}
            </div>
            <div className="font-mono text-[10px] text-slate-500 truncate mt-0.5">
              {user.email}
            </div>
            <div className={clsx('font-mono text-[10px] mt-1 font-medium', roleInfo.color)}>
              {roleInfo.text}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {/* User Management — admin & superadmin only */}
            {hasRole(['admin', 'superadmin']) && (
              <Link
                to="/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-mono
                           text-slate-300 hover:text-white hover:bg-white/5
                           transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-400">
                  <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 11c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M10 5v4M12 7h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Manajemen User
              </Link>
            )}

            {/* Divider */}
            <div className="border-t border-white/5 my-1" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono
                         text-status-off hover:bg-status-off/10
                         transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M9 10l4-3-4-3M5 7h8"
                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
