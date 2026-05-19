'use client'

import { Award, Building2, Globe2, Calculator } from 'lucide-react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/I18nProvider'

const items = [
  { icon: Award, key: 'experience' },
  { icon: Building2, key: 'portfolio' },
  { icon: Globe2, key: 'international' },
  { icon: Calculator, key: 'valuation' },
] as const

export default function TrustBand() {
  const { t } = useI18n()
  return (
    <section className="bg-navy-950 text-white border-y border-navy-800">
      <div className="container-custom py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {items.map(({ icon: Icon, key }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-gold-400" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base md:text-lg font-bold">
                  {t(`trust.${key}`)}
                </div>
                <div className="text-xs md:text-sm text-navy-300">
                  {t(`trust.${key}_sub`)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
