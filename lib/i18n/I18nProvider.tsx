'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Locale } from './config'

type Messages = Record<string, any>

interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getNested(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) return acc[key]
    return undefined
  }, obj)
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Messages
  children: ReactNode
}) {
  const t = (key: string, params?: Record<string, string | number>) => {
    let value = getNested(messages, key)
    if (typeof value !== 'string') return key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return value
  }

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
