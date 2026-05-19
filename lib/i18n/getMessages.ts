import type { Locale } from './config'
import tr from './messages/tr.json'
import en from './messages/en.json'

const messagesByLocale = { tr, en } as const

export function getMessages(locale: Locale) {
  return messagesByLocale[locale] || messagesByLocale.tr
}
