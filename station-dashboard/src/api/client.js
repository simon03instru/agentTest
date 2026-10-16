/**
 * src/api/client.js  ← FILE EXISTING YANG DIMODIFIKASI
 *
 * Perubahan dari versi sebelumnya (ditandai ← TAMBAHAN):
 * 1. Request interceptor: otomatis sisipkan Authorization: Bearer <token>
 * 2. Response interceptor: kalau 401 → hapus token → redirect ke /login
 *
 * Salin seluruh isi file ini untuk MENGGANTIKAN src/api/client.js yang ada.
 * Semua endpoint monitoring (fetchMap, fetchSummary, dll) tetap bekerja normal.
 */
import axios from 'axios'
import { BASE_URL } from '@/constants/api'

const TOKEN_KEY = 'station_auth_token' //  key localStorage

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor ────────────────────────────────────────────────────
// ← TAMBAHAN: otomatis sisipkan JWT token dari localStorage ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ───────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // ← TAMBAHAN: token expired / tidak valid → logout otomatis
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      // Redirect ke login hanya kalau tidak sedang di halaman auth
      const isAuthPage = window.location.pathname.startsWith('/login') ||
                         window.location.pathname.startsWith('/register') ||
                         window.location.pathname.startsWith('/forgot-password') ||
                         window.location.pathname.startsWith('/reset-password')
      if (!isAuthPage) {
        window.location.href = '/login'
      }
    }

    // ← TAMBAHAN: untuk request responseType:'blob' (export Excel), body error
    // juga berupa Blob → baca dulu sebagai JSON supaya pesan backend terbaca.
    let body = error.response?.data
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      try {
        body = JSON.parse(await body.text())
      } catch {
        body = undefined
      }
    }

    const raw = body?.detail ?? body?.message

    let message
    if (raw == null) {
      message = error.message ?? 'Terjadi kesalahan pada server'
    } else if (typeof raw === 'string') {
      message = raw
    } else if (Array.isArray(raw)) {
      // Pydantic validation error → array of objects
      message = raw
        .map((e) => {
          const field = Array.isArray(e.loc)
            ? e.loc.filter((l) => l !== 'body' && l !== 'query').join(' → ')
            : ''
          return field ? `${field}: ${e.msg}` : e.msg
        })
        .join(' | ')
    } else if (typeof raw === 'object') {
      message = raw.msg ?? raw.message ?? JSON.stringify(raw)
    } else {
      message = String(raw)
    }

    console.error('[API Error]', error.config?.url, error.response?.status, message)
    // ← TAMBAHAN: sertakan HTTP status supaya caller bisa bedakan 404 (data kosong)
    const err = new Error(message)
    err.status = error.response?.status
    throw err
  }
)

export { TOKEN_KEY }
export default apiClient
