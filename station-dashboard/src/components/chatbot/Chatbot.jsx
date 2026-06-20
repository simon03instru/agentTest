import { useState, useRef, useEffect } from 'react'
import { useChatbot } from './useChatbot'
import clsx from 'clsx'

// ── Simple markdown-like renderer (bold, bullet, newline) ──────────────────
function RenderContent({ content }) {
  if (!content) return null

  // Split per baris
  const lines = content.split('\n')

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Bullet list
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-accent shrink-0 mt-0.5">·</span>
              <span dangerouslySetInnerHTML={{ __html: parseBold(line.slice(2)) }} />
            </div>
          )
        }

        // Numbered list
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-slate-500 shrink-0 font-mono text-[10px] mt-0.5">
                {line.match(/^\d+/)[0]}.
              </span>
              <span dangerouslySetInnerHTML={{ __html: parseBold(line.replace(/^\d+\.\s*/, '')) }} />
            </div>
          )
        }

        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
        )
      })}
    </div>
  )
}

function parseBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function hexToRgba(hex, alpha = 1) {
  const cleaned = hex.replace('#', '')
  const value = cleaned.length === 3
    ? cleaned.split('').map((ch) => ch + ch).join('')
    : cleaned

  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function sanitizeFilenamePart(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
}

function exportChartJSON(chart) {
  const filename = `${sanitizeFilenamePart(chart?.title || 'chart') || 'chart'}.json`
  const payload = JSON.stringify(chart, null, 2)
  downloadBlob(new Blob([payload], { type: 'application/json;charset=utf-8;' }), filename)
}

function exportChartCSV(chart) {
  const labels = Array.isArray(chart?.labels) ? chart.labels : []
  const series = Array.isArray(chart?.series) ? chart.series : []
  if (!labels.length || !series.length) return

  const header = ['label', ...series.map((s, idx) => s?.name || `series_${idx + 1}`)]
  const rows = [header.join(',')]

  labels.forEach((label, idx) => {
    const cells = [
      `"${String(label).replaceAll('"', '""')}"`,
      ...series.map((s) => {
        const value = s?.data?.[idx]
        return value == null ? '' : String(value)
      }),
    ]
    rows.push(cells.join(','))
  })

  const filename = `${sanitizeFilenamePart(chart?.title || 'chart') || 'chart'}.csv`
  downloadBlob(new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' }), filename)
}

function buildChartSvg(chart) {
  const { title, chart_type: chartType = 'bar', labels = [], series = [], summary } = chart || {}
  const colors = ['#00d4ff', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444']
  const width = 1200
  const height = 720
  const pad = { top: 90, right: 50, bottom: 110, left: 90 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const max = Math.max(...series.flatMap((s) => s.data || []), 1)
  const safeTitle = escapeXml(title || 'Chart')
  const safeSummary = summary ? escapeXml(summary) : ''

  if (chartType === 'stacked_bar') {
    const rowGap = labels.length > 8 ? 12 : 18
    const barH = Math.max(14, (plotH - rowGap * (labels.length - 1)) / Math.max(labels.length, 1))

    const rows = labels.map((label, idx) => {
      const values = series.map((s) => Number(s?.data?.[idx] ?? 0))
      const total = values.reduce((sum, v) => sum + v, 0) || 1
      let x = pad.left
      const segments = values.map((value, i) => {
        const w = (value / total) * plotW
        const seg = `<rect x="${x}" y="${pad.top + idx * (barH + rowGap)}" width="${Math.max(w, 0)}" height="${barH}" rx="8" fill="${colors[i % colors.length]}"/>`
        x += w
        return seg
      }).join('')

      return `
        <text x="${pad.left - 12}" y="${pad.top + idx * (barH + rowGap) + barH / 2 + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="18" fill="#94a3b8">${escapeXml(label)}</text>
        <text x="${width - pad.right + 8}" y="${pad.top + idx * (barH + rowGap) + barH / 2 + 4}" font-family="IBM Plex Mono, monospace" font-size="18" fill="#94a3b8">${total}</text>
        ${segments}
      `
    }).join('')

    const legendY = height - 34
    const legend = series.map((s, i) => `
      <rect x="${pad.left + i * 190}" y="${legendY - 12}" width="12" height="12" rx="6" fill="${colors[i % colors.length]}"/>
      <text x="${pad.left + i * 190 + 18}" y="${legendY - 2}" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${escapeXml(s?.name || `S${i + 1}`)}</text>
    `).join('')

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#0b1220"/>
        <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="28" fill="#0f172a" stroke="${hexToRgba('#00d4ff', 0.18)}"/>
        <text x="${pad.left}" y="54" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${safeTitle}</text>
        ${safeSummary ? `<text x="${pad.left}" y="78" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${safeSummary}</text>` : ''}
        ${rows}
        ${legend}
      </svg>
    `
  }

  if (chartType === 'line') {
    const chartHeight = plotH - 36

    const grids = Array.from({ length: 5 }, (_, i) => {
      const y = pad.top + (chartHeight / 4) * i
      const val = Math.round(max - (max / 4) * i)
      return `
        <line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="rgba(255,255,255,0.06)"/>
        <text x="${pad.left - 12}" y="${y + 5}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="16" fill="#64748b">${val}</text>
      `
    }).join('')

    const lines = series.map((s, idx) => {
      const points = (s?.data || []).map((value, i) => {
        const x = pad.left + (labels.length <= 1 ? plotW / 2 : (plotW * i) / Math.max(labels.length - 1, 1))
        const y = pad.top + chartHeight - ((Number(value) || 0) / max) * chartHeight
        return `${x},${y}`
      }).join(' ')
      const fill = hexToRgba(colors[idx % colors.length], 0.12)
      return `
        <polyline points="${points}" fill="none" stroke="${colors[idx % colors.length]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <polygon points="${pad.left},${pad.top + chartHeight} ${points} ${width - pad.right},${pad.top + chartHeight}" fill="${fill}"/>
      `
    }).join('')

    const xLabels = labels.map((label, i) => {
      const x = pad.left + (labels.length <= 1 ? plotW / 2 : (plotW * i) / Math.max(labels.length - 1, 1))
      return `<text x="${x}" y="${height - 52}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${escapeXml(label)}</text>`
    }).join('')

    const legend = series.map((s, i) => `
      <rect x="${pad.left + i * 220}" y="${height - 28}" width="12" height="12" rx="6" fill="${colors[i % colors.length]}"/>
      <text x="${pad.left + i * 220 + 18}" y="${height - 18}" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${escapeXml(s?.name || `S${i + 1}`)}</text>
    `).join('')

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#0b1220"/>
        <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="28" fill="#0f172a" stroke="${hexToRgba('#00d4ff', 0.18)}"/>
        <text x="${pad.left}" y="54" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${safeTitle}</text>
        ${safeSummary ? `<text x="${pad.left}" y="78" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${safeSummary}</text>` : ''}
        ${grids}
        ${lines}
        ${xLabels}
        ${legend}
      </svg>
    `
  }

  const barWidth = labels.length ? Math.min(70, plotW / (labels.length * 1.5)) : 70
  const gap = labels.length ? (plotW - barWidth * labels.length) / Math.max(labels.length, 1) : 40
  const bars = labels.map((label, idx) => {
    const value = Number(series[0]?.data?.[idx] ?? 0)
    const h = (value / max) * plotH
    const x = pad.left + idx * (barWidth + gap)
    const y = pad.top + plotH - h
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="10" fill="${colors[0]}"/>
      <text x="${x + barWidth / 2}" y="${height - 52}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${escapeXml(label)}</text>
      <text x="${x + barWidth / 2}" y="${Math.max(y - 8, 64)}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#e2e8f0">${value}</text>
    `
  }).join('')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#0b1220"/>
      <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="28" fill="#0f172a" stroke="${hexToRgba('#00d4ff', 0.18)}"/>
      <text x="${pad.left}" y="54" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${safeTitle}</text>
      ${safeSummary ? `<text x="${pad.left}" y="${78}" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">${safeSummary}</text>` : ''}
      ${bars}
    </svg>
  `
}

async function exportChartPng(chart) {
  const svg = buildChartSvg(chart)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()

  try {
    const loaded = await new Promise((resolve, reject) => {
      img.onload = () => resolve(true)
      img.onerror = reject
      img.src = url
    })

    if (!loaded) return

    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return
      const filename = `${sanitizeFilenamePart(chart?.title || 'chart') || 'chart'}.png`
      downloadBlob(pngBlob, filename)
    }, 'image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function extractChartPayload(content) {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && ('text' in parsed || 'chart' in parsed || 'chart_svg' in parsed)) {
      return {
        text: parsed.text || '',
        chart: parsed.chart || null,
        chart_svg: parsed.chart_svg || null,
      }
    }
  } catch {
    // fall through to legacy marker parsing
  }

  const match = content.match(/\[\[chart\]\]\s*([\s\S]*?)\s*\[\[\/chart\]\]/)
  if (!match) return { text: content, chart: null, chart_svg: null }

  try {
    const chart = JSON.parse(match[1])
    const text = content.replace(match[0], '').trim()
    return { text, chart, chart_svg: null }
  } catch {
    return { text: content, chart: null, chart_svg: null }
  }
}

function ChartBlock({ chart, chartSvg }) {
  if (chartSvg) {
    return (
      <div className="mt-3 rounded-xl border border-accent/20 bg-surface-1/80 p-2">
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSvg)}`} alt={chart?.title || 'chart'} className="w-full rounded-lg" />
      </div>
    )
  }

  if (!chart) return null

  const { title, chart_type: chartType = 'bar', labels = [], series = [], summary } = chart
  const colors = ['#00d4ff', '#a78bfa', '#22c55e', '#f59e0b', '#ef4444']
  const max = Math.max(...series.flatMap((s) => s.data || []), 1)

  if (chartType === 'stacked_bar') {
    return (
      <div className="mt-3 rounded-xl border border-accent/20 bg-surface-1/80 p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white">{title}</div>
            {summary && <div className="text-[10px] text-slate-400 mt-1">{summary}</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => exportChartCSV(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download data CSV"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportChartJSON(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download data JSON"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => exportChartPng(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download chart PNG"
            >
              PNG
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {labels.map((label, idx) => {
            const values = series.map((s) => s.data?.[idx] || 0)
            const total = values.reduce((sum, v) => sum + v, 0)
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{label}</span>
                  <span>{total}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden bg-surface-3 flex">
                  {values.map((value, i) => (
                    <div
                      key={i}
                      className="h-full"
                      style={{ width: `${(value / Math.max(total, 1)) * 100}%`, background: colors[i % colors.length] }}
                      title={`${series[i]?.name || `S${i + 1}`}: ${value}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
          {series.map((s, i) => (
            <span key={s.name || i} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (chartType === 'line') {
    return (
      <div className="mt-3 rounded-xl border border-accent/20 bg-surface-1/80 p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white">{title}</div>
            {summary && <div className="text-[10px] text-slate-400 mt-1">{summary}</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => exportChartCSV(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download data CSV"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportChartJSON(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download data JSON"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => exportChartPng(chart)}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
              title="Download chart PNG"
            >
              PNG
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {series.map((s, idx) => (
            <div key={s.name || idx} className="rounded-lg bg-surface-2 border border-white/5 p-2">
              <div className="text-[10px] font-mono uppercase text-slate-500">{s.name}</div>
              <div className="mt-1 text-sm text-white">{s.data?.at(-1) ?? 0}</div>
              <div className="mt-2 flex items-end gap-1 h-16">
                {(s.data || []).map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{ height: `${(value / max) * 100}%`, background: colors[idx % colors.length] }}
                    title={`${labels[i] || i}: ${value}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-500">
          {labels.map((label) => (
            <div key={label} className="truncate">{label}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-surface-1/80 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-white">{title}</div>
          {summary && <div className="text-[10px] text-slate-400 mt-1">{summary}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => exportChartCSV(chart)}
            className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
            title="Download data CSV"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportChartJSON(chart)}
            className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
            title="Download data JSON"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => exportChartPng(chart)}
            className="rounded-md border border-white/10 bg-surface-2 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-accent/30 hover:text-accent transition-colors"
            title="Download chart PNG"
          >
            PNG
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {labels.map((label, idx) => {
          const value = series[0]?.data?.[idx] ?? 0
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(value / max) * 100}%`, background: colors[0] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', provider: 'gemini' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'openai' },
  { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano', provider: 'openai' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'openai' },
]

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}

// ── Bubble per pesan ────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const timeStr = msg.time?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const { text, chart, chart_svg: chartSvg } = isUser ? { text: msg.content, chart: null, chart_svg: null } : extractChartPayload(msg.content || '')

  return (
    <div className={clsx('flex gap-2 animate-slide-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30
                        flex items-center justify-center shrink-0 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="2" fill="#00d4ff"/>
            <circle cx="5" cy="5" r="4" stroke="#00d4ff" strokeWidth="0.8" opacity="0.4"/>
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed',
        isUser
          ? 'bg-accent/15 border border-accent/20 text-slate-200 rounded-tr-sm'
          : msg.isError
            ? 'bg-status-off/10 border border-status-off/20 text-status-off rounded-tl-sm'
            : 'bg-surface-2 border border-white/5 text-slate-300 rounded-tl-sm'
      )}>
        <RenderContent content={text} />
        {(chart || chartSvg) && <ChartBlock chart={chart} chartSvg={chartSvg} />}
        <div className={clsx(
          'font-mono text-[9px] mt-1.5',
          isUser ? 'text-accent/40 text-right' : 'text-slate-600'
        )}>
          {timeStr}
        </div>
      </div>
    </div>
  )
}

// ── Suggested questions ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Berapa total stasiun saat ini?',
  'Apa penyebab stasiun DELAY?',
  'Apa beda ARG, AWS, dan AAWS?',
  'Kenapa ada status NO DATA?',
]

// ── Main Chatbot component ──────────────────────────────────────────────────
export default function Chatbot() {
  const [isOpen, setIsOpen]       = useState(false)
  const [input, setInput]         = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite')
  const selectedOption = MODEL_OPTIONS.find((opt) => opt.value === selectedModel) ?? MODEL_OPTIONS[0]
  const { messages, isLoading, send, clear } = useChatbot(selectedModel)
  const user = JSON.parse(localStorage.getItem('user'))
  const canAccessChat =
    user?.role === 'admin' ||
    user?.role === 'superadmin'

  if (!canAccessChat) return null
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  // Auto-scroll ke bawah saat pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input saat panel dibuka
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen])

  const handleSend = () => {
    if (!input.trim()) return
    send(input)
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (q) => {
    send(q)
  }

  return (
    <>
      {/* ── Floating panel ── */}
      <div className={clsx(
        'fixed bottom-20 right-4 z-[1100] flex flex-col',
        'w-[340px] sm:w-[380px]',
        'glass-card border border-white/8 shadow-2xl shadow-black/50',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )} style={{ maxHeight: 'calc(100vh - 120px)', height: 520 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30
                            flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="2.5" fill="#00d4ff"/>
                <circle cx="6.5" cy="6.5" r="5.5" stroke="#00d4ff" strokeWidth="0.8" opacity="0.3"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="font-display text-xs font-semibold text-white">
                  Station Assistant
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-surface-2 border border-white/10 text-[10px] text-slate-300 rounded-md px-1.5 py-0.5 outline-none focus:border-accent/40"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="font-mono text-[9px] text-slate-500 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-status-on animate-pulse-slow" />
                {selectedOption.label} aktif · {selectedOption.provider.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clear}
              title="Reset percakapan"
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-300
                         hover:bg-white/5 flex items-center justify-center
                         transition-all duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 6A4 4 0 1 1 6 2V1M6 1L8 3M6 1L4 3"
                      stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-300
                         hover:bg-white/5 flex items-center justify-center
                         transition-all duration-150"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30
                              flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="bg-surface-2 border border-white/5 rounded-2xl rounded-tl-sm">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions — tampil hanya kalau hanya 1 pesan (welcome) */}
        {messages.length === 1 && (
          <div className="px-3 pb-2 shrink-0">
            <div className="label-mono mb-1.5 text-[9px]">Pertanyaan umum</div>
            <div className="flex flex-wrap gap-1">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-[10px] font-mono text-slate-400 hover:text-accent
                             bg-surface-2 hover:bg-accent/10 border border-white/8
                             hover:border-accent/25 rounded-lg px-2 py-1
                             transition-all duration-150 text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="px-3 pb-3 pt-2 border-t border-white/5 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tanya tentang status stasiun…"
              disabled={isLoading}
              className="flex-1 resize-none bg-surface-2 border border-white/10 rounded-xl
                         px-3 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono
                         focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                         disabled:opacity-50 transition-all duration-150
                         min-h-[36px] max-h-[100px]"
              style={{ fieldSizing: 'content' }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                'transition-all duration-150',
                input.trim() && !isLoading
                  ? 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30'
                  : 'bg-surface-2 border border-white/10 text-slate-600 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 12L12 6.5L1 1v4.5l7 2-7 2V12z"
                        fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
          <div className="mt-1.5 font-mono text-[9px] text-slate-700 text-center">
            Enter untuk kirim · Shift+Enter untuk baris baru
          </div>
        </div>
      </div>

      {/* ── FAB Toggle button ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={clsx(
          'fixed bottom-4 right-4 z-[1100]',
          'w-12 h-12 rounded-2xl',
          'flex items-center justify-center',
          'transition-all duration-200 shadow-lg',
          isOpen
            ? 'bg-surface-2 border border-white/10 text-slate-400 hover:text-white'
            : 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shadow-glow-sm'
        )}
        title={isOpen ? 'Tutup asisten' : 'Buka asisten'}
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-4 3V4z"
                  fill="currentColor" opacity="0.9"/>
            <circle cx="6" cy="7.5" r="1" fill="#0a0f1a"/>
            <circle cx="9" cy="7.5" r="1" fill="#0a0f1a"/>
            <circle cx="12" cy="7.5" r="1" fill="#0a0f1a"/>
          </svg>
        )}
        {/* Unread indicator — muncul saat panel tutup dan ada pesan baru */}
        {!isOpen && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full
                          bg-accent border-2 border-surface animate-pulse-slow" />
        )}
      </button>
    </>
  )
}
