'use client'

import { useI18n } from '@/lib/i18n/I18nProvider'
import { Shield, Map, Briefcase, Users } from 'lucide-react'

export default function AboutPage() {
  const { t } = useI18n()
  const values = [
    { icon: Shield, key: 'trust' },
    { icon: Map, key: 'local' },
    { icon: Briefcase, key: 'service' },
    { icon: Users, key: 'network' },
  ] as const

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <p className="text-gold-600 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-3">
            {t('about.eyebrow')}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-navy-950 mb-6">
            {t('about.title')}
          </h1>
          <div className="space-y-4 text-navy-700 leading-relaxed text-base md:text-lg text-left">
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-950 text-center mb-8">
            {t('about.values_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="card p-5 text-center hover:border-gold-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center mx-auto mb-3 shadow-gold">
                  <Icon className="w-6 h-6 text-navy-950" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-950 mb-1">
                  {t(`about.value_${key}`)}
                </h3>
                <p className="text-xs text-navy-600">
                  {t(`about.value_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
