import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffStations } from '@/hooks/useStations'
import { getStatusClass, timeAgo } from '@/utils/helpers'
import clsx from 'clsx'

/**
 * Normalisasi field dari /off response.
 *
 * /off response contoh:
 * {
 *   id_station, tipe_station, name_station, nama_kota,
 *   latitude, longitude, elevasi,
 *   status_realtime, last_observed_at, last_ingested_at, interval_detected,
 *   rr, pp_air, rh_avg, sr_avg, sr_max, wd_avg, ws_avg, ws_max,
 *   tt_air_avg, tt_air_min, tt_air_max, ws_50cm, wl_pan, ev_pan, ws_2m
 * }
 */
function normalizeOffStation(s) {
  return {
    id_station:  s.id_station,
    name:        s.name_station ?? s.id_station,
    tipe:        s.tipe_station?.toUpperCase() ?? '—',
    kota:        s.nama_kota,
    status:      s.status_realtime ?? 'NO DATA',
    last_obs:    s.last_observed_at,
    last_ingest: s.last_ingested_at,
    interval:    s.interval_detected,
    // observasi numerik
    rr:     s.rr,
    rh:     s.rh_avg,
    tt:     s.tt_air_avg,
    ws:     s.ws_avg,
    ws_max: s.ws_max,
    sr:     s.sr_avg,
  }
}

const FILTERS = ['ALL', 'OFF', 'DELAY']
const PAGE_SIZE = 10

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-3 w-full" />
        </td>
      ))}
    </tr>
  )
}

function Val({ v, unit = '' }) {
  if (v == null) return <span className="text-slate-600">—</span>
  return <span>{v}{unit}</span>
}

export default function OffStationsTable() {
  const { data: raw, isLoading, isError, dataUpdatedAt } = useOffStations()
  const navigate = useNavigate()

  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [showObs, setShowObs] = useState(false)

  const data = useMemo(() => (raw ?? []).map(normalizeOffStation), [raw])

  const filtered = useMemo(() => {
    return data.filter((s) => {
      const matchStatus = filter === 'ALL' || s.status === filter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id_station.toLowerCase().includes(q) ||
        (s.kota ?? '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [data, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID')
    : null

  const counts = useMemo(() => {
    const c = { ALL: data.length, OFF: 0, DELAY: 0, 'NO DATA': 0 }
    data.forEach((s) => { if (c[s.status] != null) c[s.status]++ })
    return c
  }, [data])

  const handleFilter = (f) => { setFilter(f); setPage(1) }
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  const colSpanBase = 6
  const colSpanObs  = showObs ? colSpanBase + 4 : colSpanBase

  return (
    <div className="glass-card flex flex-col min-h-0 animate-slide-up" style={{ animationDelay: '0.15s' }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-white/5">
        <div>
          <div className="section-title">Site Bermasalah</div>
          {lastUpdate && (
            <div className="label-mono mt-0.5 text-[10px]">
              Update: {lastUpdate} · {filtered.length} site
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Nama / ID / kota…"
            value={search}
            onChange={handleSearch}
            className="text-sm bg-surface-2 border border-white/10 rounded-lg px-3 py-1.5
                       text-slate-200 placeholder-slate-500 font-mono w-44
                       focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                       transition-all duration-150"
          />
          <button
            onClick={() => setShowObs((v) => !v)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150',
              showObs
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/5'
            )}
          >
            {showObs ? '− Data Obs' : '+ Data Obs'}
          </button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-1 px-4 pt-2 pb-1 overflow-x-auto shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all duration-150',
              filter === f
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            )}
          >
            {f}
            <span className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded-full',
              filter === f ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-slate-500'
            )}>
              {counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">ID</th>
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">Nama Stasiun</th>
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">Tipe</th>
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">Status</th>
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">Obs. Terakhir</th>
              <th className="px-4 py-2.5 text-left label-mono text-[10px]">Ingest</th>
              {showObs && <>
                <th className="px-4 py-2.5 text-left label-mono text-[10px]">RR (mm)</th>
                <th className="px-4 py-2.5 text-left label-mono text-[10px]">RH (%)</th>
                <th className="px-4 py-2.5 text-left label-mono text-[10px]">Temp (°C)</th>
                <th className="px-4 py-2.5 text-left label-mono text-[10px]">WS (m/s)</th>
              </>}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {isError && (
              <tr>
                <td colSpan={colSpanObs} className="px-4 py-8 text-center text-status-off font-mono text-sm">
                  ⚠ Gagal memuat data. Periksa koneksi backend.
                </td>
              </tr>
            )}

            {!isLoading && !isError && paged.length === 0 && (
              <tr>
                <td colSpan={colSpanObs} className="px-4 py-8 text-center text-slate-500 font-mono text-sm">
                  {search || filter !== 'ALL'
                    ? 'Tidak ada hasil yang cocok.'
                    : 'Semua site dalam kondisi baik 🎉'}
                </td>
              </tr>
            )}

            {paged.map((s) => (
              <tr
                key={s.id_station}
                onClick={() => navigate(`/station/${s.id_station}`)}
                className="group cursor-pointer hover:bg-white/[0.03] transition-colors duration-100"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-400 group-hover:text-accent transition-colors whitespace-nowrap">
                  {s.id_station}
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  <div className="text-sm text-slate-200 font-medium truncate">{s.name}</div>
                  {s.kota && (
                    <div className="font-mono text-[10px] text-slate-500 truncate">{s.kota}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400 bg-surface-3 px-2 py-0.5 rounded">
                    {s.tipe}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('status-badge', getStatusClass(s.status))}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                  {s.last_obs
                    ? timeAgo(s.last_obs)
                    : <span className="text-slate-600">Belum ada</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                  {s.last_ingest
                    ? timeAgo(s.last_ingest)
                    : <span className="text-slate-600">—</span>}
                </td>
                {showObs && <>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300"><Val v={s.rr} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300"><Val v={s.rh} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300"><Val v={s.tt} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300"><Val v={s.ws} /></td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 shrink-0">
          <span className="font-mono text-xs text-slate-500">
            Hal {page} dari {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white
                         hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pg = i + 1
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-xs font-mono transition-all',
                    pg === page
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-white
                         hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
