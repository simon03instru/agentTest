// Ganti BASE_URL sesuai environment production kamu
// Development: pakai proxy Vite (/api → localhost:8000)
// Production: langsung ke URL backend

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const REFRESH_INTERVALS = {
  SUMMARY: 60_000,   //  60s
  MAP:     30_000,   //  30s
  OFF:     120_000,  //  120s
  STATUS:  45_000,   //  45s
  DETAIL:  20_000,   //  20s
}

export const STATUS = {
  ON:      'ON',
  OFF:     'OFF',
  DELAY:   'DELAY',
  NO_DATA: 'NO DATA',
}

export const STATUS_COLOR = {
  ON:      '#22c55e',
  OFF:     '#ef4444',
  DELAY:   '#f59e0b',
  'NO DATA': '#6b7280',
}

export const STATION_TYPES = ['ARG', 'AWS', 'AAWS']
