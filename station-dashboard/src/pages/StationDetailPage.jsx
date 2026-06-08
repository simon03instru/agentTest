import { useParams, useNavigate } from 'react-router-dom'
import { useStationDetail } from '@/hooks/useStations'
import { getStatusClass, timeAgo, formatDateTime } from '@/utils/helpers'
import clsx from 'clsx'

/**
 * Semua field observasi yang mungkin muncul di response /station/:id
 * Dikelompokkan agar UI lebih rapi.
 */
const OBS_GROUPS= {
  arg: [
    {
      label: 'Hujan',
      fields: [
        { key: 'rr', label: 'Curah Hujan', unit: 'mm' },
      ],
    },
  ],

  aws: [
    {
      label: 'Hujan',
      fields: [
        { key: 'rr', label: 'Curah Hujan', unit: 'mm' },
      ],
    },

    {
      label: 'Atmosfer',
      fields: [
        { key: 'pp_air', label: 'Tekanan', unit: 'hPa' },
      ],
    },

    {
      label: 'Kelembaban',
      fields: [
        { key: 'rh_avg', label: 'RH', unit: '%' },
      ],
    },

    {
      label: 'Solar Radiation',
      fields: [
        { key: 'sr_avg', label: 'Radiasi Avg', unit: 'W/m²' },
        { key: 'sr_max', label: 'Radiasi Max', unit: 'W/m²' },
      ],
    },

    {
      label: 'Angin',
      fields: [
        { key: 'wd_avg', label: 'Wind Direction Avg', unit: '°' },
        { key: 'ws_avg', label: 'Wind Speed Avg', unit: 'm/s' },
        { key: 'ws_max', label: 'Wind Speed Max', unit: 'm/s' },
      ],
    },

    {
      label: 'Suhu Udara',
      fields: [
        { key: 'tt_air_avg', label: 'Suhu Rata-Rata', unit: '°C' },
        { key: 'tt_air_min', label: 'Suhu Minimum', unit: '°C' },
        { key: 'tt_air_max', label: 'Suhu Maximum', unit: '°C' },
      ],
    },

  ],

  aaws: [
    {
      label: 'Hujan',
      fields: [
        { key: 'rr', label: 'Curah Hujan', unit: 'mm' },
      ],
    },

    {
      label: 'Atmosfer',
      fields: [
        { key: 'pp_air', label: 'Tekanan', unit: 'hPa' },
      ],
    },

    {
      label: 'Kelembaban',
      fields: [
        { key: 'rh_avg', label: 'RH', unit: '%' },
      ],
    },

    {
      label: 'Solar Radiation',
      fields: [
        { key: 'sr_avg', label: 'Radiasi Avg', unit: 'W/m²' },
        { key: 'sr_max', label: 'Radiasi Max', unit: 'W/m²' },
      ],
    },

    {
      label: 'Angin',
      fields: [
        { key: 'wd_avg', label: 'Wind Direction Avg', unit: '°' },
        { key: 'ws_avg', label: 'Wind Speed Avg', unit: 'm/s' },
        { key: 'ws_max', label: 'Wind Speed Max', unit: 'm/s' },
      ],
    },

    {
      label: 'Suhu Udara',
      fields: [
        { key: 'tt_air_avg', label: 'Suhu Rata-Rata', unit: '°C' },
        { key: 'tt_air_min', label: 'Suhu Minimum', unit: '°C' },
        { key: 'tt_air_max', label: 'Suhu Maximum', unit: '°C' },
      ],
    },

    {
      label: 'Wind Speed 50cm & 2m',
      fields: [
        { key: 'ws_50cm', label: 'Wind Speed 50cm', unit: 'm/s' },
        { key: 'ws_2m', label: 'Wind Speed 2m', unit: 'm/s' },
      ],
    },

  ],
}

function DetailRow({ label, value, mono = true }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0 gap-4">
      <span className="label-mono text-[10px] shrink-0">{label}</span>
      <span className={clsx(
        'text-sm text-right',
        mono ? 'font-mono' : '',
        value == null ? 'text-slate-600' : 'text-slate-200'
      )}>
        {value ?? '—'}
      </span>
    </div>
  )
}

