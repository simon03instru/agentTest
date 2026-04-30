/**
 * chatbotService.js
 *
 * Layer abstraksi untuk integrasi chatbot.
 * Saat ini menggunakan mock response untuk development.
 *
 * ─── CARA INTEGRASI OPENCLAW ───────────────────────────────────────────────
 *
 * 1. Ganti BASE_OPENCLAW_URL dengan URL endpoint OpenClaw kamu
 * 2. Sesuaikan payload di fungsi sendMessage() dengan format yang diminta OpenClaw
 * 3. Sesuaikan parsing response di bagian "Parse response"
 *
 * Contoh endpoint OpenClaw yang umum:
 *   POST /api/chat          → kirim pesan, dapat balasan
 *   POST /api/chat/stream   → kirim pesan, dapat streaming balasan (SSE)
 *
 * ───────────────────────────────────────────────────────────────────────────
 */

// Ganti dengan URL OpenClaw kamu
//const OPENCLAW_URL = import.meta.env.VITE_OPENCLAW_URL ?? null
//
//// Ganti dengan API key OpenClaw jika diperlukan
//const OPENCLAW_API_KEY = import.meta.env.VITE_OPENCLAW_API_KEY ?? null

const CHAT_API_URL =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/chat`
    : null

/**
 * Kirim pesan ke chatbot dan dapatkan respons.
 *
 * @param {string}   message         - Pesan dari user
 * @param {Array}    conversationHistory - Array { role: 'user'|'assistant', content: string }
 * @param {object}   context         - Konteks dashboard (status saat ini, dll)
 * @returns {Promise<string>}        - Teks respons dari chatbot
 */
//export async function sendMessage(message, conversationHistory = [], context = {}) {
//  // ── MODE: OpenClaw terintegrasi ──────────────────────────────────────────
//  if (OPENCLAW_URL) {
//    return sendToOpenClaw(message, conversationHistory, context)
//  }
//
//  // ── MODE: Mock untuk development ─────────────────────────────────────────
//  return sendMockResponse(message, context)
//}


export async function sendToBackendChat(message, history, context) {
  const systemPrompt = buildSystemPrompt(context)

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      context,
      systemPrompt,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Chat API error ${response.status}: ${errText}`)
  }

  const data = await response.json()

  return (
    data?.answer ??
    data?.response ??
    data?.message ??
    'Tidak ada respons dari chatbot.'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  OpenClaw integration
// ─────────────────────────────────────────────────────────────────────────────

async function sendToOpenClaw(message, history, context) {
  /**
   * TODO: Sesuaikan payload ini dengan format yang diterima OpenClaw.
   *
   * Contoh payload umum untuk LLM API:
   * {
   *   model: "openclaw-v1",
   *   messages: [
   *     { role: "system", content: systemPrompt },
   *     ...history,
   *     { role: "user", content: message }
   *   ],
   *   temperature: 0.7,
   *   max_tokens: 1000,
   * }
   */

  const systemPrompt = buildSystemPrompt(context)

  const payload = {
    // Sesuaikan field ini dengan API OpenClaw
    model: 'openclaw-v1',              // ganti nama model jika perlu
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ],
    temperature: 0.5,
    max_tokens:  1024,
  }

  const headers = {
    'Content-Type': 'application/json',
  }

  // Tambahkan auth header jika ada API key
  if (OPENCLAW_API_KEY) {
    headers['Authorization'] = `Bearer ${OPENCLAW_API_KEY}`
    // atau: headers['X-API-Key'] = OPENCLAW_API_KEY
  }

  const response = await fetch(OPENCLAW_URL, {
    method:  'POST',
    headers,
    body:    JSON.stringify(payload),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenClaw error ${response.status}: ${errText}`)
  }

  const data = await response.json()

  /**
   * TODO: Sesuaikan cara parse response OpenClaw.
   *
   * Contoh format response umum:
   *   data.choices[0].message.content   ← format OpenAI-compatible
   *   data.response                      ← format custom
   *   data.message.content               ← format lain
   */
  return (
    data?.choices?.[0]?.message?.content ??   // OpenAI-compatible
    data?.response ??                          // custom format
    data?.message?.content ??                  // format lain
    'Tidak ada respons dari OpenClaw.'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  System prompt builder — inject konteks dashboard
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(context) {
  const {
    totalStations  = '?',
    onlineCount    = '?',
    offCount       = '?',
    delayCount     = '?',
    noDataCount    = '?',
    currentTime    = new Date().toLocaleString('id-ID'),
  } = context

  return `Kamu adalah asisten monitoring stasiun cuaca/hidrologi BMKG.
Kamu membantu operator memahami status jaringan stasiun pengamatan.

KONTEKS DASHBOARD SAAT INI (${currentTime}):
- Total stasiun: ${totalStations}
- Online (ON): ${onlineCount}
- Offline (OFF): ${offCount}
- Delay: ${delayCount}
- No Data: ${noDataCount}

Tipe stasiun:
- ARG (Automatic Rain Gauge): mengukur curah hujan
- AWS (Automatic Weather Station): mengukur cuaca umum (suhu, angin, kelembaban, dll)
- AAWS (Agro Automatic Weather Station): AWS untuk keperluan pertanian

Status stasiun:
- ON: data masuk normal sesuai interval
- OFF: stasiun tidak mengirim data, kemungkinan gangguan perangkat/komunikasi
- DELAY: data terlambat masuk melebihi interval normal
- NO DATA: stasiun terdaftar tapi belum pernah ada data (baru dipasang atau belum aktif)

Jawablah dalam Bahasa Indonesia yang jelas dan singkat.
Fokus pada informasi operasional yang relevan untuk monitoring jaringan stasiun.
Jika ditanya data spesifik stasiun yang tidak kamu ketahui, minta operator untuk memeriksa halaman detail stasiun.`
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mock response untuk development (tanpa OpenClaw)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_RESPONSES = [
  (ctx) =>
    `Berdasarkan data dashboard saat ini, terdapat **${ctx.totalStations}** stasiun terdaftar dengan rincian:\n- ✅ Online: ${ctx.onlineCount}\n- ❌ Offline: ${ctx.offCount}\n- ⏳ Delay: ${ctx.delayCount}\n- ○ No Data: ${ctx.noDataCount}`,

  () =>
    `Stasiun dengan status **DELAY** berarti data masuk tapi melebihi interval normalnya. Kemungkinan penyebab:\n1. Gangguan koneksi GPRS/internet di lokasi\n2. Beban server yang tinggi\n3. Gangguan sementara pada perangkat logger`,

  () =>
    `Stasiun ARG (Automatic Rain Gauge) khusus mengukur **curah hujan** menggunakan sensor tipping bucket. AWS mengukur parameter cuaca lengkap, sedangkan AAWS adalah versi AWS yang dikalibrasi untuk kebutuhan **agroklimatologi**.`,

  () =>
    `Untuk stasiun dengan status **NO DATA**, kemungkinan stasiun tersebut baru dipasang dan belum pernah mengirimkan data, atau nomor ID sudah didaftarkan tapi perangkat fisik belum terhubung.`,

  () =>
    `Saya berjalan dalam mode **demo** (OpenClaw belum terhubung). Set variabel \`VITE_OPENCLAW_URL\` di file \`.env.local\` untuk mengaktifkan AI sesungguhnya.`,
]

let mockIdx = 0
async function sendMockResponse(message, context) {
  // Simulasi delay network
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

  const lowerMsg = message.toLowerCase()

  // Simple keyword matching untuk mock yang lebih relevan
  if (lowerMsg.includes('total') || lowerMsg.includes('berapa') || lowerMsg.includes('summary')) {
    return MOCK_RESPONSES[0](context)
  }
  if (lowerMsg.includes('delay')) return MOCK_RESPONSES[1](context)
  if (lowerMsg.includes('arg') || lowerMsg.includes('aws') || lowerMsg.includes('tipe')) {
    return MOCK_RESPONSES[2](context)
  }
  if (lowerMsg.includes('no data') || lowerMsg.includes('nodata')) {
    return MOCK_RESPONSES[3](context)
  }

  // Round-robin untuk pertanyaan lainnya
  const resp = MOCK_RESPONSES[mockIdx % MOCK_RESPONSES.length](context)
  mockIdx++
  return resp
}
