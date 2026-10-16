/**
 * Sidebar filter bertingkat + counter hasil.
 * State filter ada di parent (StationFilterPage) lewat useCascadingFilters.
 */
import { FILTER_LEVELS } from '@/hooks/useCascadingFilters'
import { getStatusColor } from '@/utils/helpers'
import FilterSelect from './FilterSelect'

// Nilai `value` dikirim apa adanya ke ?tipe_station= . Kalau backend kamu
// mencocokkan huruf besar ('ARG'), ubah value di sini saja.
export const TIPE_OPTIONS = [
  { label: 'Semua Tipe',                       value: '' },
  { label: '▲ ARG',                            value: 'arg' },
  { label: '● AWS',                            value: 'aws' },
  { label: '■ AAWS',                           value: 'aaws' },
]

const LEVEL_UI = {
  balai:    { label: 'Balai',                allLabel: 'Semua Balai' },
  provinsi: { label: 'Provinsi',             allLabel: 'Semua Provinsi' },
  upt:      { label: 'UPT Penanggung Jawab', allLabel: 'Semua UPT' },
  kota:     { label: 'Kota / Kabupaten',     allLabel: 'Semua Kota' },
}

const STATUS_ORDER = ['ON', 'DELAY', 'OFF', 'NO DATA']

export default function FilterSidebar({
  cascade, tipe, onTipeChange, onReset, stats, isLoading, onClose,
}) {
  const { values, options, loading, loadingFrom, error, setLevel, retry } = cascade
  const dirty = Boolean(tipe) || FILTER_LEVELS.some((l) => values[l])

  return (
    <div className="flex h-full w-[320px] max-w-[88vw] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="section-title !text-base">Filter Stasiun</span>
        <button
          onClick={onClose}
          aria-label="Tutup panel filter"
          className="rounded px-2 font-mono text-sm text-slate-400 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Summary counter */}
        <div className="glass-card p-3">
          <div className="label-mono mb-1">Stasiun ditemukan</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-white tabular-nums">
              {isLoading ? '…' : stats.total.toLocaleString('id-ID')}
            </span>
            <span className="font-mono text-[10px] text-slate-500">stasiun</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STATUS_ORDER.filter((s) => stats.byStatus[s]).map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: getStatusColor(s) }} />
                {s} {stats.byStatus[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Error opsi */}
        {error && (
          <div className="rounded-lg border border-status-off/30 bg-status-off/10 p-2.5 font-mono text-[11px] text-status-off">
            ⚠ {error}
            <button onClick={retry} className="ml-2 underline hover:text-white">Coba lagi</button>
          </div>
        )}

        {/* Dropdown bertingkat */}
        {FILTER_LEVELS.map((level, idx) => (
          <FilterSelect
            key={level}
            label={LEVEL_UI[level].label}
            allLabel={LEVEL_UI[level].allLabel}
            value={values[level]}
            options={options[level]}
            onChange={(v) => setLevel(level, v)}
            disabled={loading && idx > loadingFrom}
            busy={loading && idx > loadingFrom}
          />
        ))}

        {/* Tipe station */}
        <label className="block">
          <div className="label-mono mb-1.5">Tipe Station</div>
          <select
            value={tipe}
            onChange={(e) => onTipeChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2
                       font-mono text-xs text-slate-200 outline-none transition focus:border-cyan-400/40"
          >
            {TIPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-900 text-slate-200">{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 p-4">
        <button
          onClick={onReset}
          disabled={!dirty}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs
                     text-slate-300 transition hover:bg-white/10 hover:text-white
                     disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↺ Reset Filter
        </button>
      </div>
    </div>
  )
}
