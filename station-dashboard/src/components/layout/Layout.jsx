import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFetchingCount } from '@/context/FetchingProvider'
import Chatbot from '@/components/chatbot/Chatbot'

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
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" fill="#00d4ff"/>
            <circle cx="7" cy="7" r="5.5" stroke="#00d4ff" strokeWidth="1" opacity="0.4"/>
            <circle cx="7" cy="7" r="3.5" stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" strokeDasharray="2 2"/>
          </svg>
        </div>
        <span className="font-display font-semibold text-white text-sm tracking-wide">
          STATION MONITOR
        </span>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`
          }
        >
          Dashboard
        </NavLink>
      </nav>

      {/* Clock + fetch indicator */}
      <div className="flex items-center gap-4">
        {fetchCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-accent/70">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono">Updating…</span>
          </div>
        )}
        <div className="text-right hidden sm:block">
          <div className="font-mono text-sm text-white tabular-nums">{timeStr}</div>
          <div className="font-mono text-[10px] text-slate-500">{dateStr}</div>
        </div>
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
