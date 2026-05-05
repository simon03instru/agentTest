const CHAT_STREAM_API_URL =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/ai/chat/stream`
    : null

export async function streamBackendChat(message, history = [], context = {}, onChunk) {
  if (!CHAT_STREAM_API_URL) {
    throw new Error('VITE_API_BASE_URL belum diset.')
  }

  const systemPrompt = buildSystemPrompt(context)

  const response = await fetch(CHAT_STREAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      context,
      systemPrompt,
      session_key: 'bmkg-ai-analyst',
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Chat API error ${response.status}: ${errText}`)
  }

  if (!response.body) {
    throw new Error('Browser tidak mendukung streaming response.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })

    if (chunk && typeof onChunk === 'function') {
      onChunk(chunk)
    }
  }
}

function buildSystemPrompt(context) {
  const {
    totalStations = '?',
    onlineCount = '?',
    offCount = '?',
    delayCount = '?',
    noDataCount = '?',
    currentTime = new Date().toLocaleString('id-ID'),
  } = context || {}

  return `Kamu adalah AI Analyst monitoring stasiun BMKG.

KONTEKS DASHBOARD FRONTEND (${currentTime}):
- Total stasiun: ${totalStations ?? '?'}
- ON: ${onlineCount ?? '?'}
- OFF: ${offCount ?? '?'}
- DELAY: ${delayCount ?? '?'}
- NO DATA: ${noDataCount ?? '?'}

INFRASTRUKTUR:
- User bertanya dari React Chat UI.
- React mengirim pesan ke FastAPI.
- FastAPI meneruskan pesan ke OpenClaw.
- OpenClaw memakai plugin TypeScript monitoring jika pertanyaan terkait data.
- Plugin memanggil API backend existing seperti summary, status, off, latest.
- Jawaban harus berdasarkan JSON dari tool/plugin.

ATURAN JAWABAN:
1. Jawab dalam Bahasa Indonesia.
2. Jika user bertanya tentang monitoring, status stasiun, ARG, AWS, AAWS, ON, OFF, DELAY, NO DATA, summary, atau latest, gunakan plugin/tools monitoring.
3. Jangan mengarang angka.
4. Jika data tidak tersedia, katakan data tidak tersedia.
5. Jawab ringkas, jelas, dan operasional.
6. Untuk daftar stasiun, tampilkan maksimal 10 item kecuali user meminta lebih.`
}