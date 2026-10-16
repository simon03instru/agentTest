/**
 * src/hooks/useCascadingFilters.js  ← FILE BARU
 *
 * Filter bertingkat: Balai → Provinsi → UPT → Kota.
 *
 * Aturan cascade:
 *  - Ganti level X  → level di bawah X di-reset ke "Semua" (''),
 *                     lalu opsi level di bawah X diambil ulang dari
 *                     GET /station/filter-options?balai=..&provinsi=..&upt=..
 *  - Opsi level X dan di atasnya TIDAK ditimpa, jadi dropdown induk tidak
 *    ikut menyusut menjadi satu pilihan saja.
 *  - Request lama yang terlambat balas diabaikan (reqId).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchFilterOptions } from '@/api/stations'

export const FILTER_LEVELS = ['balai', 'provinsi', 'upt', 'kota']

const EMPTY_VALUES  = { balai: '', provinsi: '', upt: '', kota: '' }
const EMPTY_OPTIONS = { balai: [], provinsi: [], upt: [], kota: [] }

export function useCascadingFilters() {
  const [values,  setValues]  = useState(EMPTY_VALUES)
  const [options, setOptions] = useState(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [loadingFrom, setLoadingFrom] = useState(-1)
  const [error,   setError]   = useState(null)

  const valuesRef   = useRef(EMPTY_VALUES)
  const reqId       = useRef(0)
  const lastFromRef = useRef(-1)

  /** Ambil opsi untuk semua level yang berada di bawah `fromLevel` (-1 = semua level). */
  const loadOptions = useCallback(async (current, fromLevel) => {
    const id = ++reqId.current
    lastFromRef.current = fromLevel
    setLoading(true)
    setLoadingFrom(fromLevel)
    setError(null)

    try {
      // Backend hanya butuh induk (balai/provinsi/upt); kota adalah level terakhir.
      const res = await fetchFilterOptions({
        balai:    current.balai,
        provinsi: current.provinsi,
        upt:      current.upt,
      })
      if (id !== reqId.current) return

      setOptions((prev) => {
        const next = { ...prev }
        FILTER_LEVELS.forEach((level, i) => {
          if (i > fromLevel) next[level] = Array.isArray(res?.[level]) ? res[level] : []
        })
        return next
      })
    } catch (err) {
      if (id !== reqId.current) return
      setError(err.message ?? 'Gagal memuat opsi filter')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [])

  // Opsi awal (semua level)
  useEffect(() => {
    loadOptions(EMPTY_VALUES, -1)
  }, [loadOptions])

  const setLevel = useCallback((level, value) => {
    const idx  = FILTER_LEVELS.indexOf(level)
    const next = { ...valuesRef.current, [level]: value }
    FILTER_LEVELS.forEach((l, i) => {
      if (i > idx) next[l] = ''          // reset semua level di bawahnya
    })
    valuesRef.current = next
    setValues(next)

    if (idx < FILTER_LEVELS.length - 1) {
      loadOptions(next, idx)             // isi ulang level di bawahnya
    }
  }, [loadOptions])

  const reset = useCallback(() => {
    valuesRef.current = EMPTY_VALUES
    setValues(EMPTY_VALUES)
    loadOptions(EMPTY_VALUES, -1)
  }, [loadOptions])

  const retry = useCallback(() => {
    loadOptions(valuesRef.current, lastFromRef.current)
  }, [loadOptions])

  return { values, options, loading, loadingFrom, error, setLevel, reset, retry }
}
