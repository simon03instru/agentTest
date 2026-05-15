/**
 * src/components/auth/AuthLayout.jsx  ← FILE BARU
 *
 * Layout wrapper dan komponen UI yang dipakai bersama
 * oleh Login, Register, ForgotPassword, ResetPassword.
 */
import { Link } from 'react-router-dom'
import clsx from 'clsx'

/** Wrapper halaman auth — background + centered card */
export function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: "url(/images/bmkg.jpeg)",
      }}
    >
      {/* Overlay gelap seluruh background */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Efek gradient tambahan */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(
              ellipse 80% 50% at 80% 20%,
              rgba(0,212,255,0.12),
              transparent 100%
            ),
            linear-gradient(
              to right,
              rgba(0,0,0,0.5),
              rgba(0,0,0,0.2)
            )
          `,
        }}
      />

      {/* Branding kiri atas */}
      <div className="absolute top-8 left-8 z-10 text-white max-w-md">
        <div className="flex items-center gap-4">

          {/* Logo/Icon */}
          <div
            className="w-12 h-12 flex items-center justify-center"
          >
              <img
                src="/images/logobmkg.png"
                alt="BMKG"
                className="w-15 h-15 object-contain"
              />
          </div>

          {/* Text */}
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide leading-none">
              STATION MONITORING
            </h1>

            <p className="text-sm text-slate-300 mt-1">
              BMKG Realtime Monitoring System
            </p>
          </div>
        </div>
      </div>

      {/* Area login kanan */}
      <div className="relative z-10 min-h-screen flex items-center justify-end px-6 lg:px-20">
        <div className="w-full max-w-md animate-fade-in">
          <div
            className="p-8 rounded-2xl border border-white/10 shadow-2xl
                       bg-surface/90 backdrop-blur-xl"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Input field dengan label */
export function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="label-mono text-[11px]">{label}</label>
      {children}
      {error && (
        <p className="font-mono text-[11px] text-status-off">{error}</p>
      )}
    </div>
  )
}

/** Input standar */
export function AuthInput({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full px-4 py-2.5 rounded-xl text-sm font-mono',
        'bg-surface-2 border border-white/10 text-slate-200',
        'placeholder-slate-600 outline-none',
        'focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
        'disabled:opacity-50 transition-all duration-150',
        className
      )}
      {...props}
    />
  )
}

/** Submit button */
export function AuthButton({ isLoading, children, className, ...props }) {
  return (
    <button
      disabled={isLoading}
      className={clsx(
        'w-full py-2.5 rounded-xl font-mono text-sm font-medium',
        'bg-accent/20 border border-accent/40 text-accent',
        'hover:bg-accent/30 disabled:opacity-50 disabled:cursor-wait',
        'transition-all duration-150 flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

/** Alert box untuk error / success */
export function AuthAlert({ type = 'error', children }) {
  return (
    <div className={clsx(
      'px-4 py-3 rounded-xl font-mono text-xs border',
      type === 'error'
        ? 'bg-status-off/10 border-status-off/30 text-status-off'
        : 'bg-status-on/10 border-status-on/30 text-status-on'
    )}>
      {children}
    </div>
  )
}

/** Divider dengan teks */
export function AuthDivider({ text }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 border-t border-white/8" />
      {text && <span className="label-mono text-[10px]">{text}</span>}
      <div className="flex-1 border-t border-white/8" />
    </div>
  )
}
