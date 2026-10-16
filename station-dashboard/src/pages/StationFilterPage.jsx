/**
 * src/pages/StationFilterPage.jsx  ← FILE BARU  (route: /filter)
 *
 * Sidebar filter bertingkat (kiri) + peta interaktif (kanan).
 * Di layar kecil sidebar menjadi panel yang menimpa peta.
 */
import { useMemo, useState } from 'react'
import FilterSidebar from '@/components/filter/FilterSidebar'
import FilteredStationMap from '@/components/filter/FilteredStationMap'
import { useCascadingFilters } from '@/hooks/useCascadingFilters'
import { useFilteredStations } from '@/hooks/useFilteredStations'
import { getStatusColor } from '@/utils/helpers'

export default function StationFilterPage() {
  const cascade = useCascadingFilters()
  const [tipe, setTipe] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )

  const { values } = cascade
  const { stations, isLoading, error, refetch } = useFilteredStations({
    balai: values.balai,
    provinsi: values.provinsi,
    upt: values.upt,
    kota: values.kota,
    tipe_station: tipe,
  })

  const stats = useMemo(() => {
    const byStatus = {}
    stations.forEach((s) => {
      const st = String(s.status_realtime ?? 'NO DATA').toUpperCase()
      byStatus[st] = (byStatus[st] ?? 0) + 1
    })
    return { total: stations.length, byStatus }
  }, [stations])

  const handleReset = () => {
    cascade.reset()
    setTipe('')
  }

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] overflow-hidden animate-fade-in">
      {/* Scrim (mobile) */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-[1090] bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'z-[1100] shrink-0 overflow-hidden border-white/5 bg-surface-1/95 backdrop-blur-md',
          'transition-[width] duration-300 absolute inset-y-0 left-0 lg:relative',
          sidebarOpen ? 'w-[320px] max-w-[88vw] border-r' : 'w-0',
        ].join(' ')}
      >
        <FilterSidebar
          cascade={cascade}
          tipe={tipe}
          onTipeChange={setTipe}
          onReset={handleReset}
          stats={stats}
          isLoading={isLoading}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Peta */}
      <div className="relative isolate min-w-0 flex-1">
        <FilteredStationMap stations={stations} />

        {/* Tombol buka sidebar */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="glass-card absolute left-4 top-4 z-[999] flex items-center gap-2 px-3 py-2
                       font-mono text-xs text-slate-200 shadow-lg hover:text-white"
          >
            ☰ Filter
            <span className="rounded-full bg-accent/20 px-1.5 text-[10px] text-accent">
              {isLoading ? '…' : stats.total.toLocaleString('id-ID')}
            </span>
          </button>
        )}

        {/* Status memuat / error / kosong */}
        <div className="pointer-events-none absolute left-1/2 top-4 z-[999] -translate-x-1/2">
          {isLoading && (
            <div className="glass-card px-3 py-1.5 font-mono text-xs text-accent/80 shadow-lg">
              Memuat stasiun…
            </div>
          )}
          {!isLoading && error && (
            <div className="glass-card pointer-events-auto border-status-off/30 px-3 py-1.5 font-mono text-xs text-status-off shadow-lg">
              ⚠ {error}
              <button onClick={refetch} className="ml-2 underline hover:text-white">Coba lagi</button>
            </div>
          )}
          {!isLoading && !error && stats.total === 0 && (
            <div className="glass-card px-3 py-1.5 font-mono text-xs text-slate-300 shadow-lg">
              Tidak ada stasiun yang cocok dengan filter.
            </div>
          )}
        </div>

        {/* Legend status ringkas */}
        <div className="glass-card absolute bottom-4 right-4 z-[999] flex items-center gap-3 px-3 py-2 shadow-lg">
          {['ON', 'DELAY', 'OFF', 'NO DATA'].map((s) => (
            <span key={s} className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: getStatusColor(s) }} />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
