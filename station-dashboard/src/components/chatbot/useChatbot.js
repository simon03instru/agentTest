import { useState, useCallback, useRef } from 'react'
import { sendToBackendChat } from './chatbotService'
import { useSummary } from '@/hooks/useStations'
import { transformSummary } from '@/utils/transformSummary'

/**
 * Hook untuk mengelola state chatbot.
 * Otomatis inject konteks dashboard (summary) ke setiap request.
 */
export function useChatbot() {
  const [messages, setMessages]   = useState([
    {
      id:      'welcome',
      role:    'assistant',
      content: 'Halo! Saya asisten monitoring stasiun. Tanya apa saja tentang status jaringan, tipe stasiun, atau cara membaca data. 👋',
      time:    new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)
  const abortRef                  = useRef(null)

  // Ambil konteks dashboard dari summary
  const { data: rawSummary } = useSummary()
  const summary = rawSummary ? transformSummary(rawSummary) : {}
  const dashboardContext = {
    totalStations: summary.grand_total,
    onlineCount:   summary.by_status?.ON,
    offCount:      summary.by_status?.OFF,
    delayCount:    summary.by_status?.DELAY,
    noDataCount:   summary.by_status?.['NO DATA'],
    currentTime:   new Date().toLocaleString('id-ID'),
  }

  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    const userMsg = {
      id:      `u-${Date.now()}`,
      role:    'user',
      content: text.trim(),
      time:    new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      // Kirim history (tanpa pesan welcome) ke API
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content }) => ({ role, content }))

      const response = await sendToBackendChat(text.trim(), history, dashboardContext)

      const assistantMsg = {
        id:      `a-${Date.now()}`,
        role:    'assistant',
        content: response,
        time:    new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(err.message ?? 'Gagal mendapatkan respons.')
      setMessages((prev) => [
        ...prev,
        {
          id:      `err-${Date.now()}`,
          role:    'assistant',
          content: '⚠ Gagal mendapatkan respons. Coba lagi.',
          time:    new Date(),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, dashboardContext])

  const clear = useCallback(() => {
    setMessages([
      {
        id:      'welcome',
        role:    'assistant',
        content: 'Percakapan direset. Ada yang ingin ditanyakan? 👋',
        time:    new Date(),
      },
    ])
    setError(null)
  }, [])

  return { messages, isLoading, error, send, clear }
}
