/**
 * src/hooks/useFilteredStations.js  ← FILE BARU
 *
 * GET /station/filter  — dipanggil ulang setiap filter berubah.
 * - 404 dari backend = "tidak ada hasil" → array kosong, BUKAN error.
 * - Ikut event 'station-refresh' (tombol refresh di RefreshIndicator).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchFilteredStations } from '@/api/stations'

export function useFilteredStations({ balai, provinsi, upt, kota, tipe_station }) {
  const [stations,  setStations]  = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)
  const reqId = useRef(0)

  const run = useCallback(async () => {
    const id = ++reqId.current
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchFilteredStations({ balai, provinsi, upt, kota, tipe_station })
      if (id !== reqId.current) return
      setStations(Array.isArray(res) ? res : [])
    } catch (err) {
      if (id !== reqId.current) return
      setStations([])
      if (err.status !== 404) setError(err.message ?? 'Gagal memuat stasiun')
    } finally {
      if (id === reqId.current) setIsLoading(false)
    }
  }, [balai, provinsi, upt, kota, tipe_station])

  useEffect(() => { run() }, [run])

  useEffect(() => {
    window.addEventListener('station-refresh', run)
    return () => window.removeEventListener('station-refresh', run)
  }, [run])

  return { stations, isLoading, error, refetch: run }
}
