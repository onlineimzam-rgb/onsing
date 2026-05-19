'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'
import PropertyCard from '@/components/property/PropertyCard'
import type { Property } from '@/lib/db'

export default function FeaturedProperties() {
  const { t, locale } = useI18n()
  const [properties, setProperties] = useState<Partial<Property>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties/?featured=1&limit=6')
      .then((r) => r.json())
      .then((d) => {
        let items = d.properties || []
        // Featured yoksa son eklenenleri göster
        if (items.length < 3) {
          fetch('/api/properties/?limit=6')
            .then((r) => r.json())
            .then((d2) => setProperties(d2.properties || []))
            .finally(() => setLoading(false))
        } else {
          setProperties(items)
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && properties.length === 0) return null

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-3 mb-8 md:mb-10"
        >
          <div>
            <p className="text-gold-600 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-2">
              {t('featured.eyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy-950">
              {t('featured.title')}
            </h2>
            <p className="text-navy-600 text-sm md:text-base mt-2 max-w-xl">
              {t('featured.subtitle')}
            </p>
          </div>
          <Link
            href={`/${locale}/emlak/`}
            className="hidden md:inline-flex items-center gap-1 text-navy-700 hover:text-gold-600 font-semibold"
          >
            {t('featured.cta_all')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {properties.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        <div className="md:hidden mt-6 text-center">
          <Link href={`/${locale}/emlak/`} className="btn-primary">
            {t('featured.cta_all')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
