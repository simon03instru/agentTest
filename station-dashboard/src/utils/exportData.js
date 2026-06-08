/**
 * src/utils/exportData.js  ← FILE BARU
 *
 * Utility untuk export data series ke CSV dan Excel.
 * Tidak butuh library tambahan — Excel menggunakan format HTML table
 * yang bisa dibuka di Excel/LibreOffice.
 */

/**
 * Ambil daftar kolom yang relevan berdasarkan tipe stasiun.
 * ARG  → hanya rr
 * AAWS → semua kolom yang tersedia di series
 * AWS  → semua kolom kecuali ws_50cm, ws_2m (field AAWS)
 */
export function getColumnsForType(tipe, sampleRow) {
  if (!sampleRow) return []

  const allKeys = Object.keys(sampleRow).filter((k) => k !== 'time')
  const t = (tipe ?? '').toUpperCase()

  if (t === 'ARG') return ['rr']

  if (t === 'AWS') {
    // AWS tidak punya sensor ws_50cm dan ws_2m
    return allKeys.filter((k) => !['ws_50cm', 'ws_2m'].includes(k))
  }

  // AAWS → tampilkan semua yang ada nilainya (bukan -888)
  return allKeys
}

/** Label lebih ramah untuk header kolom */
const COLUMN_LABELS = {
  rr:          'RR (mm)',
  pp_air:      'Tekanan (hPa)',
  rh_avg:      'RH (%)',
  sr_avg:      'Radiasi Rata (W/m²)',
  sr_max:      'Radiasi Max (W/m²)',
  wd_avg:      'Arah Angin (°)',
  ws_avg:      'Kec. Angin Rata (m/s)',
  ws_max:      'Kec. Angin Max (m/s)',
  tt_air_avg:  'Suhu Rata (°C)',
  tt_air_min:  'Suhu Min (°C)',
  tt_air_max:  'Suhu Max (°C)',
  ws_50cm:     'Angin 50cm (m/s)',
  ws_2m:       'Angin 2m (m/s)',
  wl_pan:      'Water Level Pan (mm)',
  ev_pan:      'Evaporasi Pan (mm)',
}

export function getColumnLabel(key) {
  return COLUMN_LABELS[key] ?? key
}

/**
 * Nilai -888 adalah sentinel "sensor tidak terpasang" dari logger.
 * Ganti dengan string kosong agar tidak membingungkan di export.
 */
function cleanValue(v) {
  if (v === -888 || v === '-888') return ''
  if (v == null) return ''
  return v
}

/** Format timestamp ISO → string lokal */
function formatTime(isoStr) {
  if (!isoStr) return ''
  try {
    return new Date(isoStr).toLocaleString('id-ID', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return isoStr
  }
}

// ─── CSV ──────────────────────────────────────────────────────────────────

/**
 * Export data series ke file CSV.
 * @param {object} exportData  - Response dari /station/export/:id
 * @param {string} tanggal     - "YYYY-MM-DD"
 */
export function exportToCSV(exportData, tanggal) {
  const { id_station, tipe_station, series } = exportData
  const rows = series?.rr ?? []  // key utama selalu "rr" dari response
  if (!rows.length) return

  const cols = getColumnsForType(tipe_station, rows[0])

  // Header
  const header = ['Waktu (WIB)', ...cols.map(getColumnLabel)]
  const lines  = [header.join(',')]

  // Rows
  rows.forEach((row) => {
    const cells = [
      `"${formatTime(row.time)}"`,
      ...cols.map((k) => cleanValue(row[k])),
    ]
    lines.push(cells.join(','))
  })

  const content  = lines.join('\n')
  const filename = `${id_station}_${tanggal}.csv`
  downloadBlob(new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' }), filename)
}

// ─── Excel (HTML table format) ────────────────────────────────────────────

/**
 * Export data series ke file .xls (HTML table yang bisa dibuka Excel).
 * Tidak butuh library SheetJS.
 */
export function exportToExcel(exportData, tanggal) {
  const { id_station, tipe_station, series } = exportData
  const rows = series?.rr ?? []
  if (!rows.length) return

  const cols = getColumnsForType(tipe_station, rows[0])

  const headerCells = ['Waktu (WIB)', ...cols.map(getColumnLabel)]
    .map((h) => `<th style="background:#1e2d45;color:#e2e8f0;padding:6px 10px;border:1px solid #334155;white-space:nowrap;">${h}</th>`)
    .join('')

  const dataRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#0f172a' : '#111827'
    const cells = [
      `<td style="padding:4px 8px;border:1px solid #1e293b;">${formatTime(row.time)}</td>`,
      ...cols.map((k) => {
        const v = cleanValue(row[k])
        return `<td style="padding:4px 8px;border:1px solid #1e293b;text-align:right;">${v}</td>`
      }),
    ].join('')
    return `<tr style="background:${bg};color:#cbd5e1;">${cells}</tr>`
  }).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"/></head>
    <body>
      <table>
        <caption style="font-weight:bold;padding:8px;color:#f1f5f9;">
          Data ${tipe_station?.toUpperCase()} — ${id_station} — ${tanggal}
        </caption>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
    </body></html>
  `

  const filename = `${id_station}_${tanggal}.xls`
  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), filename)
}

// ─── Helper ───────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
