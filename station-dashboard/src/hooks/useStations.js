import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import {
  fetchSummary, fetchMap, fetchOff, fetchStatus, fetchStationDetail,
} from '@/api/stations'
import { REFRESH_INTERVALS } from '@/constants/api'
import { FetchingContext } from '@/context/FetchingProvider'

/**
 * Generic polling hook — pengganti useQuery tanpa TanStack.
 *
 * Fitur:
 * - Fetch otomatis saat mount
 * - Polling interval yang bisa dikonfigurasi
 * - Tracking isFetching global via FetchingContext
 * - Listen custom event 'station-refresh' untuk manual refresh dari RefreshIndicator
 */
function usePolling(fetchFn, interval, enabled = true) {
  const [data, setData]           = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError]     = useState(false)
  const [error, setError]         = useState(null)
  const [dataUpdatedAt, setUpdatedAt] = useState(null)

  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const { increment, decrement } = useContext(FetchingContext)

  const run = useCallback(async (isInitial = false) => {
    if (!enabled) return
    try {
      increment()
      if (isInitial) setIsLoading(true)
      const result = await fetchFnRef.current()
      setData(result)
      setIsError(false)
      setError(null)
      setUpdatedAt(Date.now())
    } catch (err) {
      setIsError(true)
      setError(err)
    } finally {
      decrement()
      if (isInitial) setIsLoading(false)
    }
  }, [enabled, increment, decrement])

  // Fetch pertama saat mount
  useEffect(() => {
    if (!enabled) return
    run(true)
  }, [run, enabled])

  // Auto polling
  useEffect(() => {
    if (!enabled || !interval) return
    const id = setInterval(() => run(false), interval)
    return () => clearInterval(id)
  }, [run, interval, enabled])

  // Listen event manual refresh dari RefreshIndicator
  useEffect(() => {
    if (!enabled) return
    const handler = () => run(false)
    window.addEventListener('station-refresh', handler)
    return () => window.removeEventListener('station-refresh', handler)
  }, [run, enabled])

  const refetch = useCallback(() => run(false), [run])

  return { data, isLoading, isError, error, dataUpdatedAt, refetch }
}

// ─── Public hooks ─────────────────────────────────────────────────────────

/** GET /summary → { items: [{ tipe_station, status_realtime, total }] } */
export function useSummary() {
  return usePolling(fetchSummary, REFRESH_INTERVALS.SUMMARY)
}

/** GET /map → array semua site dengan koordinat dan status */
export function useMapStations() {
  return usePolling(fetchMap, REFRESH_INTERVALS.MAP)
}

/** GET /off → array site OFF / DELAY / NO DATA */
export function useOffStations() {
  return usePolling(fetchOff, REFRESH_INTERVALS.OFF)
}

/** GET /status → array semua stasiun lengkap dengan observasi */
export function useStatus() {
  return usePolling(fetchStatus, REFRESH_INTERVALS.STATUS)
}

/** GET /station/:id → detail satu stasiun */
export function useStationDetail(id) {
  return usePolling(() => fetchStationDetail(id), REFRESH_INTERVALS.DETAIL, !!id)
}
