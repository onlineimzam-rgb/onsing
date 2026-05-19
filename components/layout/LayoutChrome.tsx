'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import { CompareProvider } from '@/lib/compare/CompareProvider'
import CompareBar from '@/components/property/CompareBar'

export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = /^\/(tr|en)\/admin(?:\/|$)/.test(pathname || '')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CompareBar />
    </CompareProvider>
  )
}
