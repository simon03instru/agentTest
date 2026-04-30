/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0a0f1a',
          1: '#111827',
          2: '#1a2235',
          3: '#1e2d45',
        },
        accent: {
          DEFAULT: '#00d4ff',
          dim: '#00d4ff22',
          glow: '#00d4ff44',
        },
        status: {
          on:      '#22c55e',
          off:     '#ef4444',
          delay:   '#f59e0b',
          nodata:  '#6b7280',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,212,255,0.15)',
        'glow-sm': '0 0 10px rgba(0,212,255,0.10)',
        'status-on':    '0 0 12px rgba(34,197,94,0.40)',
        'status-off':   '0 0 12px rgba(239,68,68,0.40)',
        'status-delay': '0 0 12px rgba(245,158,11,0.40)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
