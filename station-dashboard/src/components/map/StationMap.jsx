import { useMemo, useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useMapStations } from '@/hooks/useStations'
import { getStatusColor, timeAgo } from '@/utils/helpers'
import StationChartModel from './StationChartModel'

const CENTER = [-2.5, 118.0]
const ZOOM = 5
const MARKER_SIZE = 16

function buildSvg(tipe, color, size = MARKER_SIZE) {
  const s = size
  const str = `rgba(255,255,255,0.55)`
  const tipeUpper = (tipe ?? '').toUpperCase()

  let shape = ''

  if (tipeUpper === 'ARG') {
    const pad = 1
    const pts = `${s / 2},${pad} ${s - pad},${s - pad} ${pad},${s - pad}`
    shape = `<polygon points="${pts}" fill="${color}" fill-opacity="0.92"
      stroke="${str}" stroke-width="1.5" stroke-linejoin="round"/>`
  } else if (tipeUpper === 'AAWS') {
    const pad = 1.5
    shape = `<rect x="${pad}" y="${pad}" width="${s - pad * 2}" height="${s - pad * 2}"
      rx="2.5" ry="2.5" fill="${color}" fill-opacity="0.92"
      stroke="${str}" stroke-width="1.5"/>`
  } else {
    const r = s / 2 - 1.5
    shape = `<circle cx="${s / 2}" cy="${s / 2}" r="${r}"
      fill="${color}" fill-opacity="0.92"
      stroke="${str}" stroke-width="1.5"/>`
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      ${shape}
    </svg>
  `
}

function createDivIcon(tipe, color) {
  const s = MARKER_SIZE
  return L.divIcon({
    html: buildSvg(tipe, color, s),
    className: 'station-marker',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -(s / 2 + 4)],
  })
}

function normalizeMapStation(s) {
  return {
    id_station: s.id_station,
    name:       s.name_station,
    tipe:       s.tipe_station?.toUpperCase() ?? 'AWS',
    lat:        s.latitude,
    lon:        s.longitude,
    status:     s.status_realtime ?? 'OFF',
    last_update:s.last_observed_at,
    interval:   s.interval_detected,
  }
}

// ─── DIMODIFIKASI: terima prop onOpenChart ────────────────────────────────
function MarkerLayer({ stations, onOpenChart }) {
  const map      = useMap()
  const navigate = useNavigate()

  useEffect(() => {
    if (!stations?.length) return

    const markers = []

    stations.forEach((raw) => {
      const s = normalizeMapStation(raw)
      if (s.lat == null || s.lon == null) return

      const color  = getStatusColor(s.status)
      const icon   = createDivIcon(s.tipe, color)
      const marker = L.marker([s.lat, s.lon], { icon })

      marker.bindPopup(
        L.popup({
          className:   'station-popup',
          maxWidth:    240,
          closeButton: true,
        }).setContent(buildPopupHtml(s, color))
      )

      // ─── DIMODIFIKASI: tambah handler tombol chart ─────────────────────
      marker.on('popupopen', () => {
        // Tombol Chart
        const btnChart = document.getElementById(`popup-chart-${s.id_station}`)
        if (btnChart) {
          btnChart.onclick = () => {
            marker.closePopup()
            onOpenChart(s)
          }
        }

        // Tombol Detail
        const btnDetail = document.getElementById(`popup-detail-${s.id_station}`)
        if (btnDetail) {
          btnDetail.onclick = () => {
            marker.closePopup()
            navigate(`/station/${s.id_station}`)
          }
        }
      })

      marker.addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [stations, map, navigate, onOpenChart])

  return null
}

// ─── DIMODIFIKASI: dua tombol di bawah popup ─────────────────────────────
function buildPopupHtml(s, color) {
  const lastObs  = s.last_update ? timeAgo(s.last_update) : '—'
  const tipeShape = { ARG: '▲', AWS: '●', AAWS: '■' }[s.tipe] ?? '●'

  return `
    <div style="min-width:210px;font-family:'IBM Plex Sans',sans-serif;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-weight:600;font-size:13px;color:#f1f5f9;line-height:1.3;">
            ${s.name ?? s.id_station}
          </div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#64748b;margin-top:2px;">
            ${s.id_station}
          </div>
        </div>
        <span style="
          padding:2px 8px;border-radius:999px;
          font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;
          color:${color};border:1px solid ${color}55;background:${color}22;white-space:nowrap;
        ">${s.status}</span>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;
                  display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div>
          <div style="font-size:10px;color:#64748b;">Tipe</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e2e8f0;">
            ${tipeShape} ${s.tipe}
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">Interval</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e2e8f0;">
            ${s.interval ?? '—'}
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">Lat</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e2e8f0;">
            ${Number(s.lat).toFixed(5)}
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">Lon</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e2e8f0;">
            ${Number(s.lon).toFixed(5)}
          </div>
        </div>
        <div style="grid-column:1/-1;">
          <div style="font-size:10px;color:#64748b;">Observasi terakhir</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#e2e8f0;">
            ${lastObs}
          </div>
        </div>
      </div>

      <!-- Dua tombol: Chart dan Detail -->
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button id="popup-chart-${s.id_station}" style="
          flex:1;padding:6px 0;
          font-family:'IBM Plex Mono',monospace;font-size:11px;
          color:#22c55e;background:rgba(34,197,94,0.08);
          border:1px solid rgba(34,197,94,0.25);border-radius:8px;cursor:pointer;
        "
          onmouseover="this.style.background='rgba(34,197,94,0.18)'"
          onmouseout="this.style.background='rgba(34,197,94,0.08)'"
        >Chart</button>

        <button id="popup-detail-${s.id_station}" style="
          flex:1;padding:6px 0;
          font-family:'IBM Plex Mono',monospace;font-size:11px;
          color:#00d4ff;background:rgba(0,212,255,0.08);
          border:1px solid rgba(0,212,255,0.25);border-radius:8px;cursor:pointer;
        "
          onmouseover="this.style.background='rgba(0,212,255,0.18)'"
          onmouseout="this.style.background='rgba(0,212,255,0.08)'"
        >Detail →</button>
      </div>
    </div>
  `
}

// ─── Tidak ada perubahan di fungsi-fungsi berikut ─────────────────────────

function toggleValue(value, list, setList) {
  if (list.includes(value)) {
    setList(list.filter((item) => item !== value))
  } else {
    setList([...list, value])
  }
}

function MapFilter({
  search, setSearch,
  filterTipe, setFilterTipe,
  filterStatus, setFilterStatus,
  show, setShow,
}) {
  const tipeOptions   = [
    { value: 'ARG',  label: '▲ ARG' },
    { value: 'AWS',  label: '● AWS' },
    { value: 'AAWS', label: '■ AAWS' },
  ]
  const statusOptions = ['ON', 'OFF', 'DELAY']

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] w-[270px]">
      <div className="glass-card flex items-center justify-between px-3 py-2 shadow-lg">
        <span className="font-mono text-xs text-slate-300">Search & Filter</span>
        <button
          onClick={() => setShow(!show)}
          className="rounded px-2 font-mono text-sm text-slate-400 hover:bg-white/10 hover:text-white"
        >
          {show ? '−' : '+'}
        </button>
      </div>

      {show && (
        <div className="glass-card mt-2 space-y-3 p-3 shadow-lg">
          <div>
            <div className="label-mono mb-1.5">Search Station</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / ID stasiun..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2
                         font-mono text-xs text-slate-200 outline-none
                         placeholder:text-slate-600 focus:border-cyan-400/40"
            />
          </div>

          <div className="border-t border-white/8" />

          <div>
            <div className="label-mono mb-1.5">Filter Tipe</div>
            <div className="grid grid-cols-3 gap-1.5">
              {tipeOptions.map((item) => {
                const active = filterTipe.includes(item.value)
                return (
                  <button
                    key={item.value}
                    onClick={() => toggleValue(item.value, filterTipe, setFilterTipe)}
                    className={[
                      'rounded-lg border px-2 py-1.5 font-mono text-[10px] transition',
                      active
                        ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                        : 'border-white/10 bg-black/20 text-slate-500',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="label-mono mb-1.5">Filter Status</div>
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((status) => {
                const active = filterStatus.includes(status)
                const color  = getStatusColor(status)
                return (
                  <button
                    key={status}
                    onClick={() => toggleValue(status, filterStatus, setFilterStatus)}
                    className={[
                      'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[10px] transition',
                      active
                        ? 'border-white/20 bg-white/10 text-slate-200'
                        : 'border-white/10 bg-black/20 text-slate-500',
                    ].join(' ')}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm border border-white/20"
                      style={{ background: active ? color : '#475569' }}
                    />
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ show, setShow }) {
  const tipes = [
    { tipe: 'ARG',  shape: '▲', label: 'ARG — Automatic Rain Gauge' },
    { tipe: 'AWS',  shape: '●', label: 'AWS — Automatic Weather Station' },
    { tipe: 'AAWS', shape: '■', label: 'AAWS — Automatic Agroclimate Weather Station' },
  ]
  const statuses = [
    { color: '#22c55e', label: 'ON' },
    { color: '#ef4444', label: 'OFF' },
    { color: '#f59e0b', label: 'DELAY' },
  ]

  return (
    <div className="absolute bottom-4 left-4 z-[999] glass-card p-3 shadow-lg" style={{ minWidth: 190 }}>
      <button
        onClick={() => setShow(!show)}
        className="mb-2 flex w-full items-center justify-between text-left font-mono text-[11px] text-slate-300"
      >
        <span>Legend</span>
        <span>{show ? '−' : '+'}</span>
      </button>

      {show && (
        <div className="space-y-3">
          <div>
            <div className="label-mono mb-1.5">Tipe Stasiun</div>
            {tipes.map(({ shape, label, tipe }) => (
              <div key={tipe} className="flex items-center gap-2 py-0.5">
                <span className="w-4 text-center font-mono text-xs text-slate-400">{shape}</span>
                <span className="font-mono text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8" />

          <div>
            <div className="label-mono mb-1.5">Status</div>
            {statuses.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 py-0.5">
                <div
                  className="h-3 w-3 shrink-0 rounded-sm border border-white/20"
                  style={{ background: color }}
                />
                <span className="font-mono text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CountBadge({ total, online, filtered }) {
  return (
    <div className="absolute top-4 right-4 z-[999] glass-card px-3 py-2 text-right shadow-lg">
      <div className="font-mono text-xs text-slate-400">Total Site</div>
      <div className="font-display text-2xl font-bold text-white">
        {filtered.toLocaleString('id-ID')}
      </div>
      <div className="font-mono text-[10px] text-slate-500">
        dari {total.toLocaleString('id-ID')} site
      </div>
      <div className="font-mono text-[10px] text-status-on">
        {online.toLocaleString('id-ID')} online
      </div>
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="skeleton flex h-full w-full items-center justify-center rounded-xl">
      <div className="font-mono text-sm text-slate-600">Memuat peta…</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
export default function StationMap() {
  const { data: stations, isLoading, isError } = useMapStations()

  const [search,       setSearch]       = useState('')
  const [filterTipe,   setFilterTipe]   = useState(['ARG', 'AWS', 'AAWS'])
  const [filterStatus, setFilterStatus] = useState(['ON', 'OFF', 'DELAY'])
  const [showLegend,   setShowLegend]   = useState(true)
  const [showFilter,   setShowFilter]   = useState(true)

  // ── TAMBAHAN: state untuk chart modal ─────────────────────────────────
  const [chartStation, setChartStation] = useState(null)

  const handleOpenChart  = useCallback((s) => setChartStation(s), [])
  const handleCloseChart = useCallback(() => setChartStation(null), [])

  const filteredStations = useMemo(() => {
    if (!stations) return []
    const keyword = search.trim().toLowerCase()
    return stations.filter((s) => {
      const id     = String(s.id_station  ?? '').toLowerCase()
      const name   = String(s.name_station ?? '').toLowerCase()
      const tipe   = String(s.tipe_station ?? '').toUpperCase()
      const status = String(s.status_realtime ?? 'OFF').toUpperCase()

      const matchSearch  = keyword === '' || id.includes(keyword) || name.includes(keyword)
      const matchTipe    = filterTipe.includes(tipe)
      const matchStatus  = filterStatus.includes(status)

      return matchSearch && matchTipe && matchStatus
    })
  }, [stations, search, filterTipe, filterStatus])

  const stats = useMemo(() => {
    const all      = stations ?? []
    const filtered = filteredStations ?? []
    return {
      total:    all.length,
      filtered: filtered.length,
      online:   filtered.filter((s) => s.status_realtime === 'ON').length,
    }
  }, [stations, filteredStations])

  if (isLoading) return <div className="h-full w-full"><MapSkeleton /></div>

  if (isError) {
    return (
      <div className="glass-card flex h-full w-full items-center justify-center border border-status-off/20">
        <div className="font-mono text-sm text-status-off">⚠ Gagal memuat data peta</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/5">
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* ── DIMODIFIKASI: pass onOpenChart ke MarkerLayer ── */}
        <MarkerLayer
          stations={filteredStations}
          onOpenChart={handleOpenChart}
        />
      </MapContainer>

      <MapFilter
        search={search}
        setSearch={setSearch}
        filterTipe={filterTipe}
        setFilterTipe={setFilterTipe}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        show={showFilter}
        setShow={setShowFilter}
      />

      <Legend show={showLegend} setShow={setShowLegend} />

      <CountBadge
        total={stats.total}
        filtered={stats.filtered}
        online={stats.online}
      />

      {/* ── TAMBAHAN: render modal chart ── */}
      {chartStation && (
        <StationChartModel
          station={chartStation}
          onClose={handleCloseChart}
        />
      )}
    </div>
  )
}
