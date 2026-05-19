import { notFound } from 'next/navigation'
import { I18nProvider } from '@/lib/i18n/I18nProvider'
import { getMessages } from '@/lib/i18n/getMessages'
import { locales, type Locale } from '@/lib/i18n/config'
import LayoutChrome from '@/components/layout/LayoutChrome'
import StructuredData from '@/components/seo/StructuredData'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(params.locale as Locale)) notFound()
  const locale = params.locale as Locale
  const messages = getMessages(locale)

  return (
    <I18nProvider locale={locale} messages={messages}>
      <StructuredData />
      <LayoutChrome>{children}</LayoutChrome>
    </I18nProvider>
  )
}
