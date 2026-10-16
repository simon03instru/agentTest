/**
 * src/utils/mapMarkers.js  ← FILE BARU
 *
 * Helper marker + popup Leaflet untuk halaman Filter Stasiun.
 * Bentuk marker sama dengan StationMap: ▲ ARG, ● AWS, ■ AAWS.
 */
import L from 'leaflet'
import { formatDateTime, timeAgo } from '@/utils/helpers'

const MARKER_SIZE = 16

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

/** Ubah 1 item response /station/filter jadi bentuk yang dipakai peta. */
export function normalizeFilteredStation(s) {
  return {
    id:     s.id_station,
    name:   s.name_station ?? s.id_station,
    tipe:   String(s.tipe_station ?? '').toUpperCase(),
    lat:    Number(s.latitude),
    lon:    Number(s.longitude),
    status: String(s.status_realtime ?? 'NO DATA').toUpperCase(),   // kosong → abu-abu
    lastObserved: s.last_observed_at,
    balai:    s.balai,
    provinsi: s.provinsi,
    upt:      s.upt_penanggung_jawab,
    kota:     s.nama_kota,
  }
}

export const hasCoords = (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)

function buildSvg(tipe, color, s = MARKER_SIZE) {
  const stroke = 'rgba(255,255,255,0.55)'
  let shape
  if (tipe === 'ARG') {
    shape = `<polygon points="${s / 2},1 ${s - 1},${s - 1} 1,${s - 1}" fill="${color}" fill-opacity="0.92"
      stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`
  } else if (tipe === 'AAWS') {
    shape = `<rect x="1.5" y="1.5" width="${s - 3}" height="${s - 3}" rx="2.5" ry="2.5"
      fill="${color}" fill-opacity="0.92" stroke="${stroke}" stroke-width="1.5"/>`
  } else {
    shape = `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1.5}" fill="${color}" fill-opacity="0.92"
      stroke="${stroke}" stroke-width="1.5"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${shape}</svg>`
}

export function createStationIcon(tipe, color) {
  const s = MARKER_SIZE
  return L.divIcon({
    html: buildSvg(tipe, color, s),
    className: 'station-marker',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -(s / 2 + 4)],
  })
}

const MONO = "font-family:'IBM Plex Mono',monospace;"

function field(label, value) {
  return `
    <div>
      <div style="font-size:10px;color:#64748b;">${label}</div>
      <div style="font-size:11px;color:#e2e8f0;line-height:1.35;">${escapeHtml(value || '—')}</div>
    </div>`
}

/** Isi popup marker. Semua teks dari API di-escape. Tombol Detail → data-action="detail". */
export function buildStationPopupHtml(s, color) {
  const shape = { ARG: '▲', AWS: '●', AAWS: '■' }[s.tipe] ?? '●'
  const observed = s.lastObserved
    ? `${escapeHtml(formatDateTime(s.lastObserved))} <span style="color:#64748b;">(${escapeHtml(timeAgo(s.lastObserved))})</span>`
    : '—'

  return `
    <div style="min-width:220px;font-family:'IBM Plex Sans',sans-serif;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-weight:600;font-size:13px;color:#f1f5f9;line-height:1.3;">${escapeHtml(s.name)}</div>
          <div style="${MONO}font-size:10px;color:#64748b;margin-top:2px;">${escapeHtml(s.id)}</div>
        </div>
        <span style="padding:2px 8px;border-radius:999px;${MONO}font-size:10px;font-weight:600;white-space:nowrap;
          color:${color};border:1px solid ${color}55;background:${color}22;">${escapeHtml(s.status)}</span>
      </div>

      <div style="margin-bottom:8px;">
        <span style="padding:2px 8px;border-radius:6px;${MONO}font-size:10px;color:#00d4ff;
          border:1px solid rgba(0,212,255,0.25);background:rgba(0,212,255,0.08);">${shape} ${escapeHtml(s.tipe || '—')}</span>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;
                  display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;">
        ${field('Balai', s.balai)}
        ${field('Provinsi', s.provinsi)}
        ${field('UPT', s.upt)}
        ${field('Kota', s.kota)}
        <div style="grid-column:1/-1;">
          <div style="font-size:10px;color:#64748b;">Observasi terakhir</div>
          <div style="${MONO}font-size:11px;color:#e2e8f0;">${observed}</div>
        </div>
      </div>

      <button data-action="detail" style="
        width:100%;margin-top:10px;padding:6px 0;${MONO}font-size:11px;
        color:#00d4ff;background:rgba(0,212,255,0.08);
        border:1px solid rgba(0,212,255,0.25);border-radius:8px;cursor:pointer;"
        onmouseover="this.style.background='rgba(0,212,255,0.18)'"
        onmouseout="this.style.background='rgba(0,212,255,0.08)'"
      >Detail →</button>
    </div>`
}
