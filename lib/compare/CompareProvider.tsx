'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'cugm:compare:v1'
const MAX_ITEMS = 3

type CompareItem = {
  id: number
  slug: string
  title: string
  cover?: string | null
}

type CompareContextValue = {
  items: CompareItem[]
  add: (item: CompareItem) => boolean
  remove: (id: number) => void
  has: (id: number) => boolean
  clear: () => void
  max: number
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      /* localStorage olmayabilir */
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* sessizce yok say */
    }
  }, [items])

  const add = useCallback((item: CompareItem) => {
    let accepted = false
    setItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev
      if (prev.length >= MAX_ITEMS) {
        accepted = false
        return prev
      }
      accepted = true
      return [...prev, item]
    })
    return accepted
  }, [])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const has = useCallback((id: number) => items.some((x) => x.id === id), [items])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CompareContextValue>(
    () => ({ items, add, remove, has, clear, max: MAX_ITEMS }),
    [items, add, remove, has, clear]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
