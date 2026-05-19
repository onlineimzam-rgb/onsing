'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Images, Loader2, MapPin } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { GalleryImage, Property } from '@/lib/db'

type Slide = {
  id: string
  url: string
  title: string
  subtitle?: string
  href?: string
}

export default function GallerySlider() {
  const { locale } = useI18n()
  const [slides, setSlides] = useState<Slide[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const galleryRes = await fetch('/api/gallery/')
        const galleryData = await galleryRes.json()
        const gallerySlides = (galleryData.images || [])
          .slice(0, 12)
          .map((img: GalleryImage) => ({
            id: `gallery-${img.id}`,
            url: img.url,
            title: img.title || 'Çandarlı Uzman Gayrimenkul',
            subtitle: img.category || 'Galeri',
            href: `/${locale}/galeri/`,
          }))

        if (gallerySlides.length > 0) {
          if (!cancelled) setSlides(gallerySlides)
          return
        }

        // Galeri henüz boşsa anasayfa boş kalmasın: aktif portföy kapaklarını göster.
        const propertyRes = await fetch('/api/properties/?limit=12')
        const propertyData = await propertyRes.json()
        const propertySlides = (propertyData.properties || [])
          .filter((p: Partial<Property>) => p.cover_image)
          .map((p: Partial<Property>) => ({
            id: `property-${p.id}`,
            url: p.cover_image!,
            title: p.title_tr || p.title_en || 'Portföy',
            subtitle: [p.neighborhood, p.district, p.city].filter(Boolean).join(', '),
            href: p.slug ? `/${locale}/emlak/${p.slug}/` : `/${locale}/emlak/`,
          }))

        if (!cancelled) setSlides(propertySlides)
      } catch {
        if (!cancelled) setSlides([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = window.setInterval(() => {
      setActive((idx) => (idx + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const current = slides[active]
  const thumbs = useMemo(() => slides.slice(0, 6), [slides])

  if (!loading && slides.length === 0) return null

  return (
    <section className="section-padding bg-navy-950 text-white overflow-hidden">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-gold-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2 inline-flex items-center gap-2">
              <Images className="w-4 h-4" />
              Bölgeden Kareler
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Çandarlı ve Dikili'den seçili görseller
            </h2>
            <p className="text-navy-200 text-sm md:text-base mt-2 max-w-2xl">
              Portföylerimizden, sahilden ve bölgenin yatırım değeri taşıyan noktalarından
              öne çıkan kareler.
            </p>
          </div>
          <Link
            href={`/${locale}/galeri/`}
            className="hidden md:inline-flex items-center gap-1 text-gold-300 hover:text-gold-100 font-semibold"
          >
            Tüm Galeri
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="relative">
          {loading ? (
            <div className="min-h-[420px] flex items-center justify-center rounded-3xl bg-white/5 border border-white/10">
              <Loader2 className="w-7 h-7 animate-spin text-gold-400" />
            </div>
          ) : current ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="lg:col-span-8 relative min-h-[360px] md:min-h-[520px] rounded-3xl overflow-hidden bg-navy-900 border border-white/10 shadow-2xl"
              >
                <Image
                  src={current.url}
                  alt={current.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/15 to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-6 md:bottom-6">
                  {current.subtitle && (
                    <div className="inline-flex items-center gap-1.5 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs text-gold-200 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {current.subtitle}
                    </div>
                  )}
                  <h3 className="font-display text-2xl md:text-4xl font-bold max-w-3xl">
                    {current.title}
                  </h3>
                  {current.href && (
                    <Link
                      href={current.href}
                      className="inline-flex items-center gap-2 mt-4 bg-gold-gradient text-navy-950 px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-gold transition-shadow"
                    >
                      İncele
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {slides.length > 1 && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setActive((idx) => (idx - 1 + slides.length) % slides.length)}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center"
                      aria-label="Önceki görsel"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActive((idx) => (idx + 1) % slides.length)}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center"
                      aria-label="Sonraki görsel"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>

              <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-2 gap-2 md:gap-3">
                {thumbs.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setActive(idx)}
                    className={`relative aspect-square rounded-2xl overflow-hidden bg-navy-900 border transition-all ${
                      idx === active
                        ? 'border-gold-400 ring-2 ring-gold-400/30 opacity-100'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={slide.url}
                      alt={slide.title}
                      fill
                      sizes="(max-width: 1024px) 33vw, 18vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/55 to-transparent" />
                    <span className="absolute left-2 bottom-2 text-[10px] md:text-xs font-semibold line-clamp-2 text-left">
                      {slide.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="md:hidden mt-6 text-center">
          <Link href={`/${locale}/galeri/`} className="btn-primary">
            Tüm Galeri
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
