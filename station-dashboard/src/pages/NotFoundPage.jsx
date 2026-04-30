import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="font-display text-8xl font-bold text-white/5">404</div>
      <div className="font-mono text-slate-400 text-sm">Halaman tidak ditemukan</div>
      <button
        onClick={() => navigate('/')}
        className="mt-2 px-4 py-2 rounded-lg font-mono text-sm text-accent
                   border border-accent/30 hover:bg-accent/10 transition-all"
      >
        ← Kembali ke Dashboard
      </button>
    </div>
  )
}
