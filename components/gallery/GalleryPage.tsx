'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { ChevronLeft, ChevronRight, Images, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { GalleryImage } from '@/lib/db'

export default function GalleryPage() {
  const { t } = useI18n()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [activeSlide, setActiveSlide] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  useEffect(() => {
    fetch('/api/gallery/')
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    images.forEach((i) => i.category && set.add(i.category))
    return ['all', ...Array.from(set).sort()]
  }, [images])

  const filtered = useMemo(() => {
    if (activeCat === 'all') return images
    return images.filter((i) => i.category === activeCat)
  }, [activeCat, images])

  const slides = filtered.map((i) => ({ src: i.url, alt: i.alt_text || i.title || '' }))
  const activeImage = filtered[activeSlide % Math.max(filtered.length, 1)]

  useEffect(() => {
    setActiveSlide(0)
  }, [activeCat])

  useEffect(() => {
    if (filtered.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveSlide((idx) => (idx + 1) % filtered.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [filtered.length])

  return (
    <div className="pt-20 pb-16">
      <section className="bg-navy-gradient text-white py-12 md:py-16 mb-8">
        <div className="container-custom">
          <p className="text-gold-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2">
            {t('gallery.eyebrow')}
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{t('gallery.title')}</h1>
          <p className="text-navy-100 text-base md:text-lg max-w-2xl">{t('gallery.subtitle')}</p>
        </div>
      </section>

      <div className="container-custom">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          </div>
        ) : images.length === 0 ? (
          <div className="card p-10 text-center text-navy-600">{t('gallery.empty')}</div>
        ) : (
          <>
            {/* Slider */}
            {activeImage && (
              <div className="mb-8 bg-navy-950 rounded-3xl overflow-hidden shadow-2xl border border-navy-800">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIdx(activeSlide)
                      setLightboxOpen(true)
                    }}
                    className="relative lg:col-span-8 min-h-[320px] md:min-h-[520px] bg-navy-900"
                  >
                    <Image
                      src={activeImage.url}
                      alt={activeImage.alt_text || activeImage.title || ''}
                      fill
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-transparent" />
                    <div className="absolute left-5 right-5 bottom-5 text-left text-white">
                      <p className="inline-flex items-center gap-2 text-gold-300 text-xs uppercase tracking-[0.22em] font-semibold mb-2">
                        <Images className="w-4 h-4" />
                        Galeri Slider
                      </p>
                      <h2 className="font-display text-2xl md:text-4xl font-bold">
                        {activeImage.title || activeImage.category || 'Çandarlı Uzman Galeri'}
                      </h2>
                    </div>
                    {filtered.length > 1 && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveSlide((idx) => (idx - 1 + filtered.length) % filtered.length)
                          }}
                          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveSlide((idx) => (idx + 1) % filtered.length)
                          }}
                          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </div>
                    )}
                  </button>
                  <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-2 gap-2 p-3 bg-navy-950">
                    {filtered.slice(0, 6).map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveSlide(idx)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border transition-all ${
                          idx === activeSlide
                            ? 'border-gold-400 ring-2 ring-gold-400/30'
                            : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt_text || img.title || ''}
                          fill
                          sizes="(max-width: 1024px) 33vw, 18vw"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      activeCat === cat
                        ? 'bg-gold-gradient text-navy-950 shadow-gold'
                        : 'bg-white border border-navy-200 text-navy-700 hover:border-gold-400'
                    }`}
                  >
                    {cat === 'all' ? t('gallery.all') : cat}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {filtered.map((img, idx) => (
                <motion.button
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (idx % 8) * 0.03 }}
                  onClick={() => {
                    setLightboxIdx(idx)
                    setLightboxOpen(true)
                  }}
                  className="relative aspect-square overflow-hidden rounded-xl bg-navy-100 group"
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || ''}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {img.title && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-navy-950/80 to-transparent text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.title}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={slides}
              index={lightboxIdx}
              on={{ view: ({ index }) => setLightboxIdx(index) }}
            />
          </>
        )}
      </div>
    </div>
  )
}
