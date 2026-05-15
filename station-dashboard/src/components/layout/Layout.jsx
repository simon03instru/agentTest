/**
 * src/components/layout/Layout.jsx  ← FILE EXISTING YANG DIMODIFIKASI
 *
 * Perubahan: tambahkan <UserMenu /> di sebelah kanan TopBar.
 * Semua kode lain tidak berubah.
 *
 * Cari bagian "Clock + fetch indicator" di TopBar,
 * dan tambahkan <UserMenu /> di sebelah kanan clock.
 */
import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFetchingCount } from '@/context/FetchingProvider'
import Chatbot from '@/components/chatbot/Chatbot'
import UserMenu from '@/components/auth/UserMenu'        // ← TAMBAHAN

function TopBar() {
  const fetchCount = useFetchingCount()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6
                       bg-surface-1/90 backdrop-blur-md border-b border-white/5">
      {/* Logo — tidak berubah */}
      <div className="flex items-center gap-3">
        <div
            className="w-8 h-8 flex items-center justify-center"
          >
              <img
                src="/images/logobmkg.png"
                alt="BMKG"
                className="w-15 h-15 object-contain"
              />
          </div>
        <span className="font-display font-semibold text-white text-sm tracking-wide">
          BMKG STATION MONITORING DASHBOARD
        </span>
      </div>

      {/* Kanan: fetch indicator + clock + UserMenu */}
      <div className="flex items-center gap-3">
        {fetchCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-accent/70">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono">Updating…</span>
          </div>
        )}
        {/* Clock — hidden di mobile */}
        <div className="text-right hidden sm:block">
          <div className="font-mono text-sm text-white tabular-nums">{timeStr}</div>
          <div className="font-mono text-[10px] text-slate-500">{dateStr}</div>
        </div>
        {/* ← TAMBAHAN: User avatar + dropdown */}
        <UserMenu />
      </div>
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
