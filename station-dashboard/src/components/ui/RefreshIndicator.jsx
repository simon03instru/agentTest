import { useState, useCallback } from 'react'
import { useFetchingCount } from '@/context/FetchingProvider'
import { useSummary } from '@/hooks/useStations'
import { useMapStations } from '@/hooks/useStations'
import { useOffStations } from '@/hooks/useStations'

/**
 * Tombol refresh manual.
 * Memanggil refetch() dari setiap hook utama sekaligus.
 * Tanpa TanStack, tidak ada queryClient.invalidateQueries —
 * kita trigger ulang fetch masing-masing hook lewat event.
 */
export default function RefreshIndicator() {
  const fetchCount = useFetchingCount()
  const [refreshing, setRefreshing] = useState(false)
  const isActive = fetchCount > 0 || refreshing

  const handleManualRefresh = useCallback(() => {
    if (isActive) return
    setRefreshing(true)
    // Emit custom event — setiap hook listen event ini untuk trigger refetch
    window.dispatchEvent(new CustomEvent('station-refresh'))
    setTimeout(() => setRefreshing(false), 1000)
  }, [isActive])

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <div className="flex items-center gap-1.5 text-xs text-accent/80 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Memperbarui…
        </div>
      )}
      <button
        onClick={handleManualRefresh}
        disabled={isActive}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono
                   text-slate-400 hover:text-white hover:bg-white/5 border border-white/10
                   hover:border-white/20 disabled:opacity-40 disabled:cursor-wait
                   transition-all duration-150"
        title="Refresh semua data"
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={isActive ? 'animate-spin' : ''}
        >
          <path
            d="M10 6A4 4 0 1 1 6 2V1M6 1L8 3M6 1L4 3"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        Refresh
      </button>
    </div>
  )
}
