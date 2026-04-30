import { createContext, useContext, useState, useCallback } from 'react'

export const FetchingContext = createContext({ count: 0, increment: () => {}, decrement: () => {} })

export function FetchingProvider({ children }) {
  const [count, setCount] = useState(0)
  const increment = useCallback(() => setCount((c) => c + 1), [])
  const decrement = useCallback(() => setCount((c) => Math.max(0, c - 1)), [])
  return (
    <FetchingContext.Provider value={{ count, increment, decrement }}>
      {children}
    </FetchingContext.Provider>
  )
}

export function useFetchingCount() {
  return useContext(FetchingContext).count
}
