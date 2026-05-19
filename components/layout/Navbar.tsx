'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, Calculator, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { SITE_CONFIG } from '@/lib/config'
import { useSiteSettings } from '@/lib/settings/useSiteSettings'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t, locale } = useI18n()
  const siteSettings = useSiteSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: `/${locale}/`, label: t('nav.home') },
    { href: `/${locale}/emlak/`, label: t('nav.properties') },
    { href: `/${locale}/hizmetler/`, label: t('nav.services') },
    { href: `/${locale}/mulk-degerleme/`, label: t('nav.valuation') },
    { href: `/${locale}/blog/`, label: t('nav.blog') },
    { href: `/${locale}/hakkimizda/`, label: t('nav.about') },
    { href: `/${locale}/iletisim/`, label: t('nav.contact') },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-navy-950/95 backdrop-blur-md shadow-lg border-b border-navy-800'
          : 'bg-gradient-to-b from-navy-950/80 via-navy-950/50 to-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link
            href={`/${locale}/`}
            className="flex items-center gap-3 text-white"
            aria-label="Çandarlı Uzman Gayrimenkul"
          >
            <img
              src={siteSettings.logoLightUrl}
              alt="Çandarlı Uzman Gayrimenkul"
              className="h-14 md:h-20 w-auto object-contain drop-shadow-xl"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/95 hover:text-gold-400 font-medium text-sm tracking-wide transition-colors relative group text-shadow-md"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* List Property CTA (desktop) */}
            <Link
              href={`/${locale}/portfoy-toplama/`}
              className="hidden lg:inline-flex items-center gap-2 bg-gold-gradient text-navy-950 px-4 py-2 rounded-full font-semibold text-sm shadow-gold hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('nav.list_property')}
            </Link>

            <LanguageSwitcher />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 text-white"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="xl:hidden bg-navy-950 border-t border-navy-800 overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-3 px-4 text-white/95 hover:text-gold-400 hover:bg-navy-900 rounded-lg font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-3 px-4 border-t border-navy-800 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${SITE_CONFIG.phoneRaw}`}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-2 py-3 bg-navy-800 text-white rounded-lg font-semibold text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    {t('nav.phone')}
                  </a>
                  <Link
                    href={`/${locale}/mulk-degerleme/`}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-2 py-3 bg-gold-gradient text-navy-950 rounded-lg font-semibold text-sm"
                  >
                    <Calculator className="w-4 h-4" />
                    {t('nav.valuation')}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
