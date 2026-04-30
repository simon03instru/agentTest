import { useMemo } from 'react'
import { useSummary } from '@/hooks/useStations'
import { transformSummary } from '@/utils/transformSummary'
import { percent } from '@/utils/helpers'
import clsx from 'clsx'

const STATUS_CONFIG = [
  {
    key: 'ON', label: 'Online',
    color: 'text-status-on', bg: 'bg-status-on/10',
    border: 'border-status-on/20', dot: 'bg-status-on',
  },
  {
    key: 'OFF', label: 'Offline',
    color: 'text-status-off', bg: 'bg-status-off/10',
    border: 'border-status-off/20', dot: 'bg-status-off',
  },
  {
    key: 'DELAY', label: 'Delay',
    color: 'text-status-delay', bg: 'bg-status-delay/10',
    border: 'border-status-delay/20', dot: 'bg-status-delay',
  },
  {
    key: 'NO DATA', label: 'No Data',
    color: 'text-status-nodata', bg: 'bg-status-nodata/10',
    border: 'border-status-nodata/20', dot: 'bg-status-nodata',
  },
]

// Urutan tipe yang ingin ditampilkan
const TYPE_ORDER = ['ARG', 'AWS', 'AAWS']

function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3 animate-pulse">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-8 w-16" />
      <div className="skeleton h-2 w-full" />
    </div>
  )
}

function KpiCard({ label, value, sub, color, bg, border, dot }) {
  const isOn = dot === 'bg-status-on'
  return (
    <div className={clsx(
      'glass-card p-5 border transition-all duration-200 hover:shadow-glow-sm',
      border, bg
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={clsx(
          'w-2 h-2 rounded-full',
          dot,
          isOn && 'animate-pulse-slow'
        )} />
        <span className="label-mono">{label}</span>
      </div>
      <div className={clsx('font-display text-4xl font-bold tabular-nums', color)}>
        {value ?? '—'}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-slate-500 font-mono">{sub}</div>
      )}
    </div>
  )
}

/** Stacked bar per tipe stasiun */
function TypeBar({ tipe, data, grand_total }) {
  if (!data) return null

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-200">{tipe}</span>
          <span className="font-mono text-[10px] text-slate-500">
            {data.total} site · {percent(data.total, grand_total)}%
          </span>
        </div>
        {/* Online rate badge */}
        <span className={clsx(
          'font-mono text-[10px] px-1.5 py-0.5 rounded',
          data.ON > 0
            ? 'bg-status-on/10 text-status-on'
            : 'bg-status-nodata/10 text-status-nodata'
        )}>
          {percent(data.ON, data.total)}% online
        </span>
      </div>

      {/* Stacked progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-surface-3 gap-px">
        {STATUS_CONFIG.map(({ key, dot }) => {
          const val = data[key] ?? 0
          const pct = percent(val, data.total)
          if (!pct) return null
          return (
            <div
              key={key}
              className={clsx('h-full transition-all duration-700', dot)}
              style={{ width: `${pct}%` }}
              title={`${key}: ${val}`}
            />
          )
        })}
      </div>

      {/* Count labels */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {STATUS_CONFIG.map(({ key, color, label }) => {
          const val = data[key] ?? 0
          return (
            <span key={key} className={clsx('font-mono text-[10px]', val > 0 ? color : 'text-slate-700')}>
              {val} {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function SummaryCards() {
  const { data: raw, isLoading, isError } = useSummary()

  // Transform flat array → { grand_total, by_status, by_type }
  const summary = useMemo(() => transformSummary(raw), [raw])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="glass-card p-4 skeleton h-28" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="glass-card p-4 border border-status-off/20 text-status-off text-sm font-mono">
        ⚠ Gagal memuat summary. Periksa koneksi ke backend.
      </div>
    )
  }

  const { grand_total, by_status, by_type } = summary

  // Tentukan tipe yang tampil: pakai TYPE_ORDER kalau ada, tambah sisanya
  const availableTypes = Object.keys(by_type)
  const displayTypes = [
    ...TYPE_ORDER.filter((t) => availableTypes.includes(t)),
    ...availableTypes.filter((t) => !TYPE_ORDER.includes(t)),
  ]

  return (
    <div className="space-y-3">

      {/* ── Big KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
        {STATUS_CONFIG.map(({ key, label, color, bg, border, dot }) => (
          <KpiCard
            key={key}
            label={label}
            value={(by_status[key] ?? 0).toLocaleString('id-ID')}
            sub={`${percent(by_status[key], grand_total)}% dari ${grand_total.toLocaleString('id-ID')} site`}
            color={color}
            bg={bg}
            border={border}
            dot={dot}
          />
        ))}
      </div>

      {/* ── Breakdown per tipe ── */}
      <div
        className="glass-card p-4 animate-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="section-title text-sm">Breakdown per Tipe Stasiun</span>
          <span className="label-mono">{grand_total.toLocaleString('id-ID')} total site</span>
        </div>

        {displayTypes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {displayTypes.map((tipe) => (
              <TypeBar
                key={tipe}
                tipe={tipe}
                data={by_type[tipe]}
                grand_total={grand_total}
              />
            ))}
          </div>
        ) : (
          <div className="text-slate-500 font-mono text-sm">Belum ada data summary.</div>
        )}
      </div>

    </div>
  )
}
