const CHAT_API_URL =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/chat/query`
    : null

/**
 * Kirim pesan chatbot ke backend LangChain FastAPI
 *
 * @param {string} message
 * @param {Array} history
 * @param {Object} context
 * @returns {Promise<string>}
 */
export async function sendBackendChat(
  message,
  history = [],
  context = {}
) {
  if (!CHAT_API_URL) {
    throw new Error('VITE_API_BASE_URL belum diset.')
  }

  if (!message?.trim()) {
    throw new Error('Pesan kosong.')
  }

  const payload = {
    message: message.trim(),

    history: Array.isArray(history)
      ? history.map((item) => ({
          role: item.role,
          content: item.content,
        }))
      : [],

    context: {
      totalStations: context?.totalStations ?? null,
      onlineCount: context?.onlineCount ?? null,
      offCount: context?.offCount ?? null,
      delayCount: context?.delayCount ?? null,
      noDataCount: context?.noDataCount ?? null,
      currentTime:
        context?.currentTime ||
        new Date().toLocaleString('id-ID'),
    },

    session_id: 'bmkg-ai-analyst',
  }

  let response

  try {
    response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    throw new Error(
      'Tidak dapat terhubung ke server chatbot.'
    )
  }

  if (!response.ok) {
    let errorText = ''

    try {
      errorText = await response.text()
    } catch {
      errorText = 'Unknown backend error'
    }

    throw new Error(
      `Chat API error ${response.status}: ${errorText}`
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error('Response chatbot tidak valid.')
  }

  if (!data?.answer) {
    throw new Error('Jawaban chatbot kosong.')
  }

  return data.answer
}