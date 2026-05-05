import { useState, useCallback, useMemo } from 'react'
import { streamBackendChat } from './chatbotService'
import { useSummary } from '@/hooks/useStations'
import { transformSummary } from '@/utils/transformSummary'

export function useChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya AI Analyst monitoring stasiun. Tanya status jaringan, summary, OFF, DELAY, NO DATA, atau detail stasiun. 👋',
      time: new Date(),
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const { data: rawSummary } = useSummary()
  const summary = rawSummary ? transformSummary(rawSummary) : {}

  const dashboardContext = useMemo(() => {
    return {
      totalStations: summary?.grand_total ?? null,
      onlineCount: summary?.by_status?.ON ?? null,
      offCount: summary?.by_status?.OFF ?? null,
      delayCount: summary?.by_status?.DELAY ?? null,
      noDataCount: summary?.by_status?.['NO DATA'] ?? null,
      currentTime: new Date().toLocaleString('id-ID'),
    }
  }, [summary])

  const send = useCallback(
    async (text) => {
      if (!text?.trim() || isLoading) return

      const cleanText = text.trim()
      const now = Date.now()
      const userId = `u-${now}`
      const assistantId = `a-${now}`

      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content }) => ({ role, content }))

      const userMsg = {
        id: userId,
        role: 'user',
        content: cleanText,
        time: new Date(),
      }

      const assistantMsg = {
        id: assistantId,
        role: 'assistant',
        content: '',
        time: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)
      setError(null)

      try {
        await streamBackendChat(
          cleanText,
          history,
          dashboardContext,
          (chunk) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: msg.content + chunk,
                    }
                  : msg
              )
            )
          }
        )

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId && !msg.content.trim()
              ? {
                  ...msg,
                  content: 'Tidak ada respons dari AI Analyst.',
                }
              : msg
          )
        )
      } catch (err) {
        const errorMessage =
          err?.message || 'Gagal mendapatkan respons dari AI Analyst.'

        setError(errorMessage)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    '⚠ Gagal mendapatkan respons. Pastikan FastAPI, OpenClaw, dan plugin monitoring sudah berjalan.',
                  time: new Date(),
                  isError: true,
                }
              : msg
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, dashboardContext]
  )

  const clear = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Percakapan direset. Silakan tanya tentang summary, status OFF, DELAY, NO DATA, atau detail stasiun. 👋',
        time: new Date(),
      },
    ])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    send,
    clear,
  }
}