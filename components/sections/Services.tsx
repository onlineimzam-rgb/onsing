'use client'

import { motion } from 'framer-motion'
import {
  Home, Tag, Key, Calculator, TrendingUp, Globe,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nProvider'

const items = [
  { icon: Home, key: 'buy' },
  { icon: Tag, key: 'sell' },
  { icon: Key, key: 'rent' },
  { icon: Calculator, key: 'valuation' },
  { icon: TrendingUp, key: 'investment' },
  { icon: Globe, key: 'foreign' },
] as const

export default function Services() {
  const { t } = useI18n()
  return (
    <section className="section-padding bg-gradient-to-b from-white to-navy-50/40">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-14"
        >
          <p className="text-gold-600 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-3">
            {t('services.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-navy-950 mb-4">
            {t('services.title')}
          </h2>
          <p className="text-navy-600 text-base md:text-lg leading-relaxed">
            {t('services.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {items.map(({ icon: Icon, key }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="card p-6 md:p-7 group hover:border-gold-300 transition-all"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-navy-950" />
              </div>
              <h3 className="font-display text-lg md:text-xl font-bold text-navy-950 mb-2">
                {t(`services.${key}.title`)}
              </h3>
              <p className="text-sm md:text-base text-navy-600 leading-relaxed">
                {t(`services.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
