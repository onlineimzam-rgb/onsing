'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, ArrowRight, MapPin, Calculator } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2400&q=80'

interface HeroSlide {
  id: number
  url: string
  title?: string | null
  alt_text?: string | null
}

export default function Hero() {
  const { t, locale } = useI18n()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/gallery/?category=Ana%20Sayfa%20Slide')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlides(data.images || [])
      })
      .catch(() => {
        if (!cancelled) setSlides([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = window.setInterval(() => {
      setActive((idx) => (idx + 1) % slides.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const currentSlide = slides[active]

  return (
    <section className="relative min-h-[88vh] md:min-h-[92vh] flex items-center text-white overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        {[currentSlide?.url || FALLBACK_HERO].map((src) => (
          <motion.img
            key={src}
            src={src}
            alt={currentSlide?.alt_text || currentSlide?.title || 'Çandarlı sahil'}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/25 via-navy-950/30 to-navy-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/45 via-navy-950/20 to-transparent" />
      </div>

      <div className="container-custom relative z-10 pt-24 pb-12 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <p className="inline-flex items-center gap-2 text-gold-400 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase mb-5 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {t('hero.eyebrow')}
          </p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 text-shadow-lg">
            {t('hero.title_pre')}{' '}
            <span className="gold-text">{t('hero.title_highlight')}</span>{' '}
            {t('hero.title_post')}
          </h1>

          <p className="text-base md:text-xl text-navy-100 leading-relaxed max-w-2xl mb-8 text-shadow-md">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/emlak/`} className="btn-primary">
              <Search className="w-5 h-5" />
              {t('hero.cta_browse')}
            </Link>
            <Link
              href={`/${locale}/iletisim/`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-navy-950 px-6 py-3 rounded-full font-semibold transition-all"
            >
              {t('hero.cta_contact')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/${locale}/mulk-degerleme/`}
              className="inline-flex items-center justify-center gap-2 bg-navy-950/50 backdrop-blur-sm border border-gold-400/60 text-gold-200 hover:bg-gold-400 hover:text-navy-950 px-6 py-3 rounded-full font-semibold transition-all"
            >
              <Calculator className="w-5 h-5" />
              {t('hero.cta_valuation')}
            </Link>
          </div>
        </motion.div>

        {/* Quick search bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 md:mt-14 max-w-5xl"
        >
          <form
            action={`/${locale}/emlak/`}
            method="get"
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3"
          >
            <select
              name="type"
              defaultValue=""
              className="md:col-span-2 px-3 py-3 rounded-xl border border-navy-200 text-navy-900 text-sm bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none"
            >
              <option value="">{t('hero.filter_type')}</option>
              <option value="satilik">{t('property_type.satilik')}</option>
              <option value="kiralik">{t('property_type.kiralik')}</option>
              <option value="gunluk-kiralik">{t('property_type.gunluk-kiralik')}</option>
            </select>
            <select
              name="category"
              defaultValue=""
              className="md:col-span-2 px-3 py-3 rounded-xl border border-navy-200 text-navy-900 text-sm bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none"
            >
              <option value="">{t('hero.filter_category')}</option>
              <option value="daire">{t('property_category.daire')}</option>
              <option value="villa">{t('property_category.villa')}</option>
              <option value="mustakil-ev">{t('property_category.mustakil-ev')}</option>
              <option value="yazlik">{t('property_category.yazlik')}</option>
              <option value="arsa">{t('property_category.arsa')}</option>
              <option value="tarla">{t('property_category.tarla')}</option>
              <option value="is-yeri">{t('property_category.is-yeri')}</option>
            </select>
            <select
              name="district"
              defaultValue=""
              className="md:col-span-2 px-3 py-3 rounded-xl border border-navy-200 text-navy-900 text-sm bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none"
            >
              <option value="">{t('hero.filter_district')}</option>
              <option value="Çandarlı">Çandarlı</option>
              <option value="Dikili">Dikili</option>
              <option value="Bademli">Bademli</option>
              <option value="İzmir">İzmir</option>
            </select>
            <input
              type="text"
              name="q"
              placeholder={t('hero.search_placeholder')}
              className="md:col-span-4 px-4 py-3 rounded-xl border border-navy-200 text-navy-900 text-sm bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 outline-none"
            />
            <button
              type="submit"
              className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-gold-gradient text-navy-950 px-5 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              <Search className="w-4 h-4" />
              {t('hero.search_button')}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
