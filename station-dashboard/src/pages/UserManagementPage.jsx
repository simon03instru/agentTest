/**
 * src/pages/UserManagementPage.jsx  ← FILE BARU
 *
 * Hanya bisa diakses oleh admin dan superadmin.
 * Superadmin: bisa ubah role
 * Admin: hanya bisa aktifkan/nonaktifkan user
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, updateUserRole, updateUserActive } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { timeAgo } from '@/utils/helpers'
import clsx from 'clsx'

const ROLE_CONFIG = {
  superadmin: { label: 'Superadmin', color: 'text-amber-400',   bg: 'bg-amber-400/10',  border: 'border-amber-400/30' },
  admin:      { label: 'Admin',      color: 'text-accent',      bg: 'bg-accent/10',     border: 'border-accent/30'    },
  user:       { label: 'User',       color: 'text-slate-400',   bg: 'bg-slate-400/10',  border: 'border-slate-400/30' },
}

const ROLES = ['user', 'admin', 'superadmin']

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] border',
      cfg.color, cfg.bg, cfg.border
    )}>
      {cfg.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-3 rounded" style={{ width: `${50 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function UserManagementPage() {
  const { hasRole, user: me } = useAuth()
  const navigate              = useNavigate()
  const isSuperadmin          = hasRole('superadmin')

  const [users, setUsers]     = useState([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [updating, setUpdating] = useState(null) // id user yang sedang diupdate

  const load = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(Array.isArray(data) ? data : data?.items ?? [])
    } catch (err) {
      setError(err.message ?? 'Gagal memuat daftar user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (!isSuperadmin) return
    try {
      setUpdating(userId)
      await updateUserRole(userId, { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(`Gagal ubah role: ${err.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleActive = async (userId, currentActive) => {
    try {
      setUpdating(userId)
      await updateUserActive(userId, { is_active: !currentActive })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentActive } : u))
    } catch (err) {
      alert(`Gagal ubah status: ${err.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
  })

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Manajemen User</h1>
          <p className="font-mono text-xs text-slate-500 mt-1">
            {isSuperadmin ? 'Kelola role dan status user' : 'Kelola status aktif user'}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-xs text-slate-400 hover:text-accent transition-colors"
        >
          ← Kembali
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total User', value: users.length, color: 'text-white' },
          { label: 'Aktif', value: users.filter((u) => u.is_active).length, color: 'text-status-on' },
          { label: 'Admin', value: users.filter((u) => u.role === 'admin').length, color: 'text-accent' },
          { label: 'Superadmin', value: users.filter((u) => u.role === 'superadmin').length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="label-mono mb-1">{label}</div>
            <div className={clsx('font-display text-3xl font-bold', color)}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card">
        {/* Table header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <span className="section-title text-sm">Daftar User</span>
          <input
            type="text"
            placeholder="Cari nama / username / email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-surface-2 border border-white/10 rounded-lg px-3 py-1.5
                       text-slate-200 placeholder-slate-500 font-mono w-56
                       focus:outline-none focus:border-accent/40 transition-all"
          />
        </div>

        {error && (
          <div className="px-4 py-3 text-status-off font-mono text-sm border-b border-white/5">
            ⚠ {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Nama', 'Username', 'Email', 'Role', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left label-mono text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono text-sm">
                    {search ? 'Tidak ada hasil.' : 'Belum ada user.'}
                  </td>
                </tr>
              )}

              {filtered.map((u) => {
                const isMe      = u.id === me?.id
                const isBusy    = updating === u.id
                return (
                  <tr key={u.id}
                      className="hover:bg-white/[0.02] transition-colors">

                    {/* Nama */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-200 font-medium">
                        {u.full_name || '—'}
                        {isMe && (
                          <span className="ml-1.5 font-mono text-[10px] text-accent/60">(kamu)</span>
                        )}
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {u.username}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[180px] truncate">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isSuperadmin && !isMe ? (
                        <select
                          value={u.role}
                          disabled={isBusy}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="font-mono text-xs bg-surface-2 border border-white/10
                                     rounded-lg px-2 py-1 text-slate-200 outline-none
                                     focus:border-accent/40 disabled:opacity-50 cursor-pointer"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    {/* Status aktif */}
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'font-mono text-[11px] px-2 py-0.5 rounded-full border',
                        u.is_active
                          ? 'text-status-on bg-status-on/10 border-status-on/30'
                          : 'text-status-off bg-status-off/10 border-status-off/30'
                      )}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      {!isMe && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className={clsx(
                            'font-mono text-[11px] px-3 py-1 rounded-lg border transition-all',
                            'disabled:opacity-40 disabled:cursor-wait',
                            u.is_active
                              ? 'text-status-off border-status-off/30 hover:bg-status-off/10'
                              : 'text-status-on border-status-on/30 hover:bg-status-on/10'
                          )}
                        >
                          {isBusy ? '…' : u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-white/5">
          <span className="font-mono text-[10px] text-slate-600">
            {filtered.length} dari {users.length} user ditampilkan
          </span>
        </div>
      </div>
    </div>
  )
}
