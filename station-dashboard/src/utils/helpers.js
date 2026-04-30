import { STATUS_COLOR } from '@/constants/api'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

/**
 * Warna hex berdasarkan status
 */
export function getStatusColor(status) {
  return STATUS_COLOR[status] ?? STATUS_COLOR['NO DATA']
}

/**
 * Kelas Tailwind berdasarkan status
 */
export function getStatusClass(status) {
  const map = {
    ON:       'status-on',
    OFF:      'status-off',
    DELAY:    'status-delay',
    'NO DATA':'status-nodata',
  }
  return map[status] ?? 'status-nodata'
}

/**
 * Format waktu relatif, misal: "3 menit lalu"
 * Handles ISO strings dari backend (dengan/tanpa timezone suffix).
 * Contoh input: "2026-04-20T15:40:00Z" atau "2026-04-20T09:23:41.813624Z"
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try {
    // parseISO handles Z suffix dan +offset secara native
    const d = parseISO(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return formatDistanceToNow(d, { addSuffix: true, locale: localeId })
  } catch {
    return dateStr
  }
}

/**
 * Format tanggal dan waktu lokal
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('id-ID', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * Format jumlah dengan pemisah ribuan
 */
export function formatNumber(n) {
  if (n == null) return '—'
  return n.toLocaleString('id-ID')
}

/**
 * Persen dari dua angka
 */
export function percent(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

/**
 * Membuat SVG string untuk marker Leaflet
 */
export function createMarkerSvg(color, size = 12) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}">
      <circle cx="${size}" cy="${size}" r="${size - 2}" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
      <circle cx="${size}" cy="${size}" r="${size / 2}" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `
}
