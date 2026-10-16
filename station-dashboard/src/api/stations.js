import apiClient from './client'

/**
 * Health check
 */
export const healthCheck = () => apiClient.get('/')

/**
 * GET /map → semua site beserta koordinat dan status untuk peta
 * Contoh response:
 * [{ id_station, name, lat, lon, station_type, status, last_update }]
 */
export const fetchMap = () => apiClient.get('/map')

/**
 * GET /status → status realtime semua stasiun
 */
export const fetchStatus = () => apiClient.get('/status')

/**
 * GET /off → site dengan status OFF / DELAY / NO DATA
 * Contoh response:
 * [{ id_station, name, station_type, status, last_update, province }]
 */
export const fetchOff = () => apiClient.get('/off')

/**
 * GET /summary → ringkasan jumlah per tipe dan status
 * Contoh response:
 * {
 *   total: 120,
 *   by_status: { ON: 80, OFF: 15, DELAY: 10, 'NO DATA': 15 },
 *   by_type: {
 *     ARG:  { total: 50, ON: 35, OFF: 7, DELAY: 3, 'NO DATA': 5 },
 *     AWS:  { total: 40, ON: 30, OFF: 5, DELAY: 3, 'NO DATA': 2 },
 *     AAWS: { total: 30, ON: 15, OFF: 3, DELAY: 4, 'NO DATA': 8 },
 *   }
 * }
 */
export const fetchSummary = () => apiClient.get('/summary')

/**
 * GET /station/:id → detail satu stasiun
 */
export const fetchStationDetail = (id) => apiClient.get(`/station/${id}`)


export const fetchExportData = (id_station, tanggal) =>
  apiClient.get(`/station/export/${id_station}`, {
    params: { tanggal },
  })

// ─── TAMBAHAN: filter bertingkat + export Excel ───────────────────────────

/** Buang nilai kosong ('' / null / undefined) supaya tidak dikirim sebagai ?balai= */
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  )
}

/**
 * GET /station/filter-options?balai=&provinsi=&upt=
 * → { balai: [], provinsi: [], upt: [], kota: [], sites: [], total_sites }
 */
export const fetchFilterOptions = (params) =>
  apiClient.get('/station/filter-options', { params: cleanParams(params) })

/**
 * GET /station/filter?balai=&provinsi=&upt=&kota=&tipe_station=
 * → array stasiun. Backend balas 404 kalau tidak ada hasil.
 */
export const fetchFilteredStations = (params) =>
  apiClient.get('/station/filter', { params: cleanParams(params) })

/**
 * GET /station/export/excel?tanggal=YYYY-MM-DD&balai=&provinsi=&upt=&kota=
 * → Blob (.xlsx). Timeout dibuat panjang karena file dibuat saat request.
 */
export const exportStationsExcel = (params) =>
  apiClient.get('/station/export/excel', {
    params: cleanParams(params),
    responseType: 'blob',
    timeout: 120_000,
  })
