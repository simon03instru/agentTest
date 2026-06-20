import { useState, useCallback, useMemo, useRef } from 'react'
import { sendBackendChat } from './chatbotService'
import { useSummary } from '@/hooks/useStations'
import { transformSummary } from '@/utils/transformSummary'

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `web-chat-${crypto.randomUUID()}`
  }

  return `web-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useChatbot(selectedModel = 'gemini-2.5-flash-lite') {
  const sessionIdRef = useRef(createSessionId())

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

  const selectedProvider = selectedModel.startsWith('gpt-') ? 'openai' : 'gemini'

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
        const response = await sendBackendChat(
          cleanText,
          history,
          dashboardContext,
          selectedProvider,
          selectedModel,
          sessionIdRef.current
        )

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: JSON.stringify(response),
                  time: new Date(),
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
                    '⚠ Gagal mendapatkan respons. Pastikan FastAPI dan service LangChain chatbot sudah berjalan.',
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
    [messages, isLoading, dashboardContext, selectedProvider, selectedModel]
  )

  const clear = useCallback(() => {
    sessionIdRef.current = createSessionId()

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