/** Card untuk setiap grup observasi. Hanya tampil kalau ada ≥1 nilai non-null */
function ObsGroup({ group, data }) {
  // Cek apakah minimal ada satu field yang tidak null
  const hasData = group.fields.some(({ key }) => data[key] != null)

  // Tetap render grupnya, tapi tandai kalau semua null
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="section-title text-xs">{group.label}</span>
        {!hasData && (
          <span className="label-mono text-[10px] text-slate-600">Tidak ada data</span>
        )}
      </div>
      <div className="space-y-0">
        {group.fields.map(({ key, label, unit }) => {
          const val = data[key]
          return (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <span className="label-mono text-[10px]">{label}</span>
              {val != null ? (
                <span className="font-mono text-sm text-slate-200">
                  {typeof val === 'number' ? val.toLocaleString('id-ID', { maximumFractionDigits: 3 }) : val}
                  {' '}<span className="text-slate-500 text-xs">{unit}</span>
                </span>
              ) : (
                <span className="font-mono text-sm text-slate-700">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Status badge dengan dot indicator */
function StatusBadge({ status }) {
  const s = status ?? 'NO DATA'
  return (
    <span className={clsx('status-badge text-sm px-3 py-1.5', getStatusClass(s))}>
      <span className={clsx(
        'w-2 h-2 rounded-full bg-current',
        s === 'ON' && 'animate-pulse-slow'
      )} />
      {s}
    </span>
  )
}

export default function StationDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { data, isLoading, isError } = useStationDetail(id)

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in">

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-mono text-slate-400
                   hover:text-accent transition-colors mb-6"
      >
        ← Kembali ke Dashboard
      </button>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-4">
          <div className="glass-card p-5 skeleton h-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4 skeleton h-40" />
            <div className="glass-card p-4 skeleton h-40" />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="glass-card p-6 text-center border border-status-off/20">
          <div className="text-status-off font-mono text-sm">
            ⚠ Gagal memuat data stasiun <strong>{id}</strong>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-3 text-xs font-mono text-accent hover:underline"
          >
            Kembali ke dashboard
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {data && (
        <div className="space-y-4">

          {/* Hero */}
          <div className="glass-card p-5 border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl font-bold text-white leading-tight truncate">
                  {data.name_station ?? data.id_station}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 bg-surface-3 px-2 py-0.5 rounded">
                    {data.id_station}
                  </span>
                  {data.tipe_station && (
                    <span className="font-mono text-xs text-slate-400 bg-surface-3 px-2 py-0.5 rounded uppercase">
                      {data.tipe_station}
                    </span>
                  )}
                  {data.interval_detected && (
                    <span className="font-mono text-xs text-accent/80 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                      interval: {data.interval_detected}
                    </span>
                  )}
                </div>
                {data.nama_kota && (
                  <div className="font-mono text-xs text-slate-500 mt-1.5">{data.nama_kota}</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <StatusBadge status={data.status_realtime} />
                <div className="font-mono text-[10px] text-slate-500 mt-2 leading-relaxed">
                  {data.last_observed_at
                    ? <>Obs: {timeAgo(data.last_observed_at)}</>
                    : <span className="text-slate-700">Belum ada observasi</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Info + Status grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="glass-card p-4">
              <div className="section-title text-sm mb-3">Informasi Stasiun</div>
              <DetailRow label="ID Stasiun"  value={data.id_station} />
              <DetailRow label="Tipe"        value={data.tipe_station?.toUpperCase()} />
              <DetailRow label="Kota"        value={data.nama_kota} />
              <DetailRow label="Latitude"    value={data.latitude?.toFixed(6)} />
              <DetailRow label="Longitude"   value={data.longitude?.toFixed(6)} />
              <DetailRow
                label="Elevasi"
                value={data.elevasi != null ? `${data.elevasi} m dpl` : null}
              />
            </div>

            <div className="glass-card p-4">
              <div className="section-title text-sm mb-3">Status & Waktu</div>
              <DetailRow label="Status Realtime"  value={data.status_realtime ?? 'NO DATA'} />
              <DetailRow label="Interval Deteksi" value={data.interval_detected} />
              <DetailRow
                label="Observasi Terakhir"
                value={data.last_observed_at
                  ? `${formatDateTime(data.last_observed_at)} (${timeAgo(data.last_observed_at)})`
                  : null}
              />
              <DetailRow
                label="Ingest Terakhir"
                value={data.last_ingested_at
                  ? `${formatDateTime(data.last_ingested_at)} (${timeAgo(data.last_ingested_at)})`
                  : null}
              />
            </div>
          </div>

          {/* Observasi — grid 2-3 kolom tergantung layar */}
          <div>
            <div className="section-title mb-3">Data Observasi Terakhir</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(OBS_GROUPS[data.tipe_station] ?? []).map((group) => (
              <ObsGroup key={group.label} group={group} data={data} />
            ))}
            </div>
          </div>

          {/* Raw JSON (dev only) */}
          {import.meta.env.DEV && (
            <details className="glass-card p-4 text-xs font-mono text-slate-500">
              <summary className="cursor-pointer text-slate-400 mb-2">Raw JSON (dev)</summary>
              <pre className="overflow-auto max-h-60">{JSON.stringify(data, null, 2)}</pre>
            </details>
          )}

        </div>
      )}
    </div>
  )
}
