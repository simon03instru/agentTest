/**
 * src/components/layout/Layout.jsx  ← FILE EXISTING YANG DIMODIFIKASI
 *
 * Perubahan (ditandai ← TAMBAHAN):
 *  1. Link navigasi: Dashboard / Filter
 *  2. Tombol "Export Data" → membuka ExportModal
 * Semua kode lain tidak berubah.
 */
import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFetchingCount } from '@/context/FetchingProvider'
import Chatbot from '@/components/chatbot/Chatbot'
import UserMenu from '@/components/auth/UserMenu'
import ExportModal from '@/components/export/ExportModal'   // ← TAMBAHAN

// ← TAMBAHAN
const navClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-1.5 font-mono text-xs transition',
    isActive ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-white',
  ].join(' ')

function TopBar() {
  const fetchCount = useFetchingCount()
  const [now, setNow] = useState(new Date())
  const [exportOpen, setExportOpen] = useState(false)   // ← TAMBAHAN

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-3 sm:px-6
                       bg-surface-1/90 backdrop-blur-md border-b border-white/5">
      {/* Logo + nav */}
      <div className="flex items-center gap-3 min-w-0">
        <div
            className="w-8 h-8 flex shrink-0 items-center justify-center"
          >
              <img
                src="/images/logobmkg.png"
                alt="BMKG"
                className="w-15 h-15 object-contain"
              />
          </div>
        {/* ← judul disembunyikan di layar kecil supaya nav + tombol Export muat */}
        <span className="hidden md:inline font-display font-semibold text-white text-sm tracking-wide truncate">
          BMKG STATION MONITORING DASHBOARD
        </span>

        {/* ← TAMBAHAN: navigasi */}
        <nav className="flex items-center gap-1 md:ml-2">
          <NavLink to="/" end className={navClass}>Dashboard</NavLink>
          <NavLink to="/filter" className={navClass}>Filter</NavLink>
        </nav>
      </div>

      {/* Kanan: fetch indicator + clock + Export + UserMenu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {fetchCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-accent/70">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono">Updating…</span>
          </div>
        )}
        {/* Clock — hidden di mobile */}
        <div className="text-right hidden sm:block">
          <div className="font-mono text-sm text-white tabular-nums">{timeStr}</div>
          <div className="font-mono text-[10px] text-slate-500">{dateStr}</div>
        </div>

        {/* ← TAMBAHAN: tombol Export Data */}
        <button
          onClick={() => setExportOpen(true)}
          aria-label="Export Data"
          className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5
                     font-mono text-xs text-accent transition hover:bg-accent/20"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
          </svg>
          <span className="hidden sm:inline">Export Data</span>
        </button>

        <UserMenu />
      </div>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </header>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  )
}
