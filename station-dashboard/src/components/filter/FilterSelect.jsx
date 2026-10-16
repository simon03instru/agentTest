/** Dropdown generik bergaya dashboard (dipakai sidebar & export modal). */
export default function FilterSelect({
  label, value, options = [], onChange, allLabel = 'Semua', disabled = false, busy = false,
}) {
  return (
    <label className="block">
      <div className="label-mono mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        {busy && <span className="normal-case tracking-normal text-[10px] text-accent/70">memuat…</span>}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2
                   font-mono text-xs text-slate-200 outline-none transition
                   focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" className="bg-slate-900 text-slate-200">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900 text-slate-200">{opt}</option>
        ))}
      </select>
    </label>
  )
}
