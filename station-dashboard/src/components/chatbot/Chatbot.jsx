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
        <RenderContent content={msg.content} />
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
