/**
 * Modal Export Data → GET /station/export/excel (blob) → download otomatis .xlsx
 * Dirender lewat portal karena header memakai backdrop-blur (membuat `fixed`
 * anak-anaknya relatif terhadap header, bukan layar).
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { exportStationsExcel } from '@/api/stations'
import { useCascadingFilters, FILTER_LEVELS } from '@/hooks/useCascadingFilters'
import { downloadBlob } from '@/utils/downloadBlob'
import FilterSelect from '@/components/filter/FilterSelect'

const LEVEL_UI = {
  balai:    { label: 'Balai',                allLabel: 'Semua Balai' },
  provinsi: { label: 'Provinsi',             allLabel: 'Semua Provinsi' },
  upt:      { label: 'UPT Penanggung Jawab', allLabel: 'Semua UPT' },
  kota:     { label: 'Kota / Kabupaten',     allLabel: 'Semua Kota' },
}

/** YYYY-MM-DD menurut jam lokal (toISOString() memakai UTC → bisa mundur sehari di WIB). */
function todayLocal() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function friendlyError(err) {
  const msg = err?.message ?? ''
  if (/timeout/i.test(msg))        return 'Pembuatan file terlalu lama. Coba persempit filter (mis. pilih UPT) lalu ulangi.'
  if (/network error/i.test(msg))  return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.'
  return msg || 'Gagal mengunduh file Excel.'
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function ExportModal({ onClose }) {
  const cascade = useCascadingFilters()
  const { values, options, loading: optLoading, loadingFrom, error: optError, setLevel, retry } = cascade

  const [tanggal,   setTanggal]   = useState(todayLocal)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(null)

  const close = () => { if (!isLoading) onClose() }

  // Esc untuk menutup
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !isLoading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLoading, onClose])

  const scope = values.balai || values.provinsi || values.upt || values.kota
    ? FILTER_LEVELS.map((l) => values[l]).filter(Boolean).join(' › ')
    : 'Nasional (semua stasiun)'

  const handleDownload = async () => {
    if (!tanggal) { setError('Pilih tanggal terlebih dahulu.'); return }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const blob = await exportStationsExcel({ tanggal, ...values })
      if (!blob || blob.size === 0) throw new Error('File yang diterima kosong.')

      // Nama file sama dengan yang dibuat backend: Export_Observasi_<area>_<tanggal>.xlsx
      const area = (values.balai || values.provinsi || values.upt || values.kota || 'Nasional')
        .replace(/[\s/\\]+/g, '_')
      const filename = `Export_Observasi_${area}_${tanggal}.xlsx`

      downloadBlob(blob, filename)
      setSuccess(`File "${filename}" berhasil diunduh.`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="glass-card flex max-h-[90vh] w-full max-w-md flex-col border-white/10 !bg-surface-1 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <h2 id="export-modal-title" className="section-title !text-base">Export Data Observasi</h2>
          <button
            onClick={close}
            disabled={isLoading}
            aria-label="Tutup"
            className="rounded px-2 font-mono text-sm text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block">
            <div className="label-mono mb-1.5">Tanggal</div>
            <input
              type="date"
              value={tanggal}
              max={todayLocal()}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isLoading}
              style={{ colorScheme: 'dark' }}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2
                         font-mono text-xs text-slate-200 outline-none transition
                         focus:border-cyan-400/40 disabled:opacity-50"
            />
          </label>

          {optError && (
            <div className="rounded-lg border border-status-off/30 bg-status-off/10 p-2.5 font-mono text-[11px] text-status-off">
              ⚠ {optError}
              <button onClick={retry} className="ml-2 underline hover:text-white">Coba lagi</button>
            </div>
          )}

          {FILTER_LEVELS.map((level, idx) => (
            <FilterSelect
              key={level}
              label={LEVEL_UI[level].label}
              allLabel={LEVEL_UI[level].allLabel}
              value={values[level]}
              options={options[level]}
              onChange={(v) => setLevel(level, v)}
              disabled={isLoading || (optLoading && idx > loadingFrom)}
              busy={optLoading && idx > loadingFrom}
            />
          ))}

          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 font-mono text-[11px] text-slate-400">
            Cakupan: <span className="text-slate-200">{scope}</span>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-status-off/30 bg-status-off/10 p-3 font-mono text-xs text-status-off">
              ⚠ {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-lg border border-status-on/30 bg-status-on/10 p-3 font-mono text-xs text-status-on">
              ✓ {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-white/5 px-5 py-3">
          <button
            onClick={close}
            disabled={isLoading}
            className="rounded-lg border border-white/10 px-4 py-2 font-mono text-xs text-slate-300
                       transition hover:bg-white/10 disabled:opacity-40"
          >
            Tutup
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-4 py-2
                       font-mono text-xs text-accent transition hover:bg-accent/25
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (<><Spinner /> Menyiapkan file…</>) : '⬇ Download Excel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
