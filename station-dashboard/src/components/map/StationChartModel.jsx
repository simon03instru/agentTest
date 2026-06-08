/**
 * src/components/map/StationChartModal.jsx  ← FILE BARU
 *
 * Modal chart yang muncul saat user klik "Lihat Chart" di popup marker.
 * Menampilkan data time-series dari GET /station/export/:id?tanggal=...
 *
 * Chart.js sudah di-import di index.html via CDN (lihat instruksi di bawah).
 * Atau bisa install: npm install chart.js react-chartjs-2
 *
 * INSTRUKSI CHART.JS:
 * Tambahkan di index.html sebelum </body>:
 *   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
 *
 * Atau install via npm dan import di file ini:
 *   import { Line } from 'react-chartjs-2'
 *   import { Chart, ...registrables } from 'chart.js'
 *   Chart.register(...registrables)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchExportData } from '@/api/stations'
import { exportToCSV, exportToExcel, getColumnsForType, getColumnLabel } from '@/utils/exportData'
import { getStatusColor } from '@/utils/helpers'
import clsx from 'clsx'

// ─── Config warna per parameter ───────────────────────────────────────────
const PARAM_COLOR = {
  rr:         '#00d4ff',
  pp_air:     '#a78bfa',
  rh_avg:     '#34d399',
  sr_avg:     '#fbbf24',
  sr_max:     '#f97316',
  wd_avg:     '#60a5fa',
  ws_avg:     '#4ade80',
  ws_max:     '#f87171',
  tt_air_avg: '#fb923c',
  tt_air_min: '#38bdf8',
  tt_air_max: '#ef4444',
  ws_50cm:    '#a3e635',
  ws_2m:      '#86efac',
  wl_pan:     '#c084fc',
  ev_pan:     '#f472b6',
}

function getParamColor(key) {
  return PARAM_COLOR[key] ?? '#94a3b8'
}

// ─── Format waktu label sumbu X ───────────────────────────────────────────
function formatTimeLabel(isoStr) {
  if (!isoStr) return ''
  try {
    return new Date(isoStr).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  } catch { return isoStr }
}

// ─── Tanggal hari ini dalam format YYYY-MM-DD ─────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Canvas chart (menggunakan Chart.js global) ───────────────────────────
function ChartCanvas({ rows, selectedParams, tipe }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !rows.length || !selectedParams.length) return

    // Destroy chart sebelumnya
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const Chart = window.Chart
    if (!Chart) {
      console.error('Chart.js tidak ditemukan. Tambahkan script CDN di index.html')
      return
    }

    const labels   = rows.map((r) => formatTimeLabel(r.time))
    const datasets = selectedParams.map((param) => ({
      label:           getColumnLabel(param),
      data:            rows.map((r) => r[param] === -888 ? null : r[param]),
      borderColor:     getParamColor(param),
      backgroundColor: getParamColor(param) + '15',
      borderWidth:     1.5,
      pointRadius:     rows.length > 100 ? 0 : 2,
      pointHoverRadius:4,
      tension:         0.3,
      fill:            selectedParams.length === 1,
      spanGaps:        true,
    }))

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: selectedParams.length > 1,
            labels: {
              color:     '#94a3b8',
              font:      { family: "'IBM Plex Mono'", size: 10 },
              boxWidth:  12,
              padding:   12,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderColor:     'rgba(255,255,255,0.1)',
            borderWidth:     1,
            titleColor:      '#e2e8f0',
            bodyColor:       '#94a3b8',
            titleFont:       { family: "'IBM Plex Mono'", size: 11 },
            bodyFont:        { family: "'IBM Plex Mono'", size: 11 },
            padding:         10,
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ${ctx.parsed.y ?? '—'}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color:     '#64748b',
              font:      { family: "'IBM Plex Mono'", size: 10 },
              maxTicksLimit: 12,
              maxRotation:   0,
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: {
              color: '#64748b',
              font:  { family: "'IBM Plex Mono'", size: 10 },
            },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [rows, selectedParams])

  return <canvas ref={canvasRef} />
}

// ─── Param selector chips ─────────────────────────────────────────────────
function ParamChips({ params, selected, onChange }) {
  const toggle = (p) => {
    if (selected.includes(p)) {
      if (selected.length === 1) return // minimal 1 aktif
      onChange(selected.filter((x) => x !== p))
    } else {
      onChange([...selected, p])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {params.map((p) => {
        const active = selected.includes(p)
        const color  = getParamColor(p)
        return (
          <button
            key={p}
            onClick={() => toggle(p)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px]',
              'border transition-all duration-150',
              active
                ? 'border-opacity-50'
                : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
            )}
            style={active ? {
              borderColor:     color + '55',
              background:      color + '15',
              color,
            } : {}}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: active ? color : '#475569' }}
            />
            {getColumnLabel(p)}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────
export default function StationChartModel({ station, onClose }) {
  const [tanggal, setTanggal]         = useState(todayStr())
  const [data, setData]               = useState(null)
  const [isLoading, setLoading]       = useState(false)
  const [error, setError]             = useState('')
  const [selectedParams, setSelected] = useState([])
  const [isExporting, setExporting]   = useState(false)

  const tipe = station?.tipe?.toUpperCase() ?? 'AWS'

  // Fetch data saat tanggal berubah
  const load = useCallback(async (id, tgl) => {
    try {
      setLoading(true)
      setError('')
      const result = await fetchExportData(id, tgl)
      setData(result)

      // Set param default berdasarkan tipe
      const rows  = result?.series?.rr ?? []
      const cols  = getColumnsForType(result?.tipe_station, rows[0])
      // Default: tampilkan parameter utama per tipe
      const defaults = {
        ARG:  ['rr'],
        AWS:  ['tt_air_avg', 'rh_avg', 'ws_avg'],
        AAWS: ['tt_air_avg', 'rh_avg', 'rr'],
      }
      const defaultCols = (defaults[tipe] ?? ['rr'])
        .filter((c) => cols.includes(c))
      setSelected(defaultCols.length ? defaultCols : cols.slice(0, 2))
    } catch (err) {
      setError(err.message ?? 'Gagal memuat data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [tipe])

  useEffect(() => {
    if (station?.id_station && tanggal) {
      load(station.id_station, tanggal)
    }
  }, [station?.id_station, tanggal, load])

  // Tutup modal dengan Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const rows     = data?.series?.rr ?? []
  const allCols  = getColumnsForType(data?.tipe_station, rows[0])
  const status   = station?.status ?? 'NO DATA'
  const statColor= getStatusColor(status)

  const handleExportCSV = async () => {
    if (!data) return
    setExporting(true)
    try { exportToCSV(data, tanggal) }
    finally { setExporting(false) }
  }

  const handleExportExcel = async () => {
    if (!data) return
    setExporting(true)
    try { exportToExcel(data, tanggal) }
    finally { setExporting(false) }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal panel */}
      <div className="glass-card border border-white/10 shadow-2xl w-full max-w-4xl
                      max-h-[90vh] flex flex-col animate-slide-up">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-white text-base">
                  {station?.name ?? station?.id_station}
                </span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ color: statColor, borderColor: statColor + '50', background: statColor + '20' }}
                >
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-slate-500">{station?.id_station}</span>
                <span className="font-mono text-[10px] text-slate-600">·</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{tipe}</span>
                {station?.interval && (
                  <>
                    <span className="font-mono text-[10px] text-slate-600">·</span>
                    <span className="font-mono text-[10px] text-accent/70">{station.interval}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date picker */}
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 border border-white/8">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                type="date"
                value={tanggal}
                max={todayStr()}
                onChange={(e) => setTanggal(e.target.value)}
                className="bg-transparent font-mono text-xs text-slate-200 outline-none
                           [color-scheme:dark] w-28"
              />
            </div>

            {/* Export buttons */}
            <button
              onClick={handleExportCSV}
              disabled={!data || isLoading || isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs
                         border border-white/10 text-slate-400 hover:text-white hover:bg-white/5
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Export CSV"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!data || isLoading || isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs
                         border border-status-on/30 text-status-on hover:bg-status-on/10
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Export Excel"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Excel
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Param selector ── */}
        {allCols.length > 1 && !isLoading && !error && (
          <div className="px-5 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="label-mono text-[10px] shrink-0">Parameter:</span>
              <ParamChips
                params={allCols}
                selected={selectedParams}
                onChange={setSelected}
              />
            </div>
          </div>
        )}

        {/* ── Chart area ── */}
        <div className="flex-1 min-h-0 p-5">
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="font-mono text-xs text-slate-500">Memuat data {tanggal}…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="text-status-off font-mono text-sm">⚠ {error}</div>
              <button
                onClick={() => load(station.id_station, tanggal)}
                className="font-mono text-xs text-accent hover:underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !error && rows.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="text-slate-500 font-mono text-sm">
                Tidak ada data untuk tanggal {tanggal}
              </div>
              <div className="text-slate-600 font-mono text-xs">
                Coba pilih tanggal lain
              </div>
            </div>
          )}

          {!isLoading && !error && rows.length > 0 && selectedParams.length > 0 && (
            <div className="h-full min-h-[280px]">
              <ChartCanvas
                rows={rows}
                selectedParams={selectedParams}
                tipe={tipe}
              />
            </div>
          )}
        </div>

        {/* ── Footer info ── */}
        {!isLoading && rows.length > 0 && (
          <div className="px-5 py-2.5 border-t border-white/5 shrink-0
                          flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-600">
              {rows.length} data point · {tanggal}
            </span>
            <span className="font-mono text-[10px] text-slate-600">
              Tekan Esc untuk tutup
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
